/**
 * BlockNote 스타일 테이블 핸들 컴포넌트
 * - 왼쪽: 행 핸들 (클릭: 행 전체 선택 + 메뉴)
 * - 위쪽: 열 핸들 (클릭: 열 전체 선택 + 메뉴)
 * - 오른쪽: 열 추가 버튼
 * - 아래쪽: 행 추가 버튼
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { useFloating, offset } from '@floating-ui/react'
import type { EditorView } from 'prosemirror-view'
import { TextSelection } from 'prosemirror-state'
import type { Node } from 'prosemirror-model'
import {
    addColumnBefore,
    addColumnAfter,
    deleteColumn,
    addRowBefore,
    addRowAfter,
    deleteRow,
    deleteTable,
    CellSelection,
    toggleHeader,
} from 'prosemirror-tables'

import { TableHandle } from './TableHandle'
import { ExtendButton } from './ExtendButton'
import { TableHandleMenu } from './TableHandleMenu'
import {
    freezeTableHandles,
    unfreezeTableHandles,
    type TableHandlesState,
} from '../../editor/nodeViews/table/TableHandlesPlugin'

interface TableHandlesProps {
    view: EditorView | null
    state: TableHandlesState | null
}

export function TableHandles({ view, state }: TableHandlesProps) {
    const [menuState, setMenuState] = useState<{
        type: 'row' | 'col' | null
        index: number
        anchorRect: DOMRect | null
    }>({ type: null, index: -1, anchorRect: null })

    // 핸들 호버 타이머
    const hoverTimeoutRef = useRef<number | null>(null)

    // 메뉴 상태 ref (stale closure 방지)
    const menuOpenRef = useRef(false)
    menuOpenRef.current = menuState.type !== null

    // 행 핸들 위치 계산
    const rowHandlePositioning = useFloating({
        placement: 'left',
        middleware: [offset(-8)],
    })

    // 열 핸들 위치 계산
    const colHandlePositioning = useFloating({
        placement: 'top',
        middleware: [offset(-8)],
    })

    // 행 추가 버튼 위치 계산
    const addRowPositioning = useFloating({
        placement: 'bottom',
        middleware: [offset(4)],
    })

    // 열 추가 버튼 위치 계산
    const addColPositioning = useFloating({
        placement: 'right',
        middleware: [offset(4)],
    })

    // 참조 위치 업데이트 - 핸들용
    useEffect(() => {
        if (!state?.referencePosCell || !state?.referencePosTable) return

        // 행 핸들: 테이블 왼쪽 + 현재 셀의 y 좌표
        rowHandlePositioning.refs.setReference({
            getBoundingClientRect: () =>
                new DOMRect(
                    state.referencePosTable!.x,
                    state.referencePosCell!.y,
                    state.referencePosTable!.width,
                    state.referencePosCell!.height
                ),
        })

        // 열 핸들: 현재 셀의 x + 테이블 상단
        colHandlePositioning.refs.setReference({
            getBoundingClientRect: () =>
                new DOMRect(
                    state.referencePosCell!.x,
                    state.referencePosTable!.y,
                    state.referencePosCell!.width,
                    state.referencePosTable!.height
                ),
        })
    }, [state?.referencePosCell, state?.referencePosTable])

    // 참조 위치 업데이트 - 추가 버튼용
    // referencePosTable의 각 속성을 의존성에 추가하여 크기 변경 감지
    const tableX = state?.referencePosTable?.x
    const tableY = state?.referencePosTable?.y
    const tableWidth = state?.referencePosTable?.width
    const tableHeight = state?.referencePosTable?.height
    const tableRight = state?.referencePosTable?.right
    const tableBottom = state?.referencePosTable?.bottom

    useEffect(() => {
        if (!state?.referencePosTable) return

        // 행 추가 버튼: 테이블 바로 아래
        addRowPositioning.refs.setReference({
            getBoundingClientRect: () =>
                new DOMRect(
                    state.referencePosTable!.x,
                    state.referencePosTable!.bottom,
                    state.referencePosTable!.width,
                    0
                ),
        })

        // 열 추가 버튼: 테이블 바로 오른쪽
        addColPositioning.refs.setReference({
            getBoundingClientRect: () =>
                new DOMRect(
                    state.referencePosTable!.right,
                    state.referencePosTable!.y,
                    0,
                    state.referencePosTable!.height
                ),
        })
    }, [tableX, tableY, tableWidth, tableHeight, tableRight, tableBottom])

    // 메뉴 열기 (핸들 고정)
    const openMenu = useCallback((type: 'row' | 'col', index: number, anchorRect: DOMRect) => {
        setMenuState({ type, index, anchorRect })
        freezeTableHandles() // 플러그인 뷰 고정
    }, [])

    // 메뉴 닫기 (핸들 고정 해제)
    const closeMenu = useCallback(() => {
        setMenuState({ type: null, index: -1, anchorRect: null })
        unfreezeTableHandles() // 플러그인 뷰 고정 해제
    }, [])

    // 핸들 호버 시작 (고정)
    const handleMouseEnterHandle = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        freezeTableHandles()
    }, [])

    // 핸들 호버 종료 (고정 해제, 약간의 딜레이)
    const handleMouseLeaveHandle = useCallback(() => {
        hoverTimeoutRef.current = window.setTimeout(() => {
            // 메뉴가 열려있지 않을 때만 고정 해제 (ref 사용으로 최신 상태 참조)
            if (!menuOpenRef.current) {
                unfreezeTableHandles()
            }
        }, 150) // 150ms 딜레이로 깜박임 방지
    }, [])

    // 행 명령 실행 (메뉴에서 onClose가 먼저 호출됨)
    const executeRowCommand = useCallback(
        (command: 'addBefore' | 'addAfter' | 'delete') => {
            if (!view || !state?.tableElement) return

            const index = menuState.index

            // 해당 행의 첫 번째 셀 선택
            selectCellInRow(view, state.tableElement, index)

            switch (command) {
                case 'addBefore':
                    addRowBefore(view.state, view.dispatch)
                    break
                case 'addAfter':
                    addRowAfter(view.state, view.dispatch)
                    break
                case 'delete':
                    deleteRow(view.state, view.dispatch)
                    break
            }
            view.focus()
        },
        [view, state?.tableElement, menuState.index]
    )

    // 열 명령 실행 (메뉴에서 onClose가 먼저 호출됨)
    const executeColCommand = useCallback(
        (command: 'addBefore' | 'addAfter' | 'delete') => {
            if (!view || !state?.tableElement) return

            const index = menuState.index

            // 해당 열의 첫 번째 셀 선택
            selectCellInCol(view, state.tableElement, index)

            switch (command) {
                case 'addBefore':
                    addColumnBefore(view.state, view.dispatch)
                    break
                case 'addAfter':
                    addColumnAfter(view.state, view.dispatch)
                    break
                case 'delete':
                    deleteColumn(view.state, view.dispatch)
                    break
            }
            view.focus()
        },
        [view, state?.tableElement, menuState.index]
    )

    // 테이블 삭제 (메뉴에서 onClose가 먼저 호출됨)
    const executeTableDelete = useCallback(() => {
        if (!view || !state?.tableElement) return

        // 테이블의 첫 번째 셀 선택
        selectCellInRow(view, state.tableElement, 0)

        deleteTable(view.state, view.dispatch)
        view.focus()
    }, [view, state?.tableElement])

    // 헤더 토글 (행/열) (메뉴에서 onClose가 먼저 호출됨)
    const executeToggleHeader = useCallback(() => {
        if (!view || !state?.tableElement) return

        const headerType = menuState.type === 'row' ? 'row' : 'column'

        // 첫 번째 셀 선택
        selectCellInRow(view, state.tableElement, 0)

        toggleHeader(headerType)(view.state, view.dispatch)
        view.focus()
    }, [view, state?.tableElement, menuState.type])

    // 행 추가 (마지막 행 아래)
    const handleAddRow = useCallback(() => {
        if (!view || !state?.tableElement) return

        const tbody = state.tableElement.querySelector('tbody')
        if (!tbody) return

        const lastRowIndex = tbody.children.length - 1
        selectCellInRow(view, state.tableElement, lastRowIndex)
        addRowAfter(view.state, view.dispatch)
        view.focus()

        // 핸들 고정 해제하여 다음 마우스 이벤트에서 핸들이 다시 표시되도록
        unfreezeTableHandles()
    }, [view, state?.tableElement])

    // 열 추가 (마지막 열 오른쪽)
    const handleAddCol = useCallback(() => {
        if (!view || !state?.tableElement) return

        const tbody = state.tableElement.querySelector('tbody')
        if (!tbody || !tbody.children[0]) return

        const lastColIndex = tbody.children[0].children.length - 1
        selectCellInCol(view, state.tableElement, lastColIndex)
        addColumnAfter(view.state, view.dispatch)
        view.focus()

        // 핸들 고정 해제하여 다음 마우스 이벤트에서 핸들이 다시 표시되도록
        unfreezeTableHandles()
    }, [view, state?.tableElement])

    // 테이블 구조 변경 시 메뉴 자동 닫기
    useEffect(() => {
        if (state?.shouldCloseMenu && menuState.type !== null) {
            closeMenu()
        }
    }, [state?.shouldCloseMenu, menuState.type, closeMenu])

    // 메뉴가 닫히거나 호버가 끝났을 때 정리
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    if (!view || !state?.show) {
        return null
    }

    const showRowHandle = state.rowIndex !== undefined && state.referencePosCell
    const showColHandle = state.colIndex !== undefined && state.referencePosCell

    return (
        <>
            {/* 행 핸들 */}
            {showRowHandle && (
                <div
                    ref={rowHandlePositioning.refs.setFloating}
                    className="z-[100]"
                    style={rowHandlePositioning.floatingStyles}
                    onMouseEnter={handleMouseEnterHandle}
                    onMouseLeave={handleMouseLeaveHandle}
                >
                    <TableHandle
                        orientation="row"
                        onSelect={() => selectEntireRow(view, state.rowIndex!)}
                        onOpenMenu={(rect) => openMenu('row', state.rowIndex!, rect)}
                    />
                </div>
            )}

            {/* 열 핸들 */}
            {showColHandle && (
                <div
                    ref={colHandlePositioning.refs.setFloating}
                    className="z-[100]"
                    style={colHandlePositioning.floatingStyles}
                    onMouseEnter={handleMouseEnterHandle}
                    onMouseLeave={handleMouseLeaveHandle}
                >
                    <TableHandle
                        orientation="col"
                        onSelect={() => selectEntireColumn(view, state.colIndex!)}
                        onOpenMenu={(rect) => openMenu('col', state.colIndex!, rect)}
                    />
                </div>
            )}

            {/* 행 추가 버튼 */}
            {state.showAddRowButton && (
                <div
                    ref={addRowPositioning.refs.setFloating}
                    className="z-[100]"
                    style={addRowPositioning.floatingStyles}
                    onMouseEnter={handleMouseEnterHandle}
                    onMouseLeave={handleMouseLeaveHandle}
                >
                    <ExtendButton
                        orientation="row"
                        onClick={handleAddRow}
                        tableWidth={state.referencePosTable?.width}
                    />
                </div>
            )}

            {/* 열 추가 버튼 */}
            {state.showAddColButton && (
                <div
                    ref={addColPositioning.refs.setFloating}
                    className="z-[100]"
                    style={addColPositioning.floatingStyles}
                    onMouseEnter={handleMouseEnterHandle}
                    onMouseLeave={handleMouseLeaveHandle}
                >
                    <ExtendButton
                        orientation="col"
                        onClick={handleAddCol}
                        tableHeight={state.referencePosTable?.height}
                    />
                </div>
            )}

            {/* 컨텍스트 메뉴 */}
            {menuState.type && menuState.anchorRect && (
                <TableHandleMenu
                    type={menuState.type}
                    anchorRect={menuState.anchorRect}
                    onClose={closeMenu}
                    onExecute={menuState.type === 'row' ? executeRowCommand : executeColCommand}
                    onDeleteTable={executeTableDelete}
                    onToggleHeader={executeToggleHeader}
                    isFirstRow={menuState.type === 'row' && menuState.index === 0}
                    isFirstCol={menuState.type === 'col' && menuState.index === 0}
                />
            )}
        </>
    )
}

