/**
 * 약점 기록 Hooks
 * - 모드별 취약점 기록 (word, sentence, essay)
 * - 새로운 weakPointService API 사용
 */
import { useCallback } from 'react'
import {
    addWordWeakPoint,
    addSentenceWeakPoint,
    addEssayWeakPoint,
} from '../../../db/study/weakPointService'
import { terminalToast } from '../../Toast/toast'

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
    /**
     * 단어 약점 기록
     */
    const recordWordWeakPoint = useCallback(async (params: RecordWordWeakPointParams) => {
        try {
            await addWordWeakPoint({
                noteId,
                noteType,
                keyword: params.keyword,
                hint: params.hint,
                userAnswer: params.userAnswer,
            })
        } catch (e) {
            console.error('Failed to record word weak point:', e)
            terminalToast.warning('약점 기록에 실패했습니다.')
        }
    }, [noteId, noteType])

    /**
     * 오답 여부 확인 후 기록
     */
    const recordWordIfWrong = useCallback(async (
        isCorrect: boolean,
        params: RecordWordWeakPointParams
    ) => {
        if (!isCorrect) {
            await recordWordWeakPoint(params)
        }
    }, [recordWordWeakPoint])

    return {
        recordWordWeakPoint,
        recordWordIfWrong,
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
    /**
     * 문장 약점 기록
     */
    const recordSentenceWeakPoint = useCallback(async (params: RecordSentenceWeakPointParams) => {
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
        } catch (e) {
            console.error('Failed to record sentence weak point:', e)
            terminalToast.warning('약점 기록에 실패했습니다.')
        }
    }, [noteId, noteType])

    /**
     * 오답 여부 확인 후 기록
     */
    const recordSentenceIfWrong = useCallback(async (
        isCorrect: boolean,
        params: RecordSentenceWeakPointParams
    ) => {
        if (!isCorrect) {
            await recordSentenceWeakPoint(params)
        }
    }, [recordSentenceWeakPoint])

    return {
        recordSentenceWeakPoint,
        recordSentenceIfWrong,
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

export function useEssayWeakPointRecorder({ noteId, noteType }: UseEssayWeakPointRecorderProps) {
    /**
     * 서술형 약점 기록
     */
    const recordEssayWeakPoint = useCallback(async (params: RecordEssayWeakPointParams) => {
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
        } catch (e) {
            console.error('Failed to record essay weak point:', e)
            terminalToast.warning('약점 기록에 실패했습니다.')
        }
    }, [noteId, noteType])

    /**
     * 오답 여부 확인 후 기록 (70점 미만이면 오답)
     */
    const recordEssayIfWrong = useCallback(async (
        score: number,
        params: RecordEssayWeakPointParams
    ) => {
        if (score < 70) {
            await recordEssayWeakPoint(params)
        }
    }, [recordEssayWeakPoint])

    return {
        recordEssayWeakPoint,
        recordEssayIfWrong,
    }
}
