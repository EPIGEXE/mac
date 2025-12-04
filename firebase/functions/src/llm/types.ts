/**
 * LLM 클라이언트 추상화 타입
 * - Groq, Gemini 등 여러 LLM 제공자를 교체 가능하게 함
 */

/**
 * LLM 호출 옵션
 */
export interface LLMCallOptions {
    model?: string
    temperature?: number
    maxTokens?: number
}

/**
 * LLM 제공자 종류
 */
export type LLMProvider = 'groq' | 'gemini'

/**
 * 토큰 사용량
 */
export interface TokenUsage {
    promptTokens: number
    completionTokens: number
    totalTokens: number
}

/**
 * LLM 클라이언트 인터페이스
 */
export interface LLMClient {
    /**
     * JSON 응답을 반환하는 LLM 호출
     */
    callJson<T>(
        prompt: string,
        systemPrompt: string,
        options?: LLMCallOptions
    ): Promise<T>

    /**
     * 제공자 이름
     */
    readonly provider: LLMProvider
}

/**
 * 모델 프리셋
 */
export interface ModelPresets {
    /** 정확도 중요한 작업 (퀴즈 생성, 서술형 평가) */
    ACCURATE: string
    /** 속도 중요한 작업 (단순 정답 평가, 힌트) */
    FAST: string
}
