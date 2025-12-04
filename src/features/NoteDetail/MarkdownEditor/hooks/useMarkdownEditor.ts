import { useRef, useEffect, useCallback, useState } from 'react'
import { EditorState, Transaction, TextSelection } from 'prosemirror-state'
import { Slice } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import { history } from 'prosemirror-history'
import { gapCursor } from 'prosemirror-gapcursor'
import { dropCursor } from 'prosemirror-dropcursor'
import { tableEditing, columnResizing, fixTables } from 'prosemirror-tables'

import { schema } from '../editor/schema'
import { markdownInputRules } from '../editor/plugins/inputRules'
import { editorKeymap, fullKeymap } from '../editor/plugins/keymap'
import { parseMarkdown, serializeToMarkdown, serializeSliceToMarkdown } from '../editor/markdown'
import { createNodeViews } from '../editor/nodeViews/nodeViews'
import { placeholderPlugin, focusPlugin, slashCommandPlugin, blockDragDropPlugin, autoJoinListsPlugin } from '../editor/plugins'
import type { SlashCommandState } from '../editor/plugins'
import { createCodeHighlightPlugin } from '../editor/plugins/codeHighlightPlugin'
import { createImagePlugin } from '../editor/plugins/imagePlugin'
import { createTableHandlesPlugin, type TableHandlesState } from '../editor/nodeViews/table/TableHandlesPlugin'
import { TableView } from '../editor/nodeViews/table/TableView'

interface UseMarkdownEditorOptions {
    initialContent: string // 초기 콘텐츠
    onChange: (markdown: string) => void // 콘텐츠 변경 핸들러
    editable?: boolean // 에디터 편집 가능 여부
    placeholder?: string // 플레이스홀더 텍스트
}

/**
 * ProseMirror 기반 마크다운 에디터 훅
 */
