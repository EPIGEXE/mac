import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuizNavigation } from './useQuizNavigation'

describe('useQuizNavigation', () => {
    /**
     * 키보드 이벤트 헬퍼
     *
     * useQuizNavigation은 window.addEventListener('keydown', ...)로 키보드 이벤트를 감지한다.
     * 테스트 환경(happy-dom)에서 이를 시뮬레이션하기 위해 KeyboardEvent를 직접 생성하고 dispatch한다.
     *
     * 사용 예:
     *   dispatchKey('Tab')                      // Tab
     *   dispatchKey('Tab', { shiftKey: true })  // Shift+Tab
     *   dispatchKey('Enter', { ctrlKey: true }) // Ctrl+Enter (Windows)
     *   dispatchKey('Enter', { metaKey: true }) // Cmd+Enter (Mac)
     */
    const createKeyboardEvent = (
        key: string,
        options: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {}
    ): KeyboardEvent => {
        return new KeyboardEvent('keydown', {
            key,
            shiftKey: options.shiftKey ?? false,
            ctrlKey: options.ctrlKey ?? false,
            metaKey: options.metaKey ?? false,
            bubbles: true,
            cancelable: true,
        })
    }

    const dispatchKey = (key: string, options?: Parameters<typeof createKeyboardEvent>[1]) => {
        const event = createKeyboardEvent(key, options)
        window.dispatchEvent(event)
        return event
    }

    // 기본 Props
    const defaultProps = {
        mode: 'word' as const,
        totalItems: 5,
        currentIndex: 2,
        onNavigate: vi.fn(),
        onSubmit: vi.fn(),
        enabled: true,
        canSubmit: true,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ============================================================================
    // 1. 초기 상태 테스트
    // ============================================================================

    describe('초기 상태', () => {
        it('currentIndex와 totalItems를 그대로 반환해야 함', () => {
            const { result } = renderHook(() => useQuizNavigation(defaultProps))

            expect(result.current.currentIndex).toBe(2)
            expect(result.current.totalItems).toBe(5)
        })

        it('첫 번째 항목일 때 isFirst=true, isLast=false', () => {
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, currentIndex: 0 })
            )

            expect(result.current.isFirst).toBe(true)
            expect(result.current.isLast).toBe(false)
        })

        it('마지막 항목일 때 isFirst=false, isLast=true', () => {
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, currentIndex: 4 })
            )

            expect(result.current.isFirst).toBe(false)
            expect(result.current.isLast).toBe(true)
        })

        it('항목이 1개일 때 isFirst=true, isLast=true', () => {
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, totalItems: 1, currentIndex: 0 })
            )

            expect(result.current.isFirst).toBe(true)
            expect(result.current.isLast).toBe(true)
        })
    })

    // ============================================================================
    // 2. 네비게이션 함수 테스트
    // ============================================================================

    describe('goToNext', () => {
        it('다음 인덱스로 onNavigate를 호출해야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, currentIndex: 2, onNavigate })
            )

            act(() => {
                result.current.goToNext()
            })

            expect(onNavigate).toHaveBeenCalledTimes(1)
            expect(onNavigate).toHaveBeenCalledWith(3)
        })

        it('마지막 항목에서는 호출하지 않아야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, currentIndex: 4, onNavigate })
            )

            act(() => {
                result.current.goToNext()
            })

            expect(onNavigate).not.toHaveBeenCalled()
        })
    })

    describe('goToPrevious', () => {
        it('이전 인덱스로 onNavigate를 호출해야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, currentIndex: 2, onNavigate })
            )

            act(() => {
                result.current.goToPrevious()
            })

            expect(onNavigate).toHaveBeenCalledTimes(1)
            expect(onNavigate).toHaveBeenCalledWith(1)
        })

        it('첫 번째 항목에서는 호출하지 않아야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, currentIndex: 0, onNavigate })
            )

            act(() => {
                result.current.goToPrevious()
            })

            expect(onNavigate).not.toHaveBeenCalled()
        })
    })

    describe('goToIndex', () => {
        it('유효한 인덱스로 onNavigate를 호출해야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, onNavigate })
            )

            act(() => {
                result.current.goToIndex(3)
            })

            expect(onNavigate).toHaveBeenCalledWith(3)
        })

        it('음수 인덱스는 무시해야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, onNavigate })
            )

            act(() => {
                result.current.goToIndex(-1)
            })

            expect(onNavigate).not.toHaveBeenCalled()
        })

        it('totalItems 이상의 인덱스는 무시해야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, totalItems: 5, onNavigate })
            )

            act(() => {
                result.current.goToIndex(5)
            })

            expect(onNavigate).not.toHaveBeenCalled()
        })

        it('경계값 인덱스 0은 유효해야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, onNavigate })
            )

            act(() => {
                result.current.goToIndex(0)
            })

            expect(onNavigate).toHaveBeenCalledWith(0)
        })

        it('경계값 인덱스 totalItems-1은 유효해야 함', () => {
            const onNavigate = vi.fn()
            const { result } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, totalItems: 5, onNavigate })
            )

            act(() => {
                result.current.goToIndex(4)
            })

            expect(onNavigate).toHaveBeenCalledWith(4)
        })
    })

    // ============================================================================
    // 3. Word 모드 키보드 테스트
    // ============================================================================

    describe('Word 모드 키보드 네비게이션', () => {
        it('Tab 키로 다음 항목으로 이동해야 함', () => {
            const onNavigate = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'word', currentIndex: 2, onNavigate })
            )

            act(() => {
                dispatchKey('Tab')
            })

            expect(onNavigate).toHaveBeenCalledWith(3)
        })

        it('Shift+Tab 키로 이전 항목으로 이동해야 함', () => {
            const onNavigate = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'word', currentIndex: 2, onNavigate })
            )

            act(() => {
                dispatchKey('Tab', { shiftKey: true })
            })

            expect(onNavigate).toHaveBeenCalledWith(1)
        })

        it('Enter 키는 제출하지 않아야 함 (Word 모드는 자동 제출)', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'word', onSubmit })
            )

            act(() => {
                dispatchKey('Enter')
            })

            expect(onSubmit).not.toHaveBeenCalled()
        })

        it('Ctrl+Enter 키도 제출하지 않아야 함', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'word', onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { ctrlKey: true })
            })

            expect(onSubmit).not.toHaveBeenCalled()
        })
    })

    // ============================================================================
    // 4. Sentence 모드 키보드 테스트
    // ============================================================================

    describe('Sentence 모드 키보드 네비게이션', () => {
        it('Tab 키로 다음 항목으로 이동해야 함', () => {
            const onNavigate = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', currentIndex: 2, onNavigate })
            )

            act(() => {
                dispatchKey('Tab')
            })

            expect(onNavigate).toHaveBeenCalledWith(3)
        })

        it('Shift+Tab 키로 이전 항목으로 이동해야 함', () => {
            const onNavigate = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', currentIndex: 2, onNavigate })
            )

            act(() => {
                dispatchKey('Tab', { shiftKey: true })
            })

            expect(onNavigate).toHaveBeenCalledWith(1)
        })

        it('Ctrl+Enter 키로 제출해야 함', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { ctrlKey: true })
            })

            expect(onSubmit).toHaveBeenCalledTimes(1)
        })

        it('Meta+Enter 키로도 제출해야 함 (Mac)', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { metaKey: true })
            })

            expect(onSubmit).toHaveBeenCalledTimes(1)
        })

        it('일반 Enter 키는 제출하지 않아야 함', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', onSubmit })
            )

            act(() => {
                dispatchKey('Enter')
            })

            expect(onSubmit).not.toHaveBeenCalled()
        })
    })

    // ============================================================================
    // 5. Essay 모드 키보드 테스트
    // ============================================================================

    describe('Essay 모드 키보드 네비게이션', () => {
        it('Tab 키는 네비게이션하지 않아야 함', () => {
            const onNavigate = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'essay', onNavigate })
            )

            act(() => {
                dispatchKey('Tab')
            })

            expect(onNavigate).not.toHaveBeenCalled()
        })

        it('Ctrl+Enter 키로 제출해야 함', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'essay', onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { ctrlKey: true })
            })

            expect(onSubmit).toHaveBeenCalledTimes(1)
        })

        it('Meta+Enter 키로도 제출해야 함 (Mac)', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'essay', onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { metaKey: true })
            })

            expect(onSubmit).toHaveBeenCalledTimes(1)
        })
    })

    // ============================================================================
    // 6. enabled 플래그 테스트
    // ============================================================================

    describe('enabled=false 일 때', () => {
        it('Tab 키가 무시되어야 함', () => {
            const onNavigate = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'word', enabled: false, onNavigate })
            )

            act(() => {
                dispatchKey('Tab')
            })

            expect(onNavigate).not.toHaveBeenCalled()
        })

        it('Ctrl+Enter 키가 무시되어야 함', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', enabled: false, onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { ctrlKey: true })
            })

            expect(onSubmit).not.toHaveBeenCalled()
        })
    })

    // ============================================================================
    // 7. canSubmit 플래그 테스트
    // ============================================================================

    describe('canSubmit=false 일 때', () => {
        it('Ctrl+Enter로 제출되지 않아야 함 (Sentence 모드)', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', canSubmit: false, onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { ctrlKey: true })
            })

            expect(onSubmit).not.toHaveBeenCalled()
        })

        it('Ctrl+Enter로 제출되지 않아야 함 (Essay 모드)', () => {
            const onSubmit = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'essay', canSubmit: false, onSubmit })
            )

            act(() => {
                dispatchKey('Enter', { ctrlKey: true })
            })

            expect(onSubmit).not.toHaveBeenCalled()
        })

        it('Tab 네비게이션은 canSubmit과 무관하게 동작해야 함', () => {
            const onNavigate = vi.fn()
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'word', canSubmit: false, onNavigate })
            )

            act(() => {
                dispatchKey('Tab')
            })

            expect(onNavigate).toHaveBeenCalledWith(3)
        })
    })

    // ============================================================================
    // 8. onSubmit 미제공 시 테스트
    // ============================================================================

    describe('onSubmit이 undefined일 때', () => {
        it('Ctrl+Enter가 에러 없이 무시되어야 함', () => {
            renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'sentence', onSubmit: undefined })
            )

            // 에러 없이 실행되어야 함
            expect(() => {
                act(() => {
                    dispatchKey('Enter', { ctrlKey: true })
                })
            }).not.toThrow()
        })
    })

    // ============================================================================
    // 9. 이벤트 리스너 정리 테스트
    // ============================================================================

    describe('클린업', () => {
        it('unmount 시 이벤트 리스너가 제거되어야 함', () => {
            const onNavigate = vi.fn()
            const { unmount } = renderHook(() =>
                useQuizNavigation({ ...defaultProps, mode: 'word', onNavigate })
            )

            unmount()

            act(() => {
                dispatchKey('Tab')
            })

            expect(onNavigate).not.toHaveBeenCalled()
        })

        it('enabled가 false로 변경되면 이벤트 리스너가 비활성화되어야 함', () => {
            const onNavigate = vi.fn()
            const { rerender } = renderHook(
                ({ enabled }) => useQuizNavigation({ ...defaultProps, mode: 'word', enabled, onNavigate }),
                { initialProps: { enabled: true } }
            )

            // 처음에는 동작
            act(() => {
                dispatchKey('Tab')
            })
            expect(onNavigate).toHaveBeenCalledTimes(1)

            // enabled=false로 변경
            rerender({ enabled: false })
            onNavigate.mockClear()

            act(() => {
                dispatchKey('Tab')
            })
            expect(onNavigate).not.toHaveBeenCalled()
        })
    })
})
