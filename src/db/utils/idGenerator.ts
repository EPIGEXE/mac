// ============================================================================
// ID Generator Utility
// - 일관된 ID 생성 방식 제공
// - UUID 기반으로 동시성 충돌 방지
// ============================================================================

/**
 * 엔티티별 ID prefix 타입
 */
export type EntityPrefix = 'note' | 'session' | 'record' | 'wp' | 'img';

/**
 * UUID 기반 고유 ID 생성
 * @param prefix 엔티티 prefix (note, session, record, wp, img)
 * @returns prefix-uuid 형식의 고유 ID
 */
export function generateId(prefix: EntityPrefix): string {
    return `${prefix}-${crypto.randomUUID()}`;
}

/**
 * ID에서 prefix 추출
 */
export function extractPrefix(id: string): string | null {
    const match = id.match(/^([a-z]+)-/);
    return match ? match[1] : null;
}

/**
 * ID 유효성 검사
 */
export function isValidId(id: string, expectedPrefix?: EntityPrefix): boolean {
    if (!id || typeof id !== 'string') return false;

    const prefix = extractPrefix(id);
    if (!prefix) return false;

    if (expectedPrefix && prefix !== expectedPrefix) return false;

    return true;
}
