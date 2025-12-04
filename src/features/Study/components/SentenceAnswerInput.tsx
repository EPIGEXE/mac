/**
 * 문장 모드 답변 입력 컴포넌트 (Q&A 형식)
 * - 질문에 대한 설명형 답변 입력
 */
import { useRef, useEffect } from 'react'
import { IconBulb } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { SentenceQuestionInfo } from '../types'

interface SentenceAnswerInputProps {
    question: SentenceQuestionInfo
    value: string
    onChange: (value: string) => void
    onHint: () => void
    hintsRemaining: number
    isFocused: boolean
    onFocus: () => void
}

export function SentenceAnswerInput({
    question,
    value,
    onChange,
    onHint,
    hintsRemaining,
    isFocused,
    onFocus,
}: SentenceAnswerInputProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isFocused])

    // 자동 높이 조절
    const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
        onChange(e.target.value)
    }

    return (
        <motion.div
            className={`
                p-4 border rounded-none transition-all duration-200
                ${isFocused
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'border-[var(--border-light)] bg-[var(--bg-secondary)]'
                }
            `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* 질문 헤더 */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-[var(--accent)] font-bold">{question.id}</span>
                        {question.hint && (
                            <span className="font-mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded">
                                hint: {question.hint}
                            </span>
                        )}
                    </div>
                    {/* 질문 표시 */}
                    <p className="font-mono text-sm text-[var(--text-primary)] leading-relaxed">
                        {question.question}
                    </p>
                </div>

                {hintsRemaining > 0 && (
                    <button
                        type="button"
                        onClick={onHint}
                        className="flex items-center gap-1 px-2 py-1 border border-[var(--border-light)] bg-transparent font-mono text-[10px] text-[var(--text-tertiary)] cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] ml-3 flex-shrink-0"
                    >
                        <IconBulb size={12} />
                        <span>[{hintsRemaining}]</span>
                    </button>
                )}
            </div>

            {/* 답변 입력 필드 */}
            <div className="relative">
                <span className="absolute left-3 top-3 font-mono text-sm text-[var(--accent)]">A:</span>
                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={adjustHeight}
                    onFocus={onFocus}
                    placeholder="답변을 입력하세요..."
                    rows={2}
                    className={`
                        w-full pl-10 pr-4 py-2.5
                        font-mono text-sm leading-relaxed
                        bg-[var(--bg-primary)]
                        border border-[var(--border-light)]
                        text-[var(--text-primary)]
                        placeholder:text-[var(--text-tertiary)]
                        focus:outline-none focus:border-[var(--accent)]
                        resize-none overflow-hidden
                        transition-colors duration-150
                    `}
                    style={{ minHeight: '60px' }}
                />
            </div>

            {/* 글자 수 표시 */}
            <div className="mt-2 flex justify-end">
                <span className={`font-mono text-[10px] ${
                    value.length > 0
                        ? value.length >= 20
                            ? 'text-green-500'
                            : 'text-yellow-500'
                        : 'text-[var(--text-tertiary)]'
                }`}>
                    {value.length} / 20+ chars
                </span>
            </div>
        </motion.div>
    )
}
