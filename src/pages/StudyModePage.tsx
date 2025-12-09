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
import { shuffleArray } from '../utils/funtion'

export type StudyOrder = 'sequential' | 'random'

export function StudyModePage() {
    // ================================ Hooks ================================
    const navigate = useNavigate() // 네비게이션
    const [searchParams] = useSearchParams() // 쿼리 파라미터

    // ================================ 상태 관리 ================================
    const [notes, setNotes] = useState<Note[]>([]) // 노트 목록
    const [currentIndex, setCurrentIndex] = useState(0) // 현재 인덱스
    const [isLoading, setIsLoading] = useState(true) // 로딩 상태

    // ================================ 상수 ================================
    const noteId = searchParams.get('noteId') // 노트 ID
    const category = searchParams.get('category') // 카테고리
    const order = (searchParams.get('order') as StudyOrder) || 'sequential' // 순서
    

    const currentNote = notes[currentIndex] // 현재 노트
    const hasNextNote = currentIndex < notes.length - 1 // 다음 노트

    // ================================ useEffect ================================
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
                loadedNotes = await getAllNotes({ category })
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

    // ================================ 핸들러 ================================
    // 나가기(이전 네비게이션으로)
    const handleExit = useCallback(() => {
        navigate(-1)
    }, [navigate])

    // 다음 노트로 이동
    const handleNext = useCallback(() => {
        if (currentIndex < notes.length - 1) {
            setCurrentIndex((prev) => prev + 1)
        } else {
            // 마지막 노트 완료 → 종료
            navigate(-1)
        }
    }, [currentIndex, notes.length, navigate])

    // ================================ 렌더링 ================================
    // 로딩
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">loading...</span>
            </div>
        )
    }

    // 노트가 없음
    if (notes.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">// 공부할 노트가 없습니다.</span>
            </div>
        )
    }

    return (
        <StudyQuizViewer
            key={currentNote.id} // 노트 변경 시 컴포넌트 리셋
            note={currentNote}
            onExit={handleExit}
            onNext={handleNext}
            hasNextNote={hasNextNote}
        />
    )
}
