import { IconBook, IconCalendar, IconChecks, IconChevronDown, IconChevronUp, IconClock, IconX } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { modeConfig } from '../StatisticsDashboard/const'
import type { SessionHistoryItem } from '../../db/study/types'
import type { StudyRecord } from '../../db/schema/study'

interface StudyRecordSectionProps {
    selectedDate: string
    sessionsByDate: Record<string, SessionHistoryItem[]>
    sessionRecords: Record<string, StudyRecord[]>
    expandedSessions: Record<string, boolean>
    setExpandedSessions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    noteTitles: Record<string, string>
}

export function StudyRecordSection({
    selectedDate,
    sessionsByDate,
    sessionRecords,
    expandedSessions,
    setExpandedSessions,
    noteTitles,
}: StudyRecordSectionProps) {
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

    // 세션 펼침/접힘 토글
    const toggleSession = (sessionId: string) => {
        setExpandedSessions((prev) => ({
            ...prev,
            [sessionId]: !prev[sessionId],
        }))
    }

    return (
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
                    const accuracy =
                        session.totalQuestions > 0
                            ? Math.round((session.correctCount / session.totalQuestions) * 100)
                            : 0
                    const records = sessionRecords[session.id] || []
                    const isExpanded = expandedSessions[session.id] ?? true // 기본값: 펼침

                    return (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sessionIdx * 0.05 }}
                            className="border border-[var(--border-light)] bg-[var(--bg-paper)]"
                        >
                            {/* 세션 헤더 */}
                            <button
                                onClick={() => toggleSession(session.id)}
                                className="w-full px-5 py-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-primary)]/30 transition-colors text-left"
                            >
                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* 펼침/접힘 아이콘 */}
                                    <div className="text-[var(--text-tertiary)]">
                                        {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                                    </div>

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
                                        <span
                                            className={`font-mono text-lg font-bold ${
                                                accuracy >= 80
                                                    ? 'text-[var(--success)]'
                                                    : accuracy >= 60
                                                      ? 'text-[var(--warning)]'
                                                      : 'text-[var(--error)]'
                                            }`}
                                        >
                                            {accuracy}%
                                        </span>
                                    </div>
                                </div>
                            </button>

                            {/* 학습 기록 테이블 */}
                            {isExpanded && records.length > 0 ? (
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
                                                                <IconBook
                                                                    size={14}
                                                                    className="text-[var(--text-tertiary)] flex-shrink-0"
                                                                />
                                                                <span className="font-mono text-sm text-[var(--text-primary)] truncate max-w-[300px]">
                                                                    {noteTitles[record.noteId] || record.noteId}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span
                                                                className={`${recordConfig.color} inline-flex items-center gap-1`}
                                                            >
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
                                                            <span
                                                                className={`font-mono text-sm font-medium ${
                                                                    record.score >= 80
                                                                        ? 'text-[var(--success)]'
                                                                        : record.score >= 60
                                                                          ? 'text-[var(--warning)]'
                                                                          : 'text-[var(--error)]'
                                                                }`}
                                                            >
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
                            ) : isExpanded && records.length === 0 ? (
                                <div className="px-5 py-6 text-center">
                                    <span className="font-mono text-sm text-[var(--text-tertiary)]">
                                        상세 학습 기록이 없습니다
                                    </span>
                                </div>
                            ) : null}
                        </motion.div>
                    )
                })
            )}
        </>
    )
}
