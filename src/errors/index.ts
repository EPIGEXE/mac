/**
 * 에러 모듈 통합 export
 *
 * 계층 구조:
 * AppError (base)
 *     ├── DBError
 *     │     ├── NotFoundError
 *     │     ├── InvalidInputError
 *     │     ├── DuplicateError
 *     │     └── DatabaseOperationError
 *     └── FirebaseError
 *           ├── QuotaExceededError
 *           ├── InvalidArgumentError
 *           ├── InternalError
 *           └── NetworkError
 *
 * 사용법:
 * import { AppError, DBError, NotFoundError } from '@/errors'
 */

// Types
export type { ErrorCode } from './types'
export { ERROR_MESSAGES } from './types'

// AppError (base)
export { AppError } from './AppError'

// DBError 계열
export {
    DBError,
    NotFoundError,
    InvalidInputError,
    DatabaseOperationError,
    isDBError,
    isNotFoundError,
    withErrorHandling,
} from './DBError'

// FirebaseError 계열
export {
    FirebaseError,
    QuotaExceededError,
    InvalidArgumentError,
    InternalError,
    NetworkError,
    isFirebaseError,
} from './FirebaseError'

// ============================================================================
// 에러 메시지 추출 유틸
// ============================================================================

import { AppError } from './AppError'
import { ERROR_MESSAGES } from './types'

export function getErrorMessage(error: unknown): string {
    if (AppError.isAppError(error)) {
        return ERROR_MESSAGES[error.code]
    }
    if (error instanceof Error) {
        return error.message
    }
    return ERROR_MESSAGES.UNKNOWN
}
