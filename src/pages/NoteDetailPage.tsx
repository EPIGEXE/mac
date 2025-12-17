import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { NoteHeader } from '../components/common/NoteHeader'
import { MarkdownEditor } from '../features/NoteDetail/MarkdownEditor/MarkdownEditor'
import { TableOfContents } from '../features/NoteDetail/TableOfContents'
import type { StudyModeType } from '../features/Study/types'
import type { Note } from '../db/schema/note'
import { StudyModeSelectModal } from '../features/NoteDetail/StudyModeSelectModal'
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary'
import { ErrorFallback } from '../components/ErrorBoundary/ErrorFallback'
import { useStudySessionStore } from '../stores/studySessionStore'
import { useNoteStore } from '../stores/noteStore'
import { NoteDetailHeader } from '../features/NoteDetail/NoteDetailHeader'
import { UnsavedChangesModal } from '../features/NoteDetail/UnsavedChangesModal'
import { DeleteConfirmModal } from '../features/NoteDetail/DeleteConfirmModal'
import { analytics } from '../lib/analytics'

export function NoteDetailPage() {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션
    const { noteId } = useParams<{ noteId: string }>() // 노트 ID

    // ==================================== 상수 =====================================
    const MAX_CONTENT_LENGTH = 15000 // 최대 문자 수 (약 5000 토큰)

    // ==================================== 전역 상태 =====================================
    const notes = useNoteStore((state) => state.notes) // 노트 목록
    const loadNotes = useNoteStore((state) => state.loadNotes) // 노트 로드
    const updateNote = useNoteStore((state) => state.updateNote) // 노트 업데이트
    const deleteNote = useNoteStore((state) => state.deleteNote) // 노트 삭제

    const startSession = useStudySessionStore((state) => state.startSession) // 학습 세션 시작

    // ==================================== 상수 =====================================
    const note = notes.find((n) => n.id === noteId) // 보여줄 노트 찾기

    // ==================================== 상태 관리 =====================================
    const [title, setTitle] = useState(note?.title) // 제목
    const [pendingContent, setPendingContent] = useState<string | null>(null) // 임시 콘텐츠
    const [contentLength, setContentLength] = useState(note?.content?.length || 0) // 콘텐츠 문자 수
    const [studyModalOpen, setStudyModalOpen] = useState(false) // 학습 모달
    const [studyMode, setStudyMode] = useState<StudyModeType>('word') // 학습 모드
    const [unsavedModalOpen, setUnsavedModalOpen] = useState(false) // 저장하지 않은 변경 사항 모달
    const [deleteModalOpen, setDeleteModalOpen] = useState(false) // 삭제 확인 모달

    // ==================================== useMemo =====================================
    // dirty 체크: 제목이나 콘텐츠가 변경되었는지
    const isDirty = useMemo(() => {
        const titleChanged = title !== note?.title
        const contentChanged = pendingContent !== null && pendingContent !== note?.content
        return titleChanged || contentChanged
    }, [title, note?.title, pendingContent, note?.content])

    // 저장 가능 여부: dirty이고 문자 수 제한 이하
    const canSave = isDirty && contentLength <= MAX_CONTENT_LENGTH
    const disabledSave = contentLength > MAX_CONTENT_LENGTH

    // ==================================== useEffect =====================================
    // 노트 로드
    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    // 제목 설정
    useEffect(() => {
        setTitle(note?.title)
    }, [note?.title])

    // 노트 열람 추적
    useEffect(() => {
        if (note) {
            analytics.noteView(note.id, note.category)
        }
    }, [note?.id, note?.category])

    // ==================================== 핸들러 =====================================
    // 학습 시작
    const handleStudyStart = useCallback(() => {
        setStudyModalOpen(false)
        // 단일 노트 세션 시작
        startSession({
            noteIds: [note?.id || ''],
            mode: studyMode,
            order: 'sequential',
        })
        navigate('/study')
    }, [navigate, note?.id, studyMode, startSession])

    // 콘텐츠 변경
    const handleContentChange = useCallback((content: string) => {
        setPendingContent(content)
    }, [])

    // 저장
    const handleSave = useCallback(async () => {
        const updates: Partial<Omit<Note, 'id'>> = {
            title: title?.trim() || '제목 없음',
        }
        if (pendingContent !== null) {
            updates.content = pendingContent
        }
        if (noteId && note) {
            await updateNote(noteId, note.type, updates)
        }
        setPendingContent(null)
    }, [title, pendingContent, noteId, note, updateNote])

    // 뒤로가기 (dirty 체크)
    const handleBack = useCallback(() => {
        if (isDirty) {
            setUnsavedModalOpen(true)
        } else {
            navigate('/')
        }
    }, [isDirty])

    // 저장하지 않고 나가기
    const handleDiscardAndClose = useCallback(() => {
        setUnsavedModalOpen(false)
        navigate('/')
    }, [])

    // 저장하고 나가기
    const handleSaveAndClose = useCallback(() => {
        handleSave()
        setUnsavedModalOpen(false)
        navigate('/')
    }, [handleSave])

    // 학습 모달 열기
    const handleStudyModalOpen = useCallback(() => {
        setStudyModalOpen(true)
    }, [])

    // 삭제 모달 열기
    const handleDeleteClick = useCallback(() => {
        setDeleteModalOpen(true)
    }, [])

    // 삭제 확인
    const handleConfirmDelete = useCallback(async () => {
        setDeleteModalOpen(false)
        if (noteId && note) {
            await deleteNote(noteId, note.type)
            navigate('/')
        }
    }, [noteId, note, deleteNote, navigate])

    if (!note) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center flex-col gap-4">
                <div className="text-[var(--text-secondary)]">노트를 찾을 수 없습니다.</div>
                <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-[var(--accent)] text-white border-none rounded-lg cursor-pointer"
                >
                    메인으로 돌아가기
                </button>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Top bar */}
            <NoteDetailHeader
                handleBack={handleBack}
                handleStudyStart={handleStudyModalOpen}
                handleSave={handleSave}
                handleDeleteClick={handleDeleteClick}
                canSave={canSave}
                disabledSave={disabledSave}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* 노트 헤더 (카테고리, 제목, 태그) */}
                <NoteHeader
                    category={note?.category || ''}
                    title={title || ''}
                    tag={note?.tag}
                    editable
                    onTitleChange={setTitle}
                />

                {/* 메인 콘텐츠 */}
                <div className="main-container px-6">
                    <ErrorBoundary fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}>
                        <MarkdownEditor
                            initialContent={note?.content || ''}
                            onChange={handleContentChange}
                            editable={true}
                            maxLength={MAX_CONTENT_LENGTH}
                            onLengthChange={setContentLength}
                        />
                    </ErrorBoundary>

                    {/* 문자 수 표시 */}
                    <div className="mt-4 mb-8 font-mono text-xs flex items-center justify-end gap-2">
                        <span
                            className={
                                contentLength > MAX_CONTENT_LENGTH ? 'text-red-400' : 'text-[var(--text-tertiary)]'
                            }
                        >
                            {contentLength.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}자
                        </span>
                        {contentLength > MAX_CONTENT_LENGTH && (
                            <span className="text-red-400">(제한 초과 - 저장 불가)</span>
                        )}
                    </div>
                </div>

                {/* 목차 - 화면 우측에 고정 (노션 스타일) */}
                <TableOfContents content={pendingContent ?? note?.content ?? ''} />
            </div>

            {/* 학습 모드 선택 모달 */}
            <StudyModeSelectModal
                open={studyModalOpen}
                onOpenChange={setStudyModalOpen}
                selectedMode={studyMode}
                onModeChange={setStudyMode}
                onStart={handleStudyStart}
            />

            {/* 저장하지 않은 변경 사항 모달 */}
            <UnsavedChangesModal
                unsavedModalOpen={unsavedModalOpen}
                setUnsavedModalOpen={setUnsavedModalOpen}
                handleDiscardAndClose={handleDiscardAndClose}
                handleSaveAndClose={handleSaveAndClose}
            />

            {/* 삭제 확인 모달 */}
            <DeleteConfirmModal
                deleteModalOpen={deleteModalOpen}
                setDeleteModalOpen={setDeleteModalOpen}
                handleConfirmDelete={handleConfirmDelete}
            />
        </div>
    )
}
