import { forwardRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Note } from '../../../db/schema/note'
import type { NoteTag } from '../../../data/categories'
import { TAG_LABELS } from '../../../data/categories'
import type { StudyModeType } from '../../Study/types'
import { StudyModeSelector } from '../../Study/components'

// 노트 콘텐츠 첫 라인 추출
function getFirstLine(content: string): string {
    if (!content) return ''
    const firstLine = content.split('\n').find((line) => line.trim() && !line.startsWith('#'))
    return firstLine?.trim() || ''
}

// 노트 태그 컴포넌트 (터미널 스타일 - 오른쪽 정렬)
function NoteTags({ tag }: { tag?: NoteTag }) {
    if (!tag) return null

    const levelLabel = TAG_LABELS.LEVEL[tag.level]
    const importanceLabel = TAG_LABELS.IMPORTANCE[tag.importance]
    const interviewLabel = tag.interview ? TAG_LABELS.INTERVIEW[tag.interview] : null

    return (
        <div className="flex gap-2 flex-wrap justify-end">
            <span className="font-mono text-[11px] px-2 py-0.5 text-[var(--text-tertiary)] border border-[var(--border-light)] whitespace-nowrap">
                {levelLabel}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 text-[var(--text-tertiary)] border border-[var(--border-light)] whitespace-nowrap">
                {importanceLabel}
            </span>
            {interviewLabel && (
                <span className="font-mono text-[11px] px-2 py-0.5 text-[var(--text-tertiary)] border border-[var(--border-light)] whitespace-nowrap">
                    {interviewLabel}
                </span>
            )}
        </div>
    )
}

export interface CategorySectionProps {
    category: string
    notes: Note[]
    onNoteClick: (noteId: string) => void
    onCreateNote: (category: string) => void
}

export const CategorySection = forwardRef<HTMLDivElement, CategorySectionProps>(
    ({ category, notes, onNoteClick, onCreateNote }, ref) => {
        const navigate = useNavigate()
        const [studyModalOpen, setStudyModalOpen] = useState(false)
        const [studyMode, setStudyMode] = useState<StudyModeType>('word')

        // 학습 시작
        const handleStudyStart = () => {
            setStudyModalOpen(false)
            navigate(`/study?category=${encodeURIComponent(category)}&mode=${studyMode}`)
        }

        return (
            <div ref={ref} className="mb-12 scroll-mt-[100px]">
                {/* 학습 모드 선택 모달 */}
                <StudyModeSelector
                    open={studyModalOpen}
                    onOpenChange={setStudyModalOpen}
                    selectedMode={studyMode}
                    onModeChange={setStudyMode}
                    onStart={handleStudyStart}
                    isLoading={false}
                />

                {/* 카테고리 헤더 - 터미널 스타일 */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-light)]">
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-base text-[var(--accent)]">#</span>
                        <h3 className="font-display text-xl font-normal text-[var(--text-primary)] tracking-wide">
                            {category}
                        </h3>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* 배열 인덱스 스타일 카운트 */}
                        <span className="font-mono text-[13px] text-[var(--text-tertiary)]">
                            [{notes.length}]
                        </span>
                        {/* 카테고리 전체 학습 - 강조 스타일 */}
                        {notes.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setStudyModalOpen(true)
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[12px] bg-[var(--accent)] text-white border-none cursor-pointer transition-all duration-150 hover:opacity-90"
                            >
                                <span className="text-[10px] opacity-80">▶</span>
                                study
                            </button>
                        )}
                        {/* 터미널 스타일 새 노트 버튼 */}
                        <button
                            onClick={() => onCreateNote(category)}
                            className="p-0 font-mono text-[13px] text-[var(--text-tertiary)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--accent)]"
                        >
                            + new
                        </button>
                    </div>
                </div>

                {/* 노트 리스트 */}
                <div className="flex flex-col">
                    {notes.map((note, idx) => (
                        <div
                            key={note.id}
                            className={`group px-3 py-4 bg-transparent text-left cursor-pointer transition-all duration-150 flex justify-between items-start gap-5 hover:bg-[var(--bg-hover)] ${
                                idx < notes.length - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''
                            }`}
                            onClick={() => onNoteClick(note.id)}
                        >
                            <div className="flex gap-3 flex-1 min-w-0">
                                {/* 터미널 스타일 화살표 */}
                                <span className="font-mono text-base text-[var(--text-tertiary)] transition-colors duration-150 shrink-0 group-hover:text-[var(--accent)]">
                                    {'>'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-display text-base font-normal text-[var(--text-primary)] mb-1.5 tracking-wide">
                                        {note.title}
                                    </div>
                                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap">
                                        {getFirstLine(note.content) || '내용 없음'}
                                    </div>
                                </div>
                            </div>
                            {/* 태그 - 오른쪽 정렬 */}
                            <NoteTags tag={note.tag} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }
)

CategorySection.displayName = 'CategorySection'
