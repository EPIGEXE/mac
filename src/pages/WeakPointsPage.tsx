/**
 * 취약 노트 페이지
 *
 * 취약 노트 = 학습 성적이 지속적으로 낮은 노트
 * - 정답률 70% 미만인 노트
 * - 모드별(단어/문장/서술형) 세부 성적 표시
 * - 해당 노트로 바로 학습 시작 가능
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { List } from 'react-window'
import {
    IconArrowLeft,
    IconAlertTriangle,
    IconPlayerPlay,
    IconTrophy,
    IconFlame,
    IconClock,
    IconChevronDown,
    IconChevronUp,
    IconChevronLeft,
    IconChevronRight,
    IconCheck,
    IconSearch,
    IconSortAscending,
    IconSortDescending,
} from '@tabler/icons-react'
import { WordModeIcon, SentenceModeIcon, EssayModeIcon } from '../components/icons/StudyModeIcons'
import { getWeakNotes, getAllNoteStats } from '../db/study/statisticsService'
import { getWeakPointsByNote, resolveWeakPoint } from '../db/study/weakPointService'
import { findNoteById } from '../db/note/noteService'
import type { ModeBreakdownStats, NoteStats } from '../db/study/types'
import type { StudyModeType, WeakPoint, WordWeakPoint, SentenceWeakPoint, EssayWeakPoint } from '../db/schema/study'
import { SectionTitle } from '../components/common/SectionTitle'

// ================================ 상수 ================================
const NOTES_PER_PAGE = 10
const WEAK_POINT_ITEM_HEIGHT = 120

// 정렬 옵션
type SortKey = 'accuracy' | 'studyCount' | 'lastStudiedAt' | 'weakPointCount'
type SortOrder = 'asc' | 'desc'

const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'accuracy', label: '정답률' },
    { key: 'studyCount', label: '학습 횟수' },
    { key: 'lastStudiedAt', label: '최근 학습' },
    { key: 'weakPointCount', label: '취약점 수' },
]

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

    // ================================ 상태 ================================
    const [weakNotes, setWeakNotes] = useState<NoteStats[]>([])
    const [allNotes, setAllNotes] = useState<NoteStats[]>([])
    const [noteTitles, setNoteTitles] = useState<Record<string, string>>({})
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAll, setShowAll] = useState(false)
    const [showResolved, setShowResolved] = useState(true)
    const [noteWeakPoints, setNoteWeakPoints] = useState<Record<string, WeakPoint[]>>({})
    const [loadingWeakPoints, setLoadingWeakPoints] = useState<string | null>(null)

    // 검색 & 정렬 & 페이지네이션
    const [searchQuery, setSearchQuery] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>('accuracy')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [currentPage, setCurrentPage] = useState(1)

    // ================================ 데이터 로드 ================================
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

    // ================================ 필터링 & 정렬 ================================
    const filteredAndSortedNotes = useMemo(() => {
        let notes = showAll ? allNotes : weakNotes

        // 검색 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            notes = notes.filter((note) => {
                const title = noteTitles[note.noteId]?.toLowerCase() || ''
                return title.includes(query)
            })
        }

        // 정렬
        notes = [...notes].sort((a, b) => {
            let aVal: number
            let bVal: number

            switch (sortKey) {
                case 'accuracy':
                    aVal = a.accuracy
                    bVal = b.accuracy
                    break
                case 'studyCount':
                    aVal = a.studyCount
                    bVal = b.studyCount
                    break
                case 'lastStudiedAt':
                    aVal = a.lastStudiedAt || 0
                    bVal = b.lastStudiedAt || 0
                    break
                case 'weakPointCount':
                    aVal = a.weakPointCount
                    bVal = b.weakPointCount
                    break
                default:
                    return 0
            }

            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        })

        return notes
    }, [showAll, allNotes, weakNotes, searchQuery, noteTitles, sortKey, sortOrder])

    // 페이지네이션
    const totalPages = Math.ceil(filteredAndSortedNotes.length / NOTES_PER_PAGE)
    const paginatedNotes = useMemo(() => {
        const start = (currentPage - 1) * NOTES_PER_PAGE
        return filteredAndSortedNotes.slice(start, start + NOTES_PER_PAGE)
    }, [filteredAndSortedNotes, currentPage])

    // 검색/정렬 변경 시 페이지 리셋
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, sortKey, sortOrder, showAll])

    // ================================ 핸들러 ================================
    const handleToggleExpand = async (noteId: string) => {
        if (expandedId === noteId) {
            setExpandedId(null)
            return
        }

        setExpandedId(noteId)

        if (noteWeakPoints[noteId]) return

        setLoadingWeakPoints(noteId)
        try {
            const weakPoints = await getWeakPointsByNote(noteId, true)
            setNoteWeakPoints((prev) => ({ ...prev, [noteId]: weakPoints }))
        } catch (err) {
            console.error('Failed to load weak points:', err)
        } finally {
            setLoadingWeakPoints(null)
        }
    }

    const handleResolveWeakPoint = useCallback(async (noteId: string, wpId: string) => {
        try {
            await resolveWeakPoint(wpId)
            setNoteWeakPoints((prev) => ({
                ...prev,
                [noteId]: prev[noteId]?.map((wp) =>
                    wp.id === wpId ? { ...wp, isResolved: true } : wp
                ) || [],
            }))
        } catch (err) {
            console.error('Failed to resolve weak point:', err)
        }
    }, [])

    const handleSortChange = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(key)
            setSortOrder('asc')
        }
    }

    // ================================ 유틸 ================================
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        if (hours > 0) return `${hours}h ${mins}m`
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

    // 모드별 성적 렌더링
    const renderModeStats = (stats: ModeBreakdownStats | undefined, mode: StudyModeType) => {
        if (!stats) return null
        const config = modeConfig[mode]

        return (
            <div className="flex items-center justify-between py-2 border-b border-dashed border-[var(--border-light)] last:border-b-0">
                <div className="flex items-center gap-2">
                    <span className={config.color}>{config.icon}</span>
                    <span className="font-mono text-sm text-[var(--text-secondary)]">{config.label}</span>
                    <span className="font-mono text-sm text-[var(--text-secondary)]">({stats.count}회)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-sm text-[var(--text-secondary)]">정답률</span>
                        <span className={`font-mono text-sm font-bold ${getAccuracyColor(stats.accuracy)}`}>
                            {stats.accuracy}%
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-sm text-[var(--text-secondary)]">평균</span>
                        <span className={`font-mono text-sm ${getAccuracyColor(stats.avgScore)}`}>
                            {stats.avgScore}점
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    // ================================ 가상 스크롤 취약점 아이템 ================================
    const WeakPointItem = useCallback(({ wp, noteId, isResolved }: {
        wp: WeakPoint
        noteId: string
        isResolved: boolean
    }) => {
        const config = modeConfig[wp.mode]

        return (
            <div className={`p-3 bg-[var(--bg-primary)] border mb-2 ${isResolved ? 'border-[var(--success)]/30 opacity-60' : 'border-[var(--error)]/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={config.color}>{config.icon}</span>
                    <span className="font-mono text-sm text-[var(--text-secondary)]">{config.label}</span>
                    <span className={`font-mono text-sm ${isResolved ? 'text-[var(--text-secondary)]' : 'text-[var(--error)]'}`}>
                        {wp.wrongCount}회 오답
                    </span>
                    {isResolved ? (
                        <span className="ml-auto px-1.5 py-0.5 bg-[var(--success)]/10 text-[var(--success)] font-mono text-sm flex items-center gap-1">
                            <IconCheck size={10} />
                            해결됨
                        </span>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleResolveWeakPoint(noteId, wp.id)
                            }}
                            className="ml-auto p-1 border border-[var(--success)] text-[var(--success)] cursor-pointer transition-colors hover:bg-[var(--success)]/10 flex items-center gap-1 font-mono text-sm"
                        >
                            <IconCheck size={12} />
                            해결
                        </button>
                    )}
                </div>

                {wp.mode === 'word' && (
                    <div className={isResolved ? 'opacity-70' : ''}>
                        <div className="font-mono text-sm text-[var(--text-primary)] mb-1">
                            "{(wp as WordWeakPoint).keyword}"
                        </div>
                        {(wp as WordWeakPoint).hint && (
                            <div className="font-mono text-sm text-[var(--text-secondary)] mb-1">
                                힌트: {(wp as WordWeakPoint).hint}
                            </div>
                        )}
                        {(wp as WordWeakPoint).wrongAnswers.length > 0 && (
                            <div className="font-mono text-sm text-[var(--error)]/70">
                                오답: {(wp as WordWeakPoint).wrongAnswers.slice(-3).join(', ')}
                            </div>
                        )}
                    </div>
                )}

                {wp.mode === 'sentence' && (
                    <div className={isResolved ? 'opacity-70' : ''}>
                        <div className="font-mono text-sm text-[var(--text-primary)] mb-1 line-clamp-2">
                            {(wp as SentenceWeakPoint).question}
                        </div>
                        <div className="font-mono text-sm text-[var(--text-secondary)] mb-1 truncate">
                            정답: {(wp as SentenceWeakPoint).correctAnswer}
                        </div>
                    </div>
                )}

                {wp.mode === 'essay' && (
                    <div className={isResolved ? 'opacity-70' : ''}>
                        <div className="font-mono text-sm text-[var(--text-secondary)] mb-1">
                            [{(wp as EssayWeakPoint).company}] {(wp as EssayWeakPoint).questionType}
                        </div>
                        <div className="font-mono text-sm text-[var(--text-primary)] line-clamp-2">
                            {(wp as EssayWeakPoint).question}
                        </div>
                    </div>
                )}
            </div>
        )
    }, [handleResolveWeakPoint])

    // 가상 스크롤 Row 컴포넌트 생성 함수
    const createWeakPointRowComponent = useCallback((wps: WeakPoint[], noteId: string) => {
        return function WeakPointRowComponent({ index, style }: { index: number; style: CSSProperties }) {
            const wp = wps[index]
            return (
                <div style={style}>
                    <WeakPointItem wp={wp} noteId={noteId} isResolved={wp.isResolved} />
                </div>
            )
        }
    }, [WeakPointItem])

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/statistics')}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-secondary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    <div className="flex items-center gap-3">
                        <IconAlertTriangle size={20} className="text-[var(--error)]" />
                        <span className="font-mono text-lg text-[var(--text-primary)]">취약 노트</span>
                        <span className="font-mono text-sm text-[var(--error)]">[{weakNotes.length}]</span>
                    </div>

                    <label className="flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] cursor-pointer">
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
                            <div className="font-mono text-sm text-[var(--text-primary)] mb-1">취약 노트 기준</div>
                            <div className="font-mono text-xs text-[var(--text-secondary)] space-y-1">
                                <div>• 2회 이상 학습한 노트 중 <span className="text-[var(--error)]">정답률 70% 미만</span></div>
                                <div>• 모드별(단어/문장/서술형) 성적을 확인하고 취약한 부분을 집중 학습하세요</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 검색 & 정렬 */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                    {/* 검색 */}
                    <div className="flex-1 relative">
                        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="노트 제목 검색..."
                            className="w-full pl-9 pr-4 py-2 border border-[var(--border-light)] bg-[var(--bg-paper)] font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                        />
                    </div>

                    {/* 정렬 */}
                    <div className="flex items-center gap-1">
                        {sortOptions.map((opt) => (
                            <button
                                key={opt.key}
                                onClick={() => handleSortChange(opt.key)}
                                className={`px-2 py-1.5 font-mono text-sm border cursor-pointer transition-colors flex items-center gap-1 ${
                                    sortKey === opt.key
                                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                                        : 'border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                                }`}
                            >
                                {opt.label}
                                {sortKey === opt.key && (
                                    sortOrder === 'asc'
                                        ? <IconSortAscending size={12} />
                                        : <IconSortDescending size={12} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 결과 카운트 */}
                <div className="mb-4 font-mono text-sm text-[var(--text-secondary)]">
                    {filteredAndSortedNotes.length}개 노트
                    {searchQuery && ` (검색: "${searchQuery}")`}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="font-mono text-sm text-[var(--text-secondary)]">loading...</span>
                    </div>
                ) : filteredAndSortedNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-[var(--border-light)] bg-[var(--bg-paper)]">
                        <IconTrophy size={48} className="text-[var(--success)] mb-4" />
                        <span className="font-mono text-lg text-[var(--text-primary)] mb-2">
                            {searchQuery ? '검색 결과가 없습니다' : showAll ? '학습 기록이 없습니다' : '취약 노트가 없습니다!'}
                        </span>
                        <span className="font-mono text-sm text-[var(--text-secondary)]">
                            {searchQuery ? '다른 검색어를 시도해보세요' : showAll ? '먼저 학습을 시작해보세요' : '모든 노트에서 70% 이상의 정답률을 유지하고 있습니다'}
                        </span>
                    </div>
                ) : (
                    <>
                        {/* 노트 목록 */}
                        <div className="space-y-3">
                            {paginatedNotes.map((note) => {
                                const isExpanded = expandedId === note.noteId
                                const isWeak = note.accuracy < 70
                                const wps = noteWeakPoints[note.noteId] || []
                                const unresolvedWps = wps.filter(wp => !wp.isResolved)
                                const resolvedWps = wps.filter(wp => wp.isResolved)
                                const displayWps = showResolved ? wps : unresolvedWps

                                return (
                                    <div
                                        key={note.noteId}
                                        className={`border bg-[var(--bg-paper)] transition-colors ${
                                            isWeak ? 'border-[var(--error)]/30' : 'border-[var(--border-light)]'
                                        }`}
                                    >
                                        {/* 노트 헤더 */}
                                        <div
                                            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[var(--bg-primary)]/50"
                                            onClick={() => handleToggleExpand(note.noteId)}
                                        >
                                            {/* 정답률 게이지 */}
                                            <div className="w-12 h-12 relative flex-shrink-0">
                                                <svg className="w-12 h-12 -rotate-90">
                                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-[var(--border-light)]" />
                                                    <circle
                                                        cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none"
                                                        strokeDasharray={`${(note.accuracy / 100) * 125.6} 125.6`}
                                                        className={getAccuracyColor(note.accuracy)}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className={`font-mono text-sm font-bold ${getAccuracyColor(note.accuracy)}`}>
                                                        {note.accuracy}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 노트 정보 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-mono text-sm text-[var(--text-primary)] truncate">
                                                    {noteTitles[note.noteId] || note.noteId}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    <span className="font-mono text-sm text-[var(--text-secondary)] flex items-center gap-1">
                                                        <IconClock size={10} />
                                                        {formatDuration(note.totalTime)}
                                                    </span>
                                                    <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                        {note.studyCount}회
                                                    </span>
                                                    {note.lastStudiedAt && (
                                                        <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                            {formatDate(note.lastStudiedAt)}
                                                        </span>
                                                    )}
                                                    {note.weakPointCount > 0 && (
                                                        <span className="font-mono text-sm text-[var(--error)]">
                                                            취약점 {note.weakPointCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 모드 표시 */}
                                            <div className="flex items-center gap-1">
                                                {note.modeBreakdown?.word && <span className={modeConfig.word.color}>{modeConfig.word.icon}</span>}
                                                {note.modeBreakdown?.sentence && <span className={modeConfig.sentence.color}>{modeConfig.sentence.icon}</span>}
                                                {note.modeBreakdown?.essay && <span className={modeConfig.essay.color}>{modeConfig.essay.icon}</span>}
                                            </div>

                                            {isExpanded ? <IconChevronUp size={16} className="text-[var(--text-secondary)]" /> : <IconChevronDown size={16} className="text-[var(--text-secondary)]" />}
                                        </div>

                                        {/* 상세 */}
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
                                                            <SectionTitle size="base" className="mb-2">모드별 성적</SectionTitle>

                                                            {/* 전체 정답률 바 */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="font-mono text-sm text-[var(--text-secondary)]">전체 정답률</span>
                                                                    <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                                        {note.correctCount}/{note.totalQuestions}
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                                                    <div className={`h-full transition-all ${getAccuracyBarColor(note.accuracy)}`} style={{ width: `${note.accuracy}%` }} />
                                                                </div>
                                                            </div>

                                                            {renderModeStats(note.modeBreakdown?.word, 'word')}
                                                            {renderModeStats(note.modeBreakdown?.sentence, 'sentence')}
                                                            {renderModeStats(note.modeBreakdown?.essay, 'essay')}

                                                            {!note.modeBreakdown?.word && !note.modeBreakdown?.sentence && !note.modeBreakdown?.essay && (
                                                                <div className="font-mono text-sm text-[var(--text-secondary)] text-center py-4">모드별 학습 기록이 없습니다</div>
                                                            )}

                                                            {/* 취약점 목록 - 가상 스크롤 */}
                                                            {wps.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-dashed border-[var(--border-light)]">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="font-mono text-sm text-[var(--error)] flex items-center gap-1">
                                                                            <IconAlertTriangle size={12} />
                                                                            취약점 목록
                                                                            <span className="text-[var(--text-secondary)]">
                                                                                [미해결 {unresolvedWps.length} / 전체 {wps.length}]
                                                                            </span>
                                                                        </div>
                                                                        <label className="flex items-center gap-1.5 font-mono text-sm text-[var(--text-secondary)] cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={showResolved}
                                                                                onChange={(e) => setShowResolved(e.target.checked)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="accent-[var(--accent)] w-3 h-3"
                                                                            />
                                                                            해결된 항목 포함
                                                                        </label>
                                                                    </div>

                                                                    {/* 가상 스크롤 적용 - 5개 초과시 */}
                                                                    {displayWps.length > 5 ? (
                                                                        <List
                                                                            rowCount={displayWps.length}
                                                                            rowHeight={WEAK_POINT_ITEM_HEIGHT}
                                                                            rowComponent={createWeakPointRowComponent(displayWps, note.noteId)}
                                                                            rowProps={{} as never}
                                                                            style={{ height: Math.min(displayWps.length * WEAK_POINT_ITEM_HEIGHT, 400), width: '100%' }}
                                                                        />
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {displayWps.map((wp) => (
                                                                                <WeakPointItem key={wp.id} wp={wp} noteId={note.noteId} isResolved={wp.isResolved} />
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {resolvedWps.length > 0 && !showResolved && (
                                                                        <div className="mt-3 font-mono text-sm text-[var(--success)] text-center">
                                                                            + {resolvedWps.length}개의 해결된 취약점이 숨겨져 있습니다
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {loadingWeakPoints === note.noteId && (
                                                                <div className="mt-4 pt-4 border-t border-dashed border-[var(--border-light)]">
                                                                    <div className="font-mono text-sm text-[var(--text-secondary)] text-center py-4">취약점 로딩 중...</div>
                                                                </div>
                                                            )}

                                                            {wps.length === 0 && loadingWeakPoints !== note.noteId && noteWeakPoints[note.noteId] !== undefined && (
                                                                <div className="mt-4 pt-4 border-t border-dashed border-[var(--border-light)]">
                                                                    <div className="font-mono text-sm text-[var(--success)] text-center py-4">기록된 취약점이 없습니다</div>
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

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                >
                                    <IconChevronLeft size={16} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((page) => {
                                            if (totalPages <= 7) return true
                                            if (page === 1 || page === totalPages) return true
                                            if (Math.abs(page - currentPage) <= 1) return true
                                            return false
                                        })
                                        .map((page, idx, arr) => {
                                            const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                                            return (
                                                <span key={page} className="flex items-center">
                                                    {showEllipsis && <span className="px-2 text-[var(--text-secondary)]">...</span>}
                                                    <button
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-8 h-8 font-mono text-sm cursor-pointer transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                                                : 'border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                </span>
                                            )
                                        })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                >
                                    <IconChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
