/**
 * DBError - DB 레이어 에러 클래스들
 *
 * AppError를 상속하여 DB 관련 에러 처리
 */
import { AppError } from './AppError'
import type { ErrorCode } from './types'

// ============================================================================
// DBError - DB 레이어 기본 에러
// ============================================================================

export class DBError extends AppError {
    constructor(
        code: ErrorCode,
        message: string,
        original?: unknown,
        retryable: boolean = false
    ) {
        super(code, message, original, retryable)
        this.name = 'DBError'
    }
}

// ============================================================================
// DB 에러 서브클래스들
// ============================================================================

/** 엔티티를 찾을 수 없을 때 */
export class NotFoundError extends DBError {
    entity: string
    id: string

    constructor(entity: string, id: string) {
        super('DB_NOT_FOUND', `${entity} not found: ${id}`, undefined, false)
        this.name = 'NotFoundError'
        this.entity = entity
        this.id = id
    }
}

/** 유효하지 않은 입력 */
export class InvalidInputError extends DBError {
    field?: string

    constructor(message: string, field?: string) {
        super('DB_INVALID_INPUT', message, undefined, false)
        this.name = 'InvalidInputError'
        this.field = field
    }
}

/** DB 연결/쿼리 오류 */
export class DatabaseOperationError extends DBError {
    operation: string

    constructor(operation: string, originalError?: unknown) {
        const message = originalError instanceof Error
            ? `Database operation '${operation}' failed: ${originalError.message}`
            : `Database operation '${operation}' failed`
        super('DB_OPERATION_FAILED', message, originalError, true)
        this.name = 'DatabaseOperationError'
        this.operation = operation
    }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDBError(error: unknown): error is DBError {
    return error instanceof DBError
}

export function isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError
}

// ============================================================================
// DB Error Handler Utility
// ============================================================================

/**
 * DB 작업을 래핑하여 에러 처리
 */
export async function withErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    silent: boolean = false
): Promise<T> {
    try {
        return await fn()
    } catch (error) {
        if (!silent) {
            console.error(`[DB:${operation}]`, error)
        }

        if (isDBError(error)) {
            throw error
        }
        throw new DatabaseOperationError(operation, error)
    }
}
