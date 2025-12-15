import { useCallback, useState, type CSSProperties } from 'react'
import type { ModeBreakdownStats, NoteStats } from '../../db/study/types'
import type { WeakPoint } from '../../db/schema/study'
import { getAccuracyColor } from './const'
import { IconAlertTriangle, IconChevronDown, IconChevronUp, IconClock } from '@tabler/icons-react'
import { formatDate, formatDuration } from '../../utils/funtion'
import { modeConfig } from '../StatisticsDashboard/const'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { SectionTitle } from '../../components/common/SectionTitle'
import type { StudyModeType } from '../Study/types'
import { List } from 'react-window'
import { WeakPointItem } from './WeakPointItem'

const WEAK_POINT_ITEM_HEIGHT = 120

interface WeakPointNoteProps {
    note: NoteStats
    noteTitles: Record<string, string>
    noteWeakPoints: Record<string, WeakPoint[]>
    expandedId: string | null
    handleToggleExpand: (noteId: string) => void
    handleResolveWeakPoint: (noteId: string, wpId: string) => void
    loadingWeakPoints: string | null
}

// 정답률 바 색상
const getAccuracyBarColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-[var(--success)]'
    if (accuracy >= 60) return 'bg-[var(--warning)]'
    return 'bg-[var(--error)]'
}

export function WeakPointNote({
    note,
    noteTitles,
    noteWeakPoints,
    expandedId,
    handleToggleExpand,
    handleResolveWeakPoint,
    loadingWeakPoints,
}: WeakPointNoteProps) {
    const [showResolved, setShowResolved] = useState(true)

    const isExpanded = expandedId === note.noteId
    const isWeak = note.accuracy < 70
    const wps = noteWeakPoints[note.noteId] || []
    const unresolvedWps = wps.filter((wp) => !wp.isResolved)
    const resolvedWps = wps.filter((wp) => wp.isResolved)
    const displayWps = showResolved ? wps : unresolvedWps

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

    // 가상 스크롤 Row 컴포넌트 생성 함수
    const createWeakPointRowComponent = useCallback(
        (wps: WeakPoint[], noteId: string) => {
            return function WeakPointRowComponent({ index, style }: { index: number; style: CSSProperties }) {
                const wp = wps[index]
                return (
                    <div style={style}>
                        <WeakPointItem
                            wp={wp}
                            noteId={noteId}
                            isResolved={wp.isResolved}
                            handleResolveWeakPoint={handleResolveWeakPoint}
                        />
                    </div>
                )
            }
        },
        [WeakPointItem]
    )

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
                        <span className="font-mono text-sm text-[var(--text-secondary)]">{note.studyCount}회</span>
                        {note.lastStudiedAt && (
                            <span className="font-mono text-sm text-[var(--text-secondary)]">
                                {formatDate(note.lastStudiedAt)}
                            </span>
                        )}
                        {note.weakPointCount > 0 && (
                            <span className="font-mono text-sm text-[var(--error)]">취약점 {note.weakPointCount}</span>
                        )}
                    </div>
                </div>

                {/* 모드 표시 */}
                <div className="flex items-center gap-1">
                    {note.modeBreakdown?.word && <span className={modeConfig.word.color}>{modeConfig.word.icon}</span>}
                    {note.modeBreakdown?.sentence && (
                        <span className={modeConfig.sentence.color}>{modeConfig.sentence.icon}</span>
                    )}
                    {note.modeBreakdown?.essay && (
                        <span className={modeConfig.essay.color}>{modeConfig.essay.icon}</span>
                    )}
                </div>

                {isExpanded ? (
                    <IconChevronUp size={16} className="text-[var(--text-secondary)]" />
                ) : (
                    <IconChevronDown size={16} className="text-[var(--text-secondary)]" />
                )}
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
                                <SectionTitle size="base" className="mb-2">
                                    모드별 성적
                                </SectionTitle>

                                {/* 전체 정답률 바 */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono text-sm text-[var(--text-secondary)]">
                                            전체 정답률
                                        </span>
                                        <span className="font-mono text-sm text-[var(--text-secondary)]">
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

                                {renderModeStats(note.modeBreakdown?.word, 'word')}
                                {renderModeStats(note.modeBreakdown?.sentence, 'sentence')}
                                {renderModeStats(note.modeBreakdown?.essay, 'essay')}

                                {!note.modeBreakdown?.word &&
                                    !note.modeBreakdown?.sentence &&
                                    !note.modeBreakdown?.essay && (
                                        <div className="font-mono text-sm text-[var(--text-secondary)] text-center py-4">
                                            모드별 학습 기록이 없습니다
                                        </div>
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
                                                style={{
                                                    height: Math.min(displayWps.length * WEAK_POINT_ITEM_HEIGHT, 400),
                                                    width: '100%',
                                                }}
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {displayWps.map((wp) => (
                                                    <WeakPointItem
                                                        key={wp.id}
                                                        wp={wp}
                                                        noteId={note.noteId}
                                                        isResolved={wp.isResolved}
                                                        handleResolveWeakPoint={handleResolveWeakPoint}
                                                    />
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
                                        <div className="font-mono text-sm text-[var(--text-secondary)] text-center py-4">
                                            취약점 로딩 중...
                                        </div>
                                    </div>
                                )}

                                {wps.length === 0 &&
                                    loadingWeakPoints !== note.noteId &&
                                    noteWeakPoints[note.noteId] !== undefined && (
                                        <div className="mt-4 pt-4 border-t border-dashed border-[var(--border-light)]">
                                            <div className="font-mono text-sm text-[var(--success)] text-center py-4">
                                                기록된 취약점이 없습니다
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
