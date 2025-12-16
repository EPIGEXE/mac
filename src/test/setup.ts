import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from '../mocks/server'

// 테스트 후 자동 정리
afterEach(() => {
    cleanup()
})

// MSW 서버 설정
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
