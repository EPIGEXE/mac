/**
 * 페이지 뷰 훅 (현재 비활성화)
 *
 * GTM에서 GA4 Configuration 태그가 "All Pages" 트리거로
 * 자동으로 page_view를 전송하므로 중복 방지를 위해 비활성화.
 *
 * SPA 라우트 변경 추적이 필요하면 GTM에서:
 * 1. History Change 트리거 생성
 * 2. GA4 Event 태그로 page_view 전송
 */
export function usePageView() {
    // GTM handles page_view automatically
}
