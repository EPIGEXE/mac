/**
 * Firestore Cache
 * - 영구 저장소 기반 캐싱
 * - 인스턴스 간 공유 가능
 * - TTL 7일
 */
import * as admin from 'firebase-admin'
import { ExtractedConcepts } from '../types/llmResponse'

// Firestore 컬렉션명
const COLLECTION_NAME = 'conceptCache'

// TTL: 7일
const FIRESTORE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000

interface FirestoreCacheDocument {
    concepts: ExtractedConcepts
    cachedAt: admin.firestore.Timestamp
    expiresAt: admin.firestore.Timestamp
    hitCount: number
}

/**
 * Firestore에서 개념 조회
 */
export async function getFromFirestoreCache(contentHash: string): Promise<ExtractedConcepts | null> {
    try {
        const db = admin.firestore()
        const docRef = db.collection(COLLECTION_NAME).doc(contentHash)
        const doc = await docRef.get()

        if (!doc.exists) {
            console.log('[FirestoreCache] Miss:', contentHash.slice(0, 8))
            return null
        }

        const data = doc.data() as FirestoreCacheDocument

        // TTL 만료 확인
        if (data.expiresAt.toMillis() < Date.now()) {
            console.log('[FirestoreCache] Expired:', contentHash.slice(0, 8))
            // 비동기로 삭제 (응답 지연 방지)
            docRef.delete().catch(err => console.error('[FirestoreCache] Delete error:', err))
            return null
        }

        // 히트 카운트 증가 (비동기, 응답 지연 방지)
        docRef.update({
            hitCount: admin.firestore.FieldValue.increment(1),
        }).catch(err => console.error('[FirestoreCache] Update hit count error:', err))

        console.log('[FirestoreCache] Hit:', contentHash.slice(0, 8), '| hitCount:', data.hitCount)
        return data.concepts
    } catch (error) {
        console.error('[FirestoreCache] Get error:', error)
        return null
    }
}

/**
 * Firestore에 개념 저장
 */
export async function setToFirestoreCache(contentHash: string, concepts: ExtractedConcepts): Promise<void> {
    try {
        const db = admin.firestore()
        const now = Date.now()

        const cacheDoc: FirestoreCacheDocument = {
            concepts,
            cachedAt: admin.firestore.Timestamp.fromMillis(now),
            expiresAt: admin.firestore.Timestamp.fromMillis(now + FIRESTORE_CACHE_TTL),
            hitCount: 0,
        }

        await db.collection(COLLECTION_NAME).doc(contentHash).set(cacheDoc)
        console.log('[FirestoreCache] Set:', contentHash.slice(0, 8))
    } catch (error) {
        console.error('[FirestoreCache] Set error:', error)
        // 캐시 저장 실패는 무시 (LLM 결과는 이미 반환됨)
    }
}

/**
 * 만료된 캐시 정리 (스케줄 함수에서 호출)
 */
export async function cleanupExpiredCache(): Promise<number> {
    try {
        const db = admin.firestore()
        const now = admin.firestore.Timestamp.now()

        const expiredDocs = await db
            .collection(COLLECTION_NAME)
            .where('expiresAt', '<', now)
            .limit(500) // 한 번에 최대 500개
            .get()

        if (expiredDocs.empty) {
            console.log('[FirestoreCache] No expired documents')
            return 0
        }

        const batch = db.batch()
        expiredDocs.docs.forEach(doc => batch.delete(doc.ref))
        await batch.commit()

        console.log('[FirestoreCache] Cleanup:', expiredDocs.size, 'documents deleted')
        return expiredDocs.size
    } catch (error) {
        console.error('[FirestoreCache] Cleanup error:', error)
        return 0
    }
}
