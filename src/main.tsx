import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persistOptions } from './lib/queryClient'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
    // 프로덕션 빌드에서는 MSW 완전 제외
    if (import.meta.env.PROD) {
        return
    }

    // 개발 환경: VITE_ENABLE_MSW=true 일 때만 MSW 활성화
    const enableMsw = import.meta.env.VITE_ENABLE_MSW === 'true'

    if (enableMsw) {
        const { worker } = await import('./mocks/browser')
        return worker.start({
            onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 통과
        })
    }
}

enableMocking().then(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </PersistQueryClientProvider>
        </StrictMode>,
    )
})
