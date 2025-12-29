/**
 * 세션 히스토리 페이지
 * - 세션 정보와 학습 기록을 한눈에 표시
 * - 모드별 필터
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IconArrowLeft,
    IconHistory,
    IconCalendar,
} from '@tabler/icons-react'
import { getSessionHistory, getStudyRecordsBySession } from '../db/study/studyService'
import { findNoteById } from '../db/note/noteService'
import type { StudyModeType, StudyRecord } from '../db/schema/study'
import type { SessionHistoryItem } from '../db/study/types'
import { SessionCalendar } from '../features/SessionHistory/SessionCalendar'
import { StudyRecordSection } from '../features/SessionHistory/StudyRecordSection'

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

    // 세션별 펼침/접힘 상태
    const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({})

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
                records.forEach((r) => allNoteIds.add(r.noteId))
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
        sessions.forEach((session) => {
            const dateStr = new Date(session.startedAt).toISOString().split('T')[0]
            if (!grouped[dateStr]) {
                grouped[dateStr] = []
            }
            grouped[dateStr].push(session)
        })
        return grouped
    }, [sessions])

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="main-container px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/statistics')}
                        className="bg-transparent border-none px-2 md:px-4 py-2 md:py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-1.5 md:gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    <div className="flex items-center gap-2 md:gap-3">
                        <IconHistory size={20} className="text-[var(--text-tertiary)]" />
                        <span className="font-display text-base md:text-lg text-[var(--text-primary)]">학습 기록</span>
                        <span className="font-mono text-xs md:text-sm text-[var(--text-tertiary)]">[{sessions.length}]</span>
                    </div>

                    <div className="w-12 md:w-24" />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-[1500px] mx-auto px-4 md:px-8 py-6 md:py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="font-mono text-sm text-[var(--text-tertiary)]">loading...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-6 md:gap-8">
                        {/* 좌측: 필터 + 캘린더 */}
                        <SessionCalendar
                            sessionsByDate={sessionsByDate}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            selectedMode={selectedMode}
                            setSelectedMode={setSelectedMode}
                        />

                        {/* 우측: 세션 및 학습 기록 */}
                        <div className="space-y-6">
                            {selectedDate ? (
                                <StudyRecordSection
                                    selectedDate={selectedDate}
                                    sessionsByDate={sessionsByDate}
                                    sessionRecords={sessionRecords}
                                    expandedSessions={expandedSessions}
                                    setExpandedSessions={setExpandedSessions}
                                    noteTitles={noteTitles}
                                />
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
