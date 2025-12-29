/**
 * 학습 통계 대시보드 페이지
 * - 전체 학습 통계
 * - 기간별 학습 추이 그래프
 * - 노트별 성취도
 * - 복습 추천 노트
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { useRajdhaniFont } from '../hooks/useRajdhaniFont'
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
import { TodayStudySection } from '../features/StatisticsDashboard/TodayStudySection'
import { StudyStatisticsSection } from '../features/StatisticsDashboard/StudyStatisticsSection'
import { ModeStatisticsSection } from '../features/StatisticsDashboard/ModeStatisticsSection'
import { PeriodStudyChartSection } from '../features/StatisticsDashboard/PeriodStudyChartSection'
import { RecommandReviewSection } from '../features/StatisticsDashboard/RecommandReviewSection'
import { NoteAchievementChartSection } from '../features/StatisticsDashboard/NoteAchievementChartSection'
import { WeakPointSection } from '../features/StatisticsDashboard/WeakPointSection'
import { CurrentHistorySection } from '../features/StatisticsDashboard/CurrentHistorySection'

export function StatisticsDashboardPage() {
    const navigate = useNavigate()
    useRajdhaniFont() // Rajdhani 폰트 지연 로드

    // ================================ 상태 ================================
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null) // 전체 통계
    const [periodStats, setPeriodStats] = useState<PeriodStats[]>([]) // 기간별 통계
    const [noteStats, setNoteStats] = useState<NoteStats[]>([]) // 노트별 통계
    const [recommendedNotes, setRecommendedNotes] = useState<RecommendedNote[]>([]) // 추천 노트
    const [todayStats, setTodayStats] = useState<PeriodStats | null>(null) // 오늘의 통계
    const [noteTitles, setNoteTitles] = useState<Record<string, string>>({}) // 노트 제목
    const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(7) // 기간

    // 새로운 상태 - 모드별 통계, 취약점, 세션 히스토리
    const [modeStats, setModeStats] = useState<ModeStats[]>([])
    const [weakPointSummary, setWeakPointSummary] = useState<WeakPointSummary | null>(null) // 취약점 요약
    const [topWeakPoints, setTopWeakPoints] = useState<WeakPoint[]>([]) // 취약점 상위 5개
    const [recentSessions, setRecentSessions] = useState<SessionHistoryItem[]>([]) // 최근 세션 5개

    // ================================ 데이터 로드 ================================
    useEffect(() => {
        async function loadData() {
            try {
                const [overall, period, notes, recommended, today, modes, wpSummary, wpTop, sessions] =
                    await Promise.all([
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
                    ...wpTop.map((wp) => wp.noteId),
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

    // ================================ 핸들러 ================================
    const handleBack = () => {
        navigate('/')
    }

    // ================================ 유틸 ================================

    const hasData = overallStats && overallStats.totalSessions > 0

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="main-container px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="bg-transparent border-none px-2 md:px-4 py-2 md:py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-1.5 md:gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="font-display text-base md:text-lg text-[var(--text-primary)]">학습 통계</span>
                    </div>

                    <div className="w-12 md:w-24" />
                </div>
            </header>

            {/* Content */}
            <main className="main-container px-4 md:px-6 py-6 md:py-8">
                {!hasData ? (
                    // 데이터 없음 상태
                    <div className="flex flex-col items-center justify-center py-20">
                        <span className="font-mono text-6xl text-[var(--text-tertiary)] mb-4">∅</span>
                        <span className="font-mono text-lg text-[var(--text-secondary)] mb-2">// no data yet</span>
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
                        {/* 오늘의 학습 섹션 */}
                        <TodayStudySection todayStats={todayStats} />

                        {/* 전체 통계 대시보드 섹션 */}
                        <StudyStatisticsSection overallStats={overallStats} />

                        {/* 모드별 통계 섹션 */}
                        {modeStats.length > 0 && <ModeStatisticsSection modeStats={modeStats} />}

                        {/* 기간별 학습 추이 */}
                        <PeriodStudyChartSection
                            periodDays={periodDays}
                            setPeriodDays={setPeriodDays}
                            chartData={chartData}
                        />

                        {/* 복습 추천 노트 */}
                        {recommendedNotes.length > 0 && (
                            <RecommandReviewSection recommendedNotes={recommendedNotes} noteTitles={noteTitles} />
                        )}

                        {/* 노트별 성취도 */}
                        {noteStats.length > 0 && (
                            <NoteAchievementChartSection noteStats={noteStats} noteTitles={noteTitles} />
                        )}

                        {/* 취약점 요약 */}
                        {weakPointSummary && weakPointSummary.totalCount > 0 && (
                            <WeakPointSection
                                weakPointSummary={weakPointSummary}
                                topWeakPoints={topWeakPoints}
                                noteTitles={noteTitles}
                            />
                        )}

                        {/* 최근 세션 히스토리 */}
                        {recentSessions.length > 0 && (
                            <CurrentHistorySection recentSessions={recentSessions} />
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
