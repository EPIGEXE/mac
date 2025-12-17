import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { analytics } from '../lib/analytics'

/**
 * 라우트 변경 시 자동으로 페이지 뷰 이벤트 전송
 */
export function usePageView() {
    const location = useLocation()

    useEffect(() => {
        analytics.pageView(location.pathname)
    }, [location.pathname])
}
