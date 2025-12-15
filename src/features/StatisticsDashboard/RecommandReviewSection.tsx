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
                        className={`flex items-center gap-4 px-4 py-3 ${idx < recommendedNotes.length - 1 ? 'border-b border-[var(--warning)]/20' : ''}`}
                    >
                        {/* 우선순위 */}
                        <span className="font-mono text-xs text-[var(--text-tertiary)] w-6">
                            {String(idx + 1).padStart(2, '0')}
                        </span>

                        {/* 이유 태그 */}
                        <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 border border-current ${reasonColors[rec.reason]}`}
                        >
                            {reasonLabels[rec.reason]}
                        </span>

                        {/* 노트 제목 */}
                        <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">
                            {noteTitles[rec.noteId] || rec.noteId}
                        </span>

                        {/* 추가 정보 */}
                        {rec.accuracy !== undefined && (
                            <span className="font-mono text-xs text-[var(--error)]">{rec.accuracy}%</span>
                        )}
                        {rec.weakPointCount !== undefined && (
                            <span className="font-mono text-xs text-[var(--error)]">{rec.weakPointCount} weak</span>
                        )}
                        {rec.lastStudiedAt && (
                            <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                {formatDate(rec.lastStudiedAt)}
                            </span>
                        )}

                        {/* 노트 보기 버튼 */}
                        <button
                            onClick={() => handleViewRecommended(rec.noteId)}
                            className="px-2 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            보기 →
                        </button>
                    </div>
                ))}
            </div>
        </motion.section>
    )
}
