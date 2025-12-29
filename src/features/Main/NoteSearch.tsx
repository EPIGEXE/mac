/**
 * 노트 검색 컴포넌트
 * - 터미널 스타일 검색 입력창
 * - 태그 필터 (난이도/중요도/면접빈출) - Radix Select 사용
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { IconSearch, IconX, IconChevronDown, IconCheck } from '@tabler/icons-react'
import * as Select from '@radix-ui/react-select'
import { TAG_LABELS, type Level, type Importance, type Interview } from '../../data/categories'

// 태그 필터 타입
export interface TagFilter {
    level?: Level
    importance?: Importance
    interview?: Interview
}

interface NoteSearchProps {
    /** 검색어 변경 핸들러 */
    onSearch: (query: string) => void
    /** 태그 필터 변경 핸들러 */
    onTagFilter?: (filter: TagFilter) => void
    /** 현재 태그 필터 */
    tagFilter?: TagFilter
    /** placeholder 텍스트 */
    placeholder?: string
    /** 추가 클래스 */
    className?: string
}

// 필터 옵션 정의
const FILTER_OPTIONS = {
    level: {
        label: '난이도',
        options: [
            { value: 'beginner', label: TAG_LABELS.LEVEL.beginner },
            { value: 'intermediate', label: TAG_LABELS.LEVEL.intermediate },
            { value: 'advanced', label: TAG_LABELS.LEVEL.advanced },
        ],
    },
    importance: {
        label: '중요도',
        options: [
            { value: 'good', label: TAG_LABELS.IMPORTANCE.good },
            { value: 'useful', label: TAG_LABELS.IMPORTANCE.useful },
            { value: 'core', label: TAG_LABELS.IMPORTANCE.core },
        ],
    },
    interview: {
        label: '면접',
        options: [
            { value: 'common', label: TAG_LABELS.INTERVIEW.common },
            { value: 'must', label: TAG_LABELS.INTERVIEW.must },
        ],
    },
} as const

type FilterKey = keyof typeof FILTER_OPTIONS

