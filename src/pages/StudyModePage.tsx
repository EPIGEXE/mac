/**
 * 공부 모드 페이지
 * - noteId: 단일 노트 학습
 * - category: 카테고리 전체 학습
 * - order: sequential (기본) | random
 * - mode: word | sentence | essay (학습 모드)
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StudyQuizViewer } from '../features/Study/StudyQuizViewer'
import { getAllNotes, findNoteById } from '../db/note/noteService'
import type { Note } from '../db/schema/note'
import type { StudyModeType } from '../features/Study/types'

export type StudyOrder = 'sequential' | 'random'

// 배열 셔플 (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export function StudyModePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const noteId = searchParams.get('noteId')
    const category = searchParams.get('category')
    const order = (searchParams.get('order') as StudyOrder) || 'sequential'
    const studyMode = (searchParams.get('mode') as StudyModeType) || null

    const [notes, setNotes] = useState<Note[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    // 노트 목록 로드
    useEffect(() => {
        async function loadNotes() {
            let loadedNotes: Note[] = []

            if (noteId) {
                // 단일 노트
                const note = await findNoteById(noteId)
                if (note) loadedNotes = [note]
            } else if (category) {
                // 카테고리 전체
                const allNotes = await getAllNotes()
                loadedNotes = allNotes.filter((n) => n.category === category)
            }

            // 랜덤 순서면 셔플
            if (order === 'random') {
                loadedNotes = shuffleArray(loadedNotes)
            }

            setNotes(loadedNotes)
            setIsLoading(false)
        }
        loadNotes()
    }, [noteId, category, order])

    const handleExit = useCallback(() => {
        navigate(-1)
    }, [navigate])

    const handleNext = useCallback(() => {
        if (currentIndex < notes.length - 1) {
            setCurrentIndex((prev) => prev + 1)
        } else {
            // 마지막 노트 완료 → 종료
            navigate(-1)
        }
    }, [currentIndex, notes.length, navigate])

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">loading...</span>
            </div>
        )
    }

    if (notes.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">// no notes to study</span>
            </div>
        )
    }

    const currentNote = notes[currentIndex]
    const hasNextNote = currentIndex < notes.length - 1

    return (
        <StudyQuizViewer
            key={currentNote.id} // 노트 변경 시 컴포넌트 리셋
            note={currentNote}
            onExit={handleExit}
            onNext={handleNext}
            hasNextNote={hasNextNote}
            initialMode={studyMode}
        />
    )
}