/**
 * 테이블에서 특정 셀의 위치를 계산
 */
function getCellPos(view: EditorView, rowIndex: number, colIndex: number): number | null {
    const table = findTable(view)
    if (!table) return null

    const { node: tableNode, pos: tablePos } = table

    // 테이블 내부에서 셀 위치 계산
    // tablePos + 1 = table 시작 다음 (첫 번째 row 시작 전)
    let currentPos = tablePos + 1

    for (let r = 0; r < tableNode.childCount; r++) {
        const row = tableNode.child(r)

        if (r === rowIndex) {
            // 원하는 행을 찾음
            currentPos += 1 // row 시작

            for (let c = 0; c < row.childCount; c++) {
                if (c === colIndex) {
                    // 원하는 열을 찾음 - 셀의 시작 위치 반환
                    return currentPos
                }
                currentPos += row.child(c).nodeSize
            }
            return null // 열을 찾지 못함
        }

        currentPos += row.nodeSize
    }

    return null // 행을 찾지 못함
}

/**
 * 문서에서 첫 번째 테이블을 찾아서 반환
 */
function findTable(view: EditorView): { node: Node; pos: number } | null {
    let result: { node: Node; pos: number } | null = null

    view.state.doc.descendants((node, pos) => {
        if (node.type.name === 'table' && !result) {
            result = { node, pos }
            return false
        }
        return true
    })

    return result
}

