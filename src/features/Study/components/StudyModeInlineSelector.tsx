/**
 * 학습 모드 인라인 선택 컴포넌트
 * - word: 단어 모드
 * - sentence: 문장 모드
 * - essay: 서술형 모드
 */
import type { StudyModeType } from '../types'

interface StudyModeInlineSelectorProps {
    value: StudyModeType
    onChange: (mode: StudyModeType) => void
}

const MODES: { value: StudyModeType; label: string; mono: string; description: string }[] = [
    { value: 'word', label: '단어', mono: 'word', description: '핵심 키워드를 빈칸으로' },
    { value: 'sentence', label: '문장', mono: 'sent', description: '핵심 문장을 질문으로' },
    { value: 'essay', label: '서술형', mono: 'essay', description: '면접 스타일 질문' },
]

export function StudyModeInlineSelector({ value, onChange }: StudyModeInlineSelectorProps) {
    return (
        <div className="flex gap-2 md:gap-3">
            {MODES.map(mode => {
                const isSelected = value === mode.value

                return (
                    <button
                        key={mode.value}
                        onClick={() => onChange(mode.value)}
                        className={`
                            flex-1 py-2.5 md:py-3 px-2 md:px-4 border transition-all cursor-pointer
                            ${isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                                : 'border-[var(--border-light)] hover:border-[var(--text-tertiary)]'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className={`
                                font-mono text-xs
                                ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}
                            `}>
                                {mode.mono}
                            </span>
                        </div>
                        <div className={`
                            text-sm text-center mb-1
                            ${isSelected ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}
                        `}>
                            {mode.label}
                        </div>
                        <div className="font-mono text-xs text-[var(--text-tertiary)] text-center hidden sm:block">
                            {mode.description}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
