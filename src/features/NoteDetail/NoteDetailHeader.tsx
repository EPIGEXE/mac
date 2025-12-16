import { IconArrowLeft, IconMoon, IconSun } from '@tabler/icons-react'
import { TerminalButton } from '../../components/common/TerminalButton'
import { useTheme } from '../../contexts/useTheme'

interface NoteDetailHeaderProps {
    handleBack: () => void
    handleStudyStart: () => void
    handleSave: () => void
    handleDeleteClick: () => void
    canSave: boolean
    disabledSave: boolean
}

export function NoteDetailHeader({
    handleBack,
    handleStudyStart,
    handleSave,
    handleDeleteClick,
    canSave,
    disabledSave,
}: NoteDetailHeaderProps) {
    const { theme, toggleTheme } = useTheme() // 테마

    return (
        <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
            <div className="main-container px-6 py-4 flex items-center justify-between">
                {/* 좌측: 뒤로가기 */}
                <button
                    onClick={handleBack}
                    className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                >
                    <IconArrowLeft size={18} />
                    {'<'} back
                </button>

                {/* 우측: 컨트롤 */}
                <div className="flex items-center gap-4">
                    {/* 학습 버튼 */}
                    <TerminalButton onClick={handleStudyStart} variant="filled">
                        <span className="text-[11px] opacity-80">▶</span>
                        study
                    </TerminalButton>

                    {/* 저장/삭제 버튼 */}
                    <TerminalButton onClick={handleSave} active={canSave} disabled={disabledSave}>
                        :w save
                    </TerminalButton>
                    <TerminalButton onClick={handleDeleteClick} variant="danger">
                        :d delete
                    </TerminalButton>

                    {/* 테마 토글 */}
                    <button onClick={toggleTheme} className="border-highlight-button w-8 h-8 ">
                        {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                    </button>
                </div>
            </div>
        </header>
    )
}
