import { keymap } from 'prosemirror-keymap'
import {
    baseKeymap,
    chainCommands,
    exitCode,
    joinUp,
    joinDown,
    lift,
    toggleMark,
    deleteSelection,
} from 'prosemirror-commands'
import { undo, redo } from 'prosemirror-history'
import { splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list'
import {
    goToNextCell,
    deleteTable,
    addRowAfter,
    isInTable,
    CellSelection,
    deleteRow,
    deleteColumn,
} from 'prosemirror-tables'
import type { Command, EditorState } from 'prosemirror-state'
import { NodeSelection, TextSelection } from 'prosemirror-state'
import { schema } from '../schema'

/**
 * 체크박스 토글 커맨드
 */
const toggleCheckbox: Command = (state, dispatch) => {
    const { $from } = state.selection
    const node = $from.parent

    if (node.type !== schema.nodes.checkbox) {
        return false
    }

    if (dispatch) {
        const tr = state.tr.setNodeMarkup($from.before($from.depth), undefined, {
            ...node.attrs,
            checked: !node.attrs.checked,
        })
        dispatch(tr)
    }

    return true
}

/**
 * Enter 키 처리 - 빈 블록에서 기본 paragraph로 변환
 */
const handleEnter: Command = (state, dispatch) => {
    const { $from, empty } = state.selection

    if (!empty) return false

    const parent = $from.parent

    // 빈 제목에서 Enter → paragraph로 변환
    if (parent.type === schema.nodes.heading && parent.content.size === 0) {
        if (dispatch) {
            const tr = state.tr.setBlockType(
                $from.before($from.depth),
                $from.after($from.depth),
                schema.nodes.paragraph
            )
            dispatch(tr)
        }
        return true
    }

    // 빈 체크박스에서 Enter → paragraph로 변환
    if (parent.type === schema.nodes.checkbox && parent.content.size === 0) {
        if (dispatch) {
            const tr = state.tr.setBlockType(
                $from.before($from.depth),
                $from.after($from.depth),
                schema.nodes.paragraph
            )
            dispatch(tr)
        }
        return true
    }

    // 빈 인용문에서 Enter → 인용문 탈출
    if (parent.type === schema.nodes.paragraph) {
        const grandparent = $from.node($from.depth - 1)
        if (grandparent?.type === schema.nodes.blockquote && parent.content.size === 0) {
            return lift(state, dispatch)
        }
    }

    return false
}

/**
 * NodeSelection(가로선 등) 삭제 처리
 */
const deleteNodeSelection: Command = (state, dispatch) => {
    const { selection } = state

    // NodeSelection인 경우 (가로선 등 selectable 노드)
    if (selection instanceof NodeSelection) {
        if (dispatch) {
            const tr = state.tr.deleteSelection()
            // 삭제 후 빈 문서면 빈 paragraph 추가
            if (tr.doc.content.size === 0) {
                tr.insert(0, schema.nodes.paragraph.create())
            }
            dispatch(tr.scrollIntoView())
        }
        return true
    }

    return false
}

/**
 * 이전 노드가 리스트인지 확인
 */
function hasListBefore(state: EditorState): boolean {
    const { $from } = state.selection

    // 현재 블록의 시작 위치
    const blockStart = $from.before($from.depth)
    if (blockStart <= 1) return false

    // 현재 블록 바로 이전 위치에서 노드 확인
    const $beforeBlock = state.doc.resolve(blockStart)
    const nodeBefore = $beforeBlock.nodeBefore

    return (
        nodeBefore !== null &&
        (nodeBefore.type === schema.nodes.bullet_list || nodeBefore.type === schema.nodes.ordered_list)
    )
}

/**
 * 현재 리스트 아이템 내부인지 확인
 */
function isInListItem(state: EditorState): boolean {
    const { $from } = state.selection
    for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type === schema.nodes.list_item) {
            return true
        }
    }
    return false
}

