/**
 * BlockNote 스타일 테이블 핸들 플러그인
 * - 마우스 위치를 감지하여 현재 호버된 셀의 행/열 인덱스를 추적
 * - 핸들 위치 계산을 위한 참조 DOMRect 제공
 */
import { Plugin, PluginKey } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'

export interface TableHandlesState {
    show: boolean
    showAddRowButton: boolean
    showAddColButton: boolean
    referencePosCell: DOMRect | null
    referencePosTable: DOMRect | null
    rowIndex: number | undefined
    colIndex: number | undefined
    tableElement: HTMLElement | null
    /** 테이블 구조 변경으로 메뉴를 닫아야 할 때 true */
    shouldCloseMenu?: boolean
}

export type TableHandlesCallback = (state: TableHandlesState) => void

/**
 * 테이블 셀 주변의 DOM 요소 찾기
 */
function domCellAround(target: Element): {
    type: 'cell' | 'wrapper'
    domNode: Element
    tbodyNode: Element | null
} | null {
    let currentTarget: Element | null = target

    while (currentTarget) {
        if (currentTarget.nodeName === 'TD' || currentTarget.nodeName === 'TH') {
            return {
                type: 'cell',
                domNode: currentTarget,
                tbodyNode: currentTarget.closest('tbody'),
            }
        }

        if (currentTarget.classList.contains('tableWrapper')) {
            return {
                type: 'wrapper',
                domNode: currentTarget,
                tbodyNode: currentTarget.querySelector('tbody'),
            }
        }

        if (currentTarget.classList.contains('ProseMirror') || currentTarget.classList.contains('pm-editor')) {
            return null
        }

        currentTarget = currentTarget.parentElement
    }

    return null
}

/**
 * 요소의 자식 인덱스 가져오기
 */
function getChildIndex(node: Element): number {
    return Array.from(node.parentElement?.children || []).indexOf(node)
}

class TableHandlesView {
    private state: TableHandlesState = {
        show: false,
        showAddRowButton: false,
        showAddColButton: false,
        referencePosCell: null,
        referencePosTable: null,
        rowIndex: undefined,
        colIndex: undefined,
        tableElement: null,
        shouldCloseMenu: false,
    }

    private menuFrozen = false
    private mouseState: 'up' | 'down' | 'selecting' = 'up'

    // 테이블 구조(행/열 개수) 추적
    private lastRowCount = 0
    private lastColCount = 0

    private view: EditorView
    private onUpdate: TableHandlesCallback

    constructor(view: EditorView, onUpdate: TableHandlesCallback) {
        this.view = view
        this.onUpdate = onUpdate
        this.view.dom.addEventListener('mousemove', this.mouseMoveHandler)
        this.view.dom.addEventListener('mousedown', this.mouseDownHandler)
        window.addEventListener('mouseup', this.mouseUpHandler)
    }

    private mouseDownHandler = () => {
        this.mouseState = 'down'
    }

    private mouseUpHandler = (event: MouseEvent) => {
        this.mouseState = 'up'
        this.mouseMoveHandler(event)
    }

    private mouseMoveHandler = (event: MouseEvent) => {
        if (this.menuFrozen) {
            return
        }

        if (this.mouseState === 'selecting') {
            return
        }

        if (!(event.target instanceof Element) || !this.view.dom.contains(event.target)) {
            return
        }

        const target = domCellAround(event.target)

        // 텍스트 선택 중에는 핸들 숨기기
        if (target?.type === 'cell' && this.mouseState === 'down') {
            this.mouseState = 'selecting'
            if (this.state.show) {
                this.state = { ...this.state, show: false, showAddRowButton: false, showAddColButton: false }
                this.onUpdate(this.state)
            }
            return
        }

        // 테이블 외부면 숨기기
        if (!target) {
            if (this.state.show) {
                this.state = {
                    ...this.state,
                    show: false,
                    showAddRowButton: false,
                    showAddColButton: false,
                    referencePosCell: null,
                    rowIndex: undefined,
                    colIndex: undefined,
                }
                this.onUpdate(this.state)
            }
            return
        }

        if (!target.tbodyNode) {
            return
        }

        const tableRect = target.tbodyNode.getBoundingClientRect()
        const tableWrapper = target.domNode.closest('.tableWrapper') as HTMLElement

        if (target.type === 'wrapper') {
            // 테이블 wrapper 호버 시 (테이블 가장자리 근처)
            const belowTable = event.clientY >= tableRect.bottom - 1 && event.clientY < tableRect.bottom + 20
            const toRightOfTable = event.clientX >= tableRect.right - 1 && event.clientX < tableRect.right + 20
            const hideHandles = event.clientX > tableRect.right || event.clientY > tableRect.bottom

            this.state = {
                ...this.state,
                show: true,
                showAddRowButton: belowTable,
                showAddColButton: toRightOfTable,
                referencePosTable: tableRect,
                tableElement: tableWrapper,
                colIndex: hideHandles ? undefined : this.state.colIndex,
                rowIndex: hideHandles ? undefined : this.state.rowIndex,
                referencePosCell: hideHandles ? null : this.state.referencePosCell,
            }
        } else {
            // 셀 호버 시
            const colIndex = getChildIndex(target.domNode)
            const rowIndex = getChildIndex(target.domNode.parentElement!)
            const cellRect = target.domNode.getBoundingClientRect()

            // 동일한 셀이면 업데이트 불필요
            if (this.state.show && this.state.rowIndex === rowIndex && this.state.colIndex === colIndex) {
                return
            }

            // 행/열 개수 계산
            const tbody = target.tbodyNode as HTMLElement
            const rowCount = tbody.children.length
            const colCount = tbody.children[0]?.children.length || 0

            this.state = {
                show: true,
                showAddColButton: colIndex === colCount - 1,
                showAddRowButton: rowIndex === rowCount - 1,
                referencePosTable: tableRect,
                referencePosCell: cellRect,
                rowIndex,
                colIndex,
                tableElement: tableWrapper,
            }
        }

        this.onUpdate(this.state)
    }

