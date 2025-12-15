import { motion } from 'framer-motion'
import { SectionTitle } from '../../components/common/SectionTitle'
import { DashboardGrid } from '../../components/common/DashboardGrid'
import { DashboardCard } from '../../components/common/DashboardCard'
import { formatDuration } from '../../utils/funtion'
import type { PeriodStats } from '../../db/study/types'

export function TodayStudySection({ todayStats }: { todayStats: PeriodStats | null }) {
    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <SectionTitle className="mb-4">오늘의 학습</SectionTitle>

            <DashboardGrid>
                <DashboardCard label="학습 시간" className="border-[var(--accent)]/30 bg-[var(--accent)]/5">
                    <div className="font-mono text-2xl text-[var(--accent)]">
                        {formatDuration(todayStats?.studyTime || 0)}
                    </div>
                </DashboardCard>

                <DashboardCard label="세션">
                    <div className="font-mono text-2xl text-[var(--text-primary)]">{todayStats?.sessionCount || 0}</div>
                </DashboardCard>

                <DashboardCard label="문제 수">
                    <div className="font-mono text-2xl text-[var(--text-primary)]">
                        {todayStats?.questionsAnswered || 0}
                    </div>
                </DashboardCard>

                <DashboardCard label="정답률">
                    <div
                        className={`font-mono text-2xl ${(todayStats?.accuracy || 0) >= 80 ? 'text-[var(--success)]' : (todayStats?.accuracy || 0) >= 60 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}
                    >
                        {todayStats?.accuracy || 0}%
                    </div>
                </DashboardCard>
            </DashboardGrid>
        </motion.section>
    )
}
