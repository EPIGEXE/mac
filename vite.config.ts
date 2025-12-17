import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
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
            // 프로덕션 빌드에서 MSW 제외
            external: mode === 'production' ? [/^msw/, /\/mocks\//] : [],
            output: {
                manualChunks: (id) => {
                    // React 핵심 (공통으로 사용되는 기반)
                    if (id.includes('react-dom') || id.includes('/react/')) {
                        return 'vendor-react'
                    }
                    // reactflow (RoadmapView에서만 사용, ~200KB)
                    if (id.includes('reactflow') || id.includes('@reactflow') || id.includes('dagre')) {
                        return 'vendor-reactflow'
                    }
                    // recharts (통계 페이지에서만 사용, ~150KB)
                    if (id.includes('recharts') || id.includes('d3-')) {
                        return 'vendor-recharts'
                    }
                    // prosemirror (에디터용, ~100KB)
                    if (id.includes('prosemirror')) {
                        return 'vendor-prosemirror'
                    }
                    // firebase (인증/DB, ~100KB)
                    if (id.includes('firebase') || id.includes('@firebase')) {
                        return 'vendor-firebase'
                    }
                    // highlight.js (코드 하이라이트, ~50KB)
                    if (id.includes('highlight.js') || id.includes('lowlight')) {
                        return 'vendor-highlight'
                    }
                },
            },
        },
    },
    // Vitest 설정
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.d.ts',
                'src/test/**',
                'src/mocks/**',
                'src/main.tsx',
            ],
        },
    },
}))
