import { motion } from 'framer-motion'
import { SectionTitle } from '../../components/common/SectionTitle'
import { modeConfig } from './const'
import type { ModeStats } from '../../db/service/types'

export function ModeStatisticsSection({ modeStats }: { modeStats: ModeStats[] }) {
    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
        >
            <SectionTitle className="mb-4">모드별 통계</SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {modeStats.map((stat) => {
                    const config = modeConfig[stat.mode]
                    const hasData = stat.totalSessions > 0

                    return (
                        <div key={stat.mode} className="p-3 md:p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <span className={config.color}>{config.icon}</span>
                                <span className="font-mono text-sm text-[var(--text-primary)]">{config.label}</span>
                                {/* 모바일에서 가로 배치 */}
                                {hasData && (
                                    <div className="flex items-baseline gap-1 sm:hidden ml-auto">
                                        <span
                                            className={`font-score text-2xl ${stat.accuracy >= 80 ? 'text-[var(--success)]' : stat.accuracy >= 60 ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}
                                        >
                                            {stat.accuracy}
                                        </span>
                                        <span className="font-mono text-sm text-[var(--text-tertiary)]">%</span>
                                    </div>
                                )}
                            </div>

                            {hasData ? (
                                <>
                                    {/* 데스크톱에서만 보이는 정답률 */}
                                    <div className="hidden sm:flex items-baseline gap-1 mb-2">
                                        <span
                                            className={`font-score text-3xl ${stat.accuracy >= 80 ? 'text-[var(--success)]' : stat.accuracy >= 60 ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}
                                        >
                                            {stat.accuracy}
                                        </span>
                                        <span className="font-mono text-sm text-[var(--text-tertiary)]">%</span>
                                    </div>
                                    <div className="flex items-center gap-3 font-mono text-xs text-[var(--text-tertiary)]">
                                        <span>{stat.totalSessions} 세션</span>
                                        <span>{stat.totalQuestions} 문제</span>
                                    </div>
                                </>
                            ) : (
                                <div className="font-mono text-sm text-[var(--text-tertiary)]">// no data</div>
                            )}
                        </div>
                    )
                })}
            </div>
        </motion.section>
    )
}
