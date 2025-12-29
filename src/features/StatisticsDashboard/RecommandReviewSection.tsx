import { IconAlertTriangle } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { RecommendedNote } from '../../db/study/types'
import { formatDate } from '../../utils/funtion'
import { useNavigate } from 'react-router-dom'

// 추천 이유 라벨
const reasonLabels: Record<RecommendedNote['reason'], string> = {
    has_weak_points: '취약점 있음',
    low_accuracy: '낮은 정답률',
    not_studied_recently: '오래 안함',
    never_studied: '미학습',
}

// 추천 이유 아이콘 색상
const reasonColors: Record<RecommendedNote['reason'], string> = {
    has_weak_points: 'text-[var(--error)]',
    low_accuracy: 'text-[var(--warning)]',
    not_studied_recently: 'text-[var(--text-tertiary)]',
    never_studied: 'text-[var(--accent)]',
}

export function RecommandReviewSection({
    recommendedNotes,
    noteTitles,
}: {
    recommendedNotes: RecommendedNote[]
    noteTitles: Record<string, string>
}) {
    const navigate = useNavigate()

    // 추천 노트 보기
    const handleViewRecommended = (noteId: string) => {
        navigate(`/note/${noteId}`)
    }

    return (
        <motion.section
            className="mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <IconAlertTriangle size={16} className="text-[var(--warning)]" />
                    <span className="text-base text-[var(--text-primary)]">복습 추천</span>
                    <span className="font-mono text-sm text-[var(--text-tertiary)]">[{recommendedNotes.length}]</span>
                </div>
            </div>

            <div className="border border-[var(--warning)]/30 bg-[var(--warning)]/5">
                {recommendedNotes.map((rec, idx) => (
                    <div
                        key={rec.noteId}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-3 md:px-4 py-2.5 md:py-3 ${idx < recommendedNotes.length - 1 ? 'border-b border-[var(--warning)]/20' : ''}`}
                    >
                        {/* 상단 행: 우선순위, 이유 태그, 노트 제목 */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            {/* 우선순위 */}
                            <span className="font-mono text-xs text-[var(--text-tertiary)] w-6 shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                            </span>

                            {/* 이유 태그 */}
                            <span
                                className={`font-mono text-[10px] px-1.5 py-0.5 border border-current shrink-0 ${reasonColors[rec.reason]}`}
                            >
                                {reasonLabels[rec.reason]}
                            </span>

                            {/* 노트 제목 */}
                            <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate min-w-0">
                                {noteTitles[rec.noteId] || rec.noteId}
                            </span>
                        </div>

                        {/* 하단 행 (모바일) / 우측 (데스크톱): 추가 정보 + 버튼 */}
                        <div className="flex items-center gap-2 sm:gap-3 ml-8 sm:ml-0 shrink-0">
                            {rec.accuracy !== undefined && (
                                <span className="font-mono text-xs text-[var(--error)]">{rec.accuracy}%</span>
                            )}
                            {rec.weakPointCount !== undefined && (
                                <span className="font-mono text-xs text-[var(--error)]">{rec.weakPointCount} weak</span>
                            )}
                            {rec.lastStudiedAt && (
                                <span className="font-mono text-xs text-[var(--text-tertiary)] hidden sm:inline">
                                    {formatDate(rec.lastStudiedAt)}
                                </span>
                            )}

                            {/* 노트 보기 버튼 */}
                            <button
                                onClick={() => handleViewRecommended(rec.noteId)}
                                className="px-2 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] ml-auto sm:ml-0"
                            >
                                보기 →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </motion.section>
    )
}
