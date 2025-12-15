/**
 * 노트 선택 컴포넌트
 * - 2단계 트리 구조 (대주제 > 소주제 > 노트)
 * - 전체 선택/해제
 * - 최대 10개 선택 제한
 */
import { useState, useMemo, useCallback } from 'react'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { mainCategories, type Category } from '../../../data/categories'
import type { Note } from '../../../db/schema/note'

const MAX_SELECTION = 10

interface NoteSelectorProps {
    notes: Note[]
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
}

// 2단계 트리 구조 타입
interface SubCategoryGroup {
    category: Category
    notes: Note[]
}

interface MainCategoryGroup {
    mainCategory: typeof mainCategories[number]
    subCategories: SubCategoryGroup[]
}

export function NoteSelector({ notes, selectedIds, onSelectionChange }: NoteSelectorProps) {
    // 대주제별 펼침 상태
    const [expandedMain, setExpandedMain] = useState<Set<string>>(() => {
        return new Set(mainCategories.map(m => m.id))
    })

    // 소주제별 펼침 상태
    const [expandedSub, setExpandedSub] = useState<Set<string>>(() => {
        // 기본적으로 모든 소주제 펼침
        const allSubs = new Set<string>()
        mainCategories.forEach(main => {
            main.categories.forEach(cat => {
                allSubs.add(`${main.id}-${cat}`)
            })
        })
        return allSubs
    })

    // 2단계 트리 구조로 노트 그룹화
    const groupedNotes = useMemo(() => {
        const groups: MainCategoryGroup[] = []

        mainCategories.forEach(main => {
            const subCategories: SubCategoryGroup[] = []

            main.categories.forEach(category => {
                const categoryNotes = notes.filter(note => note.category === category)
                if (categoryNotes.length > 0) {
                    subCategories.push({ category, notes: categoryNotes })
                }
            })

            if (subCategories.length > 0) {
                groups.push({ mainCategory: main, subCategories })
            }
        })

        return groups
    }, [notes])

    // 선택 가능한지 확인 (최대 10개 제한)
    const canSelect = useCallback((count: number) => {
        return selectedIds.length + count <= MAX_SELECTION
    }, [selectedIds.length])

    // 전체 해제
    const handleDeselectAll = useCallback(() => {
        onSelectionChange([])
    }, [onSelectionChange])

    // 개별 노트 토글
    const handleToggleNote = useCallback((noteId: string) => {
        if (selectedIds.includes(noteId)) {
            onSelectionChange(selectedIds.filter(id => id !== noteId))
        } else {
            if (canSelect(1)) {
                onSelectionChange([...selectedIds, noteId])
            }
        }
    }, [selectedIds, onSelectionChange, canSelect])

    // 소주제 전체 토글
    const handleToggleSubCategory = useCallback((categoryNotes: Note[]) => {
        const categoryNoteIds = categoryNotes.map(n => n.id)
        const selectedInCategory = categoryNoteIds.filter(id => selectedIds.includes(id))
        const allSelected = selectedInCategory.length === categoryNoteIds.length

        if (allSelected) {
            // 모두 선택됨 → 해제
            onSelectionChange(selectedIds.filter(id => !categoryNoteIds.includes(id)))
        } else {
            // 일부 또는 전부 미선택 → 선택 가능한 만큼만 선택
            const unselectedIds = categoryNoteIds.filter(id => !selectedIds.includes(id))
            const availableSlots = MAX_SELECTION - selectedIds.length
            const idsToAdd = unselectedIds.slice(0, availableSlots)

            if (idsToAdd.length > 0) {
                onSelectionChange([...selectedIds, ...idsToAdd])
            }
        }
    }, [selectedIds, onSelectionChange])

    // 대주제 전체 토글
    const handleToggleMainCategory = useCallback((subCategories: SubCategoryGroup[]) => {
        const allNoteIds = subCategories.flatMap(sub => sub.notes.map(n => n.id))
        const selectedInMain = allNoteIds.filter(id => selectedIds.includes(id))
        const allSelected = selectedInMain.length === allNoteIds.length

        if (allSelected) {
            // 모두 선택됨 → 해제
            onSelectionChange(selectedIds.filter(id => !allNoteIds.includes(id)))
        } else {
            // 일부 또는 전부 미선택 → 선택 가능한 만큼만 선택
            const unselectedIds = allNoteIds.filter(id => !selectedIds.includes(id))
            const availableSlots = MAX_SELECTION - selectedIds.length
            const idsToAdd = unselectedIds.slice(0, availableSlots)

            if (idsToAdd.length > 0) {
                onSelectionChange([...selectedIds, ...idsToAdd])
            }
        }
    }, [selectedIds, onSelectionChange])

    // 대주제 펼침/접힘 토글
    const handleToggleExpandMain = useCallback((mainId: string) => {
        setExpandedMain(prev => {
            const next = new Set(prev)
            if (next.has(mainId)) {
                next.delete(mainId)
            } else {
                next.add(mainId)
            }
            return next
        })
    }, [])

    // 소주제 펼침/접힘 토글
    const handleToggleExpandSub = useCallback((subKey: string) => {
        setExpandedSub(prev => {
            const next = new Set(prev)
            if (next.has(subKey)) {
                next.delete(subKey)
            } else {
                next.add(subKey)
            }
            return next
        })
    }, [])

    // 선택 상태 계산
    const getSelectionState = useCallback((noteIds: string[]): 'all' | 'some' | 'none' => {
        const selectedCount = noteIds.filter(id => selectedIds.includes(id)).length
        if (selectedCount === 0) return 'none'
        if (selectedCount === noteIds.length) return 'all'
        return 'some'
    }, [selectedIds])

    // 체크박스 렌더링
    const renderCheckbox = (state: 'all' | 'some' | 'none', onClick: () => void) => (
        <button
            onClick={onClick}
            className={`
                w-4 h-4 border flex items-center justify-center cursor-pointer transition-colors shrink-0
                ${state === 'all'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : state === 'some'
                        ? 'bg-[var(--accent)]/30 border-[var(--accent)]'
                        : 'border-[var(--border-light)] hover:border-[var(--accent)]'
                }
            `}
        >
            {state === 'all' && <span className="text-xs">✓</span>}
            {state === 'some' && <span className="text-xs">−</span>}
        </button>
    )

    const isMaxReached = selectedIds.length >= MAX_SELECTION

    return (
        <div className="border border-[var(--border-light)] bg-[var(--bg-paper)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
                <div className="font-mono text-sm text-[var(--text-secondary)]">
                    선택됨: <span className="text-[var(--accent)]">{selectedIds.length}</span>
                    <span className="text-[var(--text-secondary)]">/{MAX_SELECTION}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDeselectAll}
                        className="px-3 py-1 font-mono text-xs border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] transition-colors cursor-pointer"
                    >
                        전체 해제
                    </button>
                </div>
            </div>

            {/* 최대 선택 경고 */}
            {isMaxReached && (
                <div className="px-4 py-2 bg-[var(--warning-light)] border-b border-[var(--warning)]/30">
                    <span className="font-mono text-xs text-[var(--warning)]">
                        // 최대 {MAX_SELECTION}개까지 선택 가능합니다
                    </span>
                </div>
            )}

            {/* 2단계 트리 구조 노트 목록 */}
            <div className="max-h-[500px] overflow-y-auto">
                {groupedNotes.map(({ mainCategory, subCategories }) => {
                    const mainId = mainCategory.id
                    const isMainExpanded = expandedMain.has(mainId)
                    const allMainNoteIds = subCategories.flatMap(sub => sub.notes.map(n => n.id))
                    const mainSelectionState = getSelectionState(allMainNoteIds)

                    return (
                        <div key={mainId} className="border-b border-[var(--border-light)] last:border-b-0">
                            {/* 대주제 헤더 */}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)]">
                                <button
                                    onClick={() => handleToggleExpandMain(mainId)}
                                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
                                >
                                    {isMainExpanded
                                        ? <IconChevronDown size={16} />
                                        : <IconChevronRight size={16} />
                                    }
                                </button>

                                {renderCheckbox(mainSelectionState, () => handleToggleMainCategory(subCategories))}

                                <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                                    {mainCategory.label}
                                </span>
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                    ({allMainNoteIds.length})
                                </span>
                            </div>

                            {/* 소주제 목록 */}
                            {isMainExpanded && (
                                <div>
                                    {subCategories.map(({ category, notes: categoryNotes }) => {
                                        const subKey = `${mainId}-${category}`
                                        const isSubExpanded = expandedSub.has(subKey)
                                        const subNoteIds = categoryNotes.map(n => n.id)
                                        const subSelectionState = getSelectionState(subNoteIds)

                                        return (
                                            <div key={subKey}>
                                                {/* 소주제 헤더 */}
                                                <div className="flex items-center gap-2 px-4 py-2 pl-8 bg-[var(--bg-paper)] border-t border-[var(--border-light)]">
                                                    <button
                                                        onClick={() => handleToggleExpandSub(subKey)}
                                                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer"
                                                    >
                                                        {isSubExpanded
                                                            ? <IconChevronDown size={14} />
                                                            : <IconChevronRight size={14} />
                                                        }
                                                    </button>

                                                    {renderCheckbox(subSelectionState, () => handleToggleSubCategory(categoryNotes))}

                                                    <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                        {category}
                                                    </span>
                                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                        ({categoryNotes.length})
                                                    </span>
                                                </div>

                                                {/* 노트 목록 */}
                                                {isSubExpanded && (
                                                    <div className="py-1">
                                                        {categoryNotes.map(note => {
                                                            const isSelected = selectedIds.includes(note.id)
                                                            const isDisabled = !isSelected && isMaxReached

                                                            return (
                                                                <button
                                                                    key={note.id}
                                                                    onClick={() => !isDisabled && handleToggleNote(note.id)}
                                                                    disabled={isDisabled}
                                                                    className={`
                                                                        w-full flex items-center gap-3 px-4 py-2 pl-14 transition-colors text-left
                                                                        ${isDisabled
                                                                            ? 'opacity-50 cursor-not-allowed'
                                                                            : 'hover:bg-[var(--bg-secondary)] cursor-pointer'
                                                                        }
                                                                    `}
                                                                >
                                                                    <span className={`
                                                                        w-4 h-4 border flex items-center justify-center shrink-0 transition-colors
                                                                        ${isSelected
                                                                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                                                                            : 'border-[var(--border-light)]'
                                                                        }
                                                                    `}>
                                                                        {isSelected && <span className="text-xs">✓</span>}
                                                                    </span>

                                                                    <span className={`
                                                                        font-mono text-sm truncate
                                                                        ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}
                                                                    `}>
                                                                        {note.title}
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
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Empty State */}
            {notes.length === 0 && (
                <div className="px-4 py-8 text-center">
                    <span className="font-mono text-sm text-[var(--text-primary)]">
                        // 노트가 없습니다
                    </span>
                </div>
            )}
        </div>
    )
}
