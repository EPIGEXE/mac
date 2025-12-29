import type { NoteTag } from '../../data/categories'
import { NoteTags } from './NoteTags'

// 공통 props
interface BaseProps {
    category: string
    title: string
    tag?: NoteTag
}

// 읽기 전용
interface ReadOnlyProps extends BaseProps {
    editable?: false
}

// 편집 가능 - onTitleChange 필수
interface EditableProps extends BaseProps {
    editable: true
    onTitleChange: (title: string) => void
}

type NoteHeaderProps = ReadOnlyProps | EditableProps

const TITLE_CLASSNAME =
    'font-display text-2xl md:text-[32px] font-normal text-[var(--text-primary)] mb-4 md:mb-6 leading-[1.3] tracking-wide'

export function NoteHeader(props: NoteHeaderProps) {
    const { category, title, tag } = props

    return (
        <div className="main-container px-4 md:px-6 py-8 md:py-12">
            {/* 카테고리 */}
            <div className="flex items-center gap-2 mb-3 md:mb-5">
                <span className="font-mono text-xs text-[var(--accent)]">#</span>
                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                    {category}
                </span>
            </div>

            {/* 제목 */}
            {props.editable ? (
                <input
                    type="text"
                    value={title}
                    onChange={(e) => props.onTitleChange(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className={`w-full border-none outline-none bg-transparent ${TITLE_CLASSNAME}`}
                />
            ) : (
                <h1 className={TITLE_CLASSNAME}>{title}</h1>
            )}

            {/* 태그 */}
            <NoteTags tag={tag} className="mb-6 md:mb-8" />

            {/* 구분선 */}
            <div className="border-t border-dashed border-[var(--border-light)] mb-6 md:mb-8" />
        </div>
    )
}