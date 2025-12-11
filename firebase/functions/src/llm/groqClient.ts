/**
 * Groq API 클라이언트
 * LLaMA 모델을 사용한 퀴즈 생성 및 평가
 */
import Groq from 'groq-sdk'
import { defineSecret } from 'firebase-functions/params'
import type { LLMClient, LLMCallOptions, ModelPresets } from './types'

// Groq API 키 (Firebase Secrets)
export const groqApiKey = defineSecret('GROQ_API_KEY')

// Groq 모델 프리셋
export const GROQ_MODELS: ModelPresets = {
    // 정확도 중요한 작업 (퀴즈 생성, 서술형 평가)
    ACCURATE: 'llama-3.3-70b-versatile',
    // 속도 중요한 작업 (단순 정답 평가, 힌트)
    FAST: 'llama-3.1-8b-instant',
}

/**
 * Groq 클라이언트 생성
 */
function createGroqClient(): Groq {
    return new Groq({
        apiKey: groqApiKey.value(),
    })
}

/**
 * Groq LLM 클라이언트 구현
 */
export class GroqLLMClient implements LLMClient {
    readonly provider = 'groq' as const

    async callJson<T>(
        prompt: string,
        systemPrompt: string,
        options: LLMCallOptions = {}
    ): Promise<T> {
        const client = createGroqClient()

        const { model = GROQ_MODELS.ACCURATE, temperature = 0.3, maxTokens = 2000 } = options

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

        // 토큰 사용량 로깅
        if (response.usage) {
            console.log(
                `[Groq Token Usage] model: ${model}, prompt: ${response.usage.prompt_tokens}, completion: ${response.usage.completion_tokens}, total: ${response.usage.total_tokens}`
            )
        }

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
}

/**
 * Groq 클라이언트 싱글톤
 */
let groqClientInstance: GroqLLMClient | null = null

export function getGroqClient(): GroqLLMClient {
    if (!groqClientInstance) {
        groqClientInstance = new GroqLLMClient()
    }
    return groqClientInstance
}

/**
 * 직접 호출용 헬퍼 함수 (기존 코드와 호환)
 */
export async function callGroqJson<T>(
    prompt: string,
    systemPrompt: string,
    options: LLMCallOptions = {}
): Promise<T> {
    const client = getGroqClient()
    return client.callJson<T>(prompt, systemPrompt, options)
}

// 기존 코드 호환용 MODELS export
export const MODELS = GROQ_MODELS
