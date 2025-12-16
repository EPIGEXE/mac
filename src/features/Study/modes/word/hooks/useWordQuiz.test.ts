import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { useWordQuiz } from './useWordQuiz'

// Mock dependencies
vi.mock('../../../hooks/useWeakPointRecorder', () => ({
    useWordWeakPointRecorder: () => ({
        recordWordIfWrong: vi.fn().mockResolvedValue(undefined),
    }),
}))

vi.mock('../../../hooks/queries/useGenerateQuiz', () => ({
    useGenerateQuiz: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
    })),
}))

vi.mock('../../../services/studyApi', () => ({
    evaluateBlankAnswer: vi.fn((userAnswer: string, correctAnswer: string) => ({
        isCorrect: userAnswer.toLowerCase() === correctAnswer.toLowerCase(),
    })),
    validateAndCreateBlindedContent: vi.fn((content: string, blanks: { id: string; answer: string; hint?: string }[]) => ({
        validBlanks: blanks,
        invalidBlanks: [],
        blindedContent: content.replace(/HTTP/g, '[BLANK_1]'),
    })),
}))

// Import mocked modules
import { useGenerateQuiz } from '../../../hooks/queries/useGenerateQuiz'

const mockUseGenerateQuiz = vi.mocked(useGenerateQuiz)

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

describe('useWordQuiz', () => {
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
    })

    describe('초기 상태', () => {
        it('초기 phase는 loading이어야 함', () => {
            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.phase).toBe('loading')
            expect(result.current.blanks).toEqual([])
            expect(result.current.answers).toEqual({})
            expect(result.current.results).toEqual({})
        })

        it('초기 카운트는 모두 0이어야 함', () => {
            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.correctCount).toBe(0)
            expect(result.current.wrongCount).toBe(0)
            expect(result.current.answeredCount).toBe(0)
            expect(result.current.totalBlanks).toBe(0)
        })
    })

    describe('startQuiz', () => {
        it('startQuiz 호출 후 캐시 없으면 loading 상태로 전환', () => {
            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            act(() => {
                result.current.startQuiz()
            })

            // enabled가 true로 설정됨 (내부 상태)
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

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.phase).toBe('loading')
        })

        it('퀴즈 데이터 로드 후 quiz 상태로 전환', async () => {
            const mockBlanks = [
                { id: '1', answer: 'HTTP', hint: 'Protocol' },
                { id: '2', answer: 'TCP', hint: 'Transport' },
            ]

            mockUseGenerateQuiz.mockReturnValue({
                data: { blanks: mockBlanks, quizId: 'quiz-1', mode: 'word' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            expect(result.current.blanks).toHaveLength(2)
            expect(result.current.totalBlanks).toBe(2)
        })
    })

    describe('submitAnswer', () => {
        it('정답 제출 시 correctCount 증가', async () => {
            const mockBlanks = [{ id: '1', answer: 'HTTP', hint: 'Protocol' }]

            mockUseGenerateQuiz.mockReturnValue({
                data: { blanks: mockBlanks, quizId: 'quiz-1', mode: 'word' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            await act(async () => {
                await result.current.submitAnswer('HTTP')
            })

            expect(result.current.results['BLANK_1']).toBe(true)
            expect(result.current.correctCount).toBe(1)
            expect(result.current.wrongCount).toBe(0)
        })

        it('오답 제출 시 wrongCount 증가', async () => {
            const mockBlanks = [{ id: '1', answer: 'HTTP', hint: 'Protocol' }]

            mockUseGenerateQuiz.mockReturnValue({
                data: { blanks: mockBlanks, quizId: 'quiz-1', mode: 'word' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            await act(async () => {
                await result.current.submitAnswer('WRONG')
            })

            expect(result.current.results['BLANK_1']).toBe(false)
            expect(result.current.correctCount).toBe(0)
            expect(result.current.wrongCount).toBe(1)
        })

        it('답변이 answers에 저장되어야 함', async () => {
            const mockBlanks = [{ id: '1', answer: 'HTTP', hint: 'Protocol' }]

            mockUseGenerateQuiz.mockReturnValue({
                data: { blanks: mockBlanks, quizId: 'quiz-1', mode: 'word' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            await act(async () => {
                await result.current.submitAnswer('MyAnswer')
            })

            expect(result.current.answers['BLANK_1']).toBe('MyAnswer')
        })
    })

    describe('goToBlank', () => {
        it('빈칸 인덱스를 변경해야 함', async () => {
            const mockBlanks = [
                { id: '1', answer: 'HTTP', hint: 'Protocol' },
                { id: '2', answer: 'TCP', hint: 'Transport' },
                { id: '3', answer: 'UDP', hint: 'Datagram' },
            ]

            mockUseGenerateQuiz.mockReturnValue({
                data: { blanks: mockBlanks, quizId: 'quiz-1', mode: 'word' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            expect(result.current.currentBlankIndex).toBe(0)

            act(() => {
                result.current.goToBlank('BLANK_2')
            })

            expect(result.current.currentBlankIndex).toBe(1)

            act(() => {
                result.current.goToBlank('BLANK_3')
            })

            expect(result.current.currentBlankIndex).toBe(2)
        })
    })

    describe('showResult', () => {
        it('phase를 result로 변경해야 함', async () => {
            const mockBlanks = [{ id: '1', answer: 'HTTP', hint: 'Protocol' }]

            mockUseGenerateQuiz.mockReturnValue({
                data: { blanks: mockBlanks, quizId: 'quiz-1', mode: 'word' },
                isLoading: false,
                error: null,
            } as unknown as ReturnType<typeof useGenerateQuiz>)

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            await waitFor(() => {
                expect(result.current.phase).toBe('quiz')
            })

            act(() => {
                result.current.showResult()
            })

            expect(result.current.phase).toBe('result')
        })
    })

    describe('getDuration', () => {
        it('학습 시간을 초 단위로 반환해야 함', async () => {
            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            act(() => {
                result.current.startQuiz()
            })

            // 약간의 지연
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

            const { result } = renderHook(() => useWordQuiz(defaultProps), {
                wrapper: createWrapper(),
            })

            expect(result.current.error).toBe('API Error')
        })
    })
})
