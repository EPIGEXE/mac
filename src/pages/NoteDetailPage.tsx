import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSun, IconMoon, IconArrowLeft } from '@tabler/icons-react'
import { TerminalButton } from '../components/common/TerminalButton'
import { TerminalModal } from '../components/common/TerminalModal'
import { NoteHeader } from '../components/common/NoteHeader'
import { MarkdownEditor } from '../features/NoteDetail/MarkdownEditor/MarkdownEditor'
import { TableOfContents } from '../features/NoteDetail/TableOfContents'
import type { StudyModeType } from '../features/Study/types'
import type { Note } from '../db/schema/note'
import { StudyModeSelector } from '../features/Study/components/StudyModeSelector'
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary'
import { ErrorFallback } from '../components/ErrorBoundary/ErrorFallback'
import { useStudySessionStore } from '../stores/studySessionStore'

interface NoteDetailPageProps {
    note: Note
    theme: 'light' | 'dark'
    onThemeToggle: () => void
    onClose: () => void
    onUpdate: (updates: Partial<Omit<Note, 'id'>>) => void
    onDelete: () => void
}

export function NoteDetailPage({
    note,
    theme,
    onThemeToggle,
    onClose,
    onUpdate,
    onDelete,
}: NoteDetailPageProps) {
    const navigate = useNavigate()

    // ==================================== 상수 =====================================
    const MAX_CONTENT_LENGTH = 15000 // 최대 문자 수 (약 5000 토큰)

    // ==================================== 상태 관리 =====================================
    const [title, setTitle] = useState(note.title) // 제목
    const [pendingContent, setPendingContent] = useState<string | null>(null) // 임시 콘텐츠
    const [contentLength, setContentLength] = useState(note.content?.length || 0) // 콘텐츠 문자 수
    const [studyModalOpen, setStudyModalOpen] = useState(false) // 학습 모달
    const [studyMode, setStudyMode] = useState<StudyModeType>('word') // 학습 모드
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false) // 저장하지 않은 변경 사항 모달
    const [deleteModalOpen, setDeleteModalOpen] = useState(false) // 삭제 확인 모달

    // ==================================== useMemo =====================================
    // dirty 체크: 제목이나 콘텐츠가 변경되었는지
    const isDirty = useMemo(() => {
        const titleChanged = title !== note.title
        const contentChanged = pendingContent !== null && pendingContent !== note.content
        return titleChanged || contentChanged
    }, [title, note.title, pendingContent, note.content])

    // 저장 가능 여부: dirty이고 문자 수 제한 이하
    const canSave = isDirty && contentLength <= MAX_CONTENT_LENGTH

    // ==================================== useEffect =====================================
    // 제목 설정
    useEffect(() => {
        setTitle(note.title)
    }, [note.title])

    // ==================================== Store =====================================
    const startSession = useStudySessionStore((state) => state.startSession)

    // ==================================== 핸들러 =====================================
    // 학습 시작
    const handleStudyStart = useCallback(() => {
        setStudyModalOpen(false)
        // 단일 노트 세션 시작
        startSession({
            noteIds: [note.id],
            mode: studyMode,
            order: 'sequential',
        })
        navigate('/study')
    }, [navigate, note.id, studyMode, startSession])

    // 콘텐츠 변경
    const handleContentChange = useCallback((content: string) => {
        setPendingContent(content)
    }, [])

    // 저장
    const handleSave = useCallback(() => {
        const updates: Partial<Omit<Note, 'id'>> = {
            title: title.trim() || '제목 없음',
        }
        if (pendingContent !== null) {
            updates.content = pendingContent
        }
        onUpdate(updates)
        setPendingContent(null)
    }, [title, pendingContent, onUpdate])

    // 뒤로가기 (dirty 체크)
    const handleBack = useCallback(() => {
        if (isDirty) {
            setUnsavedModalOpen(true)
        } else {
            onClose()
        }
    }, [isDirty, onClose])

    // 저장하지 않고 나가기
    const handleDiscardAndClose = useCallback(() => {
        setUnsavedModalOpen(false)
        onClose()
    }, [onClose])

    // 저장하고 나가기
    const handleSaveAndClose = useCallback(() => {
        handleSave()
        setUnsavedModalOpen(false)
        onClose()
    }, [handleSave, onClose])

    // 삭제 모달 열기
    const handleDeleteClick = useCallback(() => {
        setDeleteModalOpen(true)
    }, [])

    // 삭제 확인
    const handleConfirmDelete = useCallback(() => {
        setDeleteModalOpen(false)
        onDelete()
    }, [onDelete])

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Top bar - 터미널 스타일 */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
                    {/* 좌측: 뒤로가기 */}
                    <button
                        onClick={handleBack}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    {/* 우측: 컨트롤 */}
                    <div className="flex items-center gap-4">
                        {/* 학습 버튼 */}
                        <button
                            onClick={() => setStudyModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[13px] bg-[var(--accent)] text-white border-none cursor-pointer transition-all duration-150 hover:opacity-90"
                        >
                            <span className="text-[11px] opacity-80">▶</span>
                            study
                        </button>

                        {/* 저장/삭제 버튼 */}
                        <TerminalButton
                            onClick={handleSave}
                            active={canSave}
                            disabled={contentLength > MAX_CONTENT_LENGTH}
                        >
                            :w save
                        </TerminalButton>
                        <TerminalButton onClick={handleDeleteClick} variant="danger">
                            :d delete
                        </TerminalButton>

                        {/* 테마 토글 */}
                        <button
                            onClick={onThemeToggle}
                            className="w-8 h-8 border border-[var(--border-light)] bg-transparent text-[var(--text-tertiary)] flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* 노트 헤더 (카테고리, 제목, 태그) */}
                <NoteHeader
                    category={note.category}
                    title={title}
                    tag={note.tag}
                    editable
                    onTitleChange={setTitle}
                />

                {/* 메인 콘텐츠 */}
                <div className="max-w-[1000px] mx-auto px-6">
                    <ErrorBoundary fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}>
                        <MarkdownEditor
                            initialContent={note.content || ''}
                            onChange={handleContentChange}
                            editable={true}
                            maxLength={MAX_CONTENT_LENGTH}
                            onLengthChange={setContentLength}
                        />
                    </ErrorBoundary>

                    {/* 문자 수 표시 */}
                    <div className="mt-4 mb-8 font-mono text-xs flex items-center justify-end gap-2">
                        <span className={contentLength > MAX_CONTENT_LENGTH ? 'text-red-400' : 'text-[var(--text-tertiary)]'}>
                            {contentLength.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}자
                        </span>
                        {contentLength > MAX_CONTENT_LENGTH && (
                            <span className="text-red-400">
                                (제한 초과 - 저장 불가)
                            </span>
                        )}
                    </div>
                </div>

                {/* 목차 - 화면 우측에 고정 (노션 스타일) */}
                <TableOfContents content={pendingContent ?? note.content ?? ''} />
            </div>

            {/* 학습 모드 선택 모달 */}
            <StudyModeSelector
                open={studyModalOpen}
                onOpenChange={setStudyModalOpen}
                selectedMode={studyMode}
                onModeChange={setStudyMode}
                onStart={handleStudyStart}
            />

            {/* 저장하지 않은 변경 사항 모달 */}
            <TerminalModal
                open={unsavedModalOpen}
                onOpenChange={setUnsavedModalOpen}
                command="vim --unsaved"
                title="저장하지 않은 변경 사항"
                description="// unsaved changes detected"
                maxWidth="400px"
            >
                <div className="flex gap-3">
                    <button
                        onClick={handleDiscardAndClose}
                        className="flex-1 p-3 border border-[var(--border-light)] hover:border-red-400 transition-colors text-center cursor-pointer"
                    >
                        <div className="font-mono text-sm text-red-400">:q!</div>
                        <div className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                            저장하지 않고 나가기
                        </div>
                    </button>
                    <button
                        onClick={handleSaveAndClose}
                        className="flex-1 p-3 border border-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors text-center cursor-pointer"
                    >
                        <div className="font-mono text-sm text-[var(--accent)]">:wq</div>
                        <div className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                            저장하고 나가기
                        </div>
                    </button>
                </div>
            </TerminalModal>

            {/* 삭제 확인 모달 */}
            <TerminalModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                command="rm --confirm"
                title="노트 삭제"
                description="// this action cannot be undone"
                maxWidth="400px"
            >
                <div className="flex gap-3">
                    <button
                        onClick={() => setDeleteModalOpen(false)}
                        className="flex-1 p-3 border border-[var(--border-light)] hover:border-[var(--text-tertiary)] transition-colors text-center cursor-pointer"
                    >
                        <div className="font-mono text-sm text-[var(--text-primary)]">:q</div>
                        <div className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                            취소
                        </div>
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        className="flex-1 p-3 border border-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors text-center cursor-pointer"
                    >
                        <div className="font-mono text-sm text-red-400">:d!</div>
                        <div className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                            삭제하기
                        </div>
                    </button>
                </div>
            </TerminalModal>
        </div>
    )
}
