/**
 * Sentence 평가 Mutation Hook
 * - TanStack Query를 사용한 문장 모드 답변 일괄 평가 API 호출
 * - AppError 기반 에러 정규화
 */
import { useMutation } from '@tanstack/react-query'
import { evaluateSentenceAnswers } from '../../services/studyApi'
import { AppError, FirebaseError } from '../../../../errors'
import type { EvaluateSentenceAnswersResponse } from '../../types'

export interface EvaluateSentenceParams {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}

/**
 * 문장 모드 답변 일괄 평가 Mutation Hook
 *
 * @example
 * const { mutate, mutateAsync, isPending, error } = useEvaluateSentence()
 *
 * // 사용
 * mutateAsync({
 *   blanks: [
 *     { id: 'q1', correctAnswer: '...', keyPoints: [...], userAnswer: '...' },
 *     ...
 *   ]
 * })
 */
export function useEvaluateSentence() {
    return useMutation<EvaluateSentenceAnswersResponse, AppError, EvaluateSentenceParams>({
        mutationFn: async (params) => {
            try {
                return await evaluateSentenceAnswers(params)
            } catch (e) {
                throw FirebaseError.fromFunctionsError(e)
            }
        },
        onError: (error) => {
            console.error('[useEvaluateSentence]', error.code, error.original)
        },
    })
}
