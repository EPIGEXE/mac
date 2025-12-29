import { motion } from 'framer-motion'
import { SectionTitle } from '../../components/common/SectionTitle'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatDate } from '../../utils/funtion'
import type { NoteStats } from '../../db/study/types'
import { useMemo } from 'react'

export function NoteAchievementChartSection({
    noteStats,
    noteTitles,
}: {
    noteStats: NoteStats[]
    noteTitles: Record<string, string>
}) {
    // 노트별 정답률 차트 데이터 (상위 10개)
    const noteChartData = useMemo(() => {
        return noteStats.slice(0, 10).map((stat) => ({
            noteId: stat.noteId,
            name: noteTitles[stat.noteId]?.slice(0, 8) || stat.noteId.slice(0, 8),
            accuracy: stat.accuracy,
            studyCount: stat.studyCount,
        }))
    }, [noteStats, noteTitles])

    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            <div className="flex items-center justify-between mb-4">
                <SectionTitle>노트별 성취도</SectionTitle>
                <span className="font-mono text-sm text-[var(--text-tertiary)]">[{noteStats.length}]</span>
            </div>

            {/* 정답률 차트 - 모바일에서 숨김 */}
            {noteChartData.length > 0 && (
                <div className="hidden sm:block p-3 md:p-4 border border-[var(--border-light)] bg-[var(--bg-paper)] mb-4">
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">
                        // 노트별 정답률 (상위 10개)
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={noteChartData}
                            layout="vertical"
                            margin={{ top: 10, right: 20, bottom: 10, left: 60 }}
                        >
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                tick={{
                                    fill: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    fontFamily: 'D2Coding',
                                }}
                                axisLine={{ stroke: 'var(--border-light)' }}
                                tickLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{
                                    fill: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    fontFamily: 'D2Coding',
                                }}
                                axisLine={{ stroke: 'var(--border-light)' }}
                                tickLine={false}
                                width={60}
                            />
                            <Bar dataKey="accuracy" radius={[0, 2, 2, 0]}>
                                {noteChartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            entry.accuracy >= 80
                                                ? 'var(--success)'
                                                : entry.accuracy >= 60
                                                  ? 'var(--warning)'
                                                  : 'var(--error)'
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 노트 리스트 - 가로 스크롤 */}
            <div className="border border-[var(--border-light)] overflow-x-auto">
                <div className="min-w-[500px]">
                    {/* 헤더 */}
                    <div className="grid grid-cols-12 gap-2 px-3 md:px-4 py-2 bg-[var(--bg-secondary)] font-mono text-xs text-[var(--text-tertiary)] border-b border-[var(--border-light)]">
                        <div className="col-span-5">노트</div>
                        <div className="col-span-2 text-center">학습 횟수</div>
                        <div className="col-span-2 text-center">정답률</div>
                        <div className="col-span-3 text-right">마지막 학습</div>
                    </div>

                    {/* 리스트 */}
                    {noteStats.slice(0, 10).map((stat, idx) => {
                        const isGood = stat.accuracy >= 80
                        const isWarning = stat.accuracy >= 60 && stat.accuracy < 80
                        const isBad = stat.accuracy < 60

                        return (
                            <div
                                key={stat.noteId}
                                className={`grid grid-cols-12 gap-2 px-3 md:px-4 py-2.5 ${idx < Math.min(noteStats.length, 20) - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''}`}
                            >
                                <div className="col-span-5 font-mono text-sm text-[var(--text-primary)] truncate">
                                    {noteTitles[stat.noteId] || stat.noteId}
                                </div>
                                <div className="col-span-2 text-center font-mono text-sm text-[var(--text-secondary)]">
                                    {stat.studyCount}
                                </div>
                                <div
                                    className={`col-span-2 text-center font-mono text-sm font-medium ${isGood ? 'text-[var(--success)]' : isWarning ? 'text-[var(--warning)]' : isBad ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}`}
                                >
                                    {stat.accuracy}%
                                </div>
                                <div className="col-span-3 text-right font-mono text-xs text-[var(--text-tertiary)]">
                                    {stat.lastStudiedAt ? formatDate(stat.lastStudiedAt) : '-'}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {noteStats.length > 20 && (
                <div className="text-center py-2 font-mono text-xs text-[var(--text-tertiary)]">
                    // +{noteStats.length - 20} more notes
                </div>
            )}
        </motion.section>
    )
}
