import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { modeConfig } from '../StatisticsDashboard/const'
import { useMemo, useState } from 'react'
import type { StudyModeType } from '../Study/types'
import type { SessionHistoryItem } from '../../db/study/types'

// 요일 라벨
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface SessionCalendarProps {
    sessionsByDate: Record<string, SessionHistoryItem[]>
    selectedDate: string | null
    setSelectedDate: (date: string) => void
    selectedMode: StudyModeType | 'all'
    setSelectedMode: (mode: StudyModeType | 'all') => void
}

export function SessionCalendar({
    sessionsByDate,
    selectedDate,
    setSelectedDate,
    selectedMode,
    setSelectedMode,
}: SessionCalendarProps) {
    // 캘린더 상태
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })

    // 날짜별 통계 (캘린더 표시용)
    const dateStats = useMemo(() => {
        const stats: Record<string, { count: number; accuracy: number; modes: Set<StudyModeType> }> = {}
        Object.entries(sessionsByDate).forEach(([date, daySessions]) => {
            const totalCorrect = daySessions.reduce((sum, s) => sum + s.correctCount, 0)
            const totalQuestions = daySessions.reduce((sum, s) => sum + s.totalQuestions, 0)
            const modes = new Set<StudyModeType>(daySessions.map((s) => s.mode))
            stats[date] = {
                count: daySessions.length,
                accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
                modes,
            }
        })
        return stats
    }, [sessionsByDate])

    // 캘린더 날짜 생성
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const days: { date: Date; isCurrentMonth: boolean }[] = []

        // 이전 달 날짜 (첫째 주 채우기)
        const firstDayOfWeek = firstDay.getDay()
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i)
            days.push({ date, isCurrentMonth: false })
        }

        // 현재 달 날짜
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({ date: new Date(year, month, d), isCurrentMonth: true })
        }

        // 다음 달 날짜 (마지막 주 채우기)
        const remainingDays = 42 - days.length // 6주 표시
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
        }

        return days
    }, [currentMonth])

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    // 월 이동
    const goToPrevMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const goToToday = () => {
        const now = new Date()
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
        setSelectedDate(now.toISOString().split('T')[0])
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* 필터 */}
            <div className="border border-[var(--border-light)] bg-[var(--bg-paper)] p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedMode('all')}
                        className={`px-2 md:px-3 py-1.5 font-mono text-xs border cursor-pointer transition-colors ${
                            selectedMode === 'all'
                                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                                : 'border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]'
                        }`}
                    >
                        전체
                    </button>
                    {(['word', 'sentence', 'essay'] as const).map((mode) => {
                        const config = modeConfig[mode]
                        return (
                            <button
                                key={mode}
                                onClick={() => setSelectedMode(mode)}
                                className={`px-2 md:px-3 py-1.5 font-mono text-xs border cursor-pointer transition-colors flex items-center gap-1 md:gap-1.5 ${
                                    selectedMode === mode
                                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                                        : 'border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]'
                                }`}
                            >
                                {config.icon}
                                {config.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 캘린더 */}
            <div className="border border-[var(--border-light)] bg-[var(--bg-paper)] p-3 md:p-5 lg:sticky lg:top-24">
                {/* 캘린더 헤더 */}
                <div className="flex items-center justify-between mb-4 md:mb-5">
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                        aria-label="이전 달"
                    >
                        <IconChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-medium text-[var(--text-primary)]">
                            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                        </span>
                        <button
                            onClick={goToToday}
                            className="px-2 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                        >
                            오늘
                        </button>
                    </div>

                    <button
                        onClick={goToNextMonth}
                        className="p-2 border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                        aria-label="다음 달"
                    >
                        <IconChevronRight size={16} />
                    </button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 mb-2">
                    {WEEKDAYS.map((day, i) => (
                        <div
                            key={day}
                            className={`text-center font-mono text-xs py-1.5 ${
                                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[var(--text-tertiary)]'
                            }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                        const dateStr = date.toISOString().split('T')[0]
                        const stat = dateStats[dateStr]
                        const isToday = dateStr === today
                        const isSelected = dateStr === selectedDate
                        const dayOfWeek = date.getDay()

                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`
                                                relative p-1.5 md:p-2 min-h-[44px] md:min-h-[52px] border cursor-pointer transition-all text-left rounded-sm
                                                ${isCurrentMonth ? 'bg-[var(--bg-paper)]' : 'bg-[var(--bg-primary)]/50'}
                                                ${isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 shadow-sm' : 'border-transparent hover:border-[var(--border-light)]'}
                                                ${isToday ? 'bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20' : ''}
                                            `}
                            >
                                {/* 날짜 숫자 */}
                                <div
                                    className={`
                                                font-mono text-sm
                                                ${
                                                    !isCurrentMonth
                                                        ? 'text-[var(--text-tertiary)]/50'
                                                        : dayOfWeek === 0
                                                          ? 'text-red-400'
                                                          : dayOfWeek === 6
                                                            ? 'text-blue-400'
                                                            : 'text-[var(--text-primary)]'
                                                }
                                                ${isToday ? 'font-bold' : ''}
                                            `}
                                >
                                    {date.getDate()}
                                </div>

                                {/* 학습 표시 */}
                                {stat && isCurrentMonth && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {Array.from(stat.modes).map((mode) => (
                                            <div
                                                key={mode}
                                                className={`w-2 h-2 rounded-full ${modeConfig[mode].bgColor}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* 범례 */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-dashed border-[var(--border-light)]">
                    {(['word', 'sentence', 'essay'] as const).map((mode) => (
                        <div key={mode} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${modeConfig[mode].bgColor}`} />
                            <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                {modeConfig[mode].label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
