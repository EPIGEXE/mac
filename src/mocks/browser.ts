/**
 * MSW Browser Worker Setup
 * - 브라우저 환경에서 Service Worker를 통해 네트워크 요청 인터셉트
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
