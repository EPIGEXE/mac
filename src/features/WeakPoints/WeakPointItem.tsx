import type { EssayWeakPoint, SentenceWeakPoint, WeakPoint, WordWeakPoint } from "../../db/schema/study"
import { modeConfig } from "../StatisticsDashboard/const"
import { IconCheck } from "@tabler/icons-react"

export function WeakPointItem({ wp, noteId, isResolved, handleResolveWeakPoint }: {
    wp: WeakPoint
    noteId: string
    isResolved: boolean
    handleResolveWeakPoint: (noteId: string, wpId: string) => void
}) {
    const config = modeConfig[wp.mode]

    return (
        <div className={`p-3 bg-[var(--bg-primary)] border mb-2 ${isResolved ? 'border-[var(--success)]/30 opacity-60' : 'border-[var(--error)]/20'}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={config.color}>{config.icon}</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">{config.label}</span>
                <span className={`font-mono text-sm ${isResolved ? 'text-[var(--text-secondary)]' : 'text-[var(--error)]'}`}>
                    {wp.wrongCount}회 오답
                </span>
                {isResolved ? (
                    <span className="ml-auto px-1.5 py-0.5 bg-[var(--success)]/10 text-[var(--success)] font-mono text-sm flex items-center gap-1">
                        <IconCheck size={10} />
                        해결됨
                    </span>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleResolveWeakPoint(noteId, wp.id)
                        }}
                        className="ml-auto p-1 border border-[var(--success)] text-[var(--success)] cursor-pointer transition-colors hover:bg-[var(--success)]/10 flex items-center gap-1 font-mono text-sm"
                    >
                        <IconCheck size={12} />
                        해결
                    </button>
                )}
            </div>

            {wp.mode === 'word' && (
                <div className={isResolved ? 'opacity-70' : ''}>
                    <div className="font-mono text-sm text-[var(--text-primary)] mb-1">
                        "{(wp as WordWeakPoint).keyword}"
                    </div>
                    {(wp as WordWeakPoint).hint && (
                        <div className="font-mono text-sm text-[var(--text-secondary)] mb-1">
                            힌트: {(wp as WordWeakPoint).hint}
                        </div>
                    )}
                    {(wp as WordWeakPoint).wrongAnswers.length > 0 && (
                        <div className="font-mono text-sm text-[var(--error)]/70">
                            오답: {(wp as WordWeakPoint).wrongAnswers.slice(-3).join(', ')}
                        </div>
                    )}
                </div>
            )}

            {wp.mode === 'sentence' && (
                <div className={isResolved ? 'opacity-70' : ''}>
                    <div className="font-mono text-sm text-[var(--text-primary)] mb-1 line-clamp-2">
                        {(wp as SentenceWeakPoint).question}
                    </div>
                    <div className="font-mono text-sm text-[var(--text-secondary)] mb-1 truncate">
                        정답: {(wp as SentenceWeakPoint).correctAnswer}
                    </div>
                </div>
            )}

            {wp.mode === 'essay' && (
                <div className={isResolved ? 'opacity-70' : ''}>
                    <div className="font-mono text-sm text-[var(--text-secondary)] mb-1">
                        [{(wp as EssayWeakPoint).company}] {(wp as EssayWeakPoint).questionType}
                    </div>
                    <div className="font-mono text-sm text-[var(--text-primary)] line-clamp-2">
                        {(wp as EssayWeakPoint).question}
                    </div>
                </div>
            )}
        </div>
    )
}