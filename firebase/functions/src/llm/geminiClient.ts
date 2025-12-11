/**
 * Gemini API 클라이언트
 * Google Gemini Flash 모델을 사용한 퀴즈 생성 및 평가
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { defineSecret } from 'firebase-functions/params'
import type { LLMClient, LLMCallOptions, ModelPresets } from './types'

// Gemini API 키 (Firebase Secrets)
export const geminiApiKey = defineSecret('GEMINI_API_KEY')

// Gemini 모델 프리셋
export const GEMINI_MODELS: ModelPresets = {
    // 정확도 중요한 작업 (퀴즈 생성, 서술형 평가)
    ACCURATE: 'gemini-2.5-flash-lite',
    // 속도 중요한 작업 (단순 정답 평가, 힌트)
    FAST: 'gemini-2.5-flash-lite',
}

/**
 * Gemini 클라이언트 생성
 */
function createGeminiClient(): GoogleGenerativeAI {
    return new GoogleGenerativeAI(geminiApiKey.value())
}

/**
 * Gemini LLM 클라이언트 구현
 */
export class GeminiLLMClient implements LLMClient {
    readonly provider = 'gemini' as const

    async callJson<T>(
        prompt: string,
        systemPrompt: string,
        options: LLMCallOptions = {}
    ): Promise<T> {
        const client = createGeminiClient()

        const { model = GEMINI_MODELS.ACCURATE, temperature = 0.3, maxTokens = 8000 } = options

        const generativeModel = client.getGenerativeModel({
            model,
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
                responseMimeType: 'application/json',
            },
            systemInstruction: systemPrompt,
        })

        const result = await generativeModel.generateContent(prompt)
        const response = result.response
        const content = response.text()

        // 토큰 사용량 로깅
        const usage = response.usageMetadata
        if (usage) {
            console.log(
                `[Gemini Token Usage] model: ${model}, prompt: ${usage.promptTokenCount}, completion: ${usage.candidatesTokenCount}, total: ${usage.totalTokenCount}`
            )
        }

        if (!content) {
            throw new Error('Empty response from Gemini API')
        }

        try {
            return JSON.parse(content) as T
        } catch {
            throw new Error(`Failed to parse Gemini response as JSON: ${content}`)
        }
    }
}

/**
 * Gemini 클라이언트 싱글톤
 */
let geminiClientInstance: GeminiLLMClient | null = null

export function getGeminiClient(): GeminiLLMClient {
    if (!geminiClientInstance) {
        geminiClientInstance = new GeminiLLMClient()
    }
    return geminiClientInstance
}

/**
 * 직접 호출용 헬퍼 함수 (기존 코드와 호환)
 */
export async function callGeminiJson<T>(
    prompt: string,
    systemPrompt: string,
    options: LLMCallOptions = {}
): Promise<T> {
    const client = getGeminiClient()
    return client.callJson<T>(prompt, systemPrompt, options)
}
