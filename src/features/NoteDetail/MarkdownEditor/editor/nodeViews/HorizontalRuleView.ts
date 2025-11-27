import type { EditorView, NodeView } from "prosemirror-view"
import { Node } from 'prosemirror-model'
import { NodeSelection } from "prosemirror-state"

/**
 * 구분선 (Horizontal Rule) NodeView
 * 클릭 시 선택 가능하도록 함
 */
export class HorizontalRuleView implements NodeView {
    dom: HTMLElement
    private view: EditorView
    private getPos: () => number | undefined

    constructor(_node: Node, view: EditorView, getPos: () => number | undefined) {
        this.view = view
        this.getPos = getPos

        // HR 요소 생성
        this.dom = document.createElement('hr')
        this.dom.className = 'pm-horizontal-rule'

        // 클릭 시 선택
        this.dom.addEventListener('click', this.handleClick.bind(this))
    }

    private handleClick(e: Event) {
        e.preventDefault()
        const pos = this.getPos()

        if (pos === undefined) return

        // NodeSelection으로 구분선 선택
        const { state, dispatch } = this.view
        const nodeSelection = NodeSelection.create(state.doc, pos)
        dispatch(state.tr.setSelection(nodeSelection))
        this.view.focus()
    }

    stopEvent(event: Event): boolean {
        // 클릭 이벤트는 직접 처리
        return event.type === 'click'
    }

    ignoreMutation(): boolean {
        return true
    }

    destroy() {
        this.dom.removeEventListener('click', this.handleClick.bind(this))
    }
}