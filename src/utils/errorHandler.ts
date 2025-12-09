/**
 * 공통 에러 핸들러 유틸리티
 * - 에러 타입 판별
 * - 사용자 친화적 메시지 변환
 * - Toast 연동 헬퍼
 */
import { terminalToast } from '../features/Toast/toast';
import { isDBError } from '../db/core/errors';
import { handleStudyApiError } from '../features/Study/services/studyApi';

// ============================================================================
// 에러 타입 판별
// ============================================================================

export type ErrorSource = 'db' | 'api' | 'unknown';

/**
 * 에러 소스 판별
 */
export function identifyErrorSource(error: unknown): ErrorSource {
    if (isDBError(error)) return 'db';
    if (error instanceof Error && 'code' in error) return 'api';
    return 'unknown';
}

// ============================================================================
// 에러 메시지 추출
// ============================================================================

/**
 * 에러에서 사용자 친화적 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
    const source = identifyErrorSource(error);

    switch (source) {
        case 'db':
            return (error as Error).message;
        case 'api':
            return handleStudyApiError(error);
        default:
            return error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.';
    }
}

// ============================================================================
// Toast 연동 헬퍼
// ============================================================================

interface WithToastErrorOptions {
    /** 에러 시 표시할 커스텀 메시지 (없으면 자동 추출) */
    errorMessage?: string;
    /** 성공 시 toast 표시 여부 */
    showSuccess?: boolean;
    /** 성공 시 표시할 메시지 */
    successMessage?: string;
}

/**
 * 비동기 작업을 Toast 에러 처리와 함께 실행
 * @returns 성공 시 결과값, 실패 시 null
 */
export async function withToastError<T>(
    fn: () => Promise<T>,
    options?: WithToastErrorOptions
): Promise<T | null> {
    try {
        const result = await fn();
        if (options?.showSuccess) {
            terminalToast.success(options.successMessage ?? '완료되었습니다.');
        }
        return result;
    } catch (error) {
        const message = options?.errorMessage ?? getErrorMessage(error);
        terminalToast.error(message);
        console.error('[Error]', error);
        return null;
    }
}

// ============================================================================
// 에러 상태 관리 (훅에서 사용)
// ============================================================================

export interface ErrorState {
    hasError: boolean;
    message: string | null;
    source: ErrorSource | null;
}

/**
 * 에러 객체를 ErrorState로 변환
 */
export function createErrorState(error: unknown): ErrorState {
    return {
        hasError: true,
        message: getErrorMessage(error),
        source: identifyErrorSource(error),
    };
}

/**
 * 초기 에러 상태
 */
export const initialErrorState: ErrorState = {
    hasError: false,
    message: null,
    source: null,
};
