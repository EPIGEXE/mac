import { motion } from 'framer-motion'
import { SectionTitle } from '../../components/common/SectionTitle'
import { DashboardGrid } from '../../components/common/DashboardGrid'
import { DashboardCard } from '../../components/common/DashboardCard'
import { formatDuration } from '../../utils/funtion'
import type { OverallStats } from '../../db/study/types'
import { IconChecks, IconX } from '@tabler/icons-react'

export function StudyStatisticsSection({ overallStats }: { overallStats: OverallStats | null }) {
    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
        >
            <SectionTitle className="mb-4 ">전체 통계</SectionTitle>

            <DashboardGrid>
                {/* 전체 정답률 (메인) */}
                <DashboardCard label="전체 정답률" colSpan={2} rowSpan={2} className="p-6">
                    <div className="flex items-baseline gap-2">
                        <span
                            className={`font-score text-7xl font-light ${overallStats!.overallAccuracy >= 80 ? 'text-[var(--success)]' : overallStats!.overallAccuracy >= 60 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}
                        >
                            {overallStats!.overallAccuracy}
                        </span>
                        <span className="font-score text-3xl text-[var(--text-tertiary)]">%</span>
                    </div>
                    <div className="mt-4 flex items-center gap-4 font-mono text-sm">
                        <span className="flex items-center gap-1.5 text-[var(--success)]">
                            <IconChecks size={16} />
                            {overallStats!.totalCorrect}
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--error)]">
                            <IconX size={16} />
                            {overallStats!.totalWrong}
                        </span>
                    </div>
                </DashboardCard>

                {/* 총 학습 시간 */}
                <DashboardCard label="총 학습 시간">
                    <div className="font-mono text-2xl text-[var(--text-primary)]">
                        {formatDuration(overallStats!.totalStudyTime)}
                    </div>
                </DashboardCard>

                {/* 총 세션 */}
                <DashboardCard label="세션 수">
                    <div className="font-mono text-2xl text-[var(--text-primary)]">{overallStats!.totalSessions}</div>
                </DashboardCard>

                {/* 학습한 노트 */}
                <DashboardCard label="학습한 노트">
                    <div className="font-mono text-2xl text-[var(--accent)]">{overallStats!.studiedNoteCount}</div>
                </DashboardCard>

                {/* 취약점 */}
                <DashboardCard label="취약점">
                    <div
                        className={`font-mono text-2xl ${overallStats!.unresolvedWeakPoints > 0 ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}`}
                    >
                        {overallStats!.unresolvedWeakPoints}
                    </div>
                </DashboardCard>
            </DashboardGrid>
        </motion.section>
    )
}
