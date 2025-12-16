import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
        tailwindcss(),
    ],
    optimizeDeps: {
        include: ['dagre'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // MSW 관련 코드는 별도 청크로 분리
                    // 프로덕션에서 VITE_ENABLE_MSW=false면 이 청크는 로드되지 않음
                    if (id.includes('/mocks/') || id.includes('msw')) {
                        return 'msw-mocks'
                    }
                },
            },
        },
    },
})
