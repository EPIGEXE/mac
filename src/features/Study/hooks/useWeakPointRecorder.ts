/**
 * 약점 기록 Hooks
 * - 모드별 취약점 기록 (word, sentence, essay)
 * - 에러는 상태로 반환, Toast는 컴포넌트에서 처리
 */
import { useCallback, useState } from 'react'
import {
    addWordWeakPoint,
    addSentenceWeakPoint,
    addEssayWeakPoint,
} from '../../../db/study/weakPointService'
import { AppError } from '../../../errors'

// ============================================================================
// 공통 타입
// ============================================================================

interface WeakPointRecorderResult {
    success: boolean
    error?: AppError
}

// ============================================================================
// 단어 모드 약점 기록 Hook
// ============================================================================

interface UseWordWeakPointRecorderProps {
    noteId: string
    noteType: 'system' | 'user'
}

interface RecordWordWeakPointParams {
    keyword: string
    hint: string
    userAnswer: string
}

export function useWordWeakPointRecorder({ noteId, noteType }: UseWordWeakPointRecorderProps) {
    const [error, setError] = useState<AppError | null>(null)

    /**
     * 단어 약점 기록
     */
    const recordWordWeakPoint = useCallback(async (
        params: RecordWordWeakPointParams
    ): Promise<WeakPointRecorderResult> => {
        setError(null)

        try {
            await addWordWeakPoint({
                noteId,
                noteType,
                keyword: params.keyword,
                hint: params.hint,
                userAnswer: params.userAnswer,
            })
            return { success: true }
        } catch (e) {
            const appError = AppError.from(e)
            console.error('[WeakPointRecorder:word]', appError.code, e)
            setError(appError)
            return { success: false, error: appError }
        }
    }, [noteId, noteType])

    /**
     * 오답 여부 확인 후 기록
     */
    const recordWordIfWrong = useCallback(async (
        isCorrect: boolean,
        params: RecordWordWeakPointParams
    ): Promise<WeakPointRecorderResult> => {
        if (!isCorrect) {
            return await recordWordWeakPoint(params)
        }
        return { success: true }
    }, [recordWordWeakPoint])

    const clearError = useCallback(() => setError(null), [])

    return {
        error,
        recordWordWeakPoint,
        recordWordIfWrong,
        clearError,
    }
}

// ============================================================================
// 문장 모드 약점 기록 Hook
// ============================================================================

interface UseSentenceWeakPointRecorderProps {
    noteId: string
    noteType: 'system' | 'user'
}

interface RecordSentenceWeakPointParams {
    questionId: string
    question: string
    correctAnswer: string
    keyPoints: string[]
    missedPoints: string[]
}

export function useSentenceWeakPointRecorder({ noteId, noteType }: UseSentenceWeakPointRecorderProps) {
    const [error, setError] = useState<AppError | null>(null)

    /**
     * 문장 약점 기록
     */
    const recordSentenceWeakPoint = useCallback(async (
        params: RecordSentenceWeakPointParams
    ): Promise<WeakPointRecorderResult> => {
        setError(null)

        try {
            await addSentenceWeakPoint({
                noteId,
                noteType,
                questionId: params.questionId,
                question: params.question,
                correctAnswer: params.correctAnswer,
                keyPoints: params.keyPoints,
                missedPoints: params.missedPoints,
            })
            return { success: true }
        } catch (e) {
            const appError = AppError.from(e)
            console.error('[WeakPointRecorder:sentence]', appError.code, e)
            setError(appError)
            return { success: false, error: appError }
        }
    }, [noteId, noteType])

    /**
     * 오답 여부 확인 후 기록
     */
    const recordSentenceIfWrong = useCallback(async (
        isCorrect: boolean,
        params: RecordSentenceWeakPointParams
    ): Promise<WeakPointRecorderResult> => {
        if (!isCorrect) {
            return await recordSentenceWeakPoint(params)
        }
        return { success: true }
    }, [recordSentenceWeakPoint])

    const clearError = useCallback(() => setError(null), [])

    return {
        error,
        recordSentenceWeakPoint,
        recordSentenceIfWrong,
        clearError,
    }
}

// ============================================================================
// 서술형 모드 약점 기록 Hook
// ============================================================================

interface UseEssayWeakPointRecorderProps {
    noteId: string
    noteType: 'system' | 'user'
}

interface RecordEssayWeakPointParams {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    missedPoints: string[]
}

/** 서술형 오답 기준 점수 */
const ESSAY_WRONG_THRESHOLD = 70

export function useEssayWeakPointRecorder({ noteId, noteType }: UseEssayWeakPointRecorderProps) {
    const [error, setError] = useState<AppError | null>(null)

    /**
     * 서술형 약점 기록
     */
    const recordEssayWeakPoint = useCallback(async (
        params: RecordEssayWeakPointParams
    ): Promise<WeakPointRecorderResult> => {
        setError(null)

        try {
            await addEssayWeakPoint({
                noteId,
                noteType,
                company: params.company,
                question: params.question,
                questionType: params.questionType,
                expectedPoints: params.expectedPoints,
                missedPoints: params.missedPoints,
            })
            return { success: true }
        } catch (e) {
            const appError = AppError.from(e)
            console.error('[WeakPointRecorder:essay]', appError.code, e)
            setError(appError)
            return { success: false, error: appError }
        }
    }, [noteId, noteType])

    /**
     * 오답 여부 확인 후 기록 (70점 미만이면 오답)
     */
    const recordEssayIfWrong = useCallback(async (
        score: number,
        params: RecordEssayWeakPointParams
    ): Promise<WeakPointRecorderResult> => {
        if (score < ESSAY_WRONG_THRESHOLD) {
            return await recordEssayWeakPoint(params)
        }
        return { success: true }
    }, [recordEssayWeakPoint])

    const clearError = useCallback(() => setError(null), [])

    return {
        error,
        recordEssayWeakPoint,
        recordEssayIfWrong,
        clearError,
    }
}
