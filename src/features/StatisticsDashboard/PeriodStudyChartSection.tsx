import { motion } from 'framer-motion'
import { SectionTitle } from '../../components/common/SectionTitle'
import { IconTrendingUp } from '@tabler/icons-react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PeriodStats } from '../../db/study/types'

interface PeriodStudyChartSectionProps {
    periodDays: 7 | 14 | 30
    setPeriodDays: (days: 7 | 14 | 30) => void
    chartData: PeriodStats[]
}

export function PeriodStudyChartSection({ periodDays, setPeriodDays, chartData }: PeriodStudyChartSectionProps) {
    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <SectionTitle>학습 추이</SectionTitle>
                    <IconTrendingUp size={16} className="text-[var(--text-tertiary)]" />
                </div>

                {/* 기간 선택 */}
                <div className="flex items-center gap-1 font-mono text-xs">
                    {([7, 14, 30] as const).map((days) => (
                        <button
                            key={days}
                            onClick={() => setPeriodDays(days)}
                            className={`px-2 py-1 border cursor-pointer transition-colors ${
                                periodDays === days
                                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                                    : 'border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]'
                            }`}
                        >
                            {days}d
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-3 md:p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                {/* 정답률 추이 */}
                <div className="mb-4 md:mb-6">
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">// 정답률 추이</div>
                    <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <XAxis
                                dataKey="dateLabel"
                                tick={{
                                    fill: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    fontFamily: 'D2Coding',
                                }}
                                axisLine={{ stroke: 'var(--border-light)' }}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{
                                    fill: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    fontFamily: 'D2Coding',
                                }}
                                axisLine={{ stroke: 'var(--border-light)' }}
                                tickLine={false}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-paper)',
                                    border: '1px solid var(--border-light)',
                                    fontFamily: 'D2Coding',
                                    fontSize: '12px',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="accuracy"
                                stroke="var(--accent)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--accent)', r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 문제 풀이 수 */}
                <div>
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">// 일별 문제 풀이</div>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <XAxis
                                dataKey="dateLabel"
                                tick={{
                                    fill: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    fontFamily: 'D2Coding',
                                }}
                                axisLine={{ stroke: 'var(--border-light)' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{
                                    fill: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    fontFamily: 'D2Coding',
                                }}
                                axisLine={{ stroke: 'var(--border-light)' }}
                                tickLine={false}
                                width={30}
                            />
                            <Bar dataKey="questionsAnswered" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.section>
    )
}
