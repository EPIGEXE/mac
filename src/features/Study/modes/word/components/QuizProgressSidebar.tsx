import type { BlankInfo } from "../../../types"

interface QuizProgressSidebarProps {
    answeredCount: number
    totalBlanks: number
    correctCount: number
    wrongCount: number
    blanks: BlankInfo[]
    results: Record<string, boolean | null>
    answers: Record<string, string>
    currentBlankIndex: number
    goToBlank: (blankId: string) => void
}

export function QuizProgressSidebar({
    answeredCount,
    totalBlanks,
    correctCount,
    wrongCount,
    blanks,
    results,
    answers,
    currentBlankIndex,
    goToBlank,
}: QuizProgressSidebarProps) {
    return (
        <div className="ml-12 shrink-0">
            <aside className="w-[180px] shrink-0 sticky top-[100px] h-fit hidden lg:block">
                {/* 진행률 요약 */}
                <div className="font-mono text-sm text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                    // progress
                </div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-[var(--border-light)]">
                    <span className="font-mono text-sm text-[var(--text-primary)]">
                        {answeredCount}/{totalBlanks}
                    </span>
                    <span className="font-mono text-xs text-[var(--success)]">✓{correctCount}</span>
                    <span className="font-mono text-xs text-[var(--error)]">✗{wrongCount}</span>
                </div>

                {/* 문제 목록 */}
                <div className="font-mono text-sm text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                    // blanks
                </div>
                <nav className="flex flex-col gap-0.5 max-h-[60vh] overflow-y-auto">
                    {blanks.map((blank, idx) => {
                        const blankKey = `BLANK_${blank.id}`
                        const isActive = currentBlankIndex === idx
                        const result = results[blankKey]
                        const hasAnswer = blankKey in answers

                        return (
                            <button
                                key={blank.id}
                                onClick={() => goToBlank(blankKey)}
                                className={`py-1.5 px-3 bg-transparent border-l-2 text-left cursor-pointer text-sm transition-all duration-150 flex items-center justify-between ${
                                    isActive
                                        ? 'text-[var(--accent)] border-l-[var(--accent)] bg-[var(--accent)]/5'
                                        : result === true
                                          ? 'text-[var(--success)] border-l-[var(--success)]'
                                          : result === false
                                            ? 'text-[var(--error)] border-l-[var(--error)]'
                                            : 'text-[var(--text-secondary)] border-l-transparent hover:text-[var(--text-primary)]'
                                }`}
                            >
                                <span className="font-mono">B{String(idx + 1).padStart(2, '0')}</span>
                                {result === true && <span className="text-[var(--success)]">✓</span>}
                                {result === false && <span className="text-[var(--error)]">✗</span>}
                                {result === undefined && hasAnswer && (
                                    <span className="text-[var(--text-tertiary)]">•</span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </aside>
        </div>
    )
}
