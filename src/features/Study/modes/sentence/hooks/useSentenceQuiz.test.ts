import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useSentenceQuiz } from './useSentenceQuiz'

// Mock dependencies
vi.mock('../../../hooks/useWeakPointRecorder', () => ({
    useSentenceWeakPointRecorder: () => ({
        recordSentenceIfWrong: vi.fn().mockResolvedValue(undefined),
    }),
}))

vi.mock('../../../hooks/queries/useGenerateQuiz', () => ({
    useGenerateQuiz: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
    })),
}))

vi.mock('../../../hooks/queries/useEvaluateSentence', () => ({
    useEvaluateSentence: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
    })),
}))

// Import mocked modules
import { useGenerateQuiz } from '../../../hooks/queries/useGenerateQuiz'
import { useEvaluateSentence } from '../../../hooks/queries/useEvaluateSentence'

const mockUseGenerateQuiz = vi.mocked(useGenerateQuiz)
const mockUseEvaluateSentence = vi.mocked(useEvaluateSentence)

// Test wrapper with QueryClient
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children)
    }
}

describe('useSentenceQuiz', () => {
    const defaultProps = {
        noteId: 'note-1',
        noteContent: 'HTTP는 프로토콜입니다.',
        noteTitle: 'Test Note',
        noteType: 'user' as const,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseGenerateQuiz.mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
        } as unknown as ReturnType<typeof useGenerateQuiz>)
        mockUseEvaluateSentence.mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof useEvaluateSentence>)
    })

    describe('초기 상태', () => {
        it('초기 phase는 loading이어야 함', () => {
            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.phase).toBe('loading')
            expect(result.current.questions).toEqual([])
            expect(result.current.answers).toEqual({})
            expect(result.current.results).toEqual({})
        })

        it('초기 카운트는 모두 0이어야 함', () => {
            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.correctCount).toBe(0)
            expect(result.current.wrongCount).toBe(0)
            expect(result.current.answeredCount).toBe(0)
            expect(result.current.totalQuestions).toBe(0)
        })

        it('문장 모드 전용 상태가 초기화되어야 함', () => {
            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.evaluationResults).toEqual([])
            expect(result.current.totalScore).toBe(0)
            expect(result.current.overallFeedback).toBe('')
            expect(result.current.focusedQuestionId).toBeNull()
        })
    })

    describe('startQuiz', () => {
        it('startQuiz 호출 후 캐시 없으면 loading 상태로 전환', () => {
            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            act(() => {
                result.current.startQuiz()
            })

            expect(result.current.phase).toBe('loading')
        })
    })

    describe('퀴즈 데이터 로드', () => {
        it('퀴즈 로딩 중일 때 phase는 loading', () => {
            mockUseGenerateQuiz.mockReturnValue({
                data: null,
                isLoading: true,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.phase).toBe('loading')
        })

        it('퀴즈 데이터 로드 후 quiz 상태로 전환', async () => {
            const mockQuestions = [
                { id: 'q1', question: 'HTTP란?', answer: '프로토콜', keyPoints: ['protocol'] },
                { id: 'q2', question: 'TCP란?', answer: '전송 계층', keyPoints: ['transport'] },
            ]

            mockUseGenerateQuiz.mockReturnValue({
                data: { questions: mockQuestions, quizId: 'quiz-1', mode: 'sentence' },
                isLoading: false,
                error: null,
            } as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            expect(result.current.questions).toHaveLength(2)
            expect(result.current.totalQuestions).toBe(2)
        })
    })

    describe('updateAnswer', () => {
        it('답변을 업데이트해야 함', async () => {
            const mockQuestions = [
                { id: 'q1', question: 'HTTP란?', answer: '프로토콜', keyPoints: ['protocol'] },
            ]

            mockUseGenerateQuiz.mockReturnValue({
                data: { questions: mockQuestions, quizId: 'quiz-1', mode: 'sentence' },
                isLoading: false,
                error: null,
            } as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.updateAnswer('q1', '프로토콜입니다')
            })

            expect(result.current.answers['q1']).toBe('프로토콜입니다')
            expect(result.current.answeredCount).toBe(1)
        })

        it('여러 답변을 업데이트해야 함', async () => {
            const mockQuestions = [
                { id: 'q1', question: 'HTTP란?', answer: '프로토콜', keyPoints: [] },
                { id: 'q2', question: 'TCP란?', answer: '전송 계층', keyPoints: [] },
            ]

            mockUseGenerateQuiz.mockReturnValue({
                data: { questions: mockQuestions, quizId: 'quiz-1', mode: 'sentence' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.updateAnswer('q1', '답변1')
                result.current.updateAnswer('q2', '답변2')
            })

            expect(result.current.answers['q1']).toBe('답변1')
            expect(result.current.answers['q2']).toBe('답변2')
            expect(result.current.answeredCount).toBe(2)
        })
    })

    describe('submitAllAnswers', () => {
        it('LLM 평가 후 결과를 저장해야 함', async () => {
            const mockQuestions = [
                { id: 'q1', question: 'HTTP란?', answer: '프로토콜', keyPoints: ['protocol'] },
            ]

            const mockEvaluationResponse = {
                results: [
                    { blankId: 'q1', isCorrect: true, feedback: '정답!', missedPoints: [] },
                ],
                totalScore: 100,
                overallFeedback: '완벽합니다!',
            }

            const mockMutateAsync = vi.fn().mockResolvedValue(mockEvaluationResponse)

            mockUseGenerateQuiz.mockReturnValue({
                data: { questions: mockQuestions, quizId: 'quiz-1', mode: 'sentence' },
                isLoading: false,
                error: null,
            } as ReturnType<typeof useGenerateQuiz>)

            mockUseEvaluateSentence.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isPending: false,
            } as unknown as ReturnType<typeof useEvaluateSentence>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.updateAnswer('q1', '프로토콜')
            })

            await act(async () => {
                await result.current.submitAllAnswers()
            })

            expect(result.current.phase).toBe('result')
            expect(result.current.totalScore).toBe(100)
            expect(result.current.overallFeedback).toBe('완벽합니다!')
            expect(result.current.evaluationResults).toHaveLength(1)
            expect(result.current.results['q1']).toBe(true)
        })

        it('오답일 때 results에 false가 저장되어야 함', async () => {
            const mockQuestions = [
                { id: 'q1', question: 'HTTP란?', answer: '프로토콜', keyPoints: ['protocol'] },
            ]

            const mockEvaluationResponse = {
                results: [
                    { blankId: 'q1', isCorrect: false, feedback: '틀렸습니다', missedPoints: ['protocol'] },
                ],
                totalScore: 0,
                overallFeedback: '다시 공부하세요',
            }

            const mockMutateAsync = vi.fn().mockResolvedValue(mockEvaluationResponse)

            mockUseGenerateQuiz.mockReturnValue({
                data: { questions: mockQuestions, quizId: 'quiz-1', mode: 'sentence' },
                isLoading: false,
                error: null,
            } as ReturnType<typeof useGenerateQuiz>)

            mockUseEvaluateSentence.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isPending: false,
            } as unknown as ReturnType<typeof useEvaluateSentence>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            await act(async () => {
                await result.current.submitAllAnswers()
            })

            expect(result.current.results['q1']).toBe(false)
            expect(result.current.wrongCount).toBe(1)
        })
    })

    describe('setFocusedQuestionId', () => {
        it('포커스된 질문 ID를 변경해야 함', async () => {
            const mockQuestions = [
                { id: 'q1', question: 'Q1', answer: 'A1', keyPoints: [] },
                { id: 'q2', question: 'Q2', answer: 'A2', keyPoints: [] },
            ]

            mockUseGenerateQuiz.mockReturnValue({
                data: { questions: mockQuestions, quizId: 'quiz-1', mode: 'sentence' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.setFocusedQuestionId('q2')
            })

            expect(result.current.focusedQuestionId).toBe('q2')
        })
    })

    describe('getDuration', () => {
        it('학습 시간을 초 단위로 반환해야 함', async () => {
            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            act(() => {
                result.current.startQuiz()
            })

            await new Promise(r => setTimeout(r, 100))

            const duration = result.current.getDuration()
            expect(duration).toBeGreaterThanOrEqual(0)
        })
    })

    describe('에러 처리', () => {
        it('에러가 있으면 error 반환', () => {
            mockUseGenerateQuiz.mockReturnValue({
                data: null,
                isLoading: false,
                error: new Error('API Error'),
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useSentenceQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.error).toBe('API Error')
        })
    })
})