/**
 * Backspace 처리 - 특수 블록을 paragraph로 변환 (undoInputRule보다 먼저 실행)
 *
 * 중요: 제목/체크박스 등에서 백스페이스 시 ##이 다시 나타나지 않고
 * 바로 paragraph로 변환되거나 줄이 삭제되도록 함
 *
 * 노션 스타일:
 * - 구분선 아래 빈 줄에서 백스페이스 → 현재 줄 삭제 후 구분선 위로 이동 (구분선 삭제 X)
 * - 구분선 삭제는 구분선을 직접 선택 후 삭제해야 함
 * - 리스트 아래 빈 줄에서 백스페이스 → 현재 줄 삭제하고 위 리스트 끝으로 이동
 * - 빈 리스트 아이템에서 백스페이스 → 리스트에서 탈출하여 paragraph로 변환
 */
const handleBackspaceFirst: Command = (state, dispatch) => {
    const { selection } = state

    // NodeSelection(가로선 등)이면 삭제
    if (selection instanceof NodeSelection) {
        return deleteNodeSelection(state, dispatch)
    }

    const { $from, empty } = selection

    if (!empty) return false

    const parent = $from.parent
    const blockPos = $from.before($from.depth)

    // 커서가 맨 앞에 있을 때
    if ($from.parentOffset === 0) {
        // 리스트 아이템 내부에서 빈 paragraph의 시작에 커서가 있을 때
        // → liftListItem으로 리스트에서 탈출
        if (isInListItem(state) && parent.type === schema.nodes.paragraph && parent.content.size === 0) {
            // 첫 번째 자식(paragraph)인 경우에만 lift
            const listItemDepth = (() => {
                for (let d = $from.depth; d > 0; d--) {
                    if ($from.node(d).type === schema.nodes.list_item) return d
                }
                return -1
            })()

            if (listItemDepth > 0) {
                const listItem = $from.node(listItemDepth)
                // 리스트 아이템의 첫 번째 자식(paragraph)이고, 그 paragraph가 비어있으면 lift
                if (listItem.firstChild === parent) {
                    return liftListItem(schema.nodes.list_item)(state, dispatch)
                }
            }
        }

        // 이전 노드가 리스트이고 현재가 빈 paragraph면 → 현재 줄 삭제하고 리스트 끝으로 이동
        if (
            !isInListItem(state) &&
            parent.type === schema.nodes.paragraph &&
            parent.content.size === 0 &&
            hasListBefore(state)
        ) {
            if (dispatch) {
                const $pos = state.doc.resolve(blockPos - 1)
                const listNode = $pos.nodeBefore
                if (listNode) {
                    // 현재 빈 paragraph 삭제
                    const tr = state.tr.delete(blockPos, $from.after($from.depth))

                    // 리스트의 마지막 아이템 끝으로 커서 이동
                    const listEndPos = blockPos - 1
                    tr.setSelection(TextSelection.near(tr.doc.resolve(listEndPos), -1))

                    dispatch(tr.scrollIntoView())
                }
            }
            return true
        }

        // 이전 노드가 구분선인지 확인 (노션 스타일)
        if (blockPos > 0) {
            const $beforeBlock = state.doc.resolve(blockPos - 1)
            const nodeBefore = $beforeBlock.nodeBefore

            // 이전 노드가 구분선이면
            if (nodeBefore && nodeBefore.type === schema.nodes.horizontal_rule) {
                // 현재 블록이 빈 paragraph면 삭제하고 구분선 위로 이동
                if (parent.type === schema.nodes.paragraph && parent.content.size === 0) {
                    if (dispatch) {
                        // 현재 빈 paragraph 삭제
                        const tr = state.tr.delete(blockPos, $from.after($from.depth))

                        // 구분선 이전 블록 끝으로 커서 이동
                        const hrPos = blockPos - nodeBefore.nodeSize
                        if (hrPos > 0) {
                            const targetPos = hrPos - 1
                            tr.setSelection(TextSelection.near(tr.doc.resolve(targetPos), -1))
                        }

                        dispatch(tr.scrollIntoView())
                    }
                    return true
                }
                // 현재 블록에 내용이 있으면 기본 동작 방지 (구분선을 넘지 않음)
                return true
            }
        }

        // 빈 제목 → paragraph
        if (parent.type === schema.nodes.heading) {
            if (dispatch) {
                const tr = state.tr.setBlockType(
                    $from.before($from.depth),
                    $from.after($from.depth),
                    schema.nodes.paragraph
                )
                dispatch(tr)
            }
            return true
        }

        // 빈 체크박스 → paragraph
        if (parent.type === schema.nodes.checkbox) {
            if (dispatch) {
                const tr = state.tr.setBlockType(
                    $from.before($from.depth),
                    $from.after($from.depth),
                    schema.nodes.paragraph
                )
                dispatch(tr)
            }
            return true
        }

        // 빈 코드블록 → paragraph
        if (parent.type === schema.nodes.code_block && parent.content.size === 0) {
            if (dispatch) {
                const tr = state.tr.setBlockType(
                    $from.before($from.depth),
                    $from.after($from.depth),
                    schema.nodes.paragraph
                )
                dispatch(tr)
            }
            return true
        }
    }

    return false
}

