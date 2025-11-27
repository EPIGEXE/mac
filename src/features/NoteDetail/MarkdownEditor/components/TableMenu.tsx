import { useEffect, useState, useCallback } from 'react'
import type { EditorView } from 'prosemirror-view'
import {
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    addRowBefore,
    addRowAfter,
    deleteRow,
    deleteTable,
    isInTable,
    CellSelection,
} from 'prosemirror-tables'

interface TableMenuProps {
    view: EditorView | null
}

interface MenuPosition {
    top: number
    left: number
}

/**
 * 테이블 컨텍스트 메뉴 - Tiptap 스타일
 */
export function TableMenu({ view }: TableMenuProps) {
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 })

    // 테이블 내부인지 확인하고 메뉴 위치 업데이트
    useEffect(() => {
        if (!view) return

        const updateMenuVisibility = () => {
            const { state } = view

            // 테이블 내부인지 확인
            if (!isInTable(state)) {
                setVisible(false)
                return
            }

            // 셀 선택 또는 텍스트 선택 확인
            const { selection } = state
            const isCellSel = selection instanceof CellSelection

            // 선택된 셀 위치 가져오기
            const $from = isCellSel ? (selection as CellSelection).$anchorCell : selection.$from

            try {
                // 셀의 DOM 위치 찾기
                const cellPos = $from.before($from.depth)
                const cellDOM = view.nodeDOM(cellPos)

                if (cellDOM && cellDOM instanceof HTMLElement) {
                    const cellRect = cellDOM.getBoundingClientRect()
                    const editorRect = view.dom.getBoundingClientRect()

                    setPosition({
                        top: cellRect.top - editorRect.top - 40,
                        left: cellRect.left - editorRect.left,
                    })
                    setVisible(true)
                }
            } catch {
                setVisible(false)
            }
        }

        // 초기 확인
        updateMenuVisibility()

        // 선택 변경 감지
        const handleSelectionChange = () => {
            updateMenuVisibility()
        }

        // 트랜잭션 후 업데이트
        const originalDispatch = view.dispatch.bind(view)
        view.dispatch = (tr) => {
            originalDispatch(tr)
            setTimeout(updateMenuVisibility, 0)
        }

        document.addEventListener('selectionchange', handleSelectionChange)

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange)
        }
    }, [view])

    // 메뉴 액션들
    const handleAddColumnBefore = useCallback(() => {
        if (!view) return
        addColumnBefore(view.state, view.dispatch)
        view.focus()
    }, [view])

    const handleAddColumnAfter = useCallback(() => {
        if (!view) return
        addColumnAfter(view.state, view.dispatch)
        view.focus()
    }, [view])

    const handleDeleteColumn = useCallback(() => {
        if (!view) return
        deleteColumn(view.state, view.dispatch)
        view.focus()
    }, [view])

    const handleAddRowBefore = useCallback(() => {
        if (!view) return
        addRowBefore(view.state, view.dispatch)
        view.focus()
    }, [view])

    const handleAddRowAfter = useCallback(() => {
        if (!view) return
        addRowAfter(view.state, view.dispatch)
        view.focus()
    }, [view])

    const handleDeleteRow = useCallback(() => {
        if (!view) return
        deleteRow(view.state, view.dispatch)
        view.focus()
    }, [view])

    const handleDeleteTable = useCallback(() => {
        if (!view) return
        deleteTable(view.state, view.dispatch)
        view.focus()
    }, [view])

    if (!visible) return null

    return (
        <div
            className="pm-table-menu absolute"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <button className="pm-table-menu-btn" onClick={handleAddColumnBefore} title="왼쪽에 열 추가">
                ⬅ 열
            </button>
            <button className="pm-table-menu-btn" onClick={handleAddColumnAfter} title="오른쪽에 열 추가">
                열 ➡
            </button>
            <button className="pm-table-menu-btn pm-table-menu-btn-danger" onClick={handleDeleteColumn} title="열 삭제">
                열 ✕
            </button>
            <span className="pm-table-menu-divider" />
            <button className="pm-table-menu-btn" onClick={handleAddRowBefore} title="위에 행 추가">
                ⬆ 행
            </button>
            <button className="pm-table-menu-btn" onClick={handleAddRowAfter} title="아래에 행 추가">
                행 ⬇
            </button>
            <button className="pm-table-menu-btn pm-table-menu-btn-danger" onClick={handleDeleteRow} title="행 삭제">
                행 ✕
            </button>
            <span className="pm-table-menu-divider" />
            <button
                className="pm-table-menu-btn pm-table-menu-btn-danger"
                onClick={handleDeleteTable}
                title="테이블 삭제"
            >
                🗑
            </button>
        </div>
    )
}
