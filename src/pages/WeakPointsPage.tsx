/**
 * 취약 노트 페이지
 *
 * 취약 노트 = 학습 성적이 지속적으로 낮은 노트
 * - 정답률 70% 미만인 노트
 * - 모드별(단어/문장/서술형) 세부 성적 표시
 * - 해당 노트로 바로 학습 시작 가능
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    IconArrowLeft,
    IconAlertTriangle,
    IconPlayerPlay,
    IconTrophy,
    IconFlame,
    IconClock,
    IconChevronDown,
    IconChevronUp,
} from '@tabler/icons-react'
import { WordModeIcon, SentenceModeIcon, EssayModeIcon } from '../components/icons/StudyModeIcons'
import { getWeakNotes, getAllNoteStats } from '../db/study/statisticsService'
import { findNoteById } from '../db/note/noteService'
import type { NoteStats, ModeBreakdownStats } from '../db/study/types'
import type { StudyModeType } from '../db/schema/study'

// 모드별 설정
const modeConfig: Record<StudyModeType, { icon: React.ReactNode; label: string; color: string }> = {
    word: { icon: <WordModeIcon size={14} />, label: '단어', color: 'text-blue-500' },
    sentence: { icon: <SentenceModeIcon size={14} />, label: '문장', color: 'text-green-500' },
    essay: { icon: <EssayModeIcon size={14} />, label: '서술형', color: 'text-purple-500' },
}

// 정답률에 따른 색상
const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-[var(--success)]'
    if (accuracy >= 60) return 'text-[var(--warning)]'
    return 'text-[var(--error)]'
}

// 정답률 바 색상
const getAccuracyBarColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-[var(--success)]'
    if (accuracy >= 60) return 'bg-[var(--warning)]'
    return 'bg-[var(--error)]'
}

export function WeakPointsPage() {
    const navigate = useNavigate()

    // 상태
    const [weakNotes, setWeakNotes] = useState<NoteStats[]>([])
    const [allNotes, setAllNotes] = useState<NoteStats[]>([])
    const [noteTitles, setNoteTitles] = useState<Record<string, string>>({})
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAll, setShowAll] = useState(false) // 모든 노트 보기 vs 취약 노트만

    // 데이터 로드
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [weak, all] = await Promise.all([
                getWeakNotes(70),
                getAllNoteStats(),
            ])

            setWeakNotes(weak)
            setAllNotes(all)

            // 노트 제목 로드
            const noteIds = new Set([...weak, ...all].map((n) => n.noteId))
            const titles: Record<string, string> = {}
            for (const noteId of noteIds) {
                const note = await findNoteById(noteId)
                if (note) {
                    titles[noteId] = note.title
                }
            }
            setNoteTitles(titles)
        } catch (err) {
            console.error('Failed to load weak notes:', err)
        } finally {
            setLoading(false)
        }
    }

    // 표시할 노트 목록
    const displayedNotes = showAll ? allNotes : weakNotes

    // 노트로 학습 시작
    const handleStartStudy = (noteId: string, mode: StudyModeType) => {
        navigate(`/study/setup?mode=${mode}&notes=${noteId}`)
    }

    // 시간 포맷
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        if (hours > 0) return `${hours}h ${mins}m`
        return `${mins}m`
    }

    // 날짜 포맷
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return '오늘'
        if (diffDays === 1) return '어제'
        if (diffDays < 7) return `${diffDays}일 전`
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }

    // 모드별 성적 렌더링
    const renderModeStats = (stats: ModeBreakdownStats | undefined, mode: StudyModeType, noteId: string) => {
        if (!stats) return null

        const config = modeConfig[mode]

        return (
            <div className="flex items-center justify-between py-2 border-b border-dashed border-[var(--border-light)] last:border-b-0">
                <div className="flex items-center gap-2">
                    <span className={config.color}>{config.icon}</span>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                        {config.label}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                        ({stats.count}회)
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* 정답률 */}
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">정답률</span>
                        <span className={`font-mono text-sm font-bold ${getAccuracyColor(stats.accuracy)}`}>
                            {stats.accuracy}%
                        </span>
                    </div>

                    {/* 평균 점수 */}
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">평균</span>
                        <span className={`font-mono text-sm ${getAccuracyColor(stats.avgScore)}`}>
                            {stats.avgScore}점
                        </span>
                    </div>

                    {/* 학습 버튼 */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleStartStudy(noteId, mode)
                        }}
                        className="p-1.5 border border-[var(--accent)] text-[var(--accent)] cursor-pointer transition-colors hover:bg-[var(--accent)]/10"
                    >
                        <IconPlayerPlay size={12} />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/statistics')}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    <div className="flex items-center gap-3">
                        <IconAlertTriangle size={20} className="text-[var(--error)]" />
                        <span className="font-mono text-lg text-[var(--text-primary)]">취약 노트</span>
                        <span className="font-mono text-sm text-[var(--error)]">
                            [{weakNotes.length}]
                        </span>
                    </div>

                    <label className="flex items-center gap-2 font-mono text-xs text-[var(--text-tertiary)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                            className="accent-[var(--accent)]"
                        />
                        전체 노트 보기
                    </label>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-[900px] mx-auto px-6 py-8">
                {/* 안내 */}
                <div className="mb-6 p-4 border border-dashed border-[var(--border-light)] bg-[var(--bg-paper)]">
                    <div className="flex items-start gap-3">
                        <IconFlame size={18} className="text-[var(--error)] mt-0.5" />
                        <div>
                            <div className="font-mono text-sm text-[var(--text-primary)] mb-1">
                                취약 노트 기준
                            </div>
                            <div className="font-mono text-xs text-[var(--text-tertiary)] space-y-1">
                                <div>• 2회 이상 학습한 노트 중 <span className="text-[var(--error)]">정답률 70% 미만</span></div>
                                <div>• 모드별(단어/문장/서술형) 성적을 확인하고 취약한 부분을 집중 학습하세요</div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="font-mono text-sm text-[var(--text-tertiary)]">loading...</span>
                    </div>
                ) : displayedNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                        <IconTrophy size={48} className="text-[var(--success)] mb-4" />
                        <span className="font-mono text-lg text-[var(--text-primary)] mb-2">
                            {showAll ? '학습 기록이 없습니다' : '취약 노트가 없습니다!'}
                        </span>
                        <span className="font-mono text-sm text-[var(--text-tertiary)]">
                            {showAll ? '먼저 학습을 시작해보세요' : '모든 노트에서 70% 이상의 정답률을 유지하고 있습니다'}
                        </span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayedNotes.map((note) => {
                            const isExpanded = expandedId === note.noteId
                            const isWeak = note.accuracy < 70

                            return (
                                <div
                                    key={note.noteId}
                                    className={`border bg-[var(--bg-paper)] transition-colors ${
                                        isWeak
                                            ? 'border-[var(--error)]/30'
                                            : 'border-[var(--border-light)]'
                                    }`}
                                >
                                    {/* 노트 헤더 */}
                                    <div
                                        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[var(--bg-primary)]/50"
                                        onClick={() => setExpandedId(isExpanded ? null : note.noteId)}
                                    >
                                        {/* 정답률 게이지 */}
                                        <div className="w-12 h-12 relative">
                                            <svg className="w-12 h-12 -rotate-90">
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    className="text-[var(--border-light)]"
                                                />
                                                <circle
                                                    cx="24"
                                                    cy="24"
                                                    r="20"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeDasharray={`${(note.accuracy / 100) * 125.6} 125.6`}
                                                    className={getAccuracyColor(note.accuracy)}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`font-mono text-xs font-bold ${getAccuracyColor(note.accuracy)}`}>
                                                    {note.accuracy}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* 노트 정보 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-sm text-[var(--text-primary)] truncate">
                                                {noteTitles[note.noteId] || note.noteId}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="font-mono text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                                                    <IconClock size={10} />
                                                    {formatDuration(note.totalTime)}
                                                </span>
                                                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                                    {note.studyCount}회 학습
                                                </span>
                                                {note.lastStudiedAt && (
                                                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                                        최근: {formatDate(note.lastStudiedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 모드 표시 */}
                                        <div className="flex items-center gap-1">
                                            {note.modeBreakdown?.word && (
                                                <span className={`${modeConfig.word.color}`}>
                                                    {modeConfig.word.icon}
                                                </span>
                                            )}
                                            {note.modeBreakdown?.sentence && (
                                                <span className={`${modeConfig.sentence.color}`}>
                                                    {modeConfig.sentence.icon}
                                                </span>
                                            )}
                                            {note.modeBreakdown?.essay && (
                                                <span className={`${modeConfig.essay.color}`}>
                                                    {modeConfig.essay.icon}
                                                </span>
                                            )}
                                        </div>

                                        {/* 펼치기 아이콘 */}
                                        {isExpanded ? (
                                            <IconChevronUp size={16} className="text-[var(--text-tertiary)]" />
                                        ) : (
                                            <IconChevronDown size={16} className="text-[var(--text-tertiary)]" />
                                        )}
                                    </div>

                                    {/* 상세 (모드별 성적) */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 border-t border-dashed border-[var(--border-light)]">
                                                    <div className="pt-3">
                                                        <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">
                                                            모드별 성적
                                                        </div>

                                                        {/* 전체 정답률 바 */}
                                                        <div className="mb-4">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                                                    전체 정답률
                                                                </span>
                                                                <span className="font-mono text-xs text-[var(--text-secondary)]">
                                                                    {note.correctCount}/{note.totalQuestions}
                                                                </span>
                                                            </div>
                                                            <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all ${getAccuracyBarColor(note.accuracy)}`}
                                                                    style={{ width: `${note.accuracy}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* 모드별 상세 */}
                                                        {renderModeStats(note.modeBreakdown?.word, 'word', note.noteId)}
                                                        {renderModeStats(note.modeBreakdown?.sentence, 'sentence', note.noteId)}
                                                        {renderModeStats(note.modeBreakdown?.essay, 'essay', note.noteId)}

                                                        {/* 학습 기록 없는 모드 안내 */}
                                                        {!note.modeBreakdown?.word && !note.modeBreakdown?.sentence && !note.modeBreakdown?.essay && (
                                                            <div className="font-mono text-xs text-[var(--text-tertiary)] text-center py-4">
                                                                모드별 학습 기록이 없습니다
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
