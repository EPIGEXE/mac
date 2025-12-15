/**
 * 학습 모드 선택 모달
 */
import { TerminalModal } from '../../components/common/TerminalModal'
import type { StudyModeType } from '../Study/types'

interface StudyModeSelectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedMode: StudyModeType
    onModeChange: (mode: StudyModeType) => void
    onStart: () => void
}

const MODES: { value: StudyModeType; label: string; mono: string; description: string }[] = [
    {
        value: 'word',
        mono: 'word',
        label: '단어',
        description: '핵심 키워드를 빈칸으로',
    },
    {
        value: 'sentence',
        mono: 'sent',
        label: '문장',
        description: '핵심 문장을 빈칸으로',
    },
    {
        value: 'essay',
        mono: 'essay',
        label: '서술형',
        description: '질문에 답변 작성',
    },
]

export function StudyModeSelectModal({
    open,
    onOpenChange,
    selectedMode,
    onModeChange,
    onStart,
}: StudyModeSelectModalProps) {
    return (
        <TerminalModal
            open={open}
            onOpenChange={onOpenChange}
            command="study --mode select"
            title="학습 모드"
            description="// select study mode"
        >
            {/* 모드 선택 */}
            <div className="mb-6">
                <div className="font-mono text-sm text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
                    // mode
                </div>
                <div className="flex flex-col border-l-2 border-[var(--border-light)]">
                    {MODES.map((mode, index) => {
                        const isSelected = selectedMode === mode.value

                        return (
                            <button
                                key={mode.value}
                                onClick={() => onModeChange(mode.value)}
                                className={`
                                    group py-3 px-4 bg-transparent text-left cursor-pointer
                                    transition-all duration-150 border-l-2 -ml-0.5
                                    ${
                                        isSelected
                                            ? 'border-l-[var(--accent)]'
                                            : 'border-l-transparent hover:border-l-[var(--text-tertiary)]'
                                    }
                                `}
                            >
                                <div className="flex items-baseline gap-3">
                                    {/* 터미널 스타일 화살표 */}
                                    <span
                                        className={`font-mono text-sm transition-colors duration-150 ${
                                            isSelected
                                                ? 'text-[var(--accent)]'
                                                : 'text-[var(--text-tertiary)] group-hover:text-[var(--accent)]'
                                        }`}
                                    >
                                        {'>'}
                                    </span>
                                    {/* 모노 접두사 */}
                                    <span
                                        className={`font-mono text-xs ${
                                            isSelected
                                                ? 'text-[var(--accent)]'
                                                : 'text-[var(--text-tertiary)]'
                                        }`}
                                    >
                                        {mode.mono}
                                    </span>
                                    {/* 라벨 */}
                                    <span
                                        className={`text-md ${
                                            isSelected
                                                ? 'font-semibold text-[var(--text-primary)]'
                                                : 'font-normal text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        {mode.label}
                                    </span>
                                </div>
                                {/* 설명 */}
                                <div className="font-mono text-sm text-[var(--text-secondary)] mt-1 ml-6">
                                    {mode.description}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 시작 버튼 */}
            <button
                onClick={onStart}
                className="w-full py-3 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <span className="text-sm opacity-80">▶</span>
                start
            </button>
        </TerminalModal>
    )
}
