/**
 * Groq API 클라이언트
 * LLaMA 모델을 사용한 퀴즈 생성 및 평가
 */
import Groq from 'groq-sdk'
import { defineSecret } from 'firebase-functions/params'

// Groq API 키 (Firebase Secrets)
const groqApiKey = defineSecret('GROQ_API_KEY')

// 모델 선택 (2024년 12월 기준 Groq 지원 모델)
export const MODELS = {
    // 정확도 중요한 작업 (퀴즈 생성, 서술형 평가)
    ACCURATE: 'llama-3.3-70b-versatile',
    // 속도 중요한 작업 (단순 정답 평가, 힌트)
    FAST: 'llama-3.1-8b-instant',
} as const

export type ModelType = (typeof MODELS)[keyof typeof MODELS]

/**
 * Groq 클라이언트 생성
 */
export function createGroqClient(): Groq {
    return new Groq({
        apiKey: groqApiKey.value(),
    })
}

/**
 * Groq API 호출 옵션
 */
export interface GroqCallOptions {
    model?: ModelType
    temperature?: number
    maxTokens?: number
}

/**
 * Groq API 호출 (JSON 응답)
 */
export async function callGroqJson<T>(
    prompt: string,
    systemPrompt: string,
    options: GroqCallOptions = {}
): Promise<T> {
    const client = createGroqClient()

    const { model = MODELS.ACCURATE, temperature = 0.3, maxTokens = 2000 } = options

    const response = await client.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
        throw new Error('Empty response from Groq API')
    }

    try {
        return JSON.parse(content) as T
    } catch {
        throw new Error(`Failed to parse Groq response as JSON: ${content}`)
    }
}

/**
 * 사용된 토큰 수 추적 (비용 계산용)
 */
export interface TokenUsage {
    promptTokens: number
    completionTokens: number
    totalTokens: number
}

/**
 * API 키 secret을 함수에서 사용하기 위한 export
 */
export { groqApiKey }