/**
 * 블록 선택 (Escape) - 노션 스타일
 * 현재 커서가 있는 블록 전체를 NodeSelection으로 선택
 */
const selectBlock: Command = (state, dispatch) => {
    const { selection } = state

    // 이미 NodeSelection이면 아무것도 안함 (blur 동작은 에디터 외부에서 처리)
    if (selection instanceof NodeSelection) {
        return false
    }

    const { $from } = selection

    // 최상위 블록의 위치 찾기
    let depth = $from.depth
    while (depth > 1 && $from.node(depth - 1).type !== schema.nodes.doc) {
        depth--
    }

    const blockPos = $from.before(depth)
    const node = state.doc.nodeAt(blockPos)

    if (!node) return false

    // 해당 블록이 selectable하면 NodeSelection으로 선택
    if (node.type.spec.selectable !== false) {
        if (dispatch) {
            const nodeSelection = NodeSelection.create(state.doc, blockPos)
            dispatch(state.tr.setSelection(nodeSelection))
        }
        return true
    }

    // selectable하지 않으면 블록 전체 텍스트 선택
    if (dispatch) {
        const blockEnd = blockPos + node.nodeSize
        const textSelection = TextSelection.create(state.doc, blockPos + 1, blockEnd - 1)
        dispatch(state.tr.setSelection(textSelection))
    }
    return true
}

/**
 * 하드 브레이크 삽입 (Shift+Enter)
 */
const insertHardBreak: Command = (state, dispatch) => {
    if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView())
    }
    return true
}

/**
 * Tab 키 처리
 * - 테이블 셀: 다음 셀로 이동 (마지막 셀이면 행 추가)
 * - 리스트 아이템: 들여쓰기 (이전 형제가 있을 때만 동작)
 * - 그 외: Tab 키 이벤트 차단 (브라우저 기본 동작 방지)
 */
const handleTab: Command = (state, dispatch) => {
    // 테이블 내부면 다음 셀로 이동
    if (isInTable(state)) {
        if (goToNextCell(1)(state, dispatch)) {
            return true
        }
        // 마지막 셀이면 행 추가 후 다음 셀로
        if (addRowAfter(state, dispatch)) {
            // 새 행의 첫 번째 셀로 이동
            goToNextCell(1)(state, dispatch)
            return true
        }
    }

    // sinkListItem 시도 - 리스트 아이템이 아니거나 첫 번째 아이템이면 false 반환
    if (sinkListItem(schema.nodes.list_item)(state, dispatch)) {
        return true
    }
    // 리스트가 아니거나 들여쓰기 불가 시 Tab 이벤트만 차단
    return true
}

/**
 * Shift+Tab 키 처리
 * - 테이블 셀: 이전 셀로 이동
 * - 리스트 아이템: 내어쓰기
 * - 그 외: Shift+Tab 키 이벤트 차단
 */
const handleShiftTab: Command = (state, dispatch) => {
    // 테이블 내부면 이전 셀로 이동
    if (isInTable(state)) {
        return goToNextCell(-1)(state, dispatch)
    }

    // liftListItem 시도
    if (liftListItem(schema.nodes.list_item)(state, dispatch)) {
        return true
    }
    // 리스트가 아니거나 내어쓰기 불가 시 이벤트만 차단
    return true
}

