/**
 * 노트 선택 컴포넌트
 * - 카테고리별 그룹화
 * - 전체 선택/해제
 * - 개별 노트 체크박스
 */
import { useState, useMemo, useCallback } from 'react'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { mainCategories } from '../../../data/categories'
import type { Note } from '../../../db/schema/note'

interface NoteSelectorProps {
    notes: Note[]
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
}

export function NoteSelector({ notes, selectedIds, onSelectionChange }: NoteSelectorProps) {
    // 카테고리별 펼침 상태
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
        // 기본적으로 모든 카테고리 펼침
        return new Set(mainCategories.map(m => m.id))
    })

    // 카테고리별 노트 그룹화
    const groupedNotes = useMemo(() => {
        const groups: Record<string, { mainCategory: typeof mainCategories[number], notes: Note[] }> = {}

        mainCategories.forEach(main => {
            const categoryNotes = notes.filter(note =>
                (main.categories as readonly string[]).includes(note.category)
            )
            if (categoryNotes.length > 0) {
                groups[main.id] = { mainCategory: main, notes: categoryNotes }
            }
        })

        return groups
    }, [notes])

    // 전체 선택
    const handleSelectAll = useCallback(() => {
        onSelectionChange(notes.map(n => n.id))
    }, [notes, onSelectionChange])

    // 전체 해제
    const handleDeselectAll = useCallback(() => {
        onSelectionChange([])
    }, [onSelectionChange])

    // 개별 노트 토글
    const handleToggleNote = useCallback((noteId: string) => {
        if (selectedIds.includes(noteId)) {
            onSelectionChange(selectedIds.filter(id => id !== noteId))
        } else {
            onSelectionChange([...selectedIds, noteId])
        }
    }, [selectedIds, onSelectionChange])

    // 카테고리 전체 토글
    const handleToggleCategory = useCallback((categoryNotes: Note[]) => {
        const categoryNoteIds = categoryNotes.map(n => n.id)
        const allSelected = categoryNoteIds.every(id => selectedIds.includes(id))

        if (allSelected) {
            // 모두 선택됨 → 해제
            onSelectionChange(selectedIds.filter(id => !categoryNoteIds.includes(id)))
        } else {
            // 일부 또는 전부 미선택 → 모두 선택
            const newIds = new Set([...selectedIds, ...categoryNoteIds])
            onSelectionChange(Array.from(newIds))
        }
    }, [selectedIds, onSelectionChange])

    // 카테고리 펼침/접힘 토글
    const handleToggleExpand = useCallback((categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(categoryId)) {
                next.delete(categoryId)
            } else {
                next.add(categoryId)
            }
            return next
        })
    }, [])

    // 카테고리 선택 상태 계산
    const getCategorySelectionState = useCallback((categoryNotes: Note[]): 'all' | 'some' | 'none' => {
        const categoryNoteIds = categoryNotes.map(n => n.id)
        const selectedCount = categoryNoteIds.filter(id => selectedIds.includes(id)).length

        if (selectedCount === 0) return 'none'
        if (selectedCount === categoryNoteIds.length) return 'all'
        return 'some'
    }, [selectedIds])

    return (
        <div className="border border-[var(--border-light)] bg-[var(--bg-paper)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
                <div className="font-mono text-sm text-[var(--text-secondary)]">
                    선택됨: <span className="text-[var(--accent)]">{selectedIds.length}</span>개
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSelectAll}
                        className="px-3 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                    >
                        전체 선택
                    </button>
                    <button
                        onClick={handleDeselectAll}
                        className="px-3 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)] transition-colors cursor-pointer"
                    >
                        전체 해제
                    </button>
                </div>
            </div>

            {/* 카테고리별 노트 목록 */}
            <div className="max-h-[400px] overflow-y-auto">
                {Object.entries(groupedNotes).map(([categoryId, { mainCategory, notes: categoryNotes }]) => {
                    const isExpanded = expandedCategories.has(categoryId)
                    const selectionState = getCategorySelectionState(categoryNotes)

                    return (
                        <div key={categoryId} className="border-b border-[var(--border-light)] last:border-b-0">
                            {/* 카테고리 헤더 */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)]">
                                {/* 펼침/접힘 버튼 */}
                                <button
                                    onClick={() => handleToggleExpand(categoryId)}
                                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
                                >
                                    {isExpanded
                                        ? <IconChevronDown size={16} />
                                        : <IconChevronRight size={16} />
                                    }
                                </button>

                                {/* 카테고리 체크박스 */}
                                <button
                                    onClick={() => handleToggleCategory(categoryNotes)}
                                    className={`
                                        w-4 h-4 border flex items-center justify-center cursor-pointer transition-colors
                                        ${selectionState === 'all'
                                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                            : selectionState === 'some'
                                                ? 'bg-[var(--accent)]/30 border-[var(--accent)]'
                                                : 'border-[var(--border-light)] hover:border-[var(--accent)]'
                                        }
                                    `}
                                >
                                    {selectionState === 'all' && <span className="text-xs">✓</span>}
                                    {selectionState === 'some' && <span className="text-xs">−</span>}
                                </button>

                                {/* 카테고리 라벨 */}
                                <span className="font-mono text-sm text-[var(--text-primary)]">
                                    {mainCategory.label}
                                </span>
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                    ({categoryNotes.length})
                                </span>
                            </div>

                            {/* 노트 목록 */}
                            {isExpanded && (
                                <div className="py-1">
                                    {categoryNotes.map(note => {
                                        const isSelected = selectedIds.includes(note.id)

                                        return (
                                            <button
                                                key={note.id}
                                                onClick={() => handleToggleNote(note.id)}
                                                className="w-full flex items-center gap-3 px-4 py-2 pl-10 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-left"
                                            >
                                                {/* 체크박스 */}
                                                <span className={`
                                                    w-4 h-4 border flex items-center justify-center shrink-0 transition-colors
                                                    ${isSelected
                                                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                                        : 'border-[var(--border-light)]'
                                                    }
                                                `}>
                                                    {isSelected && <span className="text-xs">✓</span>}
                                                </span>

                                                {/* 노트 제목 */}
                                                <span className={`
                                                    font-mono text-sm truncate
                                                    ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}
                                                `}>
                                                    {note.title}
                                                </span>

                                                {/* 카테고리 태그 */}
                                                <span className="font-mono text-xs text-[var(--text-tertiary)] shrink-0">
                                                    @{note.category}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Empty State */}
            {notes.length === 0 && (
                <div className="px-4 py-8 text-center">
                    <span className="font-mono text-sm text-[var(--text-tertiary)]">
                        // 노트가 없습니다
                    </span>
                </div>
            )}
        </div>
    )
}
