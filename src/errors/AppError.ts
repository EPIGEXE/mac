/**
 * AppError - 기본 에러 클래스
 *
 * 모든 애플리케이션 에러의 base class
 * DBError, FirebaseError가 이를 상속
 */
import {ERROR_MESSAGES, type ErrorCode } from './types'

export class AppError extends Error {
    code: ErrorCode
    original?: unknown
    retryable: boolean

    constructor(
        code: ErrorCode,
        message: string,
        original?: unknown,
        retryable: boolean = false
    ) {
        super(message)
        this.name = 'AppError'
        this.code = code
        this.original = original
        this.retryable = retryable
    }

    /** AppError 여부 확인 */
    static isAppError(error: unknown): error is AppError {
        return error instanceof AppError
    }

    /** 알 수 없는 에러를 AppError로 래핑 */
    static from(error: unknown, fallbackCode: ErrorCode = 'UNKNOWN'): AppError {
        if (AppError.isAppError(error)) {
            return error
        }
        const message = error instanceof Error ? error.message : '알 수 없는 오류'
        return new AppError(fallbackCode, message, error, false)
    }

    /** 사용자 친화적 에러 메시지 반환 */
    get userMessage(): string {
        return ERROR_MESSAGES[this.code]
    }
}
