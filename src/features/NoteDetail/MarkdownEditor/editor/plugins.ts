import { Plugin, PluginKey, NodeSelection, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { schema } from './schema'
import { saveImageFromFile } from '../../../../db/image/imageStorage'

/**
 * 슬래시 커맨드 메뉴 아이템 정의
 */
export interface SlashCommandItem {
    id: string
    label: string
    description: string
    icon: string
    action: (view: EditorView) => void
}

/**
 * 슬래시 커맨드 상태
 */
export interface SlashCommandState {
    active: boolean
    query: string
    position: { top: number; left: number } | null
    selectedIndex: number
    triggerPos: number
}

/**
 * 블록 타입별 플레이스홀더 텍스트
 */
function getPlaceholderText(nodeType: string, attrs?: Record<string, unknown>): string {
    switch (nodeType) {
        case 'heading': {
            const level = attrs?.level as number
            return `제목 ${level}`
        }
        case 'checkbox':
            return '할 일'
        case 'blockquote':
            return '인용문'
        case 'code_block':
            return '코드를 입력하세요'
        case 'paragraph':
        default:
            return '내용을 입력하세요'
    }
}

/**
 * Placeholder 플러그인
 * 커서가 있는 빈 블록에 플레이스홀더 표시 (노션 스타일)
 * 단, 리스트 아이템 내부의 paragraph는 플레이스홀더 표시 안함
 */
const placeholderPluginKey = new PluginKey('placeholder')

export function placeholderPlugin(_defaultPlaceholder: string) {
    return new Plugin({
        key: placeholderPluginKey,
        props: {
            decorations(state) {
                const { doc, selection } = state
                const decorations: Decoration[] = []

                // 현재 커서 위치의 블록 찾기
                const { $from } = selection
                const currentNode = $from.parent
                const currentPos = $from.depth > 0 ? $from.before($from.depth) : 0

                // 리스트 아이템 내부인지 확인
                const isInsideListItem =
                    $from.depth >= 2 && $from.node($from.depth - 1)?.type === schema.nodes.list_item

                // 리스트 아이템 내부면 플레이스홀더 표시 안함
                if (isInsideListItem) {
                    return DecorationSet.empty
                }

                // 커서가 있는 블록이 비어있으면 플레이스홀더 추가
                if (currentNode.content.size === 0) {
                    const placeholder = getPlaceholderText(currentNode.type.name, currentNode.attrs)

                    // 최상위 블록인 경우에만 플레이스홀더 추가
                    doc.forEach((node, offset) => {
                        if (offset === currentPos) {
                            decorations.push(
                                Decoration.node(offset, offset + node.nodeSize, {
                                    class: 'pm-placeholder',
                                    'data-placeholder': placeholder,
                                })
                            )
                        }
                    })
                }

                return DecorationSet.create(doc, decorations)
            },
        },
    })
}

/**
 * 포커스 추적 플러그인
 */
const focusPluginKey = new PluginKey('focus')

export function focusPlugin(onFocusChange?: (focused: boolean) => void) {
    return new Plugin({
        key: focusPluginKey,
        props: {
            handleDOMEvents: {
                focus: () => {
                    onFocusChange?.(true)
                    return false
                },
                blur: () => {
                    onFocusChange?.(false)
                    return false
                },
            },
        },
    })
}

/**
 * 슬래시 커맨드 플러그인
 * '/' 입력 시 커맨드 메뉴 표시
 */
export const slashCommandPluginKey = new PluginKey<SlashCommandState>('slashCommand')

// 기본 슬래시 커맨드 목록
export const defaultSlashCommands: SlashCommandItem[] = [
    {
        id: 'heading1',
        label: '제목 1',
        description: '큰 제목',
        icon: 'H1',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const tr = state.tr.setBlockType(
                $from.before($from.depth),
                $from.after($from.depth),
                schema.nodes.heading,
                { level: 1 }
            )
            dispatch(tr)
        },
    },
    {
        id: 'heading2',
        label: '제목 2',
        description: '중간 제목',
        icon: 'H2',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const tr = state.tr.setBlockType(
                $from.before($from.depth),
                $from.after($from.depth),
                schema.nodes.heading,
                { level: 2 }
            )
            dispatch(tr)
        },
    },
    {
        id: 'heading3',
        label: '제목 3',
        description: '작은 제목',
        icon: 'H3',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const tr = state.tr.setBlockType(
                $from.before($from.depth),
                $from.after($from.depth),
                schema.nodes.heading,
                { level: 3 }
            )
            dispatch(tr)
        },
    },
    {
        id: 'bullet_list',
        label: '글머리 기호 목록',
        description: '글머리 기호가 있는 목록',
        icon: '•',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const listItem = schema.nodes.list_item.create(null, schema.nodes.paragraph.create())
            const bulletList = schema.nodes.bullet_list.create(null, listItem)
            const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), bulletList)
            dispatch(tr)
        },
    },
    {
        id: 'ordered_list',
        label: '번호 목록',
        description: '번호가 있는 목록',
        icon: '1.',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const listItem = schema.nodes.list_item.create(null, schema.nodes.paragraph.create())
            const orderedList = schema.nodes.ordered_list.create({ order: 1 }, listItem)
            const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), orderedList)
            dispatch(tr)
        },
    },
    {
        id: 'checkbox',
        label: '체크박스',
        description: '할 일 목록',
        icon: '☐',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const checkbox = schema.nodes.checkbox.create({ checked: false })
            const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), checkbox)
            dispatch(tr)
        },
    },
    {
        id: 'blockquote',
        label: '인용문',
        description: '인용문 블록',
        icon: '"',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const blockquote = schema.nodes.blockquote.create(null, schema.nodes.paragraph.create())
            const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), blockquote)
            dispatch(tr)
        },
    },
    {
        id: 'code_block',
        label: '코드 블록',
        description: '코드 스니펫',
        icon: '</>',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const codeBlock = schema.nodes.code_block.create()
            const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), codeBlock)
            dispatch(tr)
        },
    },
    {
        id: 'horizontal_rule',
        label: '구분선',
        description: '가로선',
        icon: '—',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection
            const hr = schema.nodes.horizontal_rule.create()
            const paragraph = schema.nodes.paragraph.create()
            const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), [hr, paragraph])
            dispatch(tr)
        },
    },
    {
        id: 'table',
        label: '테이블',
        description: '3x3 테이블',
        icon: '▦',
        action: (view) => {
            const { state, dispatch } = view
            const { $from } = state.selection

            // 3x3 테이블 생성 (Tiptap 방식: 셀 안에 paragraph)
            const createCell = (isHeader: boolean) => {
                const para = schema.nodes.paragraph.create()
                return isHeader
                    ? schema.nodes.table_header.create(null, para)
                    : schema.nodes.table_cell.create(null, para)
            }

            const headerCells = [createCell(true), createCell(true), createCell(true)]
            const dataCells1 = [createCell(false), createCell(false), createCell(false)]
            const dataCells2 = [createCell(false), createCell(false), createCell(false)]

            const headerRow = schema.nodes.table_row.create(null, headerCells)
            const dataRow1 = schema.nodes.table_row.create(null, dataCells1)
            const dataRow2 = schema.nodes.table_row.create(null, dataCells2)
            const table = schema.nodes.table.create(null, [headerRow, dataRow1, dataRow2])

            const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), table)
            dispatch(tr)
        },
    },
    {
        id: 'image',
        label: '이미지',
        description: '이미지 삽입',
        icon: '🖼',
        action: (view) => {
            // 파일 선택 다이얼로그 열기
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return

                try {
                    // IndexedDB에 저장하고 local:// URL 받기
                    const localURL = await saveImageFromFile(file)

                    const { state, dispatch } = view
                    const imageNode = schema.nodes.image.create({
                        src: localURL,
                        alt: file.name,
                        title: file.name,
                    })

                    // 현재 블록을 이미지로 교체
                    const $from = state.selection.$from
                    const tr = state.tr.replaceWith($from.before($from.depth), $from.after($from.depth), imageNode)
                    dispatch(tr)
                    view.focus()
                } catch (error) {
                    console.error('이미지 삽입 실패:', error)
                }
            }
            input.click()
        },
    },
]

