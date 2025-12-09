/**
 * 퀴즈 네비게이션 Hook (모든 모드 지원)
 * - Tab/Shift+Tab: 이전/다음 항목 이동
 * - Enter: 제출 (문장/면접 모드)
 * - Ctrl+Enter: 제출 (면접 모드 - textarea)
 */
import { useCallback, useEffect } from 'react'
import type { StudyModeType } from '../types'

interface UseQuizNavigationProps {
    mode: StudyModeType
    totalItems: number
    currentIndex: number
    onNavigate: (index: number) => void
    onSubmit?: () => void
    enabled?: boolean
    /** 제출 가능 여부 (버튼 disabled 상태와 동기화) */
    canSubmit?: boolean
}

export function useQuizNavigation({
    mode,
    totalItems,
    currentIndex,
    onNavigate,
    onSubmit,
    enabled = true,
    canSubmit = true,
}: UseQuizNavigationProps) {
    const isFirst = currentIndex === 0
    const isLast = currentIndex === totalItems - 1

    // 다음 항목으로 이동
    const goToNext = useCallback(() => {
        if (currentIndex < totalItems - 1) {
            onNavigate(currentIndex + 1)
        }
    }, [currentIndex, totalItems, onNavigate])

    // 이전 항목으로 이동
    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            onNavigate(currentIndex - 1)
        }
    }, [currentIndex, onNavigate])

    // 특정 항목으로 이동
    const goToIndex = useCallback((index: number) => {
        if (index >= 0 && index < totalItems) {
            onNavigate(index)
        }
    }, [totalItems, onNavigate])

    // 키보드 이벤트 핸들러
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return

        // 단어 모드: Tab 네비게이션
        if (mode === 'word') {
            if (e.key === 'Tab') {
                e.preventDefault()
                if (e.shiftKey) {
                    goToPrevious()
                } else {
                    goToNext()
                }
            }
            return
        }

        // 문장 모드: Tab 네비게이션 + Enter 제출
        if (mode === 'sentence') {
            if (e.key === 'Tab') {
                e.preventDefault()
                if (e.shiftKey) {
                    goToPrevious()
                } else {
                    goToNext()
                }
                return
            }
            // Ctrl+Enter로 제출
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onSubmit && canSubmit) {
                e.preventDefault()
                onSubmit()
            }
            return
        }

        // 면접 모드: Ctrl+Enter 제출만 (네비게이션 없음)
        if (mode === 'essay') {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onSubmit && canSubmit) {
                e.preventDefault()
                onSubmit()
            }
            return
        }
    }, [enabled, mode, goToNext, goToPrevious, onSubmit, canSubmit])

    // 전역 키보드 이벤트 리스너
    useEffect(() => {
        if (!enabled) return

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [enabled, handleKeyDown])

    return {
        goToNext,
        goToPrevious,
        goToIndex,
        isFirst,
        isLast,
        currentIndex,
        totalItems,
    }
}
