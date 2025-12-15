/**
 * Quiz Cache Utility
 * - sessionStorage 기반 퀴즈 데이터 캐싱
 * - 새로고침 시 불필요한 LLM 호출 방지
 * - 토큰 남용 방지
 */

import type { BlankInfo, GenerateQuizResponse } from '../types'

// ================================ 타입 정의 ================================

/** 캐시 키 생성 */
type StudyMode = 'word' | 'sentence' | 'essay'

/** Word 모드 캐시 데이터 */
export interface CachedWordQuizData {
    response: GenerateQuizResponse
    validatedBlanks: BlankInfo[]
    blindedContent: string
    noteId: string
    timestamp: number
}

/** Sentence 모드 캐시 데이터 */
export interface CachedSentenceQuizData {
    response: GenerateQuizResponse
    noteId: string
    timestamp: number
}

/** Essay 모드 캐시 데이터 */
export interface CachedEssayQuizData {
    response: GenerateQuizResponse
    noteId: string
    timestamp: number
}

/** 통합 캐시 데이터 타입 (하위호환용) */
export type CachedQuizData = CachedWordQuizData

// ================================ 상수 ================================

const CACHE_PREFIX = 'mac_quiz_cache_'
const CACHE_TTL = 30 * 60 * 1000 // 30분 (밀리초)

// ================================ 유틸리티 함수 ================================

/**
 * 캐시 키 생성
 * @param mode 학습 모드
 * @param noteId 노트 ID
 */
function getCacheKey(mode: StudyMode, noteId: string): string {
    return `${CACHE_PREFIX}${mode}_${noteId}`
}

/**
 * Word 모드 퀴즈 캐시 저장
 */
export function saveQuizCache(
    mode: 'word',
    noteId: string,
    data: Omit<CachedWordQuizData, 'noteId' | 'timestamp'>
): void
export function saveQuizCache(
    mode: 'sentence',
    noteId: string,
    data: Omit<CachedSentenceQuizData, 'noteId' | 'timestamp'>
): void
export function saveQuizCache(
    mode: 'essay',
    noteId: string,
    data: Omit<CachedEssayQuizData, 'noteId' | 'timestamp'>
): void
export function saveQuizCache(
    mode: StudyMode,
    noteId: string,
    data: Record<string, unknown>
): void {
    try {
        const cacheData = {
            ...data,
            noteId,
            timestamp: Date.now(),
        }
        const key = getCacheKey(mode, noteId)
        sessionStorage.setItem(key, JSON.stringify(cacheData))
        console.log('[QuizCache] Saved cache for', { mode, noteId })
    } catch (e) {
        console.warn('[QuizCache] Failed to save cache:', e)
    }
}

/**
 * Word 모드 퀴즈 캐시 조회
 */
export function getQuizCache(mode: 'word', noteId: string): CachedWordQuizData | null
export function getQuizCache(mode: 'sentence', noteId: string): CachedSentenceQuizData | null
export function getQuizCache(mode: 'essay', noteId: string): CachedEssayQuizData | null
export function getQuizCache(mode: StudyMode, noteId: string): CachedWordQuizData | CachedSentenceQuizData | CachedEssayQuizData | null {
    try {
        const key = getCacheKey(mode, noteId)
        const cached = sessionStorage.getItem(key)

        if (!cached) {
            return null
        }

        const data = JSON.parse(cached)

        // TTL 체크
        const age = Date.now() - data.timestamp
        if (age > CACHE_TTL) {
            console.log('[QuizCache] Cache expired', { mode, noteId, age })
            sessionStorage.removeItem(key)
            return null
        }

        console.log('[QuizCache] Cache hit', { mode, noteId, age })
        return data
    } catch (e) {
        console.warn('[QuizCache] Failed to read cache:', e)
        return null
    }
}

/**
 * 특정 노트의 퀴즈 캐시 삭제
 */
export function clearQuizCache(mode: StudyMode, noteId: string): void {
    try {
        const key = getCacheKey(mode, noteId)
        sessionStorage.removeItem(key)
        console.log('[QuizCache] Cleared cache for', { mode, noteId })
    } catch (e) {
        console.warn('[QuizCache] Failed to clear cache:', e)
    }
}

/**
 * 모든 퀴즈 캐시 삭제
 */
export function clearAllQuizCache(): void {
    try {
        const keysToRemove: string[] = []

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key?.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key)
            }
        }

        keysToRemove.forEach(key => sessionStorage.removeItem(key))
        console.log('[QuizCache] Cleared all quiz caches', { count: keysToRemove.length })
    } catch (e) {
        console.warn('[QuizCache] Failed to clear all caches:', e)
    }
}

/**
 * 만료된 캐시 정리
 */
export function cleanExpiredCache(): void {
    try {
        const keysToRemove: string[] = []
        const now = Date.now()

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key?.startsWith(CACHE_PREFIX)) {
                try {
                    const data = JSON.parse(sessionStorage.getItem(key) || '')
                    if (now - data.timestamp > CACHE_TTL) {
                        keysToRemove.push(key)
                    }
                } catch {
                    // 파싱 실패한 항목도 삭제
                    keysToRemove.push(key)
                }
            }
        }

        keysToRemove.forEach(key => sessionStorage.removeItem(key))

        if (keysToRemove.length > 0) {
            console.log('[QuizCache] Cleaned expired caches', { count: keysToRemove.length })
        }
    } catch (e) {
        console.warn('[QuizCache] Failed to clean expired caches:', e)
    }
}
