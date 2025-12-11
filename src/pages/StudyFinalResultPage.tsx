/**
 * 학습 최종 결과 페이지
 * - 전체 세션 대시보드
 * - 노트별 점수 그래프 시각화
 * - 복습 필요 노트 하이라이트
 */
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IconArrowLeft, IconRefresh, IconAlertTriangle } from '@tabler/icons-react'
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useStudySessionStore } from '../stores/studySessionStore'
import { ScoreMessage } from '../features/Study/components/ScoreMessage'
import type { StudyModeType } from '../features/Study/types'

export function StudyFinalResultPage() {
    const navigate = useNavigate()

    const noteResults = useStudySessionStore((state) => state.noteResults)
    const selectedNoteIds = useStudySessionStore((state) => state.selectedNoteIds)
    const mode = useStudySessionStore((state) => state.mode)
    const order = useStudySessionStore((state) => state.order)
    const isActive = useStudySessionStore((state) => state.isActive)
    const getTotalStats = useStudySessionStore((state) => state.getTotalStats)
    const resetSession = useStudySessionStore((state) => state.resetSession)
    const startSession = useStudySessionStore((state) => state.startSession)

    // 통계 계산
    const stats = getTotalStats()
    const isPerfect = stats.averageScore >= 90

    // 복습 필요 노트 (60% 미만)
    const needsReviewNotes = useMemo(() => {
        return noteResults.filter((r) => r.score < 60)
    }, [noteResults])

    // 차트 데이터
    const chartData = useMemo(() => {
        return noteResults.map((result, idx) => ({
            name: `${idx + 1}`,
            score: result.score,
            title: result.noteTitle,
            needsReview: result.score < 60,
        }))
    }, [noteResults])

    // 세션이 없으면 메인으로 리다이렉트
    useEffect(() => {
        if (!isActive && noteResults.length === 0) {
            navigate('/')
        }
    }, [isActive, noteResults.length, navigate])

    // 나가기
    const handleExit = () => {
        resetSession()
        navigate('/')
    }

    // 다시 학습
    const handleRetry = () => {
        const noteIds = [...selectedNoteIds]
        const currentMode = mode
        const currentOrder = order
        resetSession()
        startSession({ noteIds, mode: currentMode as StudyModeType, order: currentOrder })
        navigate('/study')
    }

    // 복습 필요 노트만 다시 학습
    const handleRetryWeak = () => {
        const weakNoteIds = needsReviewNotes.map((r) => r.noteId)
        const currentMode = mode
        const currentOrder = order
        resetSession()
        startSession({ noteIds: weakNoteIds, mode: currentMode as StudyModeType, order: currentOrder })
        navigate('/study')
    }

    // 소요 시간 포맷
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    }

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handleExit}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} exit
                    </button>

                    <span className="font-mono text-xs text-[var(--text-tertiary)] px-2 py-1 border border-[var(--border-light)]">
                        // session complete
                    </span>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[900px] mx-auto px-6 py-8">
                    {/* ======================== 대시보드 섹션 ======================== */}
                    <motion.section
                        className="mb-10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* 타이틀 */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className="font-mono text-[var(--accent)]">#</span>
                            <span className="font-mono text-base text-[var(--text-primary)]">Dashboard</span>
                        </div>

                        {/* 대시보드 그리드 */}
                        <div className="grid grid-cols-4 gap-4">
                            {/* 평균 점수 (메인) */}
                            <div className="col-span-2 p-6 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">// avg_score</div>
                                <div className="flex items-baseline gap-2">
                                    <span
                                        className={`font-score text-6xl font-light ${isPerfect ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}
                                    >
                                        {stats.averageScore}
                                    </span>
                                    <span className="font-score text-2xl text-[var(--text-tertiary)]">%</span>
                                </div>
                                <div className="mt-3">
                                    <ScoreMessage score={stats.averageScore} isPerfect={isPerfect} />
                                </div>
                            </div>

                            {/* 노트 수 */}
                            <div className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">// notes</div>
                                <div className="font-mono text-3xl text-[var(--accent)]">{noteResults.length}</div>
                            </div>

                            {/* 총 문제 수 */}
                            <div className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">// questions</div>
                                <div className="font-mono text-3xl text-[var(--accent)]">{stats.totalQuestions}</div>
                            </div>

                            {/* 정답/오답 */}
                            <div className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">// correct</div>
                                <div className="font-mono text-3xl text-[var(--success)]">{stats.totalCorrect}</div>
                            </div>

                            <div className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">// wrong</div>
                                <div className="font-mono text-3xl text-[var(--error)]">{stats.totalWrong}</div>
                            </div>

                            {/* 소요 시간 */}
                            <div className="col-span-2 p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">// duration</div>
                                <div className="font-mono text-3xl text-[var(--text-primary)]">
                                    {formatDuration(stats.totalDuration)}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* ======================== 그래프 섹션 ======================== */}
                    <motion.section
                        className="mb-10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        {/* 타이틀 */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[var(--accent)]">#</span>
                                <span className="font-mono text-base text-[var(--text-primary)]">Score Distribution</span>
                            </div>
                            <span className="font-mono text-xs text-[var(--text-tertiary)]">[{noteResults.length}]</span>
                        </div>

                        {/* 바 차트 */}
                        <div className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'D2Coding' }}
                                        axisLine={{ stroke: 'var(--border-light)' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'D2Coding' }}
                                        axisLine={{ stroke: 'var(--border-light)' }}
                                        tickLine={false}
                                        ticks={[0, 25, 50, 75, 100]}
                                    />
                                    <ReferenceLine
                                        y={60}
                                        stroke="var(--error)"
                                        strokeDasharray="4 4"
                                        strokeOpacity={0.5}
                                    />
                                    <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.score >= 80
                                                        ? 'var(--success)'
                                                        : entry.score >= 60
                                                          ? 'var(--warning)'
                                                          : 'var(--error)'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {/* 범례 */}
                            <div className="flex items-center justify-center gap-6 mt-2 font-mono text-xs text-[var(--text-tertiary)]">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-[var(--success)]" />
                                    80%+
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-[var(--warning)]" />
                                    60-79%
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-[var(--error)]" />
                                    {'<'}60%
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-6 border-t border-dashed border-[var(--error)]" />
                                    review line
                                </span>
                            </div>
                        </div>
                    </motion.section>

                    {/* ======================== 복습 필요 노트 섹션 ======================== */}
                    {needsReviewNotes.length > 0 && (
                        <motion.section
                            className="mb-10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            {/* 타이틀 */}
                            <div className="flex items-center gap-2 mb-4">
                                <IconAlertTriangle size={16} className="text-[var(--error)]" />
                                <span className="font-mono text-base text-[var(--error)]">Needs Review</span>
                                <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                    [{needsReviewNotes.length}]
                                </span>
                            </div>

                            {/* 복습 필요 노트 리스트 */}
                            <div className="border border-[var(--error)]/30 bg-[var(--error)]/5">
                                {needsReviewNotes.map((result, idx) => (
                                    <div
                                        key={result.noteId}
                                        className={`flex items-center gap-4 px-4 py-3 ${idx < needsReviewNotes.length - 1 ? 'border-b border-[var(--error)]/20' : ''}`}
                                    >
                                        <span className="font-mono text-sm text-[var(--error)]">!</span>
                                        <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">
                                            {result.noteTitle}
                                        </span>
                                        <span className="font-mono text-sm font-medium text-[var(--error)]">
                                            {result.score}%
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* 복습 버튼 */}
                            <button
                                onClick={handleRetryWeak}
                                className="mt-4 w-full py-3 px-4 font-mono text-sm border border-[var(--error)] text-[var(--error)] bg-transparent cursor-pointer transition-colors hover:bg-[var(--error)]/10 flex items-center justify-center gap-2"
                            >
                                <IconRefresh size={16} />
                                retry weak notes [{needsReviewNotes.length}]
                            </button>
                        </motion.section>
                    )}

                    {/* ======================== 전체 노트 리스트 섹션 ======================== */}
                    <motion.section
                        className="mb-10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 }}
                    >
                        {/* 타이틀 */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-light)]">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[var(--accent)]">#</span>
                                <span className="font-mono text-base text-[var(--text-primary)]">All Notes</span>
                            </div>
                            <span className="font-mono text-sm text-[var(--text-secondary)]">
                                [{noteResults.length}]
                            </span>
                        </div>

                        {/* 노트 리스트 */}
                        <div>
                            {noteResults.map((result, idx) => {
                                const isGood = result.score >= 80
                                const isWarning = result.score >= 60 && result.score < 80
                                const isBad = result.score < 60

                                return (
                                    <motion.div
                                        key={result.noteId}
                                        className={`py-3 ${idx < noteResults.length - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.15, delay: 0.3 + idx * 0.02 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* 번호 + 상태 */}
                                            <div className="flex items-center gap-2 shrink-0 w-12">
                                                <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <span
                                                    className={`font-mono text-sm ${isGood ? 'text-[var(--success)]' : isWarning ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}
                                                >
                                                    {isGood ? '✓' : isWarning ? '△' : '✗'}
                                                </span>
                                            </div>

                                            {/* 제목 */}
                                            <span
                                                className={`flex-1 font-mono text-sm truncate ${isBad ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}`}
                                            >
                                                {result.noteTitle}
                                            </span>

                                            {/* 정답/오답 */}
                                            <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-tertiary)]">
                                                <span className="text-[var(--success)]">+{result.correctCount}</span>
                                                <span className="text-[var(--error)]">-{result.wrongCount}</span>
                                            </div>

                                            {/* 점수 */}
                                            <span
                                                className={`font-mono text-sm font-medium w-12 text-right ${isGood ? 'text-[var(--success)]' : isWarning ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}
                                            >
                                                {result.score}%
                                            </span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.section>

                    {/* ======================== 액션 버튼 ======================== */}
                    <motion.section
                        className="pt-6 border-t border-[var(--border-light)]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.35 }}
                    >
                        <div className="flex gap-3">
                            <button
                                onClick={handleExit}
                                className="flex-1 py-3 px-4 font-mono text-base border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--text-tertiary)]"
                            >
                                :q exit
                            </button>
                            <button
                                onClick={handleRetry}
                                className="flex-1 py-3 px-4 bg-[var(--accent)] text-white font-mono text-base cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                            >
                                <IconRefresh size={18} />
                                retry all
                            </button>
                        </div>
                    </motion.section>
                </div>
            </main>
        </div>
    )
}
