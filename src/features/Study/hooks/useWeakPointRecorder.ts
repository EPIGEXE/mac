/**
 * 약점 기록 Hook
 * - 단어/문장 모드에서 오답 발생 시 약점 기록
 * - 중복 로직 통합
 */
import { useCallback } from 'react'
import { addWeakPoint } from '../../../db/study/weakPointService'
import { terminalToast } from '../../Toast/toast'

interface UseWeakPointRecorderProps {
    noteId: string
    noteType: 'system' | 'user'
}

interface RecordWeakPointParams {
    content: string
    userAnswer: string
    correctAnswer: string
    questionId?: string
}

export function useWeakPointRecorder({ noteId, noteType }: UseWeakPointRecorderProps) {
    /**
     * 단일 약점 기록
     */
    const recordWeakPoint = useCallback(async (params: RecordWeakPointParams) => {
        try {
            await addWeakPoint({
                noteId,
                noteType,
                content: params.content,
                userAnswer: params.userAnswer,
                correctAnswer: params.correctAnswer,
                questionId: params.questionId,
            })
        } catch (e) {
            console.error('Failed to record weak point:', e)
            terminalToast.warning('약점 기록에 실패했습니다.')
        }
    }, [noteId, noteType])

    /**
     * 여러 약점 일괄 기록
     */
    const recordWeakPoints = useCallback(async (items: RecordWeakPointParams[]) => {
        for (const item of items) {
            await recordWeakPoint(item)
        }
    }, [recordWeakPoint])

    /**
     * 오답 여부 확인 후 기록 (단어 모드용)
     */
    const recordIfWrong = useCallback(async (
        isCorrect: boolean,
        params: RecordWeakPointParams
    ) => {
        if (!isCorrect) {
            await recordWeakPoint(params)
        }
    }, [recordWeakPoint])

    return {
        recordWeakPoint,
        recordWeakPoints,
        recordIfWrong,
    }
}
