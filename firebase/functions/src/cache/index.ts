/**
 * Concept Cache Service
 * - 하이브리드 캐싱: Memory → Firestore → LLM
 */
import { ExtractedConcepts } from '../types/llmResponse'
import { createContentHash } from './contentHash'
import { getFromMemoryCache, setToMemoryCache } from './memoryCache'
import { getFromFirestoreCache, setToFirestoreCache } from './firestoreCache'

export { createContentHash } from './contentHash'
export { cleanupExpiredCache } from './firestoreCache'

interface CacheResult {
    concepts: ExtractedConcepts
    source: 'memory' | 'firestore' | 'llm'
}

/**
 * 캐시에서 개념 조회 (Memory → Firestore 순서)
 * @returns 캐시된 개념 또는 null
 */
export async function getCachedConcepts(
    title: string,
    content: string
): Promise<CacheResult | null> {
    const contentHash = createContentHash(title, content)

    // 1. Memory 캐시 확인
    const memoryCached = getFromMemoryCache(contentHash)
    if (memoryCached) {
        return { concepts: memoryCached, source: 'memory' }
    }

    // 2. Firestore 캐시 확인
    const firestoreCached = await getFromFirestoreCache(contentHash)
    if (firestoreCached) {
        // Memory 캐시에도 저장 (다음 요청 가속화)
        setToMemoryCache(contentHash, firestoreCached)
        return { concepts: firestoreCached, source: 'firestore' }
    }

    return null
}

/**
 * 개념을 캐시에 저장 (Memory + Firestore)
 */
export async function cacheConcepts(
    title: string,
    content: string,
    concepts: ExtractedConcepts
): Promise<void> {
    const contentHash = createContentHash(title, content)

    // Memory 캐시 저장 (동기)
    setToMemoryCache(contentHash, concepts)

    // Firestore 캐시 저장 (비동기, 응답 지연 방지)
    setToFirestoreCache(contentHash, concepts).catch(err => {
        console.error('[ConceptCache] Firestore save failed:', err)
    })
}
