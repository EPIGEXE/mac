import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Slice, Fragment, Node as ProseMirrorNode } from 'prosemirror-model';

/**
 * 드래그 핸들 플러그인 상태
 */
export interface DragHandleState {
  /** 현재 호버된 블록의 위치 */
  hoveredBlockPos: number;
  /** 현재 호버된 블록의 DOM 노드 */
  hoveredBlockDom: HTMLElement | null;
  /** 현재 호버된 블록의 ProseMirror 노드 */
  hoveredBlockNode: ProseMirrorNode | null;
  /** 드래그 핸들 표시 여부 */
  visible: boolean;
  /** 핸들의 top 위치 */
  handleTop: number;
}

export const dragHandlePluginKey = new PluginKey<DragHandleState>('dragHandle');

interface DragHandlePluginOptions {
  /** 핸들 DOM element (React에서 전달) */
  element: HTMLElement | null;
  /** 상태 변경 콜백 */
  onStateChange?: (state: DragHandleState) => void;
}

/**
 * 좌표에서 가장 가까운 블록 요소 찾기
 */
function findBlockFromCoords(
  view: EditorView,
  x: number,
  y: number
): { pos: number; dom: HTMLElement; node: ProseMirrorNode } | null {
  // 에디터 영역 내 좌표로 변환
  const editorRect = view.dom.getBoundingClientRect();
  const targetX = editorRect.left + 70; // 에디터 내부 좌표

  const element = document.elementFromPoint(targetX, y);
  if (!element) return null;

  const blockElement = element.closest(
    '.ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, ' +
    '.ProseMirror li, .ProseMirror blockquote, .ProseMirror pre, ' +
    '.ProseMirror div[data-type="checkbox"], .ProseMirror hr, .ProseMirror table'
  );

  if (!blockElement || !(blockElement instanceof HTMLElement)) return null;
  if (!view.dom.contains(blockElement)) return null;

  try {
    const insidePos = view.posAtDOM(blockElement, 0);
    if (insidePos === null || insidePos < 0) return null;

    const $pos = view.state.doc.resolve(insidePos);
    const blockPos = $pos.before($pos.depth);
    const node = view.state.doc.nodeAt(blockPos);

    if (!node) return null;

    return { pos: blockPos, dom: blockElement, node };
  } catch {
    return null;
  }
}

/**
 * 드래그 핸들러 - Tiptap 방식 구현
 * 핵심: dragging 설정 → selection 설정 → dispatch (순서 중요!)
 */
function handleDragStart(
  event: DragEvent,
  view: EditorView,
  blockPos: number,
  blockNode: ProseMirrorNode,
  blockDom: HTMLElement
) {
  if (!event.dataTransfer) return;

  const { state } = view;
  const { tr } = state;

  // 1. Selection 범위 계산 (from, to)
  const from = blockPos;
  const to = blockPos + blockNode.nodeSize;

  // 2. TextSelection 생성 (NodeSelection 대신 - 더 안정적)
  const $from = state.doc.resolve(from);
  const $to = state.doc.resolve(to);
  const selection = TextSelection.between($from, $to);

  // 3. Slice 생성 - selection.content() 사용 (Tiptap 방식)
  const slice = selection.content();

  // 4. 드래그 이미지 설정
  const wrapper = document.createElement('div');
  const clonedElement = blockDom.cloneNode(true) as HTMLElement;
  wrapper.appendChild(clonedElement);
  wrapper.style.position = 'absolute';
  wrapper.style.top = '-10000px';
  wrapper.style.pointerEvents = 'none';
  document.body.appendChild(wrapper);

  event.dataTransfer.clearData();
  event.dataTransfer.setDragImage(wrapper, 0, 0);
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', blockNode.textContent);

  // 5. view.dragging 설정 (dispatch 전에 설정해야 함!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (view as any).dragging = { slice, move: true };

  // 6. Selection 적용 및 dispatch
  tr.setSelection(selection);
  view.dispatch(tr);

  // 7. 클린업
  document.addEventListener('drop', () => {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }, { once: true });

  document.addEventListener('dragend', () => {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }, { once: true });
}

/**
 * 드래그 핸들 플러그인 생성
 */
