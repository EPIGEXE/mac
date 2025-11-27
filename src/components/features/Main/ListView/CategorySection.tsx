import { forwardRef } from 'react'
import type { Note } from '../../../../lib/db'

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
            <div ref={ref} style={{ marginBottom: '48px', scrollMarginTop: '100px' }}>
                {/* 카테고리 헤더 - 터미널 스타일 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--border-light)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '16px',
                                color: 'var(--accent)',
                            }}
                        >
                            #
                        </span>
                        <h3
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '20px',
                                fontWeight: 'var(--font-weight-regular)',
                                color: 'var(--text-primary)',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {category}
                        </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* 배열 인덱스 스타일 카운트 */}
                        <span
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            [{notes.length}]
                        </span>
                        {/* 터미널 스타일 새 노트 버튼 */}
                        <button
                            onClick={() => onCreateNote(category)}
                            style={{
                                padding: '0',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px',
                                color: 'var(--text-tertiary)',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--accent)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-tertiary)'
                            }}
                        >
                            + new
                        </button>
                    </div>
                </div>

                {/* 노트 리스트 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {notes.map((note, idx) => (
                        <button
                            key={note.id}
                            onClick={() => onNoteClick(note.id)}
                            style={{
                                padding: '16px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: idx < notes.length - 1 ? '1px dashed var(--border-light)' : 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '20px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                                const arrow = e.currentTarget.querySelector('.note-arrow') as HTMLElement
                                if (arrow) arrow.style.color = 'var(--accent)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                const arrow = e.currentTarget.querySelector('.note-arrow') as HTMLElement
                                if (arrow) arrow.style.color = 'var(--text-tertiary)'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: 0 }}>
                                {/* 터미널 스타일 화살표 */}
                                <span
                                    className="note-arrow"
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '16px',
                                        color: 'var(--text-tertiary)',
                                        transition: 'color 0.15s',
                                        flexShrink: 0,
                                    }}
                                >
                                    {'>'}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '16px',
                                            fontWeight: 'var(--font-weight-regular)',
                                            color: 'var(--text-primary)',
                                            marginBottom: '6px',
                                            letterSpacing: '0.02em',
                                        }}
                                    >
                                        {note.title}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: 'var(--font-system)',
                                            fontSize: '14px',
                                            color: 'var(--text-secondary)',
                                            lineHeight: '1.5',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {getFirstLine(note.content) || '내용 없음'}
                                    </div>
                                </div>
                            </div>
                            {/* 태그 - 모노스페이스 스타일 */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                    justifyContent: 'flex-end',
                                    maxWidth: '280px',
                                }}
                            >
                                {note.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '11px',
                                            padding: '4px 10px',
                                            backgroundColor: 'transparent',
                                            color: 'var(--text-tertiary)',
                                            border: '1px solid var(--border-light)',
                                            whiteSpace: 'nowrap',
                                        }}
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