/**
 * CellSelection 삭제 처리 - BlockNote 스타일
 * - 행 전체 선택 시: 행 삭제
 * - 열 전체 선택 시: 열 삭제
 * - 모든 셀 선택 시: 테이블 삭제
 */
const deleteCellSelection: Command = (state, dispatch) => {
    const { selection } = state

    if (!(selection instanceof CellSelection)) {
        return false
    }

    const table = selection.$anchorCell.node(-1)
    const tableRowCount = table.childCount
    const tableColCount = table.firstChild ? table.firstChild.childCount : 0

    // 테이블의 전체 셀 수
    let totalCellCount = 0
    table.descendants((node) => {
        if (node.type === schema.nodes.table_cell || node.type === schema.nodes.table_header) {
            totalCellCount++
        }
    })

    const selectedCellCount = selection.ranges.length

    // 모든 셀이 선택된 경우 → 테이블 삭제
    if (totalCellCount === selectedCellCount) {
        return deleteTable(state, dispatch)
    }

    // 행 전체 선택인지 확인 (선택된 셀 수가 열 개수와 같고, 같은 행에 있음)
    if (selectedCellCount === tableColCount) {
        const anchorRow = selection.$anchorCell.index(-1)
        const headRow = selection.$headCell.index(-1)
        if (anchorRow === headRow) {
            // 같은 행의 모든 셀 선택 → 행 삭제
            return deleteRow(state, dispatch)
        }
    }

    // 열 전체 선택인지 확인 (선택된 셀 수가 행 개수와 같고, 같은 열에 있음)
    if (selectedCellCount === tableRowCount) {
        const anchorCol = selection.$anchorCell.index()
        const headCol = selection.$headCell.index()
        if (anchorCol === headCol) {
            // 같은 열의 모든 셀 선택 → 열 삭제
            return deleteColumn(state, dispatch)
        }
    }

    // 그 외의 경우 기본 삭제 동작
    return deleteSelection(state, dispatch)
}

// 기본 키맵
export const editorKeymap = keymap({
    // Undo/Redo
    'Mod-z': undo,
    'Mod-y': redo,
    'Mod-Shift-z': redo,

    // 인라인 포맷 단축키
    'Mod-b': toggleMark(schema.marks.bold),
    'Mod-i': toggleMark(schema.marks.italic),
    'Mod-`': toggleMark(schema.marks.code),
    'Mod-Shift-s': toggleMark(schema.marks.strikethrough),

    // Backspace: CellSelection 삭제 → 특수 블록 처리 → 기본 동작
    // handleBackspaceFirst가 undoInputRule보다 먼저 실행되어 ##이 다시 나타나지 않음
    Backspace: chainCommands(deleteCellSelection, handleBackspaceFirst, baseKeymap.Backspace!),

    // Delete: CellSelection 삭제 → NodeSelection(가로선 등) 삭제 처리
    Delete: chainCommands(deleteCellSelection, deleteNodeSelection, deleteSelection, baseKeymap.Delete!),

    // Enter 처리
    Enter: chainCommands(handleEnter, splitListItem(schema.nodes.list_item), baseKeymap.Enter!),

    // 하드 브레이크
    'Shift-Enter': insertHardBreak,

    // 코드 블록에서 탈출
    'Mod-Enter': exitCode,

    // 리스트 조작 (리스트 외에서는 Tab 키 무시)
    Tab: handleTab,
    'Shift-Tab': handleShiftTab,

    // 블록 조인
    'Alt-ArrowUp': joinUp,
    'Alt-ArrowDown': joinDown,

    // 체크박스 토글
    'Mod-Shift-c': toggleCheckbox,

    // 블록 선택 (노션 스타일)
    Escape: selectBlock,

    // 테이블 셀 선택 시 삭제 - BlockNote 스타일
    'Mod-Backspace': deleteCellSelection,
    'Mod-Delete': deleteCellSelection,
})

// 기본 키맵 포함
export const fullKeymap = keymap(baseKeymap)
