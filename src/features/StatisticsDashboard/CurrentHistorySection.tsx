import { IconChevronRight, IconHistory } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { modeConfig } from './const'
import { formatDate, formatDuration } from '../../utils/funtion'
import type { SessionHistoryItem } from '../../db/study/types'

export function CurrentHistorySection({ recentSessions }: { recentSessions: SessionHistoryItem[] }) {
    const navigate = useNavigate()

    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <IconHistory size={16} className="text-[var(--text-tertiary)]" />
                    <span className="text-[var(--text-primary)]">최근 학습</span>
                </div>

                <button
                    onClick={() => navigate('/study/sessions')}
                    className="px-3 py-1.5 font-mono text-xs border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center gap-1"
                >
                    전체 보기
                    <IconChevronRight size={14} />
                </button>
            </div>

            <div className="border border-[var(--border-light)]">
                {recentSessions.map((session, idx) => {
                    const config = modeConfig[session.mode]
                    const accuracy =
                        session.totalQuestions > 0
                            ? Math.round((session.correctCount / session.totalQuestions) * 100)
                            : 0

                    return (
                        <div
                            key={session.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 px-3 md:px-4 py-2.5 md:py-3 ${idx < recentSessions.length - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''}`}
                        >
                            {/* 상단: 모드, 노트수, 정답률 */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* 모드 아이콘 */}
                                <span className={config.color}>{config.icon}</span>

                                {/* 모드 라벨 */}
                                <span className="font-mono text-xs text-[var(--text-tertiary)] w-12">{config.label}</span>

                                {/* 노트 수 */}
                                <span className="font-mono text-sm text-[var(--text-secondary)]">
                                    {session.noteCount}개 노트
                                </span>

                                {/* 정답률 */}
                                <span
                                    className={`font-mono text-sm ${accuracy >= 80 ? 'text-[var(--success)]' : accuracy >= 60 ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}
                                >
                                    {accuracy}%
                                </span>
                            </div>

                            {/* 하단(모바일) / 우측(데스크톱): 시간 정보 */}
                            <div className="flex items-center gap-3 ml-7 sm:ml-auto">
                                {/* 시간 */}
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                    {formatDate(session.startedAt)}
                                </span>

                                {/* 소요 시간 */}
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                    {formatDuration(session.totalDuration)}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </motion.section>
    )
}