export function useMarkdownEditor({
    initialContent,
    onChange,
    editable = true,
    placeholder = '내용을 입력하세요...',
}: UseMarkdownEditorOptions) {
    // =================================== 상태 관리 ===================================
    const [slashCommandState, setSlashCommandState] = useState<SlashCommandState>({
        active: false,
        query: '',
        position: null,
        selectedIndex: 0,
        triggerPos: 0,
    })
    const [tableHandlesState, setTableHandlesState] = useState<TableHandlesState | null>(null)
    const [isViewReady, setIsViewReady] = useState(false)

    // =================================== Ref ===================================
    const containerRef = useRef<HTMLDivElement>(null) // 에디터 컨테이너 참조(에디터가 붙을 DOM 요소)
    const viewRef = useRef<EditorView | null>(null) // 에디터 뷰 참조
    const onChangeRef = useRef(onChange) // 콘텐츠 변경 핸들러 참조

    onChangeRef.current = onChange

    // 에디터 초기화
    useEffect(() => {
        if (!containerRef.current) return

        // 이미 에디터가 있으면 스킵
        if (viewRef.current) return

        // 초기 문서 파싱
        const doc = parseMarkdown(initialContent)

        // 테이블 문서 수정 (깨진 테이블 구조 수정)
        let fixedDoc = doc
        const tempState = EditorState.create({ doc, schema })
        const fix = fixTables(tempState)
        if (fix) {
            fixedDoc = fix.doc
        }

        // EditorState 생성
        const state = EditorState.create({
            doc: fixedDoc,
            schema,
            plugins: [
                slashCommandPlugin(setSlashCommandState), // 슬래시 커맨드를 먼저 등록하여 Enter 키를 우선 처리
                blockDragDropPlugin(), // 블록 드래그 앤 드롭 플러그인
                autoJoinListsPlugin(), // 인접한 동일 타입 리스트 자동 병합
                markdownInputRules, // 마크다운 입력 규칙
                editorKeymap, // 에디터 키맵
                fullKeymap, // 전체 키맵
                history(), // 히스토리 플러그인
                gapCursor(), // 갭 커서 플러그인(이미지, 커스텀 노드 등을 커서를 둘 수 있는 공간으로 표시)
                dropCursor({ color: '#6366f1', width: 4 }), // 드롭 커서 두께 증가
                // 테이블 플러그인 - Tiptap 스타일 (TableView 사용)
                columnResizing({
                    cellMinWidth: 100,
                    View: TableView,
                }),
                tableEditing({ allowTableNodeSelection: true }), // 테이블 노드 선택 허용
                createTableHandlesPlugin(setTableHandlesState), // 테이블 핸들 플러그인
                createCodeHighlightPlugin(), // 코드 블록 syntax highlighting
                createImagePlugin(), // 이미지 드롭/붙여넣기 플러그인
                placeholderPlugin(placeholder), // 플레이스홀더 플러그인
                focusPlugin(), // 포커스 플러그인
            ],
        })

        // EditorView 생성
        const view = new EditorView(containerRef.current, {
            state, // 에디터의 초기 상태 객체(문서 내용, 스키마, 플러그인 등 포함)
            editable: () => editable, // 에디터 편집 가능 상태
            nodeViews: createNodeViews(), // 사용자 정의 노드 뷰
            dispatchTransaction(tr: Transaction) {
                //사용자 지정 트랜잭션 처리
                const newState = view.state.apply(tr)
                view.updateState(newState)

                // 문서가 변경되었으면 마크다운으로 변환하여 콜백 호출
                // 리액트 상태로 업데이트
                if (tr.docChanged) {
                    const markdown = serializeToMarkdown(newState.doc)
                    onChangeRef.current(markdown)
                }
            },
            handleDOMEvents: {
                // ProseMirror가 처리하지 않는 DOM 이벤트 사용자 정의
                // 에디터 하단 여백 클릭 시 새 줄 생성
                click: (view, event) => {
                    const target = event.target as HTMLElement

                    // 에디터 DOM 자체를 클릭한 경우 (padding 영역 포함)
                    if (target === view.dom) {
                        const clickY = event.clientY

                        // 마지막 블록 요소 찾기
                        const lastBlockElement = view.dom.lastElementChild
                        if (!lastBlockElement) return false

                        const lastBlockRect = lastBlockElement.getBoundingClientRect()

                        // 클릭이 마지막 블록 아래쪽이면 (하단 여백 영역)
                        if (clickY > lastBlockRect.bottom) {
                            const lastChild = view.state.doc.lastChild
                            const endPos = view.state.doc.content.size

                            // 마지막 블록이 빈 paragraph면 거기로 커서 이동
                            if (
                                lastChild &&
                                lastChild.type === schema.nodes.paragraph &&
                                lastChild.content.size === 0
                            ) {
                                const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, endPos))
                                view.dispatch(tr.scrollIntoView())
                                view.focus()
                                return true
                            }

                            // 아니면 새 paragraph 추가
                            const emptyParagraph = schema.nodes.paragraph.create()
                            const tr = view.state.tr.insert(endPos, emptyParagraph)
                            tr.setSelection(TextSelection.create(tr.doc, endPos + 1))
                            view.dispatch(tr.scrollIntoView())
                            view.focus()
                            return true
                        }
                    }

                    return false
                },
            },
            attributes: {
                // 에디터의 루트 DOM 요소 HTML 속성 추가
                class: 'pm-editor', // 커스텀 클래스
                spellcheck: 'false', // 마춤법 검사 비활성화
            },
            // 복사 시 마크다운으로 변환
            clipboardTextSerializer: (slice) => {
                return serializeSliceToMarkdown(slice)
            },
            // 붙여넣기 시 마크다운 텍스트를 파싱
            clipboardTextParser: (text, _$context, plain, _view) => {
                console.log('[clipboardTextParser] called, plain:', plain, 'text length:', text.length)
                // 마크다운을 ProseMirror 문서로 파싱
                const doc = parseMarkdown(text)
                console.log('[clipboardTextParser] parsed doc:', doc.content.childCount, 'children')
                // 문서의 content를 Slice로 반환 (openStart, openEnd는 0으로 설정)
                return new Slice(doc.content, 0, 0)
            },
        })

        viewRef.current = view
        setIsViewReady(true)

        // 컬럼 리사이즈 핸들 높이를 테이블 전체 높이로 조정하는 MutationObserver
        const resizeHandleObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            // 추가된 노드 또는 그 하위에서 column-resize-handle 찾기
                            const handles = node.classList?.contains('column-resize-handle')
                                ? [node]
                                : Array.from(node.querySelectorAll('.column-resize-handle'))

                            handles.forEach((handle) => {
                                const cell = handle.parentElement
                                if (!cell) return

                                // 테이블 찾기
                                const table = cell.closest('table')
                                if (!table) return

                                // 셀의 위치와 테이블의 높이 계산
                                const tableRect = table.getBoundingClientRect()
                                const cellRect = cell.getBoundingClientRect()

                                // 핸들이 테이블 끝까지 닿도록 높이 설정
                                const handleHeight = tableRect.bottom - cellRect.top
                                ;(handle as HTMLElement).style.height = `${handleHeight}px`
                                ;(handle as HTMLElement).style.bottom = 'auto'
                            })
                        }
                    })
                }
            }
        })

        resizeHandleObserver.observe(containerRef.current, {
            childList: true,
            subtree: true,
        })

        // 클린업
        return () => {
            resizeHandleObserver.disconnect()
            view.destroy()
            viewRef.current = null
            setIsViewReady(false)
        }
    }, []) // 의존성 배열 비움 - 초기화는 한 번만

    // editable 상태 변경 처리
    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.setProps({ editable: () => editable })
        }
    }, [editable])

    // 외부에서 콘텐츠 업데이트 
    // 기존 스키마와 플로그인 재사용하고 문서 내용만 교체,
    // dispatchTransaction을 통하지 않기 때문에 히스토리를 초기화하고 강제 교체함
    const setContent = useCallback((markdown: string) => {
        if (!viewRef.current) return

        const doc = parseMarkdown(markdown)
        const newState = EditorState.create({
            doc,
            schema,
            plugins: viewRef.current.state.plugins,
        })
        viewRef.current.updateState(newState)
    }, [])

    // 포커스
    const focus = useCallback(() => {
        viewRef.current?.focus()
    }, [])

    // 블러
    const blur = useCallback(() => {
        viewRef.current?.dom.blur()
    }, [])

    return {
        containerRef,
        viewRef,
        isViewReady,
        setContent,
        focus,
        blur,
        slashCommandState,
        tableHandlesState,
    }
}
