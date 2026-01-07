import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
    useWordWeakPointRecorder,
    useSentenceWeakPointRecorder,
    useEssayWeakPointRecorder,
} from './useWeakPointRecorder'

/**
 * 외부 모듈 모킹
 *
 * vi.mock()은 import 시점에 모듈을 가짜로 대체한다.
 * - weakPointService: DB 저장 함수들 → 실제 IndexedDB 접근 방지
 */
vi.mock('../../../db/service/weakPointService', () => ({
    addWordWeakPoint: vi.fn().mockResolvedValue(undefined),
    addSentenceWeakPoint: vi.fn().mockResolvedValue(undefined),
    addEssayWeakPoint: vi.fn().mockResolvedValue(undefined),
}))

// 모킹된 모듈 import (vi.mock 이후에 해야 함)
import {
    addWordWeakPoint,
    addSentenceWeakPoint,
    addEssayWeakPoint,
} from '../../../db/service/weakPointService'

describe('useWeakPointRecorder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // useWordWeakPointRecorder
    // ============================================================================

    describe('useWordWeakPointRecorder', () => {
        const defaultProps = { noteId: 'note-1', noteType: 'user' as const }
        const wordParams = { keyword: 'HTTP', hint: 'Protocol', userAnswer: 'HTPP' }

        describe('recordWordWeakPoint', () => {
            it('약점을 DB에 저장해야 함', async () => {
                const { result } = renderHook(() => useWordWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordWordWeakPoint(wordParams)
                })

                expect(addWordWeakPoint).toHaveBeenCalledWith({
                    noteId: 'note-1',
                    noteType: 'user',
                    keyword: 'HTTP',
                    hint: 'Protocol',
                    userAnswer: 'HTPP',
                })
            })

            it('성공 시 { success: true }를 반환해야 함', async () => {
                const { result } = renderHook(() => useWordWeakPointRecorder(defaultProps))

                let response
                await act(async () => {
                    response = await result.current.recordWordWeakPoint(wordParams)
                })

                expect(response).toEqual({ success: true })
                expect(result.current.error).toBeNull()
            })

            it('DB 저장 실패 시 error 상태를 설정해야 함', async () => {
                vi.mocked(addWordWeakPoint).mockRejectedValueOnce(new Error('DB Error'))

                const { result } = renderHook(() => useWordWeakPointRecorder(defaultProps))

                let response: { success: boolean; error?: unknown } | undefined
                await act(async () => {
                    response = await result.current.recordWordWeakPoint(wordParams)
                })

                expect(response?.success).toBe(false)
                expect(response?.error).toBeDefined()
                expect(result.current.error).not.toBeNull()
            })

            it('clearError로 에러 상태를 초기화할 수 있어야 함', async () => {
                vi.mocked(addWordWeakPoint).mockRejectedValueOnce(new Error('DB Error'))

                const { result } = renderHook(() => useWordWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordWordWeakPoint(wordParams)
                })
                expect(result.current.error).not.toBeNull()

                act(() => {
                    result.current.clearError()
                })
                expect(result.current.error).toBeNull()
            })
        })

        describe('recordWordIfWrong', () => {
            it('오답(isCorrect=false)일 때만 저장해야 함', async () => {
                const { result } = renderHook(() => useWordWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordWordIfWrong(false, wordParams)
                })

                expect(addWordWeakPoint).toHaveBeenCalledTimes(1)
            })

            it('정답(isCorrect=true)일 때는 저장하지 않아야 함', async () => {
                const { result } = renderHook(() => useWordWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordWordIfWrong(true, wordParams)
                })

                expect(addWordWeakPoint).not.toHaveBeenCalled()
            })
        })
    })

    // ============================================================================
    // useSentenceWeakPointRecorder
    // ============================================================================

    describe('useSentenceWeakPointRecorder', () => {
        const defaultProps = { noteId: 'note-1', noteType: 'system' as const }
        const sentenceParams = {
            questionId: 'q-1',
            question: 'CORS란?',
            correctAnswer: 'Cross-Origin Resource Sharing',
            keyPoints: ['Cross-Origin', 'Resource', 'Sharing'],
            missedPoints: ['Sharing'],
        }

        describe('recordSentenceWeakPoint', () => {
            it('약점을 DB에 저장해야 함', async () => {
                const { result } = renderHook(() => useSentenceWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordSentenceWeakPoint(sentenceParams)
                })

                expect(addSentenceWeakPoint).toHaveBeenCalledWith({
                    noteId: 'note-1',
                    noteType: 'system',
                    ...sentenceParams,
                })
            })

            it('DB 저장 실패 시 error 상태를 설정해야 함', async () => {
                vi.mocked(addSentenceWeakPoint).mockRejectedValueOnce(new Error('DB Error'))

                const { result } = renderHook(() => useSentenceWeakPointRecorder(defaultProps))

                let response: { success: boolean; error?: unknown } | undefined
                await act(async () => {
                    response = await result.current.recordSentenceWeakPoint(sentenceParams)
                })

                expect(response?.success).toBe(false)
                expect(result.current.error).not.toBeNull()
            })
        })

        describe('recordSentenceIfWrong', () => {
            it('오답일 때만 저장해야 함', async () => {
                const { result } = renderHook(() => useSentenceWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordSentenceIfWrong(false, sentenceParams)
                })

                expect(addSentenceWeakPoint).toHaveBeenCalledTimes(1)
            })

            it('정답일 때는 저장하지 않아야 함', async () => {
                const { result } = renderHook(() => useSentenceWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordSentenceIfWrong(true, sentenceParams)
                })

                expect(addSentenceWeakPoint).not.toHaveBeenCalled()
            })
        })
    })

    // ============================================================================
    // useEssayWeakPointRecorder
    // ============================================================================

    describe('useEssayWeakPointRecorder', () => {
        const defaultProps = { noteId: 'note-1', noteType: 'user' as const }
        const essayParams = {
            company: '토스',
            question: 'CRP 최적화 경험을 설명하세요',
            questionType: 'application',
            expectedPoints: ['DOM', 'CSSOM', '렌더 트리'],
            missedPoints: ['렌더 트리'],
        }

        describe('recordEssayWeakPoint', () => {
            it('약점을 DB에 저장해야 함', async () => {
                const { result } = renderHook(() => useEssayWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordEssayWeakPoint(essayParams)
                })

                expect(addEssayWeakPoint).toHaveBeenCalledWith({
                    noteId: 'note-1',
                    noteType: 'user',
                    ...essayParams,
                })
            })

            it('DB 저장 실패 시 error 상태를 설정해야 함', async () => {
                vi.mocked(addEssayWeakPoint).mockRejectedValueOnce(new Error('DB Error'))

                const { result } = renderHook(() => useEssayWeakPointRecorder(defaultProps))

                let response: { success: boolean; error?: unknown } | undefined
                await act(async () => {
                    response = await result.current.recordEssayWeakPoint(essayParams)
                })

                expect(response?.success).toBe(false)
                expect(result.current.error).not.toBeNull()
            })
        })

        describe('recordEssayIfWrong', () => {
            it('70점 미만일 때 저장해야 함', async () => {
                const { result } = renderHook(() => useEssayWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordEssayIfWrong(69, essayParams)
                })

                expect(addEssayWeakPoint).toHaveBeenCalledTimes(1)
            })

            it('70점 이상일 때는 저장하지 않아야 함', async () => {
                const { result } = renderHook(() => useEssayWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordEssayIfWrong(70, essayParams)
                })

                expect(addEssayWeakPoint).not.toHaveBeenCalled()
            })

            it('경계값: 0점일 때 저장해야 함', async () => {
                const { result } = renderHook(() => useEssayWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordEssayIfWrong(0, essayParams)
                })

                expect(addEssayWeakPoint).toHaveBeenCalledTimes(1)
            })

            it('경계값: 100점일 때는 저장하지 않아야 함', async () => {
                const { result } = renderHook(() => useEssayWeakPointRecorder(defaultProps))

                await act(async () => {
                    await result.current.recordEssayIfWrong(100, essayParams)
                })

                expect(addEssayWeakPoint).not.toHaveBeenCalled()
            })
        })
    })
})
