/**
 * Essay 평가 Mutation Hook
 * - TanStack Query를 사용한 서술형 답변 평가 API 호출
 */
import { useMutation } from '@tanstack/react-query'
import { evaluateEssay } from '../../services/studyApi'
import type { EvaluateEssayResponse } from '../../types'

export interface EvaluateEssayParams {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
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
    return useMutation<EvaluateEssayResponse, Error, EvaluateEssayParams>({
        mutationFn: (params) => evaluateEssay(params),
        onError: (error) => {
            console.error('[Essay] Evaluation error:', error)
        },
    })
}