/**
 * 세션 히스토리 페이지
 * - 월별 캘린더 뷰로 학습 날짜 시각화
 * - 날짜 선택 시 해당 날짜 세션 상세
 * - 모드별 필터
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    IconArrowLeft,
    IconHistory,
    IconClock,
    IconChecks,
    IconX,
    IconChevronLeft,
    IconChevronRight,
    IconCalendar,
} from '@tabler/icons-react'
import { WordModeIcon, SentenceModeIcon, EssayModeIcon } from '../components/icons/StudyModeIcons'
import { getSessionHistory, getSessionModeDetails } from '../db/study/studyService'
import type { StudyModeType } from '../db/schema/study'
import type { SessionHistoryItem, SessionModeDetail } from '../db/study/types'

// 모드별 설정
const modeConfig: Record<StudyModeType, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
    word: { icon: <WordModeIcon size={14} />, label: '단어', color: 'text-blue-500', bgColor: 'bg-blue-500' },
    sentence: { icon: <SentenceModeIcon size={14} />, label: '문장', color: 'text-green-500', bgColor: 'bg-green-500' },
    essay: { icon: <EssayModeIcon size={14} />, label: '서술형', color: 'text-purple-500', bgColor: 'bg-purple-500' },
}

// 요일 라벨
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function SessionHistoryPage() {
    const navigate = useNavigate()

    // 상태
    const [sessions, setSessions] = useState<SessionHistoryItem[]>([])
    const [selectedMode, setSelectedMode] = useState<StudyModeType | 'all'>('all')
    const [loading, setLoading] = useState(true)

    // 캘린더 상태
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    // 세션별 모드 상세 정보 캐시
    const [sessionDetails, setSessionDetails] = useState<Record<string, SessionModeDetail[]>>({})
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
    const [detailLoading, setDetailLoading] = useState<string | null>(null)

    // 데이터 로드
    useEffect(() => {
        loadData()
    }, [selectedMode])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getSessionHistory({
                mode: selectedMode === 'all' ? undefined : selectedMode,
                limit: 500, // 충분히 가져오기
            })
            setSessions(data)
        } catch (err) {
            console.error('Failed to load session history:', err)
        } finally {
            setLoading(false)
        }
    }

    // 세션 상세 정보 로드
    const loadSessionDetails = async (sessionId: string) => {
        // 이미 캐시에 있으면 스킵
        if (sessionDetails[sessionId]) {
            return
        }

        setDetailLoading(sessionId)
        try {
            const details = await getSessionModeDetails(sessionId)
            setSessionDetails(prev => ({
                ...prev,
                [sessionId]: details,
            }))
        } catch (err) {
            console.error('Failed to load session details:', err)
        } finally {
            setDetailLoading(null)
        }
    }

    // 세션 확장/축소 토글
    const toggleSessionExpand = async (sessionId: string) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null)
        } else {
            setExpandedSessionId(sessionId)
            await loadSessionDetails(sessionId)
        }
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
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
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
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                        {/* 캘린더 */}
                        <div className="border border-[var(--border-light)] bg-[var(--bg-paper)] p-4">
                            {/* 캘린더 헤더 */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={goToPrevMonth}
                                    className="p-2 border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                                >
                                    <IconChevronLeft size={16} />
                                </button>

                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-base text-[var(--text-primary)]">
                                        {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                                    </span>
                                    <button
                                        onClick={goToToday}
                                        className="px-2 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                        <IconCalendar size={12} />
                                        오늘
                                    </button>
                                </div>

                                <button
                                    onClick={goToNextMonth}
                                    className="p-2 border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                                >
                                    <IconChevronRight size={16} />
                                </button>
                            </div>

                            {/* 요일 헤더 */}
                            <div className="grid grid-cols-7 mb-2">
                                {WEEKDAYS.map((day, i) => (
                                    <div
                                        key={day}
                                        className={`text-center font-mono text-xs py-2 ${
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
                                                relative p-2 min-h-[60px] border cursor-pointer transition-all
                                                ${isCurrentMonth ? 'bg-[var(--bg-paper)]' : 'bg-[var(--bg-primary)]/50'}
                                                ${isSelected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-transparent hover:border-[var(--border-light)]'}
                                                ${isToday ? 'bg-[var(--accent)]/5' : ''}
                                            `}
                                        >
                                            {/* 날짜 숫자 */}
                                            <div className={`
                                                font-mono text-sm mb-1
                                                ${!isCurrentMonth ? 'text-[var(--text-tertiary)]/50' :
                                                    dayOfWeek === 0 ? 'text-red-400' :
                                                    dayOfWeek === 6 ? 'text-blue-400' :
                                                    'text-[var(--text-primary)]'}
                                                ${isToday ? 'font-bold' : ''}
                                            `}>
                                                {date.getDate()}
                                                {isToday && (
                                                    <span className="ml-1 text-[8px] text-[var(--accent)]">●</span>
                                                )}
                                            </div>

                                            {/* 학습 표시 */}
                                            {stat && isCurrentMonth && (
                                                <div className="space-y-1">
                                                    {/* 모드 표시 */}
                                                    <div className="flex gap-0.5">
                                                        {Array.from(stat.modes).map(mode => (
                                                            <div
                                                                key={mode}
                                                                className={`w-2 h-2 rounded-full ${modeConfig[mode].bgColor}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    {/* 정답률 */}
                                                    <div className={`font-mono text-[10px] ${
                                                        stat.accuracy >= 80 ? 'text-[var(--success)]' :
                                                        stat.accuracy >= 60 ? 'text-[var(--warning)]' :
                                                        'text-[var(--error)]'
                                                    }`}>
                                                        {stat.accuracy}%
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* 범례 */}
                            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-dashed border-[var(--border-light)]">
                                {(['word', 'sentence', 'essay'] as const).map(mode => (
                                    <div key={mode} className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${modeConfig[mode].bgColor}`} />
                                        <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                            {modeConfig[mode].label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 선택된 날짜의 세션 상세 */}
                        <div className="border border-[var(--border-light)] bg-[var(--bg-paper)]">
                            <AnimatePresence mode="wait">
                                {selectedDate ? (
                                    <motion.div
                                        key={selectedDate}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {/* 날짜 헤더 */}
                                        <div className="px-4 py-3 border-b border-[var(--border-light)]">
                                            <div className="font-mono text-sm text-[var(--text-primary)]">
                                                {formatSelectedDate(selectedDate)}
                                            </div>
                                            {selectedDateSessions.length > 0 && (
                                                <div className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                                                    {selectedDateSessions.length}개 세션
                                                </div>
                                            )}
                                        </div>

                                        {/* 세션 목록 */}
                                        {selectedDateSessions.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                                <span className="font-mono text-2xl text-[var(--text-tertiary)] mb-2">∅</span>
                                                <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                                    학습 기록 없음
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-dashed divide-[var(--border-light)] max-h-[500px] overflow-y-auto">
                                                {selectedDateSessions.map((session) => {
                                                    const config = modeConfig[session.mode]
                                                    const accuracy = session.totalQuestions > 0
                                                        ? Math.round((session.correctCount / session.totalQuestions) * 100)
                                                        : 0
                                                    const isExpanded = expandedSessionId === session.id
                                                    const details = sessionDetails[session.id]
                                                    const isLoadingDetail = detailLoading === session.id

                                                    return (
                                                        <div key={session.id} className="p-4">
                                                            {/* 세션 헤더 - 클릭 가능 */}
                                                            <button
                                                                onClick={() => toggleSessionExpand(session.id)}
                                                                className="w-full text-left cursor-pointer bg-transparent border-none p-0"
                                                            >
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={config.color}>{config.icon}</span>
                                                                    <span className="font-mono text-sm text-[var(--text-primary)]">
                                                                        {config.label}
                                                                    </span>
                                                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                                        {formatTime(session.startedAt)}
                                                                    </span>
                                                                    <span className="ml-auto font-mono text-[10px] text-[var(--text-tertiary)] px-1.5 py-0.5 border border-[var(--border-light)]">
                                                                        {session.order === 'sequential' ? '순차' : '랜덤'}
                                                                    </span>
                                                                    <IconChevronRight
                                                                        size={14}
                                                                        className={`text-[var(--text-tertiary)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                                    />
                                                                </div>

                                                                {/* 세션 요약 */}
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                                                                        <IconClock size={12} />
                                                                        <span className="font-mono">{formatDuration(session.totalDuration)}</span>
                                                                    </div>
                                                                    <div className="font-mono text-[var(--text-tertiary)]">
                                                                        {session.noteCount}개 노트
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-[var(--success)] flex items-center gap-0.5">
                                                                            <IconChecks size={12} />
                                                                            {session.correctCount}
                                                                        </span>
                                                                        <span className="font-mono text-[var(--error)] flex items-center gap-0.5">
                                                                            <IconX size={12} />
                                                                            {session.wrongCount}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`font-mono text-base font-bold ${
                                                                        accuracy >= 80 ? 'text-[var(--success)]' :
                                                                        accuracy >= 60 ? 'text-[var(--warning)]' :
                                                                        'text-[var(--error)]'
                                                                    }`}>
                                                                        {accuracy}%
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            {/* 모드별 상세 정보 (확장 시) */}
                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="mt-3 pt-3 border-t border-dashed border-[var(--border-light)]">
                                                                            <div className="font-mono text-[10px] text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">
                                                                                모드별 성적
                                                                            </div>

                                                                            {isLoadingDetail ? (
                                                                                <div className="flex items-center justify-center py-4">
                                                                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">loading...</span>
                                                                                </div>
                                                                            ) : details && details.length > 0 ? (
                                                                                <div className="space-y-2">
                                                                                    {details.map((detail) => {
                                                                                        const modeConf = modeConfig[detail.mode]
                                                                                        const modeAccuracy = detail.totalQuestions > 0
                                                                                            ? Math.round((detail.correctCount / detail.totalQuestions) * 100)
                                                                                            : 0

                                                                                        return (
                                                                                            <div
                                                                                                key={detail.mode}
                                                                                                className="bg-[var(--bg-primary)] border border-[var(--border-light)] p-2.5"
                                                                                            >
                                                                                                {/* 모드 헤더 */}
                                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                                    <span className={modeConf.color}>{modeConf.icon}</span>
                                                                                                    <span className="font-mono text-xs text-[var(--text-primary)]">
                                                                                                        {modeConf.label}
                                                                                                    </span>
                                                                                                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                                                                                        ({detail.noteCount}개 노트)
                                                                                                    </span>
                                                                                                </div>

                                                                                                {/* 모드 상세 */}
                                                                                                <div className="grid grid-cols-3 gap-2">
                                                                                                    {/* 정답률 */}
                                                                                                    <div className="text-center">
                                                                                                        <div className="font-mono text-[10px] text-[var(--text-tertiary)] mb-0.5">
                                                                                                            정답률
                                                                                                        </div>
                                                                                                        <div className={`font-mono text-sm font-bold ${
                                                                                                            modeAccuracy >= 80 ? 'text-[var(--success)]' :
                                                                                                            modeAccuracy >= 60 ? 'text-[var(--warning)]' :
                                                                                                            'text-[var(--error)]'
                                                                                                        }`}>
                                                                                                            {modeAccuracy}%
                                                                                                        </div>
                                                                                                        <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                                                                                            {detail.correctCount}/{detail.totalQuestions}
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* 평균 점수 */}
                                                                                                    <div className="text-center">
                                                                                                        <div className="font-mono text-[10px] text-[var(--text-tertiary)] mb-0.5">
                                                                                                            평균 점수
                                                                                                        </div>
                                                                                                        <div className={`font-mono text-sm font-bold ${
                                                                                                            detail.avgScore >= 80 ? 'text-[var(--success)]' :
                                                                                                            detail.avgScore >= 60 ? 'text-[var(--warning)]' :
                                                                                                            'text-[var(--error)]'
                                                                                                        }`}>
                                                                                                            {detail.avgScore}
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* 학습 시간 */}
                                                                                                    <div className="text-center">
                                                                                                        <div className="font-mono text-[10px] text-[var(--text-tertiary)] mb-0.5">
                                                                                                            시간
                                                                                                        </div>
                                                                                                        <div className="font-mono text-sm text-[var(--text-primary)]">
                                                                                                            {formatDuration(detail.totalDuration)}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )
                                                                                    })}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-center py-3">
                                                                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                                                        상세 기록 없음
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-16 px-4"
                                    >
                                        <IconCalendar size={32} className="text-[var(--text-tertiary)] mb-3" />
                                        <span className="font-mono text-sm text-[var(--text-tertiary)] text-center">
                                            캘린더에서 날짜를 선택하세요
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
