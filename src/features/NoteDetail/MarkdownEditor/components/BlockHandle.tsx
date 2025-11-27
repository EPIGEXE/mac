import { useEffect, useState, useCallback, useRef } from 'react'
import type { EditorView } from 'prosemirror-view'
import { NodeSelection, TextSelection } from 'prosemirror-state'
import { Slice, Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { Plus, GripVertical } from 'lucide-react'
import { schema } from '../editor/schema'

interface DragHandleState {
    hoveredBlockPos: number
    hoveredBlockDom: HTMLElement | null
    hoveredBlockNode: ProseMirrorNode | null
    visible: boolean
    handleTop: number
}

interface BlockHandleProps {
    view: EditorView | null
    containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * 좌표에서 가장 가까운 블록 요소 찾기 (Tiptap findElementNextToCoords 방식)
 *
 * DOM 구조:
 * containerRef (div.pm-editor-wrapper, paddingLeft: 60px)
 *   └─ view.dom (div.ProseMirror) ← 에디터 콘텐츠
 *        └─ p, h1, h2... (블록들)
 *
 * 마우스가 왼쪽 여백(padding)에 있어도 해당 Y 좌표의 블록을 찾아야 함
 */
function findBlockFromCoords(
    view: EditorView,
    containerRef: React.RefObject<HTMLDivElement | null>,
    _x: number,
    y: number
): { pos: number; dom: HTMLElement; node: ProseMirrorNode; top: number } | null {
    if (!containerRef.current) return null

    // Y 좌표 기반으로 view.dom의 직접 자식들 중에서 블록 찾기
    // (커스텀 NodeView도 view.dom의 직접 자식이므로 항상 찾을 수 있음)
    let block: HTMLElement | null = null

    for (const child of Array.from(view.dom.children)) {
        const childRect = child.getBoundingClientRect()
        if (y >= childRect.top && y <= childRect.bottom) {
            block = child as HTMLElement
            break
        }
    }

    if (!block) return null

    try {
        // view.dom의 직접 자식들 중에서 block의 인덱스 찾기
        const children = Array.from(view.dom.children)
        const blockIndex = children.indexOf(block)

        if (blockIndex === -1) {
            // block이 view.dom의 직접 자식이 아닌 경우 (예외 상황)
            console.warn('Block is not a direct child of view.dom')
            return null
        }

        // 문서에서 해당 인덱스의 노드와 위치 찾기
        let actualPos = 0
        let targetNode: ProseMirrorNode | null = null

        for (let i = 0; i < view.state.doc.childCount; i++) {
            if (i === blockIndex) {
                targetNode = view.state.doc.child(i)
                break
            }
            actualPos += view.state.doc.child(i).nodeSize
        }

        if (!targetNode) {
            console.warn('Could not find node at index', blockIndex)
            return null
        }

        const containerRect = containerRef.current.getBoundingClientRect()
        const blockRect = block.getBoundingClientRect()
        const top = blockRect.top - containerRect.top

        return { pos: actualPos, dom: block, node: targetNode, top }
    } catch (e) {
        console.error('findBlockFromCoords error:', e)
        return null
    }
}

/**
 * 드래그 핸들러 - 이전 작동하던 방식 복구
 */
function handleDragStart(
    event: DragEvent,
    view: EditorView,
    blockPos: number,
    blockNode: ProseMirrorNode,
    blockDom: HTMLElement
) {
    if (!event.dataTransfer) return

    const { state, dispatch } = view

    // 1. 블록 선택 (테이블 제외 - 테이블은 NodeSelection 시 텍스트 선택되어 파란색 나타남)
    if (blockNode.type.name !== 'table') {
        try {
            const tr = state.tr.setSelection(NodeSelection.create(state.doc, blockPos))
            dispatch(tr)
        } catch {
            // NodeSelection 실패해도 계속 진행
        }
    }

    // 2. ProseMirror 드래그 데이터 설정 (핵심!)
    const slice = Slice.maxOpen(Fragment.from(blockNode))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(view as any).dragging = { slice, move: true }

    // 3. 브라우저 드래그 데이터 설정
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', blockNode.textContent)

    if (blockDom) {
        event.dataTransfer.setDragImage(blockDom, 0, 0)
    }
}

// dragEnd 핸들러 추가
function handleDragEnd(view: EditorView) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(view as any).dragging = null

    // 포커스 복원
    if (!view.isDestroyed) {
        view.focus()
    }
}

/**
 * 노션 스타일 블록 핸들러 (Tiptap 아키텍처 적용)
 */
export function BlockHandle({ view, containerRef }: BlockHandleProps) {
    const [state, setState] = useState<DragHandleState>({
        hoveredBlockPos: -1,
        hoveredBlockDom: null,
        hoveredBlockNode: null,
        visible: false,
        handleTop: 0,
    })

    const handleRef = useRef<HTMLDivElement>(null)
    const rafIdRef = useRef<number | null>(null)

    // 현재 상태를 ref로 유지 (의존성 배열 최소화)
    const stateRef = useRef(state)
    stateRef.current = state

    // 마우스 이동 핸들러
    useEffect(() => {
        if (!containerRef.current || !view) return
        const container = containerRef.current

        const handleMouseMove = (e: MouseEvent) => {
            // RAF로 쓰로틀링
            if (rafIdRef.current) return

            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null

                // view가 파괴되었으면 리턴
                if (!view || !view.dom || !view.dom.parentElement) return

                // 블록 찾기 (좌표 클램핑으로 항상 블록을 찾을 수 있음)
                const block = findBlockFromCoords(view, containerRef, e.clientX, e.clientY)

                if (block) {
                    const currentState = stateRef.current
                    // 같은 블록이고 이미 visible이면 업데이트 스킵
                    if (
                        currentState.visible &&
                        currentState.hoveredBlockPos === block.pos &&
                        Math.abs(currentState.handleTop - block.top) < 1
                    ) {
                        return
                    }

                    setState({
                        hoveredBlockPos: block.pos,
                        hoveredBlockDom: block.dom,
                        hoveredBlockNode: block.node,
                        visible: true,
                        handleTop: block.top,
                    })
                }
                // 블록을 못 찾아도 숨기지 않음 - Tiptap 방식
                // (mouseleave에서 처리)
            })
        }

        // Tiptap 방식: 마우스가 핸들 영역으로 이동하면 숨기지 않음
        const handleMouseLeave = (e: MouseEvent) => {
            // 마우스가 핸들 영역으로 이동했는지 확인
            const relatedTarget = e.relatedTarget as HTMLElement | null
            if (relatedTarget && handleRef.current?.contains(relatedTarget)) {
                return // 핸들 영역으로 이동했으면 숨기지 않음
            }
            setState((prev) => ({ ...prev, visible: false }))
        }

        // Tiptap 방식: 키 입력 시 핸들 숨기기 (에디터에 포커스 있을 때)
        const handleKeyDown = () => {
            if (view.hasFocus()) {
                setState((prev) => ({
                    ...prev,
                    visible: false,
                    hoveredBlockPos: -1,
                    hoveredBlockDom: null,
                    hoveredBlockNode: null,
                }))
            }
        }

        container.addEventListener('mousemove', handleMouseMove)
        container.addEventListener('mouseleave', handleMouseLeave)
        // keydown은 view.dom에 등록 (에디터 내부 입력 감지)
        view.dom.addEventListener('keydown', handleKeyDown)

        return () => {
            container.removeEventListener('mousemove', handleMouseMove)
            container.removeEventListener('mouseleave', handleMouseLeave)
            view.dom.removeEventListener('keydown', handleKeyDown)
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current)
            }
        }
    }, [view, containerRef]) // 의존성 최소화

    // 블록 선택 함수 (클릭 시)
    const selectBlock = useCallback(() => {
        if (!view || state.hoveredBlockPos < 0 || !state.hoveredBlockNode) return

        const { state: editorState, dispatch } = view

        try {
            // NodeSelection 시도
            if (state.hoveredBlockNode.type.spec.selectable !== false) {
                const tr = editorState.tr.setSelection(NodeSelection.create(editorState.doc, state.hoveredBlockPos))
                dispatch(tr)
                view.focus()
                return
            }
        } catch {
            // NodeSelection 실패 시 TextSelection으로 블록 전체 선택
        }

        // TextSelection fallback
        try {
            const $start = editorState.doc.resolve(state.hoveredBlockPos + 1)
            const $end = editorState.doc.resolve(state.hoveredBlockPos + state.hoveredBlockNode.nodeSize - 1)
            const tr = editorState.tr.setSelection(TextSelection.between($start, $end))
            dispatch(tr)
            view.focus()
        } catch (err) {
            console.warn('Failed to select block:', err)
        }
    }, [view, state.hoveredBlockPos, state.hoveredBlockNode])

    // 핸들 클릭 핸들러
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            e.preventDefault()
            selectBlock()
        },
        [selectBlock]
    )

    // 드래그 시작 핸들러 (Tiptap 방식)
    const onDragStart = useCallback(
        (e: React.DragEvent) => {
            if (!view || state.hoveredBlockPos < 0 || !state.hoveredBlockNode || !state.hoveredBlockDom) {
                e.preventDefault()
                return
            }

            handleDragStart(e.nativeEvent, view, state.hoveredBlockPos, state.hoveredBlockNode, state.hoveredBlockDom)
        },
        [view, state.hoveredBlockPos, state.hoveredBlockNode, state.hoveredBlockDom]
    )

    // 드래그 종료 핸들러
    const onDragEnd = useCallback(() => {
        if (view) {
            handleDragEnd(view)
        }
        setState((prev) => ({ ...prev, visible: false }))
    }, [view])

    // + 버튼 클릭
    const handleAddClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            e.preventDefault()
            if (!view || !state.hoveredBlockDom) return

            const { state: editorState, dispatch } = view

            // 클릭 시점에 DOM에서 직접 위치 계산 (React 상태가 stale할 수 있음)
            let blockPos: number
            let blockNode: ProseMirrorNode | null = null

            try {
                // posAtDOM은 DOM 요소의 첫 번째 위치를 반환 (테이블이면 내부 셀 위치일 수 있음)
                const rawPos = view.posAtDOM(state.hoveredBlockDom, 0)

                // resolve로 정확한 블록 위치 찾기
                const $pos = editorState.doc.resolve(rawPos)

                // 최상위 블록 레벨(depth 1)로 이동
                if ($pos.depth >= 1) {
                    blockPos = $pos.before(1)
                    blockNode = $pos.node(1)
                } else {
                    blockPos = rawPos
                    blockNode = editorState.doc.nodeAt(rawPos)
                }

                if (!blockNode) return
            } catch {
                return
            }

            // 1단계: 현재 블록 뒤에 빈 문단 삽입
            const insertPos = blockPos + blockNode.nodeSize
            const emptyParagraph = schema.nodes.paragraph.create()

            let tr = editorState.tr.insert(insertPos, emptyParagraph)

            // 새 paragraph 내부로 커서 이동 (insertPos + 1)
            const cursorPos = insertPos + 1
            tr = tr.setSelection(TextSelection.create(tr.doc, cursorPos))

            // 2단계: "/" 텍스트 삽입 (insertText는 커서를 자동으로 텍스트 뒤로 이동시킴)
            tr = tr.insertText('/')

            dispatch(tr.scrollIntoView())
            view.focus()
        },
        [view, state.hoveredBlockDom]
    )

    // 핸들에서 마우스가 완전히 빠져나갈 때 숨기기
    const handleWrapperMouseLeave = useCallback(
        (e: React.MouseEvent) => {
            // 마우스가 컨테이너 영역으로 돌아가는지 확인
            const relatedTarget = e.relatedTarget as HTMLElement | null
            if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
                return // 컨테이너 안으로 이동했으면 숨기지 않음 (mousemove가 처리)
            }
            setState((prev) => ({ ...prev, visible: false }))
        },
        [containerRef]
    )

    if (!state.visible || !containerRef.current) return null

    return (
        <div
                ref={handleRef}
                className="pm-block-handle-wrapper absolute left-1 h-6 flex items-center pointer-events-auto z-50"
                onMouseLeave={handleWrapperMouseLeave}
                style={{ top: state.handleTop + 4 }}
            >
                    {/* + 버튼 */}
                    <div
                        className="pm-block-add"
                        onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        onClick={handleAddClick}
                        title="블록 추가"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                    </div>

                    {/* 드래그 핸들 */}
                    <div
                        className="pm-block-handle"
                        draggable={true}
                        onClick={handleClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        title="클릭하여 선택, 드래그하여 이동"
                    >
                        <GripVertical size={14} />
                    </div>
            </div>
    )
}