export function createDragHandlePlugin(options: DragHandlePluginOptions) {
  const { onStateChange } = options;

  let currentState: DragHandleState = {
    hoveredBlockPos: -1,
    hoveredBlockDom: null,
    hoveredBlockNode: null,
    visible: false,
    handleTop: 0,
  };

  let handleElement: HTMLElement | null = null;
  let rafId: number | null = null;

  const updateState = (newState: Partial<DragHandleState>) => {
    currentState = { ...currentState, ...newState };
    onStateChange?.(currentState);
  };

  const hideHandle = () => {
    updateState({
      visible: false,
      hoveredBlockPos: -1,
      hoveredBlockDom: null,
      hoveredBlockNode: null,
    });
  };

  const onDragStart = (e: DragEvent) => {
    const view = (handleElement as any)?._prosemirrorView as EditorView;
    if (!view || currentState.hoveredBlockPos < 0 || !currentState.hoveredBlockNode || !currentState.hoveredBlockDom) {
      return;
    }

    handleDragStart(
      e,
      view,
      currentState.hoveredBlockPos,
      currentState.hoveredBlockNode,
      currentState.hoveredBlockDom
    );
  };

  const onDragEnd = () => {
    // ProseMirror가 drop을 처리한 후 포커스 복원
    const view = (handleElement as any)?._prosemirrorView as EditorView;
    if (view && !view.hasFocus()) {
      setTimeout(() => {
        view.focus();
      }, 0);
    }
    hideHandle();
  };

  return new Plugin<DragHandleState>({
    key: dragHandlePluginKey,

    state: {
      init: () => currentState,
      apply(tr, value) {
        // 문서 변경 시 위치 매핑
        if (tr.docChanged && value.hoveredBlockPos >= 0) {
          const newPos = tr.mapping.map(value.hoveredBlockPos);
          if (newPos !== value.hoveredBlockPos) {
            return { ...value, hoveredBlockPos: newPos };
          }
        }
        return value;
      },
    },

    view(editorView) {
      return {
        update(view) {
          // 핸들 요소에 view 참조 저장
          if (handleElement) {
            (handleElement as any)._prosemirrorView = view;
          }
        },
        destroy() {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          if (handleElement) {
            handleElement.removeEventListener('dragstart', onDragStart);
            handleElement.removeEventListener('dragend', onDragEnd);
          }
        },
      };
    },

    props: {
      handleDOMEvents: {
        // 키보드 입력 시 핸들 숨기기
        keydown(view) {
          if (view.hasFocus() && currentState.visible) {
            hideHandle();
          }
          return false;
        },

        // 마우스 이동 시 블록 감지
        mousemove(view, event) {
          // RAF로 쓰로틀링
          if (rafId) return false;

          rafId = requestAnimationFrame(() => {
            rafId = null;

            const containerRect = view.dom.parentElement?.getBoundingClientRect();
            if (!containerRect) return;

            const relativeX = event.clientX - containerRect.left;

            // 왼쪽 여백 영역에서만 핸들 표시
            if (relativeX < 0 || relativeX > 80) {
              if (currentState.visible) {
                hideHandle();
              }
              return;
            }

            const block = findBlockFromCoords(view, event.clientX, event.clientY);

            if (block) {
              const blockRect = block.dom.getBoundingClientRect();
              const handleTop = blockRect.top - containerRect.top;

              // 같은 블록이면 업데이트 스킵
              if (currentState.hoveredBlockPos === block.pos &&
                  Math.abs(currentState.handleTop - handleTop) < 1) {
                return;
              }

              updateState({
                hoveredBlockPos: block.pos,
                hoveredBlockDom: block.dom,
                hoveredBlockNode: block.node,
                visible: true,
                handleTop,
              });
            } else if (currentState.visible) {
              hideHandle();
            }
          });

          return false;
        },

        // 마우스가 에디터를 벗어나면 핸들 숨기기
        mouseleave() {
          if (currentState.visible) {
            hideHandle();
          }
          return false;
        },

        // 드롭 후 포커스 복원
        drop(view) {
          if (!view.hasFocus()) {
            setTimeout(() => view.focus(), 0);
          }
          return false;
        },
      },
    },
  });
}

/**
 * 핸들 요소 등록 (React 컴포넌트에서 호출)
 */
export function registerDragHandleElement(
  view: EditorView,
  element: HTMLElement
) {
  // view 참조 저장
  (element as any)._prosemirrorView = view;

  // 드래그 속성 설정
  element.draggable = true;
  element.style.cursor = 'grab';
}
