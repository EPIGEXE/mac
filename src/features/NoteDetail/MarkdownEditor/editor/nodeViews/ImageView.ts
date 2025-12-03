/**
 * 이미지 NodeView
 * - local:// URL을 ObjectURL로 변환하여 표시
 * - 좌우 리사이즈 핸들로 크기 조절 (비율 유지)
 * - 선택 시 아웃라인 표시
 */
import type { Node } from 'prosemirror-model'
import type { EditorView, NodeView } from 'prosemirror-view'
import { isLocalURL, resolveLocalURL } from '../../../../../db/image/imageStorage'

export class ImageView implements NodeView {
    dom: HTMLElement
    private wrapper: HTMLElement
    private img: HTMLImageElement
    private node: Node
    private view: EditorView
    private getPos: () => number | undefined
    private leftHandle: HTMLElement | null = null
    private rightHandle: HTMLElement | null = null
    private isResizing = false
    private startX = 0
    private startWidth = 0
    private resizeDirection: 'left' | 'right' = 'right'

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node
        this.view = view
        this.getPos = getPos

        // 외부 컨테이너 (중앙 정렬용, 블록 레벨)
        this.dom = document.createElement('div')
        this.dom.className = 'pm-image-container'
        this.dom.style.cssText = `
            display: flex;
            justify-content: center;
            width: 100%;
            line-height: 0;
            margin: 8px 0;
        `

        // 내부 wrapper (이미지 + 핸들을 감싸서 핸들 위치 맞춤)
        this.wrapper = document.createElement('div')
        this.wrapper.className = 'pm-image-wrapper'
        this.wrapper.style.cssText = `
            display: inline-block;
            position: relative;
            line-height: 0;
        `

        // 이미지 요소 생성
        this.img = document.createElement('img')
        this.img.alt = node.attrs.alt || ''
        this.img.title = node.attrs.title || ''
        this.img.style.cssText = `
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            transition: box-shadow 0.2s;
            display: block;
        `

        // 저장된 width가 있으면 적용
        if (node.attrs.width) {
            this.img.style.width = `${node.attrs.width}px`
        }

        // 로딩 플레이스홀더 스타일
        this.img.style.minHeight = '100px'
        this.img.style.backgroundColor = 'var(--bg-secondary, #f3f4f6)'

        this.wrapper.appendChild(this.img)
        this.dom.appendChild(this.wrapper)

        // 리사이즈 핸들 생성
        this.createResizeHandles()

        // 이미지 소스 설정
        this.updateSrc(node.attrs.src)

        // 이미지 로드 완료 시 플레이스홀더 스타일 제거
        this.img.onload = () => {
            this.img.style.minHeight = ''
            this.img.style.backgroundColor = ''
        }

        // 이미지 로드 실패 시
        this.img.onerror = () => {
            this.img.style.minHeight = '60px'
            this.img.style.backgroundColor = 'var(--bg-secondary, #f3f4f6)'
            this.img.alt = '이미지를 불러올 수 없습니다'
        }

