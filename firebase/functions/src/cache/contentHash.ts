/**
 * Content Hash 유틸리티
 * - 노트 내용을 기반으로 캐시 키 생성
 */
import * as crypto from 'crypto'

/**
 * 노트 제목과 내용을 기반으로 해시 생성
 * Firestore document ID로 사용 가능한 32자 해시
 */
export function createContentHash(title: string, content: string): string {
    return crypto
        .createHash('sha256')
        .update(`${title}:${content}`)
        .digest('hex')
        .slice(0, 32)
}
