/**
 * FirebaseError - Firebase 레이어 에러 클래스들
 *
 * AppError를 상속하여 Firebase 관련 에러 처리
 */
import { type ErrorCode } from './types'
import { AppError } from './AppError'

// ============================================================================
// FirebaseError - Firebase 레이어 기본 에러
// ============================================================================

export class FirebaseError extends AppError {
    constructor(
        code: ErrorCode,
        message: string,
        original?: unknown,
        retryable: boolean = false
    ) {
        super(code, message, original, retryable)
        this.name = 'FirebaseError'
    }

    /** Firebase Functions 에러에서 적절한 FirebaseError 생성 */
    static fromFunctionsError(error: unknown): FirebaseError {
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const code = (error as { code: string }).code

            if (code.includes('resource-exhausted')) {
                return new QuotaExceededError(error)
            }
            if (code.includes('invalid-argument')) {
                return new InvalidArgumentError(error)
            }
            if (code.includes('unavailable') || code.includes('internal')) {
                return new InternalError(error)
            }
        }

        // 네트워크 에러
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return new NetworkError(error)
        }

        return new FirebaseError('UNKNOWN', '알 수 없는 오류', error, false)
    }
}

// ============================================================================
// Firebase 에러 서브클래스들
// ============================================================================

/** 요청 한도 초과 */
export class QuotaExceededError extends FirebaseError {
    constructor(original?: unknown) {
        super('FIREBASE_QUOTA_EXCEEDED', '요청 한도 초과', original, true)
        this.name = 'QuotaExceededError'
    }
}

/** 잘못된 요청 */
export class InvalidArgumentError extends FirebaseError {
    constructor(original?: unknown) {
        super('FIREBASE_INVALID_ARGUMENT', '잘못된 요청', original, false)
        this.name = 'InvalidArgumentError'
    }
}

/** 서버 내부 오류 */
export class InternalError extends FirebaseError {
    constructor(original?: unknown) {
        super('FIREBASE_INTERNAL', '서버 오류', original, true)
        this.name = 'InternalError'
    }
}

/** 네트워크 오류 */
export class NetworkError extends FirebaseError {
    constructor(original?: unknown) {
        super('NETWORK_ERROR', '네트워크 오류', original, true)
        this.name = 'NetworkError'
    }
}

// ============================================================================
// Type Guard
// ============================================================================

export function isFirebaseError(error: unknown): error is FirebaseError {
    return error instanceof FirebaseError
}
