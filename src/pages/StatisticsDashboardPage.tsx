/**
 * 학습 통계 대시보드 페이지
 * - 전체 학습 통계
 * - 기간별 학습 추이 그래프
 * - 노트별 성취도
 * - 복습 추천 노트
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    IconArrowLeft,
    IconChecks,
    IconX,
    IconAlertTriangle,
    IconTrendingUp,
    IconRefresh,
    IconHistory,
    IconChevronRight,
} from '@tabler/icons-react'
import { WordModeIcon, SentenceModeIcon, EssayModeIcon } from '../components/icons/StudyModeIcons'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    LineChart,
    Line,
    Tooltip,
    Cell,
} from 'recharts'
import {
    getOverallStats,
    getPeriodStats,
    getAllNoteStats,
    getRecommendedNotes,
    getTodayStats,
    getAllModeStats,
    type OverallStats,
    type NoteStats,
    type PeriodStats,
    type RecommendedNote,
    type ModeStats,
} from '../db/study/statisticsService'
import { getWeakPointSummary, getTopWeakPoints } from '../db/study/weakPointService'
import { getSessionHistory } from '../db/study/studyService'
import type { WeakPoint } from '../db/schema/study'
import type { WeakPointSummary, SessionHistoryItem } from '../db/study/types'
import { findNoteById } from '../db/note/noteService'
import { useStudySessionStore } from '../stores/studySessionStore'
import { DashboardGrid } from '../components/common/DashboardGrid'
import { DashboardCard } from '../components/common/DashboardCard'
import { SectionTitle } from '../components/common/SectionTitle'
import type { StudyModeType } from '../features/Study/types'

// 추천 이유 라벨
const reasonLabels: Record<RecommendedNote['reason'], string> = {
    has_weak_points: '취약점 있음',
    low_accuracy: '낮은 정답률',
    not_studied_recently: '오래 안함',
    never_studied: '미학습',
}

// 추천 이유 아이콘 색상
const reasonColors: Record<RecommendedNote['reason'], string> = {
    has_weak_points: 'text-[var(--error)]',
    low_accuracy: 'text-[var(--warning)]',
    not_studied_recently: 'text-[var(--text-tertiary)]',
    never_studied: 'text-[var(--accent)]',
}

// 모드별 아이콘 및 라벨
const modeConfig: Record<StudyModeType, { icon: React.ReactNode; label: string; color: string }> = {
    word: { icon: <WordModeIcon size={16} />, label: '단어', color: 'text-blue-500' },
    sentence: { icon: <SentenceModeIcon size={16} />, label: '문장', color: 'text-green-500' },
    essay: { icon: <EssayModeIcon size={16} />, label: '서술형', color: 'text-purple-500' },
}

export function StatisticsDashboardPage() {
    const navigate = useNavigate()
    const startSession  = useStudySessionStore((state) => state.startSession)

    // ================================ 상태 ================================
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
    const [periodStats, setPeriodStats] = useState<PeriodStats[]>([])
    const [noteStats, setNoteStats] = useState<NoteStats[]>([])
    const [recommendedNotes, setRecommendedNotes] = useState<RecommendedNote[]>([])
    const [todayStats, setTodayStats] = useState<PeriodStats | null>(null)
    const [noteTitles, setNoteTitles] = useState<Record<string, string>>({})
    const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(7)

    // 새로운 상태 - 모드별 통계, 취약점, 세션 히스토리
    const [modeStats, setModeStats] = useState<ModeStats[]>([])
    const [weakPointSummary, setWeakPointSummary] = useState<WeakPointSummary | null>(null)
    const [topWeakPoints, setTopWeakPoints] = useState<WeakPoint[]>([])
    const [recentSessions, setRecentSessions] = useState<SessionHistoryItem[]>([])

    // ================================ 데이터 로드 ================================
    useEffect(() => {
        async function loadData() {
            try {
                const [overall, period, notes, recommended, today, modes, wpSummary, wpTop, sessions] = await Promise.all([
                    getOverallStats(),
                    getPeriodStats(periodDays),
                    getAllNoteStats(),
                    getRecommendedNotes(5),
                    getTodayStats(),
                    getAllModeStats(),
                    getWeakPointSummary(),
                    getTopWeakPoints(5),
                    getSessionHistory({ limit: 5 }),
                ])

                setOverallStats(overall)
                setPeriodStats(period)
                setNoteStats(notes)
                setRecommendedNotes(recommended)
                setTodayStats(today)
                setModeStats(modes)
                setWeakPointSummary(wpSummary)
                setTopWeakPoints(wpTop)
                setRecentSessions(sessions)

                // 노트 제목 로드
                const allNoteIds = new Set([
                    ...notes.map((n) => n.noteId),
                    ...recommended.map((r) => r.noteId),
                ])

                const titles: Record<string, string> = {}
                for (const noteId of allNoteIds) {
                    const note = await findNoteById(noteId)
                    if (note) {
                        titles[noteId] = note.title
                    }
                }
                setNoteTitles(titles)
            } catch (err) {
                console.error('Failed to load statistics:', err)
            }
        }

        loadData()
    }, [periodDays])

    // ================================ 계산된 값 ================================
    // 차트 데이터 - 날짜 축약
    const chartData = useMemo(() => {
        return periodStats.map((stat) => ({
            ...stat,
            dateLabel: stat.date.slice(5), // MM-DD
        }))
    }, [periodStats])

    // 노트별 정답률 차트 데이터 (상위 10개)
    const noteChartData = useMemo(() => {
        return noteStats
            .slice(0, 10)
            .map((stat) => ({
                noteId: stat.noteId,
                name: noteTitles[stat.noteId]?.slice(0, 8) || stat.noteId.slice(0, 8),
                accuracy: stat.accuracy,
                studyCount: stat.studyCount,
            }))
    }, [noteStats, noteTitles])

    // ================================ 핸들러 ================================
    const handleBack = () => {
        navigate('/')
    }

    // 추천 노트로 학습 시작
    const handleStudyRecommended = (noteId: string) => {
        startSession({
            noteIds: [noteId],
            mode: 'word' as StudyModeType,
            order: 'sequential',
        })
        navigate('/study')
    }

    // 추천 노트 전체 학습
    const handleStudyAllRecommended = () => {
        if (recommendedNotes.length === 0) return
        startSession({
            noteIds: recommendedNotes.map((r) => r.noteId),
            mode: 'word' as StudyModeType,
            order: 'sequential',
        })
        navigate('/study')
    }

    // ================================ 유틸 ================================
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return '오늘'
        if (diffDays === 1) return '어제'
        if (diffDays < 7) return `${diffDays}일 전`
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }

    const hasData = overallStats && overallStats.totalSessions > 0

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="main-container px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="font-mono text-lg text-[var(--text-primary)]">학습 통계</span>
                    </div>

                    <div className="w-24" />
                </div>
            </header>

            {/* Content */}
            <main className="main-container px-6 py-8">
                {!hasData ? (
                    // 데이터 없음 상태
                    <div className="flex flex-col items-center justify-center py-20">
                        <span className="font-mono text-6xl text-[var(--text-tertiary)] mb-4">∅</span>
                        <span className="font-mono text-lg text-[var(--text-secondary)] mb-2">
                            // no data yet
                        </span>
                        <span className="font-mono text-sm text-[var(--text-secondary)] mb-6">
                            학습을 시작하면 통계가 기록됩니다
                        </span>
                        <button
                            onClick={() => navigate('/study/setup')}
                            className="px-6 py-3 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer transition-opacity hover:opacity-90"
                        >
                            학습 시작하기 →
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ======================== 오늘의 학습 ======================== */}
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
                                    <div className="font-mono text-2xl text-[var(--text-primary)]">
                                        {todayStats?.sessionCount || 0}
                                    </div>
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

                        {/* ======================== 전체 통계 대시보드 ======================== */}
                        <motion.section
                            className="mb-10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 }}
                        >
                            <SectionTitle className="mb-4">전체 통계</SectionTitle>

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
                                    <div className="font-mono text-2xl text-[var(--text-primary)]">
                                        {overallStats!.totalSessions}
                                    </div>
                                </DashboardCard>

                                {/* 학습한 노트 */}
                                <DashboardCard label="학습한 노트">
                                    <div className="font-mono text-2xl text-[var(--accent)]">
                                        {overallStats!.studiedNoteCount}
                                    </div>
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

                        {/* ======================== 모드별 통계 ======================== */}
                        {modeStats.length > 0 && (
                            <motion.section
                                className="mb-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.08 }}
                            >
                                <SectionTitle className="mb-4">모드별 통계</SectionTitle>

                                <div className="grid grid-cols-3 gap-4">
                                    {modeStats.map((stat) => {
                                        const config = modeConfig[stat.mode]
                                        const hasData = stat.totalSessions > 0

                                        return (
                                            <div
                                                key={stat.mode}
                                                className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={config.color}>{config.icon}</span>
                                                    <span className="font-mono text-sm text-[var(--text-primary)]">
                                                        {config.label}
                                                    </span>
                                                </div>

                                                {hasData ? (
                                                    <>
                                                        <div className="flex items-baseline gap-1 mb-2">
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
                                                    <div className="font-mono text-sm text-[var(--text-tertiary)]">
                                                        // no data
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.section>
                        )}

                        {/* ======================== 기간별 학습 추이 ======================== */}
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

                            <div className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                                {/* 정답률 추이 */}
                                <div className="mb-6">
                                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">
                                        // 정답률 추이
                                    </div>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                            <XAxis
                                                dataKey="dateLabel"
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'D2Coding' }}
                                                axisLine={{ stroke: 'var(--border-light)' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={[0, 100]}
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'D2Coding' }}
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
                                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">
                                        // 일별 문제 풀이
                                    </div>
                                    <ResponsiveContainer width="100%" height={100}>
                                        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                            <XAxis
                                                dataKey="dateLabel"
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'D2Coding' }}
                                                axisLine={{ stroke: 'var(--border-light)' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'D2Coding' }}
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

                        {/* ======================== 복습 추천 노트 ======================== */}
                        {recommendedNotes.length > 0 && (
                            <motion.section
                                className="mb-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.15 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <IconAlertTriangle size={16} className="text-[var(--warning)]" />
                                        <span className="font-mono text-base text-[var(--text-primary)]">
                                            복습 추천
                                        </span>
                                        <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                            [{recommendedNotes.length}]
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleStudyAllRecommended}
                                        className="px-3 py-1.5 font-mono text-xs border border-[var(--accent)] text-[var(--accent)] cursor-pointer transition-colors hover:bg-[var(--accent)]/10 flex items-center gap-1.5"
                                    >
                                        <IconRefresh size={14} />
                                        study all
                                    </button>
                                </div>

                                <div className="border border-[var(--warning)]/30 bg-[var(--warning)]/5">
                                    {recommendedNotes.map((rec, idx) => (
                                        <div
                                            key={rec.noteId}
                                            className={`flex items-center gap-4 px-4 py-3 ${idx < recommendedNotes.length - 1 ? 'border-b border-[var(--warning)]/20' : ''}`}
                                        >
                                            {/* 우선순위 */}
                                            <span className="font-mono text-xs text-[var(--text-tertiary)] w-6">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>

                                            {/* 이유 태그 */}
                                            <span
                                                className={`font-mono text-[10px] px-1.5 py-0.5 border border-current ${reasonColors[rec.reason]}`}
                                            >
                                                {reasonLabels[rec.reason]}
                                            </span>

                                            {/* 노트 제목 */}
                                            <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">
                                                {noteTitles[rec.noteId] || rec.noteId}
                                            </span>

                                            {/* 추가 정보 */}
                                            {rec.accuracy !== undefined && (
                                                <span className="font-mono text-xs text-[var(--error)]">
                                                    {rec.accuracy}%
                                                </span>
                                            )}
                                            {rec.weakPointCount !== undefined && (
                                                <span className="font-mono text-xs text-[var(--error)]">
                                                    {rec.weakPointCount} weak
                                                </span>
                                            )}
                                            {rec.lastStudiedAt && (
                                                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                    {formatDate(rec.lastStudiedAt)}
                                                </span>
                                            )}

                                            {/* 학습 버튼 */}
                                            <button
                                                onClick={() => handleStudyRecommended(rec.noteId)}
                                                className="px-2 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                            >
                                                study →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* ======================== 노트별 성취도 ======================== */}
                        {noteStats.length > 0 && (
                            <motion.section
                                className="mb-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <SectionTitle>노트별 성취도</SectionTitle>
                                    <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                        [{noteStats.length}]
                                    </span>
                                </div>

                                {/* 정답률 차트 */}
                                {noteChartData.length > 0 && (
                                    <div className="p-4 border border-[var(--border-light)] bg-[var(--bg-paper)] mb-4">
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
                                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'D2Coding' }}
                                                    axisLine={{ stroke: 'var(--border-light)' }}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'D2Coding' }}
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

                                {/* 노트 리스트 */}
                                <div className="border border-[var(--border-light)]">
                                    {/* 헤더 */}
                                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[var(--bg-secondary)] font-mono text-xs text-[var(--text-tertiary)] border-b border-[var(--border-light)]">
                                        <div className="col-span-5">노트</div>
                                        <div className="col-span-2 text-center">학습 횟수</div>
                                        <div className="col-span-2 text-center">정답률</div>
                                        <div className="col-span-3 text-right">마지막 학습</div>
                                    </div>

                                    {/* 리스트 */}
                                    {noteStats.slice(0, 20).map((stat, idx) => {
                                        const isGood = stat.accuracy >= 80
                                        const isWarning = stat.accuracy >= 60 && stat.accuracy < 80
                                        const isBad = stat.accuracy < 60

                                        return (
                                            <div
                                                key={stat.noteId}
                                                className={`grid grid-cols-12 gap-2 px-4 py-2.5 ${idx < Math.min(noteStats.length, 20) - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''}`}
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

                                {noteStats.length > 20 && (
                                    <div className="text-center py-2 font-mono text-xs text-[var(--text-tertiary)]">
                                        // +{noteStats.length - 20} more notes
                                    </div>
                                )}
                            </motion.section>
                        )}

                        {/* ======================== 취약점 요약 ======================== */}
                        {weakPointSummary && weakPointSummary.unresolvedCount > 0 && (
                            <motion.section
                                className="mb-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.25 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <IconAlertTriangle size={16} className="text-[var(--error)]" />
                                        <span className="font-mono text-base text-[var(--text-primary)]">
                                            취약점
                                        </span>
                                        <span className="font-mono text-sm text-[var(--error)]">
                                            [{weakPointSummary.unresolvedCount}]
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => navigate('/study/weak-points')}
                                        className="px-3 py-1.5 font-mono text-xs border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center gap-1"
                                    >
                                        전체 보기
                                        <IconChevronRight size={14} />
                                    </button>
                                </div>

                                {/* 모드별 취약점 요약 */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {(['word', 'sentence', 'essay'] as const).map((mode) => {
                                        const config = modeConfig[mode]
                                        const count = weakPointSummary.byMode[mode]

                                        return (
                                            <div
                                                key={mode}
                                                className="p-3 border border-[var(--border-light)] bg-[var(--bg-paper)] flex items-center gap-3"
                                            >
                                                <span className={config.color}>{config.icon}</span>
                                                <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                    {config.label}
                                                </span>
                                                <span className={`ml-auto font-mono text-lg ${count > 0 ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'}`}>
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
                                            const displayContent = wp.mode === 'word'
                                                ? wp.keyword
                                                : wp.mode === 'sentence'
                                                    ? wp.question?.slice(0, 50)
                                                    : wp.question?.slice(0, 50)

                                            return (
                                                <div
                                                    key={wp.id}
                                                    className={`flex items-center gap-3 px-4 py-2.5 ${idx < topWeakPoints.length - 1 ? 'border-b border-[var(--error)]/20' : ''}`}
                                                >
                                                    <span className={config.color}>{config.icon}</span>
                                                    <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">
                                                        {displayContent || '(내용 없음)'}
                                                    </span>
                                                    <span className="font-mono text-xs text-[var(--error)]">
                                                        {wp.wrongCount}회 오답
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </motion.section>
                        )}

                        {/* ======================== 최근 세션 히스토리 ======================== */}
                        {recentSessions.length > 0 && (
                            <motion.section
                                className="mb-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <IconHistory size={16} className="text-[var(--text-tertiary)]" />
                                        <span className="font-mono text-base text-[var(--text-primary)]">
                                            최근 학습
                                        </span>
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
                                        const accuracy = session.totalQuestions > 0
                                            ? Math.round((session.correctCount / session.totalQuestions) * 100)
                                            : 0

                                        return (
                                            <div
                                                key={session.id}
                                                className={`flex items-center gap-4 px-4 py-3 ${idx < recentSessions.length - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''}`}
                                            >
                                                {/* 모드 아이콘 */}
                                                <span className={config.color}>{config.icon}</span>

                                                {/* 모드 라벨 */}
                                                <span className="font-mono text-xs text-[var(--text-tertiary)] w-12">
                                                    {config.label}
                                                </span>

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

                                                {/* 시간 */}
                                                <span className="ml-auto font-mono text-xs text-[var(--text-tertiary)]">
                                                    {formatDate(session.startedAt)}
                                                </span>

                                                {/* 소요 시간 */}
                                                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                    {formatDuration(session.totalDuration)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.section>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
