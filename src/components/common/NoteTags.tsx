import type { NoteTag } from '../../data/categories'
import { TAG_LABELS } from '../../data/categories'

interface NoteTagsProps {
    tag?: NoteTag
    className?: string
}

export function NoteTags({ tag, className = '' }: NoteTagsProps) {
    if (!tag) return null

    return (
        <div className={`flex gap-2 flex-wrap ${className}`}>
            <span
                className={`font-mono text-[11px] px-2 py-0.5 border whitespace-nowrap ${
                    tag.level === 'beginner'
                        ? 'text-[var(--text-tertiary)] border-[var(--border-light)]'
                        : tag.level === 'advanced'
                          ? 'font-medium text-[var(--accent)] border-[var(--accent)]'
                          : 'text-[var(--text-tertiary)] border-[var(--border-light)]'
                }`}
            >
                {tag.level === 'beginner' ? '·' : tag.level === 'intermediate' ? '··' : '···'}{' '}
                {TAG_LABELS.LEVEL[tag.level]}
            </span>
            <span
                className={`font-mono text-[11px] px-2 py-0.5 border whitespace-nowrap ${
                    tag.importance === 'good'
                        ? 'text-[var(--text-tertiary)] border-[var(--border-light)]'
                        : tag.importance === 'core'
                          ? 'font-medium text-[var(--accent)] border-[var(--accent)]'
                          : 'text-[var(--text-tertiary)] border-[var(--border-light)]'
                }`}
            >
                {tag.importance === 'good' ? '·' : tag.importance === 'useful' ? '··' : '···'}{' '}
                {TAG_LABELS.IMPORTANCE[tag.importance]}
            </span>
            {tag.interview && (
                <span
                    className={`font-mono text-[11px] px-2 py-0.5 border whitespace-nowrap ${
                        tag.interview === 'must'
                            ? 'font-medium text-[var(--accent)] border-[var(--accent)]'
                            : 'text-[var(--text-tertiary)] border-[var(--border-light)]'
                    }`}
                >
                    {tag.interview === 'common' ? '·' : '··'} {TAG_LABELS.INTERVIEW[tag.interview]}
                </span>
            )}
        </div>
    )
}