export function NoteSearch({
    onSearch,
    onTagFilter,
    tagFilter = {},
    placeholder = '노트 검색...',
    className = '',
}: NoteSearchProps) {
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // 디바운스된 검색
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query)
        }, 150)
        return () => clearTimeout(timer)
    }, [query, onSearch])

    // 검색어 변경
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
    }, [])

    // 검색어 초기화
    const handleClear = useCallback(() => {
        setQuery('')
        inputRef.current?.focus()
    }, [])

    // 키보드 단축키
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClear()
        }
    }, [handleClear])

    // 필터 선택 핸들러
    const handleFilterChange = useCallback((key: FilterKey, value: string) => {
        onTagFilter?.({
            ...tagFilter,
            [key]: value === 'all' ? undefined : value,
        })
    }, [onTagFilter, tagFilter])

    // 활성 필터 개수
    const activeFilterCount = Object.values(tagFilter).filter(Boolean).length

    return (
        <div className={`flex flex-col gap-2 md:flex-row md:items-center md:gap-3 ${className}`}>
            {/* 검색창 */}
            <div
                className={`
                    relative flex items-center gap-2 px-3 md:px-4 h-11 md:h-12 md:flex-1
                    bg-[var(--bg-paper)] border
                    transition-all duration-200
                    ${isFocused
                        ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(var(--border-rgb),0.1)]'
                        : 'border-[var(--border-light)] hover:border-[var(--border-medium)]'
                    }
                `}
            >
                <IconSearch
                    size={18}
                    className={`shrink-0 transition-colors duration-200 ${
                        isFocused ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                    }`}
                />

                <span className={`font-mono text-sm shrink-0 transition-colors duration-200 ${
                    isFocused ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                }`}>
                    grep
                </span>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="
                        flex-1 bg-transparent outline-none
                        font-mono text-sm text-[var(--text-primary)]
                        placeholder:text-[var(--text-tertiary)]/50
                    "
                />

                <button
                    onClick={handleClear}
                    className={`
                        shrink-0 w-7 h-7 flex items-center justify-center
                        text-[var(--text-tertiary)] hover:text-[var(--accent)]
                        transition-all duration-150
                        ${query ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                    `}
                    aria-label="검색어 지우기"
                    tabIndex={query ? 0 : -1}
                >
                    <IconX size={16} />
                </button>
            </div>

            {/* 태그 필터 드롭다운들 (Radix Select) */}
            {onTagFilter && (
                <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
                    {(Object.keys(FILTER_OPTIONS) as FilterKey[]).map((key) => {
                        const config = FILTER_OPTIONS[key]
                        const currentValue = tagFilter[key]
                        const currentLabel = currentValue
                            ? config.options.find((o) => o.value === currentValue)?.label
                            : null

                        return (
                            <Select.Root
                                key={key}
                                value={currentValue ?? 'all'}
                                onValueChange={(value) => handleFilterChange(key, value)}
                            >
                                <Select.Trigger
                                    className={`
                                        flex items-center gap-1.5 h-10 md:h-12 px-2 md:px-3
                                        bg-[var(--bg-paper)] border font-mono text-xs md:text-sm cursor-pointer whitespace-nowrap
                                        transition-all duration-200 outline-none
                                        data-[state=open]:border-[var(--accent)]
                                        ${currentValue
                                            ? 'border-[var(--accent)] text-[var(--accent)]'
                                            : 'border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--border-medium)]'
                                        }
                                    `}
                                >
                                    <span className="text-[var(--text-tertiary)] text-xs">
                                        {config.label}
                                    </span>
                                    <Select.Value>
                                        <span className={currentValue ? 'text-[var(--accent)]' : ''}>
                                            {currentLabel || '-'}
                                        </span>
                                    </Select.Value>
                                    <Select.Icon>
                                        <IconChevronDown size={12} />
                                    </Select.Icon>
                                </Select.Trigger>

                                <Select.Portal>
                                    <Select.Content
                                        className="
                                            z-50 min-w-[120px]
                                            bg-[var(--bg-paper)] border border-[var(--border-light)]
                                            shadow-[var(--shadow-elevated)]
                                            animate-in fade-in-0 zoom-in-95
                                        "
                                        position="popper"
                                        sideOffset={4}
                                        align="end"
                                    >
                                        <Select.Viewport>
                                            {/* 전체 옵션 */}
                                            <Select.Item
                                                value="all"
                                                className={`
                                                    relative flex items-center px-3 py-2 pr-8
                                                    font-mono text-sm cursor-pointer outline-none
                                                    transition-colors duration-150
                                                    data-[highlighted]:bg-[var(--accent)]/15
                                                    ${!currentValue
                                                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                                        : 'text-[var(--text-secondary)]'
                                                    }
                                                `}
                                            >
                                                <Select.ItemText>전체</Select.ItemText>
                                                <Select.ItemIndicator className="absolute right-2">
                                                    <IconCheck size={14} />
                                                </Select.ItemIndicator>
                                            </Select.Item>

                                            <Select.Separator className="h-px bg-[var(--border-light)]" />

                                            {config.options.map((option) => (
                                                <Select.Item
                                                    key={option.value}
                                                    value={option.value}
                                                    className={`
                                                        relative flex items-center px-3 py-2 pr-8
                                                        font-mono text-sm cursor-pointer outline-none
                                                        transition-colors duration-150
                                                        data-[highlighted]:bg-[var(--accent)]/15
                                                        ${currentValue === option.value
                                                            ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                                            : 'text-[var(--text-secondary)]'
                                                        }
                                                    `}
                                                >
                                                    <Select.ItemText>{option.label}</Select.ItemText>
                                                    <Select.ItemIndicator className="absolute right-2">
                                                        <IconCheck size={14} />
                                                    </Select.ItemIndicator>
                                                </Select.Item>
                                            ))}
                                        </Select.Viewport>
                                    </Select.Content>
                                </Select.Portal>
                            </Select.Root>
                        )
                    })}

                    {/* 필터 초기화 버튼 - 항상 표시하되 비활성화 상태로 */}
                    <button
                        onClick={() => onTagFilter?.({})}
                        disabled={activeFilterCount === 0}
                        className={`
                            h-10 md:h-12 px-2 md:px-3 shrink-0
                            bg-[var(--bg-paper)] border font-mono text-xs cursor-pointer
                            transition-all duration-200
                            ${activeFilterCount > 0
                                ? 'border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                : 'border-[var(--border-light)] text-[var(--text-tertiary)]/30 cursor-not-allowed'
                            }
                        `}
                    >
                        초기화
                    </button>
                </div>
            )}
        </div>
    )
}
