/**
 * 힌트 생성 Cloud Function
 * - 정답을 기반으로 힌트 생성
 * - 힌트 레벨별로 점점 더 자세한 힌트 제공
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { callGroqJson, MODELS, groqApiKey } from '../llm/groqClient'
import { SYSTEM_PROMPTS, buildHintPrompt } from '../llm/prompts'

// 요청 타입
interface GetHintRequest {
    answer: string
    hintLevel: number
    previousHints: string[]
}

// LLM 응답 타입
interface HintLLMResponse {
    hint: string
}

/**
 * 힌트 생성 함수
 */
export const getHint = onCall(
    {
        region: 'asia-northeast3',
        secrets: [groqApiKey],
        timeoutSeconds: 15,
        memory: '128MiB',
    },
    async (request) => {
        const data = request.data as GetHintRequest

        // 입력 검증
        if (!data.answer) {
            throw new HttpsError('invalid-argument', 'answer is required')
        }

        if (typeof data.hintLevel !== 'number' || data.hintLevel < 1 || data.hintLevel > 3) {
            throw new HttpsError('invalid-argument', 'hintLevel must be 1, 2, or 3')
        }

        try {
            const prompt = buildHintPrompt({
                answer: data.answer,
                hintLevel: data.hintLevel,
                previousHints: data.previousHints || [],
            })

            const llmResponse = await callGroqJson<HintLLMResponse>(
                prompt,
                SYSTEM_PROMPTS.HINT_GENERATOR,
                { model: MODELS.FAST, maxTokens: 200 }
            )

            return {
                hint: llmResponse.hint,
                remainingHints: 3 - data.hintLevel,
            }
        } catch (error) {
            console.error('Failed to get hint:', error)

            if (error instanceof HttpsError) {
                throw error
            }

            throw new HttpsError('internal', 'Failed to get hint. Please try again.')
        }
    }
)
