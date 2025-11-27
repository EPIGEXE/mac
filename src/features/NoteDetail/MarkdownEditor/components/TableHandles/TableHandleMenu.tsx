/**
 * 테이블 핸들 컨텍스트 메뉴
 */
import { useEffect, useRef } from 'react'
import { useFloating, offset, flip, shift } from '@floating-ui/react'

interface TableHandleMenuProps {
    type: 'row' | 'col'
    anchorRect: DOMRect
    onClose: () => void
    onExecute: (command: 'addBefore' | 'addAfter' | 'delete') => void
    onDeleteTable?: () => void
    onToggleHeader?: () => void
    isFirstRow?: boolean
    isFirstCol?: boolean
}

export function TableHandleMenu({
    type,
    anchorRect,
    onClose,
    onExecute,
    onDeleteTable,
    onToggleHeader,
    isFirstRow,
    isFirstCol,
}: TableHandleMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    const { refs, floatingStyles } = useFloating({
        placement: type === 'row' ? 'left-start' : 'bottom-start',
        middleware: [offset(4), flip(), shift()],
    })

    // 참조 위치 설정
    useEffect(() => {
        refs.setReference({
            getBoundingClientRect: () => anchorRect,
        })
    }, [anchorRect, refs])

    // 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        // 약간의 딜레이를 주어 클릭 이벤트가 즉시 발생하지 않도록
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 0)

        return () => {
            clearTimeout(timeoutId)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    const menuItems =
        type === 'row'
            ? [
                  { label: '위에 행 추가', command: 'addBefore' as const, icon: '↑' },
                  { label: '아래에 행 추가', command: 'addAfter' as const, icon: '↓' },
                  ...(isFirstRow && onToggleHeader
                      ? [
                            { type: 'divider' as const },
                            { label: '헤더 행 토글', command: 'toggleHeader' as const, icon: '▤' },
                        ]
                      : []),
                  { type: 'divider' as const },
                  { label: '행 삭제', command: 'delete' as const, danger: true, icon: '×' },
              ]
            : [
                  { label: '왼쪽에 열 추가', command: 'addBefore' as const, icon: '←' },
                  { label: '오른쪽에 열 추가', command: 'addAfter' as const, icon: '→' },
                  ...(isFirstCol && onToggleHeader
                      ? [
                            { type: 'divider' as const },
                            { label: '헤더 열 토글', command: 'toggleHeader' as const, icon: '▥' },
                        ]
                      : []),
                  { type: 'divider' as const },
                  { label: '열 삭제', command: 'delete' as const, danger: true, icon: '×' },
              ]

    return (
        <div
            ref={(node) => {
                menuRef.current = node
                refs.setFloating(node)
            }}
            className="z-[1000] bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-1 min-w-[160px]"
            style={floatingStyles}
        >
            {menuItems.map((item, index) => {
                if (item.type === 'divider') {
                    return <div key={`divider-${index}`} className="h-px bg-[var(--border-light)] mx-2 my-1" />
                }

                return (
                    <button
                        key={item.command}
                        onClick={() => {
                            // 먼저 메뉴를 닫고 명령 실행 (DOM 변경 전에 메뉴 제거)
                            onClose()
                            if (item.command === 'toggleHeader' && onToggleHeader) {
                                onToggleHeader()
                            } else {
                                onExecute(item.command as 'addBefore' | 'addAfter' | 'delete')
                            }
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2 border-none bg-transparent text-left cursor-pointer text-[13px] rounded transition-[background] duration-150 hover:bg-[var(--bg-secondary)] ${
                            item.danger ? 'text-[#ef4444]' : 'text-[var(--text-primary)]'
                        }`}
                    >
                        <span className="w-4 text-center opacity-60">{item.icon}</span>
                        {item.label}
                    </button>
                )
            })}

            {/* 테이블 삭제 옵션 */}
            {onDeleteTable && (
                <>
                    <div className="h-px bg-[var(--border-light)] mx-2 my-1" />
                    <button
                        onClick={() => {
                            onClose()
                            onDeleteTable()
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 border-none bg-transparent text-left cursor-pointer text-[13px] rounded text-[#ef4444] transition-[background] duration-150 hover:bg-[rgba(239,68,68,0.1)]"
                    >
                        <span className="w-4 text-center opacity-60">🗑</span>
                        테이블 삭제
                    </button>
                </>
            )}
        </div>
    )
}