        // 이벤트 바인딩
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
    }

    private createResizeHandles() {
        const handleStyle = `
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 8px;
            height: 48px;
            background: var(--accent, #6366f1);
            border-radius: 4px;
            cursor: ew-resize;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
        `

        // 왼쪽 핸들
        this.leftHandle = document.createElement('div')
        this.leftHandle.className = 'pm-image-handle pm-image-handle-left'
        this.leftHandle.style.cssText = handleStyle + 'left: -4px;'
        this.leftHandle.addEventListener('mousedown', (e) => this.onMouseDown(e, 'left'))

        // 오른쪽 핸들
        this.rightHandle = document.createElement('div')
        this.rightHandle.className = 'pm-image-handle pm-image-handle-right'
        this.rightHandle.style.cssText = handleStyle + 'right: -4px;'
        this.rightHandle.addEventListener('mousedown', (e) => this.onMouseDown(e, 'right'))

        // wrapper에 핸들 추가 (이미지 기준으로 위치)
        this.wrapper.appendChild(this.leftHandle)
        this.wrapper.appendChild(this.rightHandle)

        // 호버 시 핸들 표시
        this.wrapper.addEventListener('mouseenter', () => {
            if (this.leftHandle) this.leftHandle.style.opacity = '1'
            if (this.rightHandle) this.rightHandle.style.opacity = '1'
        })

        this.wrapper.addEventListener('mouseleave', () => {
            if (!this.isResizing) {
                if (this.leftHandle) this.leftHandle.style.opacity = '0'
                if (this.rightHandle) this.rightHandle.style.opacity = '0'
            }
        })
    }

    private onMouseDown(e: MouseEvent, direction: 'left' | 'right') {
        e.preventDefault()
        e.stopPropagation()

        this.isResizing = true
        this.resizeDirection = direction
        this.startX = e.clientX
        this.startWidth = this.img.offsetWidth

        document.addEventListener('mousemove', this.onMouseMove)
        document.addEventListener('mouseup', this.onMouseUp)

        // 드래그 중 선택 방지
        document.body.style.userSelect = 'none'
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isResizing) return

        const deltaX = e.clientX - this.startX
        let newWidth: number

        if (this.resizeDirection === 'right') {
            newWidth = this.startWidth + deltaX
        } else {
            newWidth = this.startWidth - deltaX
        }

        // 최소/최대 크기 제한
        const minWidth = 400
        const maxWidth = this.dom.parentElement?.offsetWidth || 800

        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

        this.img.style.width = `${newWidth}px`
    }

    private onMouseUp() {
        if (!this.isResizing) return

        this.isResizing = false

        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('mouseup', this.onMouseUp)
        document.body.style.userSelect = ''

        // 핸들 숨기기
        if (this.leftHandle) this.leftHandle.style.opacity = '0'
        if (this.rightHandle) this.rightHandle.style.opacity = '0'

        // ProseMirror 노드 업데이트
        const pos = this.getPos()
        if (pos === undefined) return

        const newWidth = this.img.offsetWidth
        const tr = this.view.state.tr.setNodeMarkup(pos, null, {
            ...this.node.attrs,
            width: newWidth,
        })

        this.view.dispatch(tr)
    }

    private async updateSrc(src: string) {
        if (isLocalURL(src)) {
            // local:// URL을 ObjectURL로 변환
            const objectURL = await resolveLocalURL(src)
            if (objectURL) {
                this.img.src = objectURL
            } else {
                this.img.alt = '이미지를 찾을 수 없습니다'
            }
        } else {
            // 일반 URL은 그대로 사용
            this.img.src = src
        }
    }

    update(node: Node): boolean {
        if (node.type !== this.node.type) return false

        const oldSrc = this.node.attrs.src
        this.node = node
        this.img.alt = node.attrs.alt || ''
        this.img.title = node.attrs.title || ''

        // width 업데이트
        if (node.attrs.width) {
            this.img.style.width = `${node.attrs.width}px`
        } else {
            this.img.style.width = ''
        }

        // src가 변경되었으면 업데이트
        if (node.attrs.src !== oldSrc) {
            this.updateSrc(node.attrs.src)
        }

        return true
    }

    selectNode() {
        this.dom.classList.add('ProseMirror-selectednode')
        this.img.style.outline = '2px solid var(--accent, #6366f1)'
        this.img.style.outlineOffset = '2px'

        // 선택 시 핸들 표시
        if (this.leftHandle) this.leftHandle.style.opacity = '1'
        if (this.rightHandle) this.rightHandle.style.opacity = '1'
    }

    deselectNode() {
        this.dom.classList.remove('ProseMirror-selectednode')
        this.img.style.outline = ''
        this.img.style.outlineOffset = ''

        // 선택 해제 시 핸들 숨기기
        if (this.leftHandle) this.leftHandle.style.opacity = '0'
        if (this.rightHandle) this.rightHandle.style.opacity = '0'
    }

    stopEvent(e: Event) {
        // 리사이즈 핸들 이벤트는 막음
        if (e.target === this.leftHandle || e.target === this.rightHandle) {
            return true
        }
        return false
    }

    ignoreMutation() {
        return true
    }

    destroy() {
        document.removeEventListener('mousemove', this.onMouseMove)
        document.removeEventListener('mouseup', this.onMouseUp)
    }
}

/**
 * ImageView 팩토리 함수
 */
export function createImageView(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined
): ImageView {
    return new ImageView(node, view, getPos)
}
