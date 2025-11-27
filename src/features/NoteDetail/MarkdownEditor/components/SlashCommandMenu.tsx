import { useEffect, useRef } from 'react'
import type { SlashCommandState, SlashCommandItem } from '../editor/plugins'
import { defaultSlashCommands } from '../editor/plugins'
import type { EditorView } from 'prosemirror-view'

interface SlashCommandMenuProps {
    state: SlashCommandState
    view: EditorView | null
    containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * 슬래시 커맨드 메뉴 컴포넌트
 */
export function SlashCommandMenu({ state, view, containerRef }: SlashCommandMenuProps) {
    // ==================================== useRef =====================================
    const menuRef = useRef<HTMLDivElement>(null) // 메뉴 참조

    // 필터링된 커맨드 목록
    const filteredCommands = filterCommands(defaultSlashCommands, state.query)

    // 선택된 아이템으로 스크롤
    useEffect(() => {
        if (menuRef.current && state.active) {
            const selectedItem = menuRef.current.querySelector('[data-selected="true"]')
            selectedItem?.scrollIntoView({ block: 'nearest' })
        }
    }, [state.selectedIndex, state.active])

    if (!state.active || !state.position || filteredCommands.length === 0 || !containerRef.current) {
        return null
    }

    // 메뉴 위치 계산 (에디터 컨테이너 기준 absolute 위치)
    const containerRect = containerRef.current.getBoundingClientRect()
    const relativeTop = state.position.top - containerRect.top
    const relativeLeft = state.position.left - containerRect.left

    const menuStyle: React.CSSProperties = {
        position: 'absolute',
        top: relativeTop + 4,
        left: relativeLeft,
        zIndex: 1000,
    }

    // 화면 하단을 넘어가면 위로 표시
    if (state.position.top + 300 > window.innerHeight) {
        menuStyle.top = relativeTop - 300
    }

    const handleItemClick = (command: SlashCommandItem) => {
        if (!view) return

        // 슬래시와 쿼리 삭제 후 커맨드 실행
        const { state: editorState, dispatch } = view
        const { $from } = editorState.selection
        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
        const slashIndex = textBefore.lastIndexOf('/')

        if (slashIndex >= 0) {
            const deleteFrom = $from.pos - (textBefore.length - slashIndex)
            const deleteTo = $from.pos
            dispatch(editorState.tr.delete(deleteFrom, deleteTo))

            setTimeout(() => {
                command.action(view)
                view.focus()
            }, 0)
        }
    }

    return (
        <div ref={menuRef} style={menuStyle} className="slash-command-menu">
                <div className="slash-command-list">
                    {filteredCommands.map((command, index) => (
                        <div
                            key={command.id}
                            className={`slash-command-item ${index === state.selectedIndex ? 'selected' : ''}`}
                            data-selected={index === state.selectedIndex}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                handleItemClick(command)
                            }}
                            onMouseEnter={() => {
                                // 마우스 오버시 선택 상태 변경 (선택사항)
                            }}
                        >
                            <span className="slash-command-icon">{command.icon}</span>
                            <div className="slash-command-content">
                                <span className="slash-command-label">{command.label}</span>
                                <span className="slash-command-description">{command.description}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
    )
}

// 커맨드 필터링
function filterCommands(commands: SlashCommandItem[], query: string): SlashCommandItem[] {
    if (!query) return commands
    const lowerQuery = query.toLowerCase()
    return commands.filter(
        (cmd) => cmd.label.toLowerCase().includes(lowerQuery) || cmd.description.toLowerCase().includes(lowerQuery)
    )
}
