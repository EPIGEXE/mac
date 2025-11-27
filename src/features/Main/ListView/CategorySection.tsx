import { forwardRef } from 'react'
import type { Note } from '../../../lib/db'

// 노트 콘텐츠 첫 라인 추출
function getFirstLine(content: string): string {
    if (!content) return ''
    const firstLine = content.split('\n').find((line) => line.trim() && !line.startsWith('#'))
    return firstLine?.trim() || ''
}

export interface CategorySectionProps {
    category: string
    notes: Note[]
    onNoteClick: (noteId: string) => void
    onCreateNote: (category: string) => void
}

export const CategorySection = forwardRef<HTMLDivElement, CategorySectionProps>(
    ({ category, notes, onNoteClick, onCreateNote }, ref) => {
        return (
            <div ref={ref} className="mb-12 scroll-mt-[100px]">
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
                        <button
                            key={note.id}
                            onClick={() => onNoteClick(note.id)}
                            className={`group px-3 py-4 bg-transparent border-none text-left cursor-pointer transition-all duration-150 flex justify-between items-start gap-5 hover:bg-[var(--bg-hover)] ${
                                idx < notes.length - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''
                            }`}
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
                            {/* 태그 - 모노스페이스 스타일 */}
                            <div className="flex gap-2 flex-wrap justify-end max-w-[280px]">
                                {note.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="font-mono text-[11px] px-2.5 py-1 bg-transparent text-[var(--text-tertiary)] border border-[var(--border-light)] whitespace-nowrap"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    }
)

CategorySection.displayName = 'CategorySection'
