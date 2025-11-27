import { Node } from 'prosemirror-model'
import type { EditorView, NodeView } from "prosemirror-view"
import { schema } from '../schema'

/**
 * 체크박스 NodeView
 * 체크박스 토글을 위한 커스텀 렌더링
 */
export class CheckboxView implements NodeView {
    dom: HTMLElement
    contentDOM: HTMLElement
    private checkbox: HTMLInputElement
    private view: EditorView
    private getPos: () => number | undefined

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.view = view
        this.getPos = getPos

        // 컨테이너
        this.dom = document.createElement('div')
        this.dom.className = 'pm-checkbox'
        this.dom.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false')

        // 체크박스
        this.checkbox = document.createElement('input')
        this.checkbox.type = 'checkbox'
        this.checkbox.checked = node.attrs.checked
        this.checkbox.className = 'pm-checkbox-input'
        this.checkbox.addEventListener('change', this.handleChange.bind(this))

        // 콘텐츠 영역
        this.contentDOM = document.createElement('span')
        this.contentDOM.className = 'pm-checkbox-content'

        this.dom.appendChild(this.checkbox)
        this.dom.appendChild(this.contentDOM)
    }

    private handleChange(e: Event) {
        const checked = (e.target as HTMLInputElement).checked
        const pos = this.getPos()

        if (pos === undefined) return

        this.view.dispatch(
            this.view.state.tr.setNodeMarkup(pos, undefined, {
                checked,
            })
        )
    }

    update(node: Node): boolean {
        if (node.type !== schema.nodes.checkbox) return false

        this.checkbox.checked = node.attrs.checked
        this.dom.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false')
        return true
    }

    destroy() {
        this.checkbox.removeEventListener('change', this.handleChange.bind(this))
    }

    stopEvent(event: Event): boolean {
        // 체크박스 클릭은 에디터로 전파하지 않음
        return event.target === this.checkbox
    }

    ignoreMutation(): boolean {
        return false
    }
}
