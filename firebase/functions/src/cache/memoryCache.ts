/**
 * Memory Cache
 * - Cloud Functions 인스턴스 내 메모리 캐싱
 * - 콜드 스타트 시 초기화됨
 * - 동일 인스턴스에서의 반복 요청에 효과적
 */
import { ExtractedConcepts } from '../types/llmResponse'

interface CacheEntry {
    concepts: ExtractedConcepts
    timestamp: number
    expiresAt: number
}

// 메모리 캐시 (인스턴스 수준)
const cache = new Map<string, CacheEntry>()

// TTL: 1시간 (Cloud Functions 인스턴스 수명 고려)
const MEMORY_CACHE_TTL = 60 * 60 * 1000

/**
 * 메모리 캐시에서 개념 조회
 */
export function getFromMemoryCache(contentHash: string): ExtractedConcepts | null {
    const entry = cache.get(contentHash)

    if (!entry) {
        return null
    }

    // TTL 만료 확인
    if (Date.now() > entry.expiresAt) {
        cache.delete(contentHash)
        console.log('[MemoryCache] Entry expired:', contentHash.slice(0, 8))
        return null
    }

    console.log('[MemoryCache] Hit:', contentHash.slice(0, 8))
    return entry.concepts
}

/**
 * 메모리 캐시에 개념 저장
 */
export function setToMemoryCache(contentHash: string, concepts: ExtractedConcepts): void {
    const now = Date.now()

    cache.set(contentHash, {
        concepts,
        timestamp: now,
        expiresAt: now + MEMORY_CACHE_TTL,
    })

    console.log('[MemoryCache] Set:', contentHash.slice(0, 8), '| Cache size:', cache.size)

    // 메모리 관리: 100개 초과 시 오래된 항목 정리
    if (cache.size > 100) {
        cleanupOldEntries()
    }
}

/**
 * 오래된 캐시 항목 정리
 */
function cleanupOldEntries(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
            cache.delete(key)
            cleaned++
        }
    }

    // 여전히 100개 초과면 가장 오래된 것부터 삭제
    if (cache.size > 100) {
        const entries = Array.from(cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)

        const toRemove = entries.slice(0, cache.size - 80) // 80개까지 줄임
        for (const [key] of toRemove) {
            cache.delete(key)
            cleaned++
        }
    }

    console.log('[MemoryCache] Cleanup:', cleaned, 'entries removed | Remaining:', cache.size)
}

/**
 * 캐시 통계 (디버깅용)
 */
export function getMemoryCacheStats(): { size: number; keys: string[] } {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()).map(k => k.slice(0, 8)),
    }
}
