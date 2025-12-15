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
    IconTrophy,
    IconFlame,
    IconClock,
    IconChevronDown,
    IconChevronUp,
    IconChevronLeft,
    IconChevronRight,
    IconSearch,
    IconSortAscending,
    IconSortDescending,
} from '@tabler/icons-react'
import { WordModeIcon, SentenceModeIcon, EssayModeIcon } from '../components/icons/StudyModeIcons'
import { getWeakNotes, getAllNoteStats } from '../db/study/statisticsService'
import { getWeakPointsByNote, resolveWeakPoint } from '../db/study/weakPointService'
import { findNoteById } from '../db/note/noteService'
import type { ModeBreakdownStats, NoteStats } from '../db/study/types'
import type { StudyModeType, WeakPoint } from '../db/schema/study'
import { SectionTitle } from '../components/common/SectionTitle'
import { WeakPointItem } from '../features/WeakPoints/WeakPointItem'
import { WeakPointNote } from '../features/WeakPoints/WeakPointNote'
import { Pagenation } from '../features/WeakPoints/Pagenation'

// ================================ 상수 ================================
const NOTES_PER_PAGE = 10

// 정렬 옵션
type SortKey = 'accuracy' | 'studyCount' | 'lastStudiedAt' | 'weakPointCount'
type SortOrder = 'asc' | 'desc'

const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'accuracy', label: '정답률' },
    { key: 'studyCount', label: '학습 횟수' },
    { key: 'lastStudiedAt', label: '최근 학습' },
    { key: 'weakPointCount', label: '취약점 수' },
]

export function WeakPointsPage() {
    const navigate = useNavigate()

    // ================================ 상태 ================================
    const [weakNotes, setWeakNotes] = useState<NoteStats[]>([])
    const [allNotes, setAllNotes] = useState<NoteStats[]>([])
    const [noteTitles, setNoteTitles] = useState<Record<string, string>>({})
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAll, setShowAll] = useState(false)
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
            const [weak, all] = await Promise.all([getWeakNotes(70), getAllNoteStats()])

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
                [noteId]: prev[noteId]?.map((wp) => (wp.id === wpId ? { ...wp, isResolved: true } : wp)) || [],
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

    // ================================ 가상 스크롤 취약점 아이템 ================================

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
                        <span className="font-display text-lg text-[var(--text-primary)]">취약 노트</span>
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
                                <div>
                                    • 2회 이상 학습한 노트 중{' '}
                                    <span className="text-[var(--error)]">정답률 70% 미만</span>
                                </div>
                                <div>• 모드별(단어/문장/서술형) 성적을 확인하고 취약한 부분을 집중 학습하세요</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 검색 & 정렬 */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                    {/* 검색 */}
                    <div className="flex-1 relative">
                        <IconSearch
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                        />
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
                                {sortKey === opt.key &&
                                    (sortOrder === 'asc' ? (
                                        <IconSortAscending size={12} />
                                    ) : (
                                        <IconSortDescending size={12} />
                                    ))}
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
                            {searchQuery
                                ? '검색 결과가 없습니다'
                                : showAll
                                  ? '학습 기록이 없습니다'
                                  : '취약 노트가 없습니다!'}
                        </span>
                        <span className="font-mono text-sm text-[var(--text-secondary)]">
                            {searchQuery
                                ? '다른 검색어를 시도해보세요'
                                : showAll
                                  ? '먼저 학습을 시작해보세요'
                                  : '모든 노트에서 70% 이상의 정답률을 유지하고 있습니다'}
                        </span>
                    </div>
                ) : (
                    <>
                        {/* 노트 목록 */}
                        <div className="space-y-3">
                            {paginatedNotes.map((note) => {
                                return (
                                    <WeakPointNote
                                        key={note.noteId}
                                        note={note}
                                        noteTitles={noteTitles}
                                        noteWeakPoints={noteWeakPoints}
                                        expandedId={expandedId}
                                        handleToggleExpand={handleToggleExpand}
                                        handleResolveWeakPoint={handleResolveWeakPoint}
                                        loadingWeakPoints={loadingWeakPoints}
                                    />
                                )
                            })}
                        </div>

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <Pagenation
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
