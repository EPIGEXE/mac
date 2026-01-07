/**
 * Study Session Store
 * - 학습 세션 전역 상태 관리
 * - 노트 선택, 진행 상황, 결과 관리
 * - DB 세션과 연동
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StudyModeType } from '../features/Study/types'
import type { WordBlankDetail, SentenceQuestionDetail, EssayStudyRecord } from '../db/schema/study'
import {
    saveSession,
    closeSession,
    recordWordStudy,
    recordSentenceStudy,
    recordEssayStudy,
} from '../db/study/studyService'
import { AppError } from '../errors'

// ================================ 타입 정의 ================================

/** 노트별 결과 (모드별 상세 정보 포함) */
export interface NoteResult {
    noteId: string
    noteTitle: string
    noteType: 'user' | 'system'
    mode: StudyModeType
    totalQuestions: number
    correctCount: number
    wrongCount: number
    score: number       // 0-100
    duration: number    // 초
    // 모드별 상세 정보
    wordDetails?: WordBlankDetail[]
    sentenceDetails?: {
        questions: SentenceQuestionDetail[]
        totalScore: number
        overallFeedback: string
    }
    essayDetails?: EssayStudyRecord['details']
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

    // 에러 상태
    error: AppError | null          // 세션 저장 에러
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

    // 에러 클리어
    clearError: () => void

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
    error: null,
}

// ================================ Store 생성 ================================

export const useStudySessionStore = create<StudySessionStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            /**
             * 세션 시작 (메모리에만 저장, DB 저장은 완료 시)
             */
            startSession: async ({ noteIds, mode, order }) => {
                console.log('[StudySessionStore] startSession', { noteIds, noteIdsLength: noteIds.length, mode, order })

                set({
                    selectedNoteIds: noteIds,
                    mode,
                    order,
                    currentIndex: 0,
                    isActive: true,
                    noteResults: [],
                    startedAt: Date.now(),
                    completedAt: null,
                    dbSessionId: null, // 완료 시에만 DB 세션 생성
                    error: null, // 에러 초기화
                })

                console.log('[StudySessionStore] startSession completed (memory only)')
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
             * 세션 완료 (DB에 세션 생성 + 학습 기록 일괄 저장 + 세션 종료)
             */
            completeSession: async () => {
                const { selectedNoteIds, noteResults, mode, order, startedAt } = get()

                console.log('[StudySessionStore] completeSession called', {
                    selectedNoteIdsLength: selectedNoteIds.length,
                    noteResultsLength: noteResults.length,
                    mode,
                })

                // 완료 시에만 DB에 세션 생성 및 학습 기록 저장
                if (mode && startedAt && noteResults.length > 0) {
                    try {
                        // 1. DB 세션 생성
                        const dbSession = await saveSession({
                            noteIds: selectedNoteIds,
                            mode,
                            order,
                        })

                        console.log('[StudySessionStore] DB session created', { dbSessionId: dbSession.id })

                        // 2. 학습 기록 일괄 저장 (모드별로 분기)
                        for (const result of noteResults) {
                            if (result.mode === 'word' && result.wordDetails) {
                                await recordWordStudy({
                                    noteId: result.noteId,
                                    noteType: result.noteType,
                                    sessionId: dbSession.id,
                                    duration: result.duration,
                                    blanks: result.wordDetails,
                                })
                            } else if (result.mode === 'sentence' && result.sentenceDetails) {
                                await recordSentenceStudy({
                                    noteId: result.noteId,
                                    noteType: result.noteType,
                                    sessionId: dbSession.id,
                                    duration: result.duration,
                                    questions: result.sentenceDetails.questions,
                                    totalScore: result.sentenceDetails.totalScore,
                                    overallFeedback: result.sentenceDetails.overallFeedback,
                                })
                            } else if (result.mode === 'essay' && result.essayDetails) {
                                await recordEssayStudy({
                                    noteId: result.noteId,
                                    noteType: result.noteType,
                                    sessionId: dbSession.id,
                                    duration: result.duration,
                                    ...result.essayDetails,
                                })
                            }
                        }

                        console.log('[StudySessionStore] Study records saved', { count: noteResults.length })

                        // 3. 세션 종료 (summary 자동 계산)
                        await closeSession(dbSession.id)

                        console.log('[StudySessionStore] DB session closed', { dbSessionId: dbSession.id })
                    } catch (e) {
                        const appError = AppError.from(e)
                        console.error('[StudySessionStore] Failed to save session:', appError.code, e)
                        set({ error: appError })
                    }
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
             * 에러 클리어
             */
            clearError: () => {
                set({ error: null })
            },

            /**
             * DB 세션 ID getter
             */
            getDbSessionId: () => {
                return get().dbSessionId
            },
        }),
        {
            name: 'mac-study-session-storage',
            storage: createJSONStorage(() => sessionStorage),
            // 함수는 제외하고 상태만 persist
            partialize: (state) => ({
                selectedNoteIds: state.selectedNoteIds,
                mode: state.mode,
                order: state.order,
                currentIndex: state.currentIndex,
                isActive: state.isActive,
                noteResults: state.noteResults,
                startedAt: state.startedAt,
                completedAt: state.completedAt,
                dbSessionId: state.dbSessionId,
            }),
        }
    )
)

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
