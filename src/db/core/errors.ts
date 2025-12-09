// ============================================================================
// Database Error Classes
// - 커스텀 에러 클래스 정의
// - 에러 타입별 분류 및 처리
// ============================================================================

/**
 * DB 에러 기본 클래스
 */
export class DBError extends Error {
    readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'DBError';
        this.code = code;
    }
}

/**
 * 엔티티를 찾을 수 없을 때
 */
export class NotFoundError extends DBError {
    readonly entity: string;
    readonly id: string;

    constructor(entity: string, id: string) {
        super(`${entity} not found: ${id}`, 'NOT_FOUND');
        this.name = 'NotFoundError';
        this.entity = entity;
        this.id = id;
    }
}

/**
 * 유효하지 않은 입력
 */
export class InvalidInputError extends DBError {
    readonly field?: string;

    constructor(message: string, field?: string) {
        super(message, 'INVALID_INPUT');
        this.name = 'InvalidInputError';
        this.field = field;
    }
}

/**
 * 중복 데이터
 */
export class DuplicateError extends DBError {
    readonly entity: string;
    readonly field: string;

    constructor(entity: string, field: string, value: string) {
        super(`${entity} with ${field} '${value}' already exists`, 'DUPLICATE');
        this.name = 'DuplicateError';
        this.entity = entity;
        this.field = field;
    }
}

/**
 * DB 연결/쿼리 오류
 */
export class DatabaseOperationError extends DBError {
    readonly operation: string;
    readonly originalError?: unknown;

    constructor(operation: string, originalError?: unknown) {
        const message = originalError instanceof Error
            ? `Database operation '${operation}' failed: ${originalError.message}`
            : `Database operation '${operation}' failed`;
        super(message, 'DB_OPERATION_ERROR');
        this.name = 'DatabaseOperationError';
        this.operation = operation;
        this.originalError = originalError;
    }
}

// ============================================================================
// Error Type Guards
// ============================================================================

export function isDBError(error: unknown): error is DBError {
    return error instanceof DBError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
}

export function isInvalidInputError(error: unknown): error is InvalidInputError {
    return error instanceof InvalidInputError;
}

// ============================================================================
// Error Handler Utility
// ============================================================================

/**
 * DB 작업을 래핑하여 에러 처리
 */
export async function withErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (isDBError(error)) {
            throw error;
        }
        throw new DatabaseOperationError(operation, error);
    }
}
