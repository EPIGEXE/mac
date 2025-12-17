import { useEffect } from 'react'

/**
 * Rajdhani 폰트 지연 로드 훅
 * - 결과 표시용 폰트라 메인페이지에서 불필요
 * - Study/Statistics 페이지에서만 로드
 */
let isLoaded = false

export function useRajdhaniFont() {
    useEffect(() => {
        if (isLoaded) return

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500&display=swap'
        document.head.appendChild(link)

        isLoaded = true
    }, [])
}
