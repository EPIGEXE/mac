/**
 * Error Fallback UI 컴포넌트들
 * - 터미널 스타일 유지
 */
import { IconRefresh, IconReload } from '@tabler/icons-react'

interface ErrorFallbackProps {
    error: Error
    onReset?: () => void
}

/**
 * 섹션용 에러 표시 (에디터, 퀴즈 등)
 */
export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
    return (
        <div className="h-full min-h-[200px] flex flex-col items-center justify-center gap-4 bg-[var(--bg-secondary)] p-8 rounded">
            <span className="font-mono text-sm text-[var(--error)]">// runtime error</span>
            <pre className="font-mono text-xs text-[var(--text-tertiary)] max-w-md overflow-auto whitespace-pre-wrap">
                {error.message}
            </pre>
            {onReset && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 font-mono text-sm border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                    <IconRefresh size={16} />
                    :retry
                </button>
            )}
        </div>
    )
}

/**
 * 전체 앱 크래시용 에러 표시
 */
export function AppCrashFallback({ error }: { error: Error }) {
    const handleReload = () => {
        window.location.reload()
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center gap-6 bg-[var(--bg-primary)] p-8">
            <div className="text-center">
                <span className="font-mono text-lg text-[var(--error)]">// application crash</span>
                <p className="font-mono text-sm text-[var(--text-tertiary)] mt-2">
                    예상치 못한 오류가 발생했습니다.
                </p>
            </div>

            <pre className="font-mono text-xs text-[var(--text-tertiary)] max-w-lg overflow-auto whitespace-pre-wrap bg-[var(--bg-secondary)] p-4 rounded border border-[var(--border-light)]">
                {error.message}
            </pre>

            <button
                onClick={handleReload}
                className="flex items-center gap-2 px-6 py-3 font-mono text-sm border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
                <IconReload size={18} />
                :reload application
            </button>

            <p className="font-mono text-xs text-[var(--text-tertiary)]">
                문제가 지속되면 브라우저 캐시를 삭제해보세요.
            </p>
        </div>
    )
}
