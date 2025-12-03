/**
 * 서술형 답변 평가 Cloud Function
 * - 서술형 모드에서만 사용 (LLM 평가 필요)
 * - 단어/문장 모드는 클라이언트에서 직접 채점
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { callGroqJson, MODELS, groqApiKey } from '../llm/groqClient'
import { SYSTEM_PROMPTS, buildEvaluateEssayPrompt } from '../llm/prompts'

// 요청 타입
interface EvaluateEssayRequest {
    question: string
    expectedPoints: string[]
    userAnswer: string
}

// LLM 응답 타입
interface EssayEvaluationResponse {
    isCorrect: boolean
    score: number
    matchedPoints: string[]
    missedPoints: string[]
    feedback: string
}

/**
 * 서술형 답변 평가 함수
 */
export const evaluateAnswer = onCall(
    {
        region: 'asia-northeast3',
        secrets: [groqApiKey],
        timeoutSeconds: 30,
        memory: '256MiB',
    },
    async (request) => {
        const data = request.data as EvaluateEssayRequest

        // 입력 검증
        if (!data.question || !data.expectedPoints || !data.userAnswer) {
            throw new HttpsError('invalid-argument', 'question, expectedPoints, userAnswer are required')
        }

        if (data.userAnswer.length > 5000) {
            throw new HttpsError('invalid-argument', 'userAnswer must be less than 5000 characters')
        }

        try {
            const prompt = buildEvaluateEssayPrompt({
                question: data.question,
                expectedPoints: data.expectedPoints,
                userAnswer: data.userAnswer,
            })

            const llmResponse = await callGroqJson<EssayEvaluationResponse>(
                prompt,
                SYSTEM_PROMPTS.ANSWER_EVALUATOR,
                { model: MODELS.ACCURATE }
            )

            return {
                isCorrect: llmResponse.isCorrect,
                score: llmResponse.score,
                matchedPoints: llmResponse.matchedPoints,
                missedPoints: llmResponse.missedPoints,
                feedback: llmResponse.feedback,
            }
        } catch (error) {
            console.error('Failed to evaluate answer:', error)

            if (error instanceof HttpsError) {
                throw error
            }

            throw new HttpsError('internal', 'Failed to evaluate answer. Please try again.')
        }
    }
)
