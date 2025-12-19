/**
 * 범용 로딩 스피너 컴포넌트
 * - 터미널 스타일 로딩 애니메이션
 * - Suspense fallback, 비동기 로딩 등에 사용
 */

interface LoadingSpinnerProps {
    /** 로딩 메시지 */
    message?: string
    /** 크기 */
    size?: 'sm' | 'md' | 'lg'
    /** 전체 화면 모드 */
    fullScreen?: boolean
    /** 추가 클래스 */
    className?: string
}

export function LoadingSpinner({
    message = 'Loading...',
    size = 'md',
    fullScreen = false,
    className = '',
}: LoadingSpinnerProps) {
    const sizeStyles = {
        sm: { spinner: 'w-6 h-6', text: 'text-xs', gap: 'gap-2' },
        md: { spinner: 'w-10 h-10', text: 'text-sm', gap: 'gap-3' },
        lg: { spinner: 'w-14 h-14', text: 'text-base', gap: 'gap-4' },
    }

    const { spinner, text, gap } = sizeStyles[size]

    const content = (
        <div className={`flex flex-col items-center justify-center ${gap} ${className}`}>
            {/* 스피너 */}
            <div className={`relative ${spinner}`}>
                {/* 외부 링 */}
                <div className="absolute inset-0 border-2 border-[var(--border-light)] rounded-full" />
                {/* 회전 링 */}
                <div className="absolute inset-0 border-2 border-transparent border-t-[var(--accent)] rounded-full animate-spin" />
                {/* 중앙 점 */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
                </div>
            </div>

            {/* 메시지 */}
            {message && (
                <div className={`font-mono ${text} text-[var(--text-tertiary)] flex items-center gap-1`}>
                    <span className="text-[var(--accent)]">$</span>
                    <span>{message}</span>
                    <span className="animate-[blink_1s_infinite]">_</span>
                </div>
            )}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                {content}
            </div>
        )
    }

    return content
}
