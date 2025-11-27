import { SlashCommandMenu } from './components/SlashCommandMenu'
import { BlockHandle } from './components/BlockHandle'
import { useMarkdownEditor } from './hooks/useMarkdownEditor';
import { TableHandles } from './components/TableHandles/TableHandles';

export interface MarkdownEditorProps {
    initialContent: string;
    onChange: (content: string) => void;
    editable?: boolean;
  }

/**
 * ProseMirror 기반 마크다운 에디터
 *
 * 특징:
 * - 실시간 마크다운 변환 (## → h2, - → bullet list 등)
 * - 커서 위치 자동 관리 (Transaction 기반)
 * - Undo/Redo 지원 (Ctrl+Z, Ctrl+Y)
 * - 체크박스 토글 지원
 * - 슬래시 커맨드 (/) 지원
 * - 블록 드래그 앤 드롭 (노션 스타일)
 *
 * 지원 마크다운:
 * - # + Space → h1
 * - ## + Space → h2
 * - ### + Space → h3
 * - - + Space → bullet list
 * - 1. + Space → numbered list
 * - - [ ] + Space → checkbox
 * - > + Space → blockquote
 * - ``` → code block
 * - --- → horizontal rule
 * - | | | → table
 */
export function MarkdownEditor({ initialContent, onChange, editable = true }: MarkdownEditorProps) {
    // =================================== Hooks ===================================
    const {
        containerRef, // 에디터 컨테이너 참조(에디터가 붙을 DOM 요소)
        viewRef, // 에디터 뷰 참조
        isViewReady, // 에디터 준비 상태
        slashCommandState, // 슬래시 커맨드 상태
        tableHandlesState, // 테이블 핸들 상태
    } = useMarkdownEditor({
        initialContent, // 초기 콘텐츠
        onChange, // 콘텐츠 변경 핸들러
        editable, // 에디터 편집 가능 여부
        placeholder: '내용을 입력하세요...',
    })

    return (
        // 에디터 래퍼 (블록 핸들 호버 감지 영역)
        // paddingLeft를 주어 왼쪽 여백에서도 마우스 이벤트를 감지할 수 있게 함
        <div
            ref={containerRef}
            className="pm-editor-wrapper relative w-[calc(100%+54px)] min-h-[200px] -ml-[54px] pl-[54px] pr-5 box-border"
        >
            {/* 블록 핸들 (노션 스타일) */}
            {editable && isViewReady && viewRef.current && (
                <BlockHandle view={viewRef.current} containerRef={containerRef} />
            )}

            {/* 슬래시 커맨드 메뉴 */}
            <SlashCommandMenu state={slashCommandState} view={viewRef.current} containerRef={containerRef} />

            {/* 테이블 핸들 (BlockNote 스타일) */}
            {editable && isViewReady && <TableHandles view={viewRef.current} state={tableHandlesState} />}
        </div>
    )
}
