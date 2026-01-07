import { IconAlertTriangle, IconChevronRight } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { modeConfig } from './const'
import type { WeakPointSummary } from '../../db/service/types'
import type { WeakPoint } from '../../db/core/schema'

export function WeakPointSection({
    weakPointSummary,
    topWeakPoints,
    noteTitles,
}: {
    weakPointSummary: WeakPointSummary
    topWeakPoints: WeakPoint[]
    noteTitles: Record<string, string>
}) {
    const navigate = useNavigate()

    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
        >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <IconAlertTriangle size={16} className="text-[var(--error)]" />
                    <span className="text-[var(--text-primary)]">취약점</span>
                    <span className="font-mono text-sm text-[var(--text-tertiary)]">
                        [미해결 <span className="text-[var(--error)]">{weakPointSummary.unresolvedCount}</span>
                        {weakPointSummary.resolvedCount > 0 && (
                            <>
                                {' '}
                                / 해결 <span className="text-[var(--success)]">{weakPointSummary.resolvedCount}</span>
                            </>
                        )}
                        ]
                    </span>
                </div>

                <button
                    onClick={() => navigate('/study/weak-points')}
                    className="px-2 md:px-3 py-1.5 font-mono text-xs border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center gap-1"
                >
                    전체 보기
                    <IconChevronRight size={14} />
                </button>
            </div>

            {/* 모드별 취약점 요약 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mb-4">
                {(['word', 'sentence', 'essay'] as const).map((mode) => {
                    const config = modeConfig[mode]
                    const count = weakPointSummary.byMode[mode]

                    return (
                        <div
                            key={mode}
                            className="p-2.5 md:p-3 border border-[var(--border-light)] bg-[var(--bg-paper)] flex items-center gap-2 md:gap-3"
                        >
                            <span className={config.color}>{config.icon}</span>
                            <span className="font-mono text-sm text-[var(--text-secondary)]">{config.label}</span>
                            <span
                                className={`ml-auto font-mono text-lg ${count > 0 ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'}`}
                            >
                                {count}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* 상위 취약점 목록 */}
            {topWeakPoints.length > 0 && (
                <div className="border border-[var(--error)]/30 bg-[var(--error)]/5">
                    {topWeakPoints.map((wp: WeakPoint, idx: number) => {
                        const config = modeConfig[wp.mode]
                        const displayContent =
                            wp.mode === 'word'
                                ? wp.keyword
                                : wp.mode === 'sentence'
                                  ? wp.question?.slice(0, 50)
                                  : wp.question?.slice(0, 50)
                        const noteTitle = noteTitles[wp.noteId]

                        return (
                            <div
                                key={wp.id}
                                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 ${idx < topWeakPoints.length - 1 ? 'border-b border-[var(--error)]/20' : ''}`}
                            >
                                <span className={`${config.color} shrink-0`}>{config.icon}</span>
                                <div className="flex-1 min-w-0 gap-0.5 md:gap-1 flex flex-col">
                                    {noteTitle && (
                                        <span className="font-mono text-xs text-[var(--text-secondary)] truncate block">
                                            @ {noteTitle}
                                        </span>
                                    )}
                                    <span className="font-mono text-sm text-[var(--text-primary)] truncate block">
                                        {displayContent || '(내용 없음)'}
                                    </span>
                                </div>
                                <span className="font-mono text-xs text-[var(--error)] whitespace-nowrap shrink-0">
                                    {wp.wrongCount}회 오답
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </motion.section>
    )
}
