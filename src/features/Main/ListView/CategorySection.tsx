import { forwardRef } from 'react'
import type { Note } from '../../../db/schema/note'
import { NoteTags } from '../../../components/common/NoteTags'

export interface CategorySectionProps {
    category: string // 카테고리 이름
    notes: Note[] // 카테고리에 속한 노트 목록
    onNoteClick: (noteId: string) => void // 노트 클릭 핸들러
    onCreateNote: (category: string) => void // 새 노트 생성 핸들러
}

export const CategorySection = forwardRef<HTMLDivElement, CategorySectionProps>(
    ({ category, notes, onNoteClick, onCreateNote }, ref) => {

        return (
            <div ref={ref} className="mb-8 md:mb-12 scroll-mt-[100px]">
                {/* 카테고리 헤더 */}
                <div className="flex items-center justify-between mb-3 md:mb-4 pb-2 md:pb-3 border-b border-[var(--border-light)]">
                    <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-mono text-base text-[var(--accent)] shrink-0">#</span>
                        <h3 className="font-display text-xl font-normal text-[var(--text-primary)] tracking-wide truncate">
                            {category}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        {/* 배열 인덱스 스타일 카운트 */}
                        <span className="font-mono text-sm text-[var(--text-tertiary)]">[{notes.length}]</span>

                        {/* 터미널 스타일 새 노트 버튼 */}
                        <button
                            onClick={() => onCreateNote(category)}
                            className="p-0 font-mono text-sm text-[var(--text-tertiary)] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[var(--accent)]"
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
                            className={`group px-2 md:px-3 py-3 md:py-4 bg-transparent text-left cursor-pointer transition-all duration-150 flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-5 hover:bg-[var(--bg-hover)] ${
                                idx < notes.length - 1 ? 'border-b border-dashed border-[var(--border-light)]' : ''
                            }`}
                            onClick={() => onNoteClick(note.id)}
                        >
                            <div className="flex gap-2 md:gap-3 flex-1 min-w-0">
                                {/* 터미널 스타일 화살표 */}
                                <span className="font-mono text-base text-[var(--text-tertiary)] transition-colors duration-150 shrink-0 group-hover:text-[var(--accent)]">
                                    {'>'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-display text-base font-normal text-[var(--text-primary)] mb-1 md:mb-1.5 tracking-wide">
                                        {note.title}
                                    </div>
                                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap">
                                        {note.firstLine || '내용 없음'}
                                    </div>
                                </div>
                            </div>
                            {/* 태그 - 모바일에서는 왼쪽 정렬, 데스크톱에서는 오른쪽 정렬 */}
                            <NoteTags tag={note.tag} className="ml-5 md:ml-0 md:justify-end shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }
)

CategorySection.displayName = 'CategorySection'
