import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    identifyErrorSource,
    getErrorMessage,
    createErrorState,
    initialErrorState,
    type ErrorState,
} from './errorHandler'

// ================================ 의존성 모킹 ================================
vi.mock('../features/Toast/toast', () => ({
    terminalToast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}))

vi.mock('../db/core/errors', () => ({
    isDBError: vi.fn((error: unknown) => {
        return error instanceof Error && 'isDBError' in error
    }),
}))

vi.mock('../features/Study/services/studyApi', () => ({
    handleStudyApiError: vi.fn(() => 'API 에러 메시지'),
}))

// ================================ 테스트 ================================
describe('errorHandler', () => {
    // 모킹 초기화
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // identifyErrorSource 에러 반환 테스트
    describe('identifyErrorSource', () => {
        it('DB 에러는 "db"를 반환해야 함', () => {
            const dbError = new Error('DB Error')
            ;(dbError as Error & { isDBError: boolean }).isDBError = true

            expect(identifyErrorSource(dbError)).toBe('db')
        })

        it('code 속성이 있는 에러는 "api"를 반환해야 함', () => {
            const apiError = new Error('API Error')
            ;(apiError as Error & { code: string }).code = 'NETWORK_ERROR'

            expect(identifyErrorSource(apiError)).toBe('api')
        })

        it('일반 에러는 "unknown"을 반환해야 함', () => {
            const error = new Error('Unknown Error')
            expect(identifyErrorSource(error)).toBe('unknown')
        })

        it('문자열 에러는 "unknown"을 반환해야 함', () => {
            expect(identifyErrorSource('string error')).toBe('unknown')
        })
    })

    // getErrorMessage 에러 메시지 반환 테스트
    describe('getErrorMessage', () => {
        it('DB 에러는 에러 메시지를 반환해야 함', () => {
            const dbError = new Error('데이터베이스 연결 실패')
            ;(dbError as Error & { isDBError: boolean }).isDBError = true

            expect(getErrorMessage(dbError)).toBe('데이터베이스 연결 실패')
        })

        it('API 에러는 handleStudyApiError 결과를 반환해야 함', () => {
            const apiError = new Error('API Error')
            ;(apiError as Error & { code: string }).code = 'NETWORK_ERROR'

            expect(getErrorMessage(apiError)).toBe('API 에러 메시지')
        })

        it('일반 Error 객체는 message를 반환해야 함', () => {
            const error = new Error('일반 에러')
            expect(getErrorMessage(error)).toBe('일반 에러')
        })

        it('문자열이 아닌 에러는 기본 메시지를 반환해야 함', () => {
            expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.')
            expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.')
            expect(getErrorMessage(123)).toBe('알 수 없는 오류가 발생했습니다.')
        })
    })

    // createErrorState 에러 상태 생성 테스트
    describe('createErrorState', () => {
        it('에러로부터 ErrorState를 생성해야 함', () => {
            const error = new Error('테스트 에러')
            const state = createErrorState(error)

            expect(state.hasError).toBe(true)
            expect(state.message).toBe('테스트 에러')
            expect(state.source).toBe('unknown')
        })

        it('DB 에러는 source가 "db"이어야 함', () => {
            const dbError = new Error('DB Error')
            ;(dbError as Error & { isDBError: boolean }).isDBError = true

            const state = createErrorState(dbError)

            expect(state.source).toBe('db')
        })
    })

    // 초기 에러 상태 테스트
    describe('initialErrorState', () => {
        it('초기 에러 상태는 hasError가 false여야 함', () => {
            expect(initialErrorState.hasError).toBe(false)
            expect(initialErrorState.message).toBeNull()
            expect(initialErrorState.source).toBeNull()
        })

        it('초기 상태는 불변이어야 함', () => {
            const expected: ErrorState = {
                hasError: false,
                message: null,
                source: null,
            }

            expect(initialErrorState).toEqual(expected)
        })
    })
})