/**
 * 특정 셀을 선택
 */
function selectCell(view: EditorView, rowIndex: number, colIndex: number): boolean {
    const cellPos = getCellPos(view, rowIndex, colIndex)
    if (cellPos === null) {
        console.warn(`Cannot find cell at row ${rowIndex}, col ${colIndex}`)
        return false
    }

    try {
        const $cell = view.state.doc.resolve(cellPos)
        const selection = CellSelection.create(view.state.doc, $cell.pos)
        view.dispatch(view.state.tr.setSelection(selection))
        return true
    } catch (e) {
        console.warn('CellSelection failed, trying TextSelection:', e)
        try {
            const selection = TextSelection.create(view.state.doc, cellPos + 1)
            view.dispatch(view.state.tr.setSelection(selection))
            return true
        } catch (e2) {
            console.error('TextSelection also failed:', e2)
            return false
        }
    }
}

/**
 * 테이블 요소에서 특정 행의 첫 번째 셀을 선택
 */
function selectCellInRow(view: EditorView, _tableElement: HTMLElement, rowIndex: number) {
    selectCell(view, rowIndex, 0)
}

/**
 * 테이블 요소에서 특정 열의 첫 번째 셀을 선택
 */
function selectCellInCol(view: EditorView, _tableElement: HTMLElement, colIndex: number) {
    selectCell(view, 0, colIndex)
}

