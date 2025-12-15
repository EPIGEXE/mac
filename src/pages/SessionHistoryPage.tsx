/**
 * 세션 히스토리 페이지
 * - 세션 정보와 학습 기록을 한눈에 표시
 * - 모드별 필터
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    IconArrowLeft,
    IconHistory,
    IconClock,
    IconChecks,
    IconX,
    IconChevronLeft,
    IconChevronRight,
    IconCalendar,
    IconBook,
} from '@tabler/icons-react'
import { WordModeIcon, SentenceModeIcon, EssayModeIcon } from '../components/icons/StudyModeIcons'
import { getSessionHistory, getStudyRecordsBySession } from '../db/study/studyService'
import { findNoteById } from '../db/note/noteService'
import type { StudyModeType, StudyRecord } from '../db/schema/study'
import type { SessionHistoryItem } from '../db/study/types'

// 모드별 설정
const modeConfig: Record<StudyModeType, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
    word: { icon: <WordModeIcon size={16} />, label: '단어', color: 'text-blue-500', bgColor: 'bg-blue-500' },
    sentence: { icon: <SentenceModeIcon size={16} />, label: '문장', color: 'text-green-500', bgColor: 'bg-green-500' },
    essay: { icon: <EssayModeIcon size={16} />, label: '서술형', color: 'text-purple-500', bgColor: 'bg-purple-500' },
}

// 요일 라벨
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function SessionHistoryPage() {
    const navigate = useNavigate()

    // 상태
    const [sessions, setSessions] = useState<SessionHistoryItem[]>([])
    const [selectedMode, setSelectedMode] = useState<StudyModeType | 'all'>('all')
    const [loading, setLoading] = useState(true)

    // 세션별 학습 기록 캐시
    const [sessionRecords, setSessionRecords] = useState<Record<string, StudyRecord[]>>({})

    // 노트 제목 캐시
    const [noteTitles, setNoteTitles] = useState<Record<string, string>>({})

    // 캘린더 상태
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    const [selectedDate, setSelectedDate] = useState<string | null>(() => {
        return new Date().toISOString().split('T')[0]
    })

    // 데이터 로드
    useEffect(() => {
        loadData()
    }, [selectedMode])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getSessionHistory({
                mode: selectedMode === 'all' ? undefined : selectedMode,
                limit: 500,
            })
            setSessions(data)

            // 모든 세션의 학습 기록을 로드
            await loadAllSessionRecords(data)
        } catch (err) {
            console.error('Failed to load session history:', err)
        } finally {
            setLoading(false)
        }
    }

    // 모든 세션의 학습 기록 로드
    const loadAllSessionRecords = async (sessionList: SessionHistoryItem[]) => {
        const newRecords: Record<string, StudyRecord[]> = {}
        const allNoteIds = new Set<string>()

        for (const session of sessionList) {
            try {
                const records = await getStudyRecordsBySession(session.id)
                newRecords[session.id] = records
                records.forEach(r => allNoteIds.add(r.noteId))
            } catch (err) {
                console.error(`Failed to load records for session ${session.id}:`, err)
                newRecords[session.id] = []
            }
        }

        setSessionRecords(newRecords)

        // 노트 제목 로드
        const titles: Record<string, string> = {}
        for (const noteId of allNoteIds) {
            try {
                const note = await findNoteById(noteId)
                if (note) {
                    titles[noteId] = note.title
                }
            } catch {
                // ignore
            }
        }
        setNoteTitles(titles)
    }

    // 날짜별 세션 그룹화
    const sessionsByDate = useMemo(() => {
        const grouped: Record<string, SessionHistoryItem[]> = {}
        sessions.forEach(session => {
            const dateStr = new Date(session.startedAt).toISOString().split('T')[0]
            if (!grouped[dateStr]) {
                grouped[dateStr] = []
            }
            grouped[dateStr].push(session)
        })
        return grouped
    }, [sessions])

    // 날짜별 통계 (캘린더 표시용)
    const dateStats = useMemo(() => {
        const stats: Record<string, { count: number; accuracy: number; modes: Set<StudyModeType> }> = {}
        Object.entries(sessionsByDate).forEach(([date, daySessions]) => {
            const totalCorrect = daySessions.reduce((sum, s) => sum + s.correctCount, 0)
            const totalQuestions = daySessions.reduce((sum, s) => sum + s.totalQuestions, 0)
            const modes = new Set<StudyModeType>(daySessions.map(s => s.mode))
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

    // 월 이동
    const goToPrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const goToToday = () => {
        const now = new Date()
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
        setSelectedDate(now.toISOString().split('T')[0])
    }

    // 선택된 날짜의 세션들
    const selectedDateSessions = selectedDate ? sessionsByDate[selectedDate] || [] : []

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hours > 0) {
            return `${hours}시간 ${mins}분`
        }
        if (mins > 0) {
            return `${mins}분 ${secs}초`
        }
        return `${secs}초`
    }

    const formatSelectedDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
        })
    }

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="main-container px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/statistics')}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    <div className="flex items-center gap-3">
                        <IconHistory size={20} className="text-[var(--text-tertiary)]" />
                        <span className="font-mono text-lg text-[var(--text-primary)]">학습 기록</span>
                        <span className="font-mono text-sm text-[var(--text-tertiary)]">
                            [{sessions.length}]
                        </span>
                    </div>

                    <div className="w-24" />
                </div>
            </header>

            {/* Content */}
            <main className="main-container px-6 py-8">
                {/* 필터 */}
                <div className="flex items-center gap-2 mb-6">
                    <button
                        onClick={() => setSelectedMode('all')}
                        className={`px-3 py-1.5 font-mono text-xs border cursor-pointer transition-colors ${
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
                                className={`px-3 py-1.5 font-mono text-xs border cursor-pointer transition-colors flex items-center gap-1.5 ${
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

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="font-mono text-sm text-[var(--text-tertiary)]">loading...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                        {/* 캘린더 (왼쪽) */}
                        <div className="border border-[var(--border-light)] bg-[var(--bg-paper)] p-4 h-fit lg:sticky lg:top-24">
                            {/* 캘린더 헤더 */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={goToPrevMonth}
                                    className="p-1.5 border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                                >
                                    <IconChevronLeft size={14} />
                                </button>

                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-[var(--text-primary)]">
                                        {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                                    </span>
                                    <button
                                        onClick={goToToday}
                                        className="px-1.5 py-0.5 font-mono text-[10px] border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                                    >
                                        오늘
                                    </button>
                                </div>

                                <button
                                    onClick={goToNextMonth}
                                    className="p-1.5 border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                                >
                                    <IconChevronRight size={14} />
                                </button>
                            </div>

                            {/* 요일 헤더 */}
                            <div className="grid grid-cols-7 mb-1">
                                {WEEKDAYS.map((day, i) => (
                                    <div
                                        key={day}
                                        className={`text-center font-mono text-[10px] py-1 ${
                                            i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[var(--text-tertiary)]'
                                        }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* 날짜 그리드 */}
                            <div className="grid grid-cols-7 gap-0.5">
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
                                                relative p-1 min-h-[40px] border cursor-pointer transition-all text-left
                                                ${isCurrentMonth ? 'bg-[var(--bg-paper)]' : 'bg-[var(--bg-primary)]/50'}
                                                ${isSelected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-transparent hover:border-[var(--border-light)]'}
                                                ${isToday ? 'bg-[var(--accent)]/5' : ''}
                                            `}
                                        >
                                            {/* 날짜 숫자 */}
                                            <div className={`
                                                font-mono text-xs
                                                ${!isCurrentMonth ? 'text-[var(--text-tertiary)]/50' :
                                                    dayOfWeek === 0 ? 'text-red-400' :
                                                    dayOfWeek === 6 ? 'text-blue-400' :
                                                    'text-[var(--text-primary)]'}
                                                ${isToday ? 'font-bold' : ''}
                                            `}>
                                                {date.getDate()}
                                            </div>

                                            {/* 학습 표시 */}
                                            {stat && isCurrentMonth && (
                                                <div className="flex gap-0.5 mt-0.5">
                                                    {Array.from(stat.modes).map(mode => (
                                                        <div
                                                            key={mode}
                                                            className={`w-1.5 h-1.5 rounded-full ${modeConfig[mode].bgColor}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* 범례 */}
                            <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-dashed border-[var(--border-light)]">
                                {(['word', 'sentence', 'essay'] as const).map(mode => (
                                    <div key={mode} className="flex items-center gap-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${modeConfig[mode].bgColor}`} />
                                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                            {modeConfig[mode].label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 세션 및 학습 기록 (오른쪽) */}
                        <div className="space-y-6">
                            {selectedDate ? (
                                <>
                                    {/* 날짜 헤더 */}
                                    <div className="flex items-center gap-3">
                                        <IconCalendar size={18} className="text-[var(--text-tertiary)]" />
                                        <span className="font-mono text-base text-[var(--text-primary)]">
                                            {formatSelectedDate(selectedDate)}
                                        </span>
                                        {selectedDateSessions.length > 0 && (
                                            <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                                [{selectedDateSessions.length}개 세션]
                                            </span>
                                        )}
                                    </div>

                                    {selectedDateSessions.length === 0 ? (
                                        <div className="border border-[var(--border-light)] bg-[var(--bg-paper)] p-12 text-center">
                                            <span className="font-mono text-3xl text-[var(--text-tertiary)] block mb-2">∅</span>
                                            <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                                이 날짜에는 학습 기록이 없습니다
                                            </span>
                                        </div>
                                    ) : (
                                        // 각 세션을 카드로 표시
                                        selectedDateSessions.map((session, sessionIdx) => {
                                            const config = modeConfig[session.mode]
                                            const accuracy = session.totalQuestions > 0
                                                ? Math.round((session.correctCount / session.totalQuestions) * 100)
                                                : 0
                                            const records = sessionRecords[session.id] || []

                                            return (
                                                <motion.div
                                                    key={session.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: sessionIdx * 0.05 }}
                                                    className="border border-[var(--border-light)] bg-[var(--bg-paper)]"
                                                >
                                                    {/* 세션 헤더 */}
                                                    <div className="px-5 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            {/* 모드 */}
                                                            <div className="flex items-center gap-2">
                                                                <span className={config.color}>{config.icon}</span>
                                                                <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                                                                    {config.label} 모드
                                                                </span>
                                                            </div>

                                                            {/* 순서 */}
                                                            <span className="font-mono text-xs text-[var(--text-tertiary)] px-2 py-0.5 border border-[var(--border-light)]">
                                                                {session.order === 'sequential' ? '순차 학습' : '랜덤 학습'}
                                                            </span>

                                                            {/* 시간 */}
                                                            <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                                {formatTime(session.startedAt)}
                                                            </span>

                                                            {/* 소요 시간 */}
                                                            <span className="font-mono text-sm text-[var(--text-secondary)] flex items-center gap-1">
                                                                <IconClock size={14} />
                                                                {formatDuration(session.totalDuration)}
                                                            </span>

                                                            {/* 통계 */}
                                                            <div className="flex items-center gap-3 ml-auto">
                                                                <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                                    {session.noteCount}개 노트
                                                                </span>
                                                                <span className="font-mono text-sm text-[var(--success)] flex items-center gap-1">
                                                                    <IconChecks size={14} />
                                                                    {session.correctCount}
                                                                </span>
                                                                <span className="font-mono text-sm text-[var(--error)] flex items-center gap-1">
                                                                    <IconX size={14} />
                                                                    {session.wrongCount}
                                                                </span>
                                                                <span className={`font-mono text-lg font-bold ${
                                                                    accuracy >= 80 ? 'text-[var(--success)]' :
                                                                    accuracy >= 60 ? 'text-[var(--warning)]' :
                                                                    'text-[var(--error)]'
                                                                }`}>
                                                                    {accuracy}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 학습 기록 테이블 */}
                                                    {records.length > 0 ? (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="border-b border-[var(--border-light)] bg-[var(--bg-primary)]/50">
                                                                        <th className="px-4 py-2 text-left font-mono text-xs text-[var(--text-tertiary)] font-normal">
                                                                            노트
                                                                        </th>
                                                                        <th className="px-4 py-2 text-center font-mono text-xs text-[var(--text-tertiary)] font-normal w-20">
                                                                            모드
                                                                        </th>
                                                                        <th className="px-4 py-2 text-center font-mono text-xs text-[var(--text-tertiary)] font-normal w-24">
                                                                            문제 수
                                                                        </th>
                                                                        <th className="px-4 py-2 text-center font-mono text-xs text-[var(--text-tertiary)] font-normal w-20">
                                                                            정답
                                                                        </th>
                                                                        <th className="px-4 py-2 text-center font-mono text-xs text-[var(--text-tertiary)] font-normal w-20">
                                                                            오답
                                                                        </th>
                                                                        <th className="px-4 py-2 text-center font-mono text-xs text-[var(--text-tertiary)] font-normal w-20">
                                                                            점수
                                                                        </th>
                                                                        <th className="px-4 py-2 text-right font-mono text-xs text-[var(--text-tertiary)] font-normal w-24">
                                                                            소요 시간
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {records.map((record, recordIdx) => {
                                                                        const recordConfig = modeConfig[record.mode]

                                                                        return (
                                                                            <tr
                                                                                key={record.id}
                                                                                className={`
                                                                                    hover:bg-[var(--bg-primary)]/30 transition-colors
                                                                                    ${recordIdx < records.length - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''}
                                                                                `}
                                                                            >
                                                                                <td className="px-4 py-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <IconBook size={14} className="text-[var(--text-tertiary)] flex-shrink-0" />
                                                                                        <span className="font-mono text-sm text-[var(--text-primary)] truncate max-w-[300px]">
                                                                                            {noteTitles[record.noteId] || record.noteId}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <span className={`${recordConfig.color} inline-flex items-center gap-1`}>
                                                                                        {recordConfig.icon}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                                                        {record.totalQuestions}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <span className="font-mono text-sm text-[var(--success)]">
                                                                                        {record.correctCount}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <span className="font-mono text-sm text-[var(--error)]">
                                                                                        {record.wrongCount}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <span className={`font-mono text-sm font-medium ${
                                                                                        record.score >= 80 ? 'text-[var(--success)]' :
                                                                                        record.score >= 60 ? 'text-[var(--warning)]' :
                                                                                        'text-[var(--error)]'
                                                                                    }`}>
                                                                                        {record.score}점
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-right">
                                                                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                                                        {formatDuration(record.duration)}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="px-5 py-6 text-center">
                                                            <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                                                상세 학습 기록이 없습니다
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )
                                        })
                                    )}
                                </>
                            ) : (
                                <div className="border border-[var(--border-light)] bg-[var(--bg-paper)] p-16 text-center">
                                    <IconCalendar size={40} className="text-[var(--text-tertiary)] mx-auto mb-4" />
                                    <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                        캘린더에서 날짜를 선택하세요
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
