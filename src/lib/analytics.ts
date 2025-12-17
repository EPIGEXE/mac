// Google Tag Manager 래퍼

declare global {
    interface Window {
        dataLayer: Record<string, unknown>[]
    }
}

const GTM_ID = import.meta.env.VITE_GTM_ID
const isProduction = import.meta.env.PROD

// GTM 초기화 (프로덕션 + GTM_ID 존재 시에만)
function initGTM() {
    if (!isProduction || !GTM_ID) return

    // dataLayer 초기화
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js',
    })

    // GTM 스크립트 로드
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
    document.head.appendChild(script)

    // noscript iframe (SEO/접근성)
    const noscript = document.createElement('noscript')
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`
    iframe.height = '0'
    iframe.width = '0'
    iframe.style.display = 'none'
    iframe.style.visibility = 'hidden'
    noscript.appendChild(iframe)
    document.body.insertBefore(noscript, document.body.firstChild)
}

// 앱 시작 시 GTM 초기화
initGTM()

function pushEvent(event: string, params?: Record<string, unknown>) {
    if (isProduction && GTM_ID && typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            event,
            ...params,
        })
    }
}

export const analytics = {
    // 페이지 뷰
    pageView: (pagePath: string, pageTitle?: string) => {
        pushEvent('page_view', {
            page_path: pagePath,
            page_title: pageTitle,
        })
    },

    // 노트 열람
    noteView: (noteId: string, category: string) => {
        pushEvent('note_view', {
            note_id: noteId,
            category,
        })
    },

    // 노트 생성
    noteCreate: (category: string) => {
        pushEvent('note_create', {
            category,
        })
    },

    // 학습 시작
    studyStart: (noteCount: number, categoryFilter?: string) => {
        pushEvent('study_start', {
            note_count: noteCount,
            category_filter: categoryFilter,
        })
    },

    // 학습 완료
    studyComplete: (duration: number, score: number, noteCount: number) => {
        pushEvent('study_complete', {
            duration_seconds: Math.round(duration / 1000),
            score,
            note_count: noteCount,
        })
    },

    // 학습 이탈
    studyAbandon: (duration: number, completedCount: number) => {
        pushEvent('study_abandon', {
            duration_seconds: Math.round(duration / 1000),
            completed_count: completedCount,
        })
    },

    // 뷰 모드 전환
    viewModeChange: (mode: 'list' | 'roadmap') => {
        pushEvent('view_mode_change', {
            mode,
        })
    },

    // 토픽 필터 변경
    topicFilterChange: (filter: string) => {
        pushEvent('topic_filter_change', {
            filter,
        })
    },
}