    freezeHandles() {
        this.menuFrozen = true
    }

    unfreezeHandles() {
        this.menuFrozen = false
    }

    update() {
        // 문서 변경 시 핸들 업데이트
        if (!this.state.show || !this.state.tableElement) {
            return
        }

        // 테이블이 제거되었는지 확인
        if (!this.state.tableElement.isConnected) {
            this.state = {
                ...this.state,
                show: false,
                showAddRowButton: false,
                showAddColButton: false,
                shouldCloseMenu: true,
            }
            this.menuFrozen = false // 고정 해제
            this.onUpdate(this.state)
            return
        }

        // 위치 업데이트
        const tbody = this.state.tableElement.querySelector('tbody')
        if (!tbody) return

        const tableRect = tbody.getBoundingClientRect()

        // 현재 행/열 개수 계산
        const rowCount = tbody.children.length
        const colCount = tbody.children[0]?.children.length || 0

        // 테이블 구조가 변경되었는지 확인 (행/열 삭제 감지)
        const structureChanged = rowCount !== this.lastRowCount || colCount !== this.lastColCount
        const shouldCloseMenu = structureChanged && this.menuFrozen

        // 구조 변경 시 메뉴 닫기 및 고정 해제
        if (shouldCloseMenu) {
            this.menuFrozen = false
        }

        // 행/열 개수 저장
        this.lastRowCount = rowCount
        this.lastColCount = colCount

        // 인덱스 유효성 검사 및 조정
        let { rowIndex, colIndex } = this.state
        let referencePosCell = this.state.referencePosCell

        // 행/열이 삭제되어 인덱스가 범위를 벗어난 경우 조정
        if (rowIndex !== undefined && rowIndex >= rowCount) {
            rowIndex = rowCount > 0 ? rowCount - 1 : undefined
        }
        if (colIndex !== undefined && colIndex >= colCount) {
            colIndex = colCount > 0 ? colCount - 1 : undefined
        }

        // 셀 위치 업데이트
        if (rowIndex !== undefined && colIndex !== undefined) {
            const row = tbody.children[rowIndex]
            if (row) {
                const cell = row.children[colIndex]
                if (cell) {
                    referencePosCell = cell.getBoundingClientRect()
                }
            }
        }

        // 마지막 행/열에 있을 때만 추가 버튼 표시
        const showAddRowButton = rowIndex !== undefined && rowIndex === rowCount - 1
        const showAddColButton = colIndex !== undefined && colIndex === colCount - 1

        this.state = {
            ...this.state,
            referencePosTable: tableRect,
            referencePosCell,
            rowIndex,
            colIndex,
            showAddRowButton,
            showAddColButton,
            shouldCloseMenu,
        }

        this.onUpdate(this.state)
    }

    destroy() {
        this.view.dom.removeEventListener('mousemove', this.mouseMoveHandler)
        this.view.dom.removeEventListener('mousedown', this.mouseDownHandler)
        window.removeEventListener('mouseup', this.mouseUpHandler)
    }
}

export const tableHandlesPluginKey = new PluginKey<TableHandlesView>('tableHandles')

// 플러그인 뷰 인스턴스를 저장 (freeze/unfreeze 접근용)
let currentPluginView: TableHandlesView | null = null

export function createTableHandlesPlugin(onUpdate: TableHandlesCallback): Plugin {
    return new Plugin({
        key: tableHandlesPluginKey,
        view(editorView) {
            currentPluginView = new TableHandlesView(editorView, onUpdate)
            return currentPluginView
        },
    })
}

/**
 * 핸들 고정 (메뉴 열릴 때 호출)
 * - 마우스 움직임에 반응하지 않도록 함
 */
export function freezeTableHandles(): void {
    currentPluginView?.freezeHandles()
}

/**
 * 핸들 고정 해제 (메뉴 닫힐 때 호출)
 */
export function unfreezeTableHandles(): void {
    currentPluginView?.unfreezeHandles()
}
