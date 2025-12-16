/**
 * Sentence 평가 Mutation Hook
 * - TanStack Query를 사용한 문장 모드 답변 일괄 평가 API 호출
 */
import { useMutation } from '@tanstack/react-query'
import { evaluateSentenceAnswers } from '../../services/studyApi'
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
    return useMutation<EvaluateSentenceAnswersResponse, Error, EvaluateSentenceParams>({
        mutationFn: (params) => evaluateSentenceAnswers(params),
        onError: (error) => {
            console.error('[Sentence] Evaluation error:', error)
        },
    })
}