/**
 * 행 전체 선택 (CellSelection으로 첫 번째 셀부터 마지막 셀까지)
 */
function selectEntireRow(view: EditorView, rowIndex: number): boolean {
    const table = findTable(view)
    if (!table) return false

    const { node: tableNode } = table
    if (rowIndex >= tableNode.childCount) return false

    const row = tableNode.child(rowIndex)
    const colCount = row.childCount
    if (colCount === 0) return false

    const anchorCellPos = getCellPos(view, rowIndex, 0)
    const headCellPos = getCellPos(view, rowIndex, colCount - 1)

    if (anchorCellPos === null || headCellPos === null) return false

    try {
        const $anchor = view.state.doc.resolve(anchorCellPos)
        const $head = view.state.doc.resolve(headCellPos)
        const selection = CellSelection.create(view.state.doc, $anchor.pos, $head.pos)
        view.dispatch(view.state.tr.setSelection(selection))
        view.focus()
        return true
    } catch (e) {
        console.warn('Row selection failed:', e)
        return false
    }
}

/**
 * 열 전체 선택 (CellSelection으로 첫 번째 행부터 마지막 행까지)
 */
function selectEntireColumn(view: EditorView, colIndex: number): boolean {
    const table = findTable(view)
    if (!table) return false

    const { node: tableNode } = table
    const rowCount = tableNode.childCount
    if (rowCount === 0) return false

    // 해당 열이 존재하는지 확인
    const firstRow = tableNode.child(0)
    if (colIndex >= firstRow.childCount) return false

    const anchorCellPos = getCellPos(view, 0, colIndex)
    const headCellPos = getCellPos(view, rowCount - 1, colIndex)

    if (anchorCellPos === null || headCellPos === null) return false

    try {
        const $anchor = view.state.doc.resolve(anchorCellPos)
        const $head = view.state.doc.resolve(headCellPos)
        const selection = CellSelection.create(view.state.doc, $anchor.pos, $head.pos)
        view.dispatch(view.state.tr.setSelection(selection))
        view.focus()
        return true
    } catch (e) {
        console.warn('Column selection failed:', e)
        return false
    }
}
