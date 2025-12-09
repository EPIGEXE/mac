/**
 * 공부 모드 페이지
 * - store 모드: studySessionStore에서 노트 목록 관리 (StudySetupPage에서 진입)
 * - legacy 모드: URL 파라미터로 단일 노트/카테고리 학습 (NoteDetailPage에서 진입)
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StudyQuizViewer } from '../features/Study/StudyQuizViewer'
import { useStudySessionStore, useStudyProgress, useStudyProgressText } from '../stores/studySessionStore'
import { getAllNotes, findNoteById } from '../db/note/noteService'
import type { Note } from '../db/schema/note'
import { shuffleArray } from '../utils/funtion'
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
        isActive: isSessionActive,
        goToNextNote,
        getCurrentNoteId,
        isSingleNoteMode,
    } = useStudySessionStore()

    const progress = useStudyProgress()
    const progressText = useStudyProgressText()

    // ================================ 상태 관리 ================================
    const [notes, setNotes] = useState<Note[]>([])
    const [legacyIndex, setLegacyIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    // ================================ URL 파라미터 (legacy 모드용) ================================
    const noteId = searchParams.get('noteId')
    const category = searchParams.get('category')
    const order = (searchParams.get('order') as StudyOrder) || 'sequential'

    // Store 모드인지 Legacy 모드인지 판별
    const isStoreMode = isSessionActive && selectedNoteIds.length > 0

    // 현재 노트
    const currentNote = useMemo(() => {
        if (isStoreMode) {
            const currentNoteId = getCurrentNoteId()
            return notes.find(n => n.id === currentNoteId) ?? null
        }
        return notes[legacyIndex] ?? null
    }, [isStoreMode, notes, legacyIndex, getCurrentNoteId])

    // 다음 노트 존재 여부
    const hasNextNote = useMemo(() => {
        if (isStoreMode) {
            return storeIndex < selectedNoteIds.length - 1
        }
        return legacyIndex < notes.length - 1
    }, [isStoreMode, storeIndex, selectedNoteIds.length, legacyIndex, notes.length])

    // 단일 노트 모드 여부 (최종 결과 페이지 스킵용)
    const isSingleNote = isStoreMode ? isSingleNoteMode() : (noteId !== null)

    // ================================ useEffect ================================
    useEffect(() => {
        async function loadNotes() {
            setIsLoading(true)
            let loadedNotes: Note[] = []

            if (isStoreMode) {
                // Store 모드: selectedNoteIds로 노트 로드
                for (const id of selectedNoteIds) {
                    const note = await findNoteById(id)
                    if (note) loadedNotes.push(note)
                }
            } else if (noteId) {
                // Legacy 모드: 단일 노트
                const note = await findNoteById(noteId)
                if (note) loadedNotes = [note]
            } else if (category) {
                // Legacy 모드: 카테고리 전체
                loadedNotes = await getAllNotes({ category })
                if (order === 'random') {
                    loadedNotes = shuffleArray(loadedNotes)
                }
            }

            setNotes(loadedNotes)
            setIsLoading(false)
        }

        loadNotes()
    }, [isStoreMode, selectedNoteIds, noteId, category, order])

    // ================================ 핸들러 ================================
    const handleExit = useCallback(() => {
        navigate('/')
    }, [navigate])

    const handleNext = useCallback(() => {
        if (isStoreMode) {
            const hasMore = goToNextNote()
            if (!hasMore) {
                // 마지막 노트 완료
                if (isSingleNote) {
                    // 단일 노트면 메인으로
                    navigate('/')
                } else {
                    // 여러 노트면 최종 결과 페이지로
                    navigate('/study/result')
                }
            }
        } else {
            // Legacy 모드
            if (legacyIndex < notes.length - 1) {
                setLegacyIndex(prev => prev + 1)
            } else {
                navigate(-1)
            }
        }
    }, [isStoreMode, goToNextNote, isSingleNote, navigate, legacyIndex, notes.length])

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
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">// 공부할 노트가 없습니다.</span>
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
                // 진행률 정보 (Store 모드에서만 표시)
                showProgress={isStoreMode && !isSingleNote}
                progress={progress}
                progressText={progressText}
            />
        </ErrorBoundary>
    )
}
