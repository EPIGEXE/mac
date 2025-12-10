/**
 * 공부 모드 페이지
 * - store 모드: studySessionStore에서 노트 목록 관리 (StudySetupPage에서 진입)
 * - legacy 모드: URL 파라미터로 단일 노트/카테고리 학습 (NoteDetailPage에서 진입)
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StudyQuizViewer } from '../features/Study/StudyQuizViewer'
import { useStudySessionStore, useStudyProgress, useStudyProgressText } from '../stores/studySessionStore'
import { findNoteById } from '../db/note/noteService'
import type { Note } from '../db/schema/note'
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary'
import { ErrorFallback } from '../components/ErrorBoundary/ErrorFallback'

export type StudyOrder = 'sequential' | 'random'

export function StudyModePage() {
    // ================================ Hooks ================================
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Store 상태
    const {
        selectedNoteIds,
        currentIndex: storeIndex,
        goToNextNote,
        isSingleNoteMode,
        completeSession,
    } = useStudySessionStore()

    const progress = useStudyProgress()
    const progressText = useStudyProgressText()

    // ================================ 상태 관리 ================================
    const [notes, setNotes] = useState<Note[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ================================ URL 파라미터 (legacy 모드용) ================================
    const noteId = searchParams.get('noteId')
    const category = searchParams.get('category')
    const order = (searchParams.get('order') as StudyOrder) || 'sequential'

    // 현재 노트
    const currentNote = useMemo(() => {
        const currentNoteId = selectedNoteIds[storeIndex] ?? null
        const found = notes.find((n) => n.id === currentNoteId) ?? null
        console.log('[StudyModePage] currentNote computed', { currentNoteId, storeIndex, found: found?.title })
        return found
    }, [notes, selectedNoteIds, storeIndex])

    // 다음 노트 존재 여부
    const hasNextNote = useMemo(() => {
        return storeIndex < selectedNoteIds.length - 1
    }, [storeIndex, selectedNoteIds.length])

    // 단일 노트 모드 여부 (최종 결과 페이지 스킵용)
    const isSingleNote = isSingleNoteMode()

    // ================================ useEffect ================================
    useEffect(() => {
        async function loadNotes() {
            setIsLoading(true)
            const loadedNotes: Note[] = []

            for (const id of selectedNoteIds) {
                const note = await findNoteById(id)
                if (note) loadedNotes.push(note)
            }

            setNotes(loadedNotes)
            setIsLoading(false)
        }

        loadNotes()
    }, [selectedNoteIds, noteId, category, order])

    // ================================ 핸들러 ================================
    const handleExit = useCallback(() => {
        navigate('/')
    }, [navigate])

    const handleNext = useCallback(async () => {
        console.log('[StudyModePage] handleNext called', { storeIndex, selectedNoteIds })
        const hasMore = goToNextNote()
        console.log('[StudyModePage] goToNextNote result', { hasMore })
        if (!hasMore) {
            // 마지막 노트 완료 - DB 세션 종료
            await completeSession()

            if (isSingleNote) {
                // 단일 노트면 메인으로
                navigate('/')
            } else {
                // 여러 노트면 최종 결과 페이지로
                navigate('/study/result')
            }
        }
    }, [goToNextNote, isSingleNote, navigate, storeIndex, selectedNoteIds, completeSession])

    // ================================ 렌더링 ================================
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">loading...</span>
            </div>
        )
    }

    if (!currentNote) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] p-8 rounded">
                <span className="font-mono text-[var(--text-tertiary)]">// 공부할 노트가 없습니다.</span>
                <button
                    onClick={handleExit}
                    className="flex items-center gap-2 px-4 py-2 font-mono text-sm border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                    back
                </button>
            </div>
        )
    }

    return (
        <ErrorBoundary fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}>
            <StudyQuizViewer
                key={currentNote.id}
                note={currentNote}
                onExit={handleExit}
                onNext={handleNext}
                hasNextNote={hasNextNote}
                showProgress={!isSingleNote}
                progress={progress}
                progressText={progressText}
            />
        </ErrorBoundary>
    )
}
