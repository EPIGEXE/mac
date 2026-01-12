/**
 * Essay 평가 Mutation Hook
 * - TanStack Query를 사용한 서술형 답변 평가 API 호출
 * - AppError 기반 에러 정규화
 */
import { useMutation } from '@tanstack/react-query'
import { evaluateEssay } from '../../services/studyApi'
import { AppError, FirebaseError } from '../../../../errors'
import type { EvaluateEssayResponse } from '../../types'

export interface EvaluateEssayParams {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    evaluationCriteria?: {
        excellent: string[]
        good: string[]
        poor: string[]
    }
    answerGuide: string
    userAnswer: string
}

/**
 * 서술형 답변 평가 Mutation Hook
 *
 * @example
 * const { mutate, mutateAsync, isPending, error } = useEvaluateEssay()
 *
 * // 사용
 * mutate({
 *   company: '토스',
 *   question: '...',
 *   questionType: 'application',
 *   expectedPoints: [...],
 *   answerGuide: '...',
 *   userAnswer: '...'
 * })
 */
export function useEvaluateEssay() {
    return useMutation<EvaluateEssayResponse, AppError, EvaluateEssayParams>({
        mutationFn: async (params) => {
            try {
                return await evaluateEssay(params)
            } catch (e) {
                throw FirebaseError.fromFunctionsError(e)
            }
        },
        onError: (error) => {
            console.error('[useEvaluateEssay]', error.code, error.original)
        },
    })
}
