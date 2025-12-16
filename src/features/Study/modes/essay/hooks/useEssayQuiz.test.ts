import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useEssayQuiz } from './useEssayQuiz'

// Mock dependencies
vi.mock('../../../hooks/useWeakPointRecorder', () => ({
    useEssayWeakPointRecorder: () => ({
        recordEssayIfWrong: vi.fn().mockResolvedValue(undefined),
    }),
}))

vi.mock('../../../hooks/queries/useGenerateQuiz', () => ({
    useGenerateQuiz: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
    })),
}))

vi.mock('../../../hooks/queries/useEvaluateEssay', () => ({
    useEvaluateEssay: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
    })),
}))

// Import mocked modules
import { useGenerateQuiz } from '../../../hooks/queries/useGenerateQuiz'
import { useEvaluateEssay } from '../../../hooks/queries/useEvaluateEssay'

const mockUseGenerateQuiz = vi.mocked(useGenerateQuiz)
const mockUseEvaluateEssay = vi.mocked(useEvaluateEssay)

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

describe('useEssayQuiz', () => {
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
        mockUseEvaluateEssay.mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof useEvaluateEssay>)
    })

    describe('초기 상태', () => {
        it('초기 phase는 loading이어야 함', () => {
            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.phase).toBe('loading')
            expect(result.current.question).toBeUndefined()
            expect(result.current.answer).toBe('')
            expect(result.current.result).toBeNull()
        })

        it('초기 isCorrect는 false이어야 함', () => {
            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.isCorrect).toBe(false)
        })
    })

    describe('startQuiz', () => {
        it('startQuiz 호출 후 캐시 없으면 loading 상태로 전환', () => {
            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
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

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.phase).toBe('loading')
        })

        it('퀴즈 데이터 로드 후 quiz 상태로 전환', async () => {
            const mockEssay = {
                company: 'Toss',
                question: 'CRP에 대해 설명하세요',
                questionType: 'knowledge',
                expectedPoints: ['DOM', 'CSSOM', 'Render Tree'],
                answerGuide: 'CRP는 브라우저 렌더링 과정입니다.',
            }

            mockUseGenerateQuiz.mockReturnValue({
                data: { essay: mockEssay, quizId: 'quiz-1', mode: 'essay' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            expect(result.current.question).toBeDefined()
            expect(result.current.question?.company).toBe('Toss')
            expect(result.current.question?.question).toBe('CRP에 대해 설명하세요')
        })
    })

    describe('setAnswer', () => {
        it('답변을 업데이트해야 함', async () => {
            const mockEssay = {
                company: 'Toss',
                question: 'CRP에 대해 설명하세요',
                questionType: 'knowledge',
                expectedPoints: ['DOM'],
                answerGuide: 'CRP 설명',
            }

            mockUseGenerateQuiz.mockReturnValue({
                data: { essay: mockEssay, quizId: 'quiz-1', mode: 'essay' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.setAnswer('CRP는 브라우저 렌더링 과정입니다.')
            })

            expect(result.current.answer).toBe('CRP는 브라우저 렌더링 과정입니다.')
        })
    })

    describe('submitAnswer', () => {
        it('LLM 평가 후 결과를 저장해야 함 (70점 이상 = 정답)', async () => {
            const mockEssay = {
                company: 'Toss',
                question: 'CRP에 대해 설명하세요',
                questionType: 'knowledge',
                expectedPoints: ['DOM', 'CSSOM'],
                answerGuide: 'CRP 설명',
            }

            const mockEvaluationResponse = {
                score: 85,
                feedback: '잘 설명했습니다!',
                missedPoints: [],
                coveredPoints: ['DOM', 'CSSOM'],
            }

            const mockMutateAsync = vi.fn().mockResolvedValue(mockEvaluationResponse)

            mockUseGenerateQuiz.mockReturnValue({
                data: { essay: mockEssay, quizId: 'quiz-1', mode: 'essay' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            mockUseEvaluateEssay.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isPending: false,
            } as unknown as ReturnType<typeof useEvaluateEssay>)

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.setAnswer('CRP는 브라우저 렌더링 과정입니다.')
            })

            await act(async () => {
                await result.current.submitAnswer()
            })

            expect(result.current.phase).toBe('result')
            expect(result.current.result?.score).toBe(85)
            expect(result.current.isCorrect).toBe(true)
        })

        it('70점 미만일 때 isCorrect가 false여야 함', async () => {
            const mockEssay = {
                company: 'Toss',
                question: 'CRP에 대해 설명하세요',
                questionType: 'knowledge',
                expectedPoints: ['DOM', 'CSSOM'],
                answerGuide: 'CRP 설명',
            }

            const mockEvaluationResponse = {
                score: 50,
                feedback: '더 공부하세요',
                missedPoints: ['CSSOM'],
                coveredPoints: ['DOM'],
            }

            const mockMutateAsync = vi.fn().mockResolvedValue(mockEvaluationResponse)

            mockUseGenerateQuiz.mockReturnValue({
                data: { essay: mockEssay, quizId: 'quiz-1', mode: 'essay' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            mockUseEvaluateEssay.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isPending: false,
            } as unknown as ReturnType<typeof useEvaluateEssay>)

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.setAnswer('잘 모르겠습니다')
            })

            await act(async () => {
                await result.current.submitAnswer()
            })

            expect(result.current.result?.score).toBe(50)
            expect(result.current.isCorrect).toBe(false)
        })

        it('답변이 비어있으면 제출하지 않아야 함', async () => {
            const mockEssay = {
                company: 'Toss',
                question: 'CRP에 대해 설명하세요',
                questionType: 'knowledge',
                expectedPoints: ['DOM'],
                answerGuide: 'CRP 설명',
            }

            const mockMutateAsync = vi.fn()

            mockUseGenerateQuiz.mockReturnValue({
                data: { essay: mockEssay, quizId: 'quiz-1', mode: 'essay' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            mockUseEvaluateEssay.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isPending: false,
            } as unknown as ReturnType<typeof useEvaluateEssay>)

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            // 빈 답변으로 제출
            await act(async () => {
                await result.current.submitAnswer()
            })

            expect(mockMutateAsync).not.toHaveBeenCalled()
        })
    })

    describe('retry', () => {
        it('다시 풀기 시 상태를 초기화해야 함', async () => {
            const mockEssay = {
                company: 'Toss',
                question: 'CRP에 대해 설명하세요',
                questionType: 'knowledge',
                expectedPoints: ['DOM'],
                answerGuide: 'CRP 설명',
            }

            const mockEvaluationResponse = {
                score: 85,
                feedback: '잘 설명했습니다!',
                missedPoints: [],
                coveredPoints: ['DOM'],
            }

            const mockMutateAsync = vi.fn().mockResolvedValue(mockEvaluationResponse)

            mockUseGenerateQuiz.mockReturnValue({
                data: { essay: mockEssay, quizId: 'quiz-1', mode: 'essay' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            mockUseEvaluateEssay.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isPending: false,
            } as unknown as ReturnType<typeof useEvaluateEssay>)

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.setAnswer('답변')
            })

            await act(async () => {
                await result.current.submitAnswer()
            })

            expect(result.current.phase).toBe('result')

            act(() => {
                result.current.retry()
            })

            expect(result.current.phase).toBe('quiz')
            expect(result.current.answer).toBe('')
            expect(result.current.result).toBeNull()
        })
    })

    describe('getDuration', () => {
        it('학습 시간을 초 단위로 반환해야 함', async () => {
            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
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

            const { result } = renderHook(() => useEssayQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.error).toBe('API Error')
        })
    })
})
