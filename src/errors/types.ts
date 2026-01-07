/**
 * 에러 코드 및 메시지 정의
 */

// ============================================================================
// 에러 코드 정의
// ============================================================================

export type ErrorCode =
    // 네트워크
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    // Firebase
    | 'FIREBASE_QUOTA_EXCEEDED'
    | 'FIREBASE_INVALID_ARGUMENT'
    | 'FIREBASE_INTERNAL'
    // DB
    | 'DB_NOT_FOUND'
    | 'DB_INVALID_INPUT'
    | 'DB_DUPLICATE'
    | 'DB_OPERATION_FAILED'

    // 비즈니스 에러
    | 'EVALUATION_FAILED'

    // 일반
    | 'UNKNOWN'

// ============================================================================
// 사용자 친화적 메시지 매핑
// ============================================================================

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
    // 네트워크
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    // Firebase
    FIREBASE_QUOTA_EXCEEDED: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    FIREBASE_INVALID_ARGUMENT: '잘못된 요청입니다.',
    FIREBASE_INTERNAL: '서버 오류가 발생했습니다.',
    // DB
    DB_NOT_FOUND: '데이터를 찾을 수 없습니다.',
    DB_INVALID_INPUT: '입력값을 확인해주세요.',
    DB_DUPLICATE: '이미 존재하는 데이터입니다.',
    DB_OPERATION_FAILED: '데이터 처리에 실패했습니다.',
    // 비즈니스 에러
    EVALUATION_FAILED: '답변 평가에 실패했습니다.',
    // 일반
    UNKNOWN: '알 수 없는 오류가 발생했습니다.',
}
