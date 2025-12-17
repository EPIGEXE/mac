import { Link } from 'react-router-dom'
import { IconHome, IconArrowLeft } from '@tabler/icons-react'

export function NotFoundPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
            <div className="text-center">
                <span className="font-mono text-6xl text-[var(--error)]">404</span>
                <p className="font-mono text-lg text-[var(--text-secondary)] mt-4">
                    // page not found
                </p>
                <p className="font-mono text-sm text-[var(--text-tertiary)] mt-2">
                    요청하신 페이지를 찾을 수 없습니다.
                </p>
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 px-4 py-2 font-mono text-sm border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                    <IconArrowLeft size={16} />
                    :back
                </button>
                <Link
                    to="/"
                    className="flex items-center gap-2 px-4 py-2 font-mono text-sm border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                    <IconHome size={16} />
                    :home
                </Link>
            </div>
        </div>
    )
}
