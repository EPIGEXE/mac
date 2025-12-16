/**
 * 공부 모드 페이지
 * - store 모드: studySessionStore에서 노트 목록 관리 (StudySetupPage에서 진입)
 * - legacy 모드: URL 파라미터로 단일 노트/카테고리 학습 (NoteDetailPage에서 진입)
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StudyQuizViewer } from '../features/Study/StudyQuizViewer'
import { useStudySessionStore } from '../stores/studySessionStore'
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
    const selectedNoteIds = useStudySessionStore((state) => state.selectedNoteIds)
    const storeIndex = useStudySessionStore((state) => state.currentIndex)
    const goToNextNote = useStudySessionStore((state) => state.goToNextNote)
    const abandonSession = useStudySessionStore((state) => state.abandonSession)

    // ================================ 상태 관리 ================================
    const [notes, setNotes] = useState<Note[]>([])

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


    // ================================ DEBUG ================================
    console.log('[StudyModePage] render', {
        selectedNoteIds,
        selectedNoteIdsLength: selectedNoteIds.length,
        storeIndex,
    })

    // ================================ useEffect ================================
    useEffect(() => {
        async function loadNotes() {
            console.log('[StudyModePage] loadNotes started', { selectedNoteIds })
            const loadedNotes: Note[] = []

            for (const id of selectedNoteIds) {
                const note = await findNoteById(id)
                console.log('[StudyModePage] findNoteById result', { id, found: !!note, noteTitle: note?.title })
                if (note) loadedNotes.push(note)
            }

            console.log('[StudyModePage] loadNotes completed', {
                loadedCount: loadedNotes.length,
                loadedIds: loadedNotes.map(n => n.id)
            })
            setNotes(loadedNotes)
        }

        loadNotes()
    }, [selectedNoteIds, noteId, category, order])

    // ================================ 핸들러 ================================
    const handleExit = useCallback(async () => {
        // 중간 이탈 시 세션을 isCompleted: false로 종료 (통계에 포함 안 됨)
        await abandonSession()
        navigate('/')
    }, [abandonSession, navigate])

    const handleNext = useCallback(() => {
        // 실시간으로 store에서 값을 가져와야 함 (클로저 캡처 문제 방지)
        const currentSelectedNoteIds = useStudySessionStore.getState().selectedNoteIds
        const currentIsSingleNote = currentSelectedNoteIds.length === 1

        const hasMore = goToNextNote()
        console.log('[StudyModePage] handleNext', { hasMore, isSingleNote: currentIsSingleNote })

        if (!hasMore) {
            // 마지막 노트 - 결과 페이지로 이동 (completeSession은 각 모드 결과 화면에서 호출됨)
            if (currentIsSingleNote) {
                // 단일 노트면 메인으로
                navigate('/')
            } else {
                // 여러 노트면 최종 결과 페이지로
                navigate('/study/result')
            }
        }
    }, [goToNextNote, navigate])

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
            />
        </ErrorBoundary>
    )
}
