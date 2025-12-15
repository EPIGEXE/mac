/**
 * Study Session Store
 * - 학습 세션 전역 상태 관리
 * - 노트 선택, 진행 상황, 결과 관리
 * - DB 세션과 연동
 */
import { create } from 'zustand'
import type { StudyModeType } from '../features/Study/types'
import { startSession as dbStartSession, endSession as dbEndSession } from '../db/study/studyService'

// ================================ 타입 정의 ================================

/** 노트별 결과 */
export interface NoteResult {
    noteId: string
    noteTitle: string
    totalQuestions: number
    correctCount: number
    wrongCount: number
    score: number       // 0-100
    duration: number    // 초
}

/** 학습 순서 */
export type StudyOrder = 'sequential' | 'random'

/** 학습 세션 상태 */
interface StudySession {
    // 설정
    selectedNoteIds: string[]       // 선택된 노트 ID들
    mode: StudyModeType | null      // 학습 모드
    order: StudyOrder               // 순서

    // 진행 상황
    currentIndex: number            // 현재 노트 인덱스 (0-based)
    isActive: boolean               // 세션 활성화 여부

    // 결과
    noteResults: NoteResult[]       // 노트별 결과
    startedAt: number | null        // 시작 시간 (timestamp)
    completedAt: number | null      // 완료 시간 (timestamp)

    // DB 세션 ID
    dbSessionId: string | null      // DB에 저장된 세션 ID
}

/** Store 액션 */
interface StudySessionActions {
    // 세션 시작
    startSession: (params: {
        noteIds: string[]
        mode: StudyModeType
        order: StudyOrder
    }) => Promise<void>

    // 진행
    goToNextNote: () => boolean     // 다음 노트로 (마지막이면 false)
    getCurrentNoteId: () => string | null

    // 결과 기록
    recordNoteResult: (result: NoteResult) => void

    // 통계
    getTotalStats: () => {
        totalQuestions: number
        totalCorrect: number
        totalWrong: number
        averageScore: number
        totalDuration: number
    }

    // 세션 종료
    completeSession: () => Promise<void>
    resetSession: () => void

    // DB 세션 ID getter
    getDbSessionId: () => string | null
}

type StudySessionStore = StudySession & StudySessionActions

// ================================ 초기 상태 ================================

const initialState: StudySession = {
    selectedNoteIds: [],
    mode: null,
    order: 'sequential',
    currentIndex: 0,
    isActive: false,
    noteResults: [],
    startedAt: null,
    completedAt: null,
    dbSessionId: null,
}

// ================================ Store 생성 ================================

export const useStudySessionStore = create<StudySessionStore>((set, get) => ({
    ...initialState,

    /**
     * 세션 시작
     */
    startSession: async ({ noteIds, mode, order }) => {
        console.log('[StudySessionStore] startSession', { noteIds, noteIdsLength: noteIds.length, mode, order })

        // DB에 세션 생성
        const dbSession = await dbStartSession()

        set({
            selectedNoteIds: noteIds,
            mode,
            order,
            currentIndex: 0,
            isActive: true,
            noteResults: [],
            startedAt: Date.now(),
            completedAt: null,
            dbSessionId: dbSession.id,
        })

        console.log('[StudySessionStore] startSession completed', { dbSessionId: dbSession.id })
    },

    /**
     * 현재 노트 ID 반환
     */
    getCurrentNoteId: () => {
        const { selectedNoteIds, currentIndex, isActive } = get()
        if (!isActive || selectedNoteIds.length === 0) return null
        return selectedNoteIds[currentIndex] ?? null
    },

    /**
     * 다음 노트로 이동
     * @returns 다음 노트가 있으면 true, 마지막이면 false
     */
    goToNextNote: () => {
        const { selectedNoteIds, currentIndex } = get()
        const nextIndex = currentIndex + 1

        console.log('[StudySessionStore] goToNextNote', {
            currentIndex,
            nextIndex,
            selectedNoteIdsLength: selectedNoteIds.length,
            hasMore: nextIndex < selectedNoteIds.length,
        })

        if (nextIndex >= selectedNoteIds.length) {
            return false
        }

        set({ currentIndex: nextIndex })
        return true
    },

    /**
     * 노트별 결과 기록
     */
    recordNoteResult: (result) => {
        console.log('[StudySessionStore] recordNoteResult', {
            noteId: result.noteId,
            noteTitle: result.noteTitle,
            score: result.score,
            currentResultsCount: get().noteResults.length,
        })

        set((state) => ({
            noteResults: [...state.noteResults, result],
        }))
    },

    /**
     * 전체 통계 계산
     */
    getTotalStats: () => {
        const { noteResults } = get()

        if (noteResults.length === 0) {
            return {
                totalQuestions: 0,
                totalCorrect: 0,
                totalWrong: 0,
                averageScore: 0,
                totalDuration: 0,
            }
        }

        const totalQuestions = noteResults.reduce((sum, r) => sum + r.totalQuestions, 0)
        const totalCorrect = noteResults.reduce((sum, r) => sum + r.correctCount, 0)
        const totalWrong = noteResults.reduce((sum, r) => sum + r.wrongCount, 0)
        const totalDuration = noteResults.reduce((sum, r) => sum + r.duration, 0)
        const averageScore = noteResults.reduce((sum, r) => sum + r.score, 0) / noteResults.length

        return {
            totalQuestions,
            totalCorrect,
            totalWrong,
            averageScore: Math.round(averageScore),
            totalDuration,
        }
    },

    /**
     * 세션 완료
     */
    completeSession: async () => {
        const { dbSessionId, selectedNoteIds, noteResults } = get()

        console.log('[StudySessionStore] completeSession called', {
            dbSessionId,
            selectedNoteIdsLength: selectedNoteIds.length,
            noteResultsLength: noteResults.length,
        })

        // DB 세션 종료
        if (dbSessionId) {
            await dbEndSession(dbSessionId).catch((e) =>
                console.error('Failed to end DB session:', e)
            )
        }

        set({
            isActive: false,
            completedAt: Date.now(),
        })

        console.log('[StudySessionStore] completeSession done - isActive set to false')
    },

    /**
     * 세션 초기화
     */
    resetSession: () => {
        set(initialState)
    },

    /**
     * DB 세션 ID getter
     */
    getDbSessionId: () => {
        return get().dbSessionId
    },
}))

// ================================ Selector Hooks ================================

/** 진행률 계산 (0-100) */
export const useStudyProgress = () => {
    const { selectedNoteIds, currentIndex, isActive } = useStudySessionStore()

    if (!isActive || selectedNoteIds.length === 0) return 0
    return Math.round(((currentIndex + 1) / selectedNoteIds.length) * 100)
}

/** 진행 상황 텍스트 (예: "3/10") */
export const useStudyProgressText = () => {
    const { selectedNoteIds, currentIndex, isActive } = useStudySessionStore()

    if (!isActive || selectedNoteIds.length === 0) return ''
    return `${currentIndex + 1}/${selectedNoteIds.length}`
}

/** 다음 노트 존재 여부 */
export const useHasNextNote = () => {
    const { selectedNoteIds, currentIndex, isActive } = useStudySessionStore()

    if (!isActive) return false
    return currentIndex < selectedNoteIds.length - 1
}
