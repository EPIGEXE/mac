/**
 * LLM 클라이언트 팩토리
 * 환경 변수로 Groq 또는 Gemini 선택 가능
 */
import { defineString } from 'firebase-functions/params'
import type { LLMClient, LLMCallOptions, ModelPresets, LLMProvider } from './types'
import { getGroqClient, groqApiKey, GROQ_MODELS } from './groqClient'
import { getGeminiClient, geminiApiKey, GEMINI_MODELS } from './geminiClient'

// LLM 제공자 선택 (Firebase 환경 변수)
// 'groq' 또는 'gemini' - 기본값은 'gemini'
const llmProvider = defineString('LLM_PROVIDER', { default: 'gemini' })

/**
 * 현재 설정된 LLM 제공자 가져오기
 */
export function getCurrentProvider(): LLMProvider {
    const provider = llmProvider.value() as LLMProvider
    if (provider !== 'groq' && provider !== 'gemini') {
        console.warn(`Unknown LLM provider: ${provider}, falling back to gemini`)
        return 'gemini'
    }
    return provider
}

/**
 * 현재 LLM 클라이언트 가져오기
 */
export function getLLMClient(): LLMClient {
    const provider = getCurrentProvider()

    if (provider === 'groq') {
        return getGroqClient()
    }
    return getGeminiClient()
}

/**
 * 현재 모델 프리셋 가져오기
 */
export function getModelPresets(): ModelPresets {
    const provider = getCurrentProvider()

    if (provider === 'groq') {
        return GROQ_MODELS
    }
    return GEMINI_MODELS
}

/**
 * LLM 호출 (추상화된 인터페이스)
 * 환경 변수에 따라 Groq 또는 Gemini 사용
 */
export async function callLLMJson<T>(
    prompt: string,
    systemPrompt: string,
    options: LLMCallOptions = {}
): Promise<T> {
    const client = getLLMClient()
    const presets = getModelPresets()

    // 모델이 지정되지 않았으면 ACCURATE 사용
    const finalOptions: LLMCallOptions = {
        ...options,
        model: options.model || presets.ACCURATE,
    }

    console.log(`[LLM] Using provider: ${client.provider}, model: ${finalOptions.model}`)

    return client.callJson<T>(prompt, systemPrompt, finalOptions)
}

/**
 * 사용되는 모든 시크릿 export (Cloud Functions에서 필요)
 */
export function getRequiredSecrets() {
    const provider = getCurrentProvider()

    if (provider === 'groq') {
        return [groqApiKey]
    }
    return [geminiApiKey]
}

// 타입 및 유틸리티 re-export
export type { LLMClient, LLMCallOptions, ModelPresets, LLMProvider } from './types'
export { GROQ_MODELS } from './groqClient'
export { GEMINI_MODELS } from './geminiClient'

// 개별 클라이언트 export (직접 사용 필요시)
export { groqApiKey, callGroqJson } from './groqClient'
export { geminiApiKey, callGeminiJson } from './geminiClient'
