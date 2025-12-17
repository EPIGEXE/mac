import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

export function Pagenation({
    currentPage,
    totalPages,
    setCurrentPage,
}: {
    currentPage: number
    totalPages: number
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>
}) {
    return (
        <div className="mt-6 flex items-center justify-center gap-2">
            <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label="이전 페이지"
            >
                <IconChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                        if (totalPages <= 7) return true
                        if (page === 1 || page === totalPages) return true
                        if (Math.abs(page - currentPage) <= 1) return true
                        return false
                    })
                    .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                        return (
                            <span key={page} className="flex items-center">
                                {showEllipsis && <span className="px-2 text-[var(--text-secondary)]">...</span>}
                                <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 font-mono text-sm cursor-pointer transition-colors ${
                                        currentPage === page
                                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                            : 'border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                    }`}
                                >
                                    {page}
                                </button>
                            </span>
                        )
                    })}
            </div>

            <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label="다음 페이지"
            >
                <IconChevronRight size={16} />
            </button>
        </div>
    )
}
