/**
 * 단순화된 TableView (Tiptap extension-table 기반)
 * - 테이블 렌더링만 담당
 * - 핸들은 별도의 React 컴포넌트(TableHandles)에서 처리
 */
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView, ViewMutationRecord } from 'prosemirror-view'

import { updateColumns } from './colStyle'

export class TableView implements NodeView {
    node: ProseMirrorNode
    cellMinWidth: number
    dom: HTMLDivElement
    table: HTMLTableElement
    colgroup: HTMLTableColElement
    contentDOM: HTMLTableSectionElement
    view: EditorView
    getPos: (() => number | undefined) | undefined

    constructor(node: ProseMirrorNode, cellMinWidth: number, view: EditorView, getPos?: () => number | undefined) {
        this.node = node
        this.cellMinWidth = cellMinWidth
        this.view = view
        this.getPos = getPos

        // tableWrapper div 생성
        this.dom = document.createElement('div')
        this.dom.className = 'tableWrapper'

        // table 생성
        this.table = this.dom.appendChild(document.createElement('table'))

        // colgroup 생성 및 초기화
        this.colgroup = this.table.appendChild(document.createElement('colgroup'))
        updateColumns(node, this.colgroup, this.table, cellMinWidth)

        // tbody (contentDOM)
        this.contentDOM = this.table.appendChild(document.createElement('tbody'))
    }

    update(node: ProseMirrorNode): boolean {
        if (node.type !== this.node.type) {
            return false
        }

        this.node = node
        updateColumns(node, this.colgroup, this.table, this.cellMinWidth)

        return true
    }

    ignoreMutation(mutation: ViewMutationRecord): boolean {
        const target = mutation.target as Node
        const isInsideWrapper = this.dom.contains(target)
        const isInsideContent = this.contentDOM.contains(target)

        // wrapper 내부이지만 content 외부의 변경은 무시 (colgroup 등)
        if (isInsideWrapper && !isInsideContent) {
            if (mutation.type === 'attributes' || mutation.type === 'childList' || mutation.type === 'characterData') {
                return true
            }
        }

        return false
    }
}