export function slashCommandPlugin(onStateChange?: (state: SlashCommandState) => void) {
    // 뷰 참조를 저장 (좌표 계산용)
    let viewRef: EditorView | null = null
    // 붙여넣기 플래그 (붙여넣기 시 슬래시 메뉴 비활성화)
    let isPasting = false

    return new Plugin<SlashCommandState>({
        key: slashCommandPluginKey,
        view(view) {
            viewRef = view
            return {
                update(view) {
                    viewRef = view
                },
                destroy() {
                    viewRef = null
                },
            }
        },
        state: {
            init: () => ({
                active: false,
                query: '',
                position: null,
                selectedIndex: 0,
                triggerPos: 0,
            }),
            apply(tr, value, _oldState, newState) {
                // 트랜잭션에서 슬래시 커맨드 상태 가져오기 (명시적 상태 설정)
                const meta = tr.getMeta(slashCommandPluginKey)
                if (meta !== undefined) {
                    onStateChange?.(meta)
                    return meta
                }

                // 붙여넣기 중에는 슬래시 메뉴 비활성화
                if (isPasting) {
                    isPasting = false
                    if (value.active) {
                        const newValue: SlashCommandState = {
                            active: false,
                            query: '',
                            position: null,
                            selectedIndex: 0,
                            triggerPos: 0,
                        }
                        onStateChange?.(newValue)
                        return newValue
                    }
                    return value
                }

                // Tiptap 방식: 매 트랜잭션마다 슬래시 감지 (문서 변경 시)
                if (tr.docChanged) {
                    const { $from } = newState.selection

                    // 커서 앞의 텍스트 가져오기
                    // 방법 1: nodeBefore (Tiptap) - 커서가 텍스트 노드 바로 뒤에 있을 때만 작동
                    // 방법 2: parent.textContent.slice(0, parentOffset) - 더 안정적
                    const nodeBefore = $from.nodeBefore
                    let textBefore = nodeBefore?.isText ? nodeBefore.text : null

                    // nodeBefore가 없으면 parent의 텍스트에서 추출 (fallback)
                    if (!textBefore && $from.parentOffset > 0) {
                        textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
                    }

                    // parentOffset이 0이지만 parent에 텍스트가 있는 경우 (paragraph 끝 위치)
                    if (!textBefore && $from.parent.textContent) {
                        const parentEnd = $from.end($from.depth)
                        if ($from.pos === parentEnd) {
                            textBefore = $from.parent.textContent
                        }
                    }

                    if (textBefore) {
                        // 정규식으로 슬래시 매치
                        // Tiptap 방식: 줄 시작 또는 공백 뒤의 슬래시만 매치
                        // 캡처 그룹 1: 앞의 공백 (있으면), 캡처 그룹 2: 슬래시 명령어
                        const regexp = /(?:^|(\s))(\/[^\s/]*)$/
                        const match = textBefore.match(regexp)

                        if (match && match[2]) {
                            const query = match[2].slice(1) // '/' 제외

                            // 쿼리에 공백이 있으면 무시
                            if (!query.includes(' ')) {
                                // triggerPos 계산: parent 시작 + slash index
                                // match.index는 전체 매치 시작, 공백이 있으면 +1
                                const parentStart = $from.start($from.depth)
                                const slashOffset = match.index! + (match[1] ? match[1].length : 0)
                                const triggerPos = parentStart + slashOffset

                                // 좌표 계산 (슬래시 위치 기준)
                                let position = value.position
                                if (viewRef) {
                                    try {
                                        // 슬래시 위치에서 좌표 계산 (커서 위치가 아닌 triggerPos 사용)
                                        const coords = viewRef.coordsAtPos(triggerPos)
                                        position = { top: coords.bottom, left: coords.left }
                                    } catch {
                                        // 좌표 계산 실패 시 기존 position 유지
                                    }
                                }

                                const newValue: SlashCommandState = {
                                    active: true,
                                    query,
                                    position,
                                    selectedIndex: value.active ? value.selectedIndex : 0,
                                    triggerPos,
                                }
                                onStateChange?.(newValue)
                                return newValue
                            }
                        }
                    }

                    // 슬래시가 없거나 유효하지 않음 → 비활성화 (이전에 활성 상태였으면)
                    if (value.active) {
                        const newValue: SlashCommandState = {
                            active: false,
                            query: '',
                            position: null,
                            selectedIndex: 0,
                            triggerPos: 0,
                        }
                        onStateChange?.(newValue)
                        return newValue
                    }
                }

                return value
            },
        },
        props: {
            handleKeyDown(view, event) {
                const pluginState = slashCommandPluginKey.getState(view.state)

                if (!pluginState?.active) {
                    // '/' 키 입력은 이제 apply()에서 자동 감지되므로 여기서 처리 불필요
                    return false
                }

                // 활성 상태에서 키보드 처리
                const filteredCommands = filterCommands(defaultSlashCommands, pluginState.query)

                switch (event.key) {
                    case 'ArrowDown': {
                        event.preventDefault()
                        const nextIndex = (pluginState.selectedIndex + 1) % filteredCommands.length
                        const downState = { ...pluginState, selectedIndex: nextIndex }
                        view.dispatch(view.state.tr.setMeta(slashCommandPluginKey, downState))
                        return true
                    }

                    case 'ArrowUp': {
                        event.preventDefault()
                        const prevIndex =
                            (pluginState.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length
                        const upState = { ...pluginState, selectedIndex: prevIndex }
                        view.dispatch(view.state.tr.setMeta(slashCommandPluginKey, upState))
                        return true
                    }
                    case 'Enter':
                        event.preventDefault()
                        if (filteredCommands.length > 0) {
                            executeCommand(view, pluginState, filteredCommands[pluginState.selectedIndex])
                        }
                        return true

                    case 'Escape': {
                        event.preventDefault()
                        const escapeState: SlashCommandState = {
                            active: false,
                            query: '',
                            position: null,
                            selectedIndex: 0,
                            triggerPos: 0,
                        }
                        view.dispatch(view.state.tr.setMeta(slashCommandPluginKey, escapeState))
                        return true
                    }
                    case 'Backspace':
                        // 쿼리가 비어있으면 비활성화
                        if (pluginState.query === '') {
                            const backspaceState: SlashCommandState = {
                                active: false,
                                query: '',
                                position: null,
                                selectedIndex: 0,
                                triggerPos: 0,
                            }
                            view.dispatch(view.state.tr.setMeta(slashCommandPluginKey, backspaceState))
                        }
                        return false

                    default:
                        return false
                }
            },
            // 붙여넣기 시 슬래시 메뉴가 나오지 않도록 플래그 설정
            handlePaste() {
                isPasting = true
                return false // 기본 붙여넣기 처리 허용
            },
        },
    })
}

function filterCommands(commands: SlashCommandItem[], query: string): SlashCommandItem[] {
    if (!query) return commands
    const lowerQuery = query.toLowerCase()
    return commands.filter(
        (cmd) => cmd.label.toLowerCase().includes(lowerQuery) || cmd.description.toLowerCase().includes(lowerQuery)
    )
}

function executeCommand(view: EditorView, _pluginState: SlashCommandState, command: SlashCommandItem) {
    // 슬래시와 쿼리 삭제
    const { state, dispatch } = view
    const { $from } = state.selection
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
    const slashIndex = textBefore.lastIndexOf('/')

    if (slashIndex >= 0) {
        const deleteFrom = $from.pos - (textBefore.length - slashIndex)
        const deleteTo = $from.pos

        let tr = state.tr.delete(deleteFrom, deleteTo)
        tr = tr.setMeta(slashCommandPluginKey, {
            active: false,
            query: '',
            position: null,
            selectedIndex: 0,
            triggerPos: 0,
        })
        dispatch(tr)

        // 커맨드 실행
        setTimeout(() => {
            command.action(view)
            view.focus()
        }, 0)
    }
}

/**
 * 블록 드래그 앤 드롭 플러그인
 * 핸들에서 시작된 드래그를 ProseMirror의 기본 메커니즘으로 처리
 */
export function blockDragDropPlugin() {
    return new Plugin({
        props: {
            handleDOMEvents: {
                mousedown(view, event) {
                    const target = event.target as HTMLElement

                    // 블록 핸들에서 mousedown이 발생한 경우
                    if (target.closest('.pm-block-handle')) {
                        const handle = target.closest('.pm-block-handle') as HTMLElement
                        const wrapper = handle.closest('.pm-block-handle-wrapper') as HTMLElement

                        if (!wrapper) return false

                        // 핸들의 위치로 블록 찾기
                        const rect = wrapper.getBoundingClientRect()
                        const editorRect = view.dom.getBoundingClientRect()
                        const y = rect.top + rect.height / 2 - editorRect.top

                        // 에디터 내의 모든 블록을 순회하며 해당 위치의 블록 찾기
                        let targetPos: number | null = null
                        view.state.doc.forEach((_node, pos) => {
                            try {
                                const dom = view.nodeDOM(pos)
                                if (dom && dom instanceof HTMLElement) {
                                    const nodeRect = dom.getBoundingClientRect()
                                    const nodeTop = nodeRect.top - editorRect.top
                                    const nodeBottom = nodeTop + nodeRect.height

                                    if (y >= nodeTop && y <= nodeBottom) {
                                        targetPos = pos
                                    }
                                }
                            } catch {
                                // 무시
                            }
                        })

                        if (targetPos !== null) {
                            // NodeSelection 생성
                            try {
                                const nodeSelection = NodeSelection.create(view.state.doc, targetPos)
                                const tr = view.state.tr.setSelection(nodeSelection)
                                view.dispatch(tr)
                            } catch {
                                // NodeSelection이 불가능한 경우 TextSelection 사용
                                const $pos = view.state.doc.resolve(targetPos)
                                const node = view.state.doc.nodeAt(targetPos)
                                if (node) {
                                    const $end = view.state.doc.resolve(targetPos + node.nodeSize)
                                    const textSelection = TextSelection.between($pos, $end)
                                    const tr = view.state.tr.setSelection(textSelection)
                                    view.dispatch(tr)
                                }
                            }
                        }

                        // 이벤트를 ProseMirror가 처리하도록 함
                        return false
                    }

                    return false
                },
                // 드롭 후 포커스 복원
                drop(view) {
                    // 포커스가 없으면 복원
                    if (!view.hasFocus()) {
                        view.focus()
                    }
                    return false // ProseMirror 기본 처리 허용
                },
            },
        },
    })
}

/**
 * 인접한 동일 타입 리스트 자동 병합 플러그인
 *
 * 리스트 아이템 삭제 시 분리된 리스트가 자동으로 병합됨
 * 예: bullet_list + bullet_list → 하나의 bullet_list
 */
export function autoJoinListsPlugin() {
    return new Plugin({
        appendTransaction(transactions, _oldState, newState) {
            // 문서가 변경되지 않았으면 리턴
            if (!transactions.some((tr) => tr.docChanged)) {
                return null
            }

            let tr = newState.tr
            let modified = false

            // 문서의 최상위 레벨 노드들만 순회 (doc의 직접 자식들)
            for (let i = 0; i < newState.doc.childCount - 1; i++) {
                const node = newState.doc.child(i)
                const nextNode = newState.doc.child(i + 1)

                // bullet_list 또는 ordered_list인 경우
                if (
                    (node.type === schema.nodes.bullet_list || node.type === schema.nodes.ordered_list) &&
                    node.type === nextNode.type
                ) {
                    // 현재 노드의 시작 위치 계산
                    let pos = 0
                    for (let j = 0; j < i; j++) {
                        pos += newState.doc.child(j).nodeSize
                    }

                    // 첫 번째 리스트의 끝 위치 (내부 컨텐츠 끝)
                    const firstListEnd = pos + node.nodeSize - 1 // -1 for closing tag
                    // 두 번째 리스트의 시작과 끝
                    const secondListStart = pos + node.nodeSize
                    const secondListEnd = secondListStart + nextNode.nodeSize

                    // 첫 번째 리스트에 두 번째 리스트의 아이템들을 추가하고, 두 번째 리스트를 삭제
                    tr = tr
                        .insert(firstListEnd, nextNode.content)
                        .delete(secondListStart + nextNode.content.size, secondListEnd + nextNode.content.size)

                    modified = true

                    break // 한 번에 하나씩만 병합
                }
            }

            return modified ? tr : null
        },
    })
}
