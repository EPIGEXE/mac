/**
 * 학습 순서 선택 컴포넌트
 * - sequential: 순차적
 * - random: 랜덤
 */
import { IconList, IconArrowsShuffle } from '@tabler/icons-react'
import type { StudyOrder } from '../../../stores/studySessionStore'

interface StudyOrderSelectorProps {
    value: StudyOrder
    onChange: (order: StudyOrder) => void
}

const OPTIONS: { value: StudyOrder; label: string; mono: string; icon: typeof IconList }[] = [
    { value: 'sequential', label: '순차적', mono: 'seq', icon: IconList },
    { value: 'random', label: '랜덤', mono: 'rnd', icon: IconArrowsShuffle },
]

export function StudyOrderSelector({ value, onChange }: StudyOrderSelectorProps) {
    return (
        <div className="flex gap-2 md:gap-3">
            {OPTIONS.map(option => {
                const isSelected = value === option.value
                const Icon = option.icon

                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            flex-1 py-2.5 md:py-3 px-2 md:px-4 border transition-all cursor-pointer
                            ${isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                : 'border-[var(--border-light)] hover:border-[var(--text-tertiary)]'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Icon
                                size={18}
                                className={isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}
                            />
                            <span className={`
                                font-mono text-xs
                                ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}
                            `}>
                                {option.mono}
                            </span>
                        </div>
                        <div className={`
                            text-sm text-center
                            ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}
                        `}>
                            {option.label}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
