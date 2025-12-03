/**
 * 답변 입력 컴포넌트
 * 터미널 스타일 디자인 적용
 */
import { useState, useRef, useEffect } from 'react'
import { IconBulb, IconCheck, IconArrowRight } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnswerInputProps {
    blankId: string
    hint?: string
    value: string
    result: boolean | null // null = 미채점
    isLoading: boolean
    onSubmit: (answer: string) => void
    onHint: () => void
    onSkip: () => void
    hintsRemaining: number
}

export function AnswerInput({
    blankId,
    hint,
    value,
    result,
    isLoading,
    onSubmit,
    onHint,
    onSkip,
    hintsRemaining,
}: AnswerInputProps) {
    const [inputValue, setInputValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)

    // blankId 변경 시 입력값 초기화 및 포커스
    useEffect(() => {
        setInputValue(value)
        inputRef.current?.focus()
    }, [blankId, value])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim() && !isLoading && result === null) {
            onSubmit(inputValue.trim())
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault()
            onSkip()
        }
    }

    const isCorrect = result === true
    const isAnswered = result !== null

    return (
        <motion.div
            className="border-t border-[var(--border-light)] bg-[var(--bg-paper)]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            {/* 터미널 스타일 헤더 */}
            <div className="border-b border-[var(--border-light)] bg-[var(--bg-secondary)] px-6 py-2">
                <div className="max-w-[800px] mx-auto flex items-center gap-3">
                    {/* 터미널 스타일 프롬프트 */}
                    <span className="font-mono text-xs text-[var(--accent)]">{'>'}</span>
                    <span className="font-mono text-xs text-[var(--text-tertiary)]">
                        answer --blank
                    </span>
                    <span className="font-mono text-xs text-[var(--accent)]">{blankId}</span>
                    {hint && (
                        <>
                            <span className="font-mono text-xs text-[var(--text-tertiary)]">--hint</span>
                            <span className="font-mono text-xs text-[var(--text-secondary)]">"{hint}"</span>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 py-4">
                <div className="max-w-[800px] mx-auto">
                    {/* 결과 표시 */}
                    <AnimatePresence mode="wait">
                        {isAnswered && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mb-4 overflow-hidden"
                            >
                                <div
                                    className={`
                                        flex items-center gap-3 p-3 rounded-none border-l-4
                                        font-mono text-sm
                                        ${isCorrect
                                            ? 'bg-green-500/10 border-l-green-500 text-green-600'
                                            : 'bg-red-500/10 border-l-red-500 text-red-500'
                                        }
                                    `}
                                >
                                    <span className="text-xs opacity-70">//</span>
                                    {isCorrect ? (
                                        <span>correct! 정답입니다</span>
                                    ) : (
                                        <span>wrong. 오답입니다</span>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 입력 폼 */}
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        {/* 터미널 스타일 입력창 */}
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--accent)]">
                                $
                            </span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading || isAnswered}
                                placeholder="답을 입력하세요..."
                                className={`
                                    w-full pl-8 pr-4 py-3
                                    font-mono text-sm
                                    bg-[var(--bg-primary)]
                                    border border-[var(--border-light)]
                                    text-[var(--text-primary)]
                                    placeholder:text-[var(--text-tertiary)]
                                    focus:outline-none focus:border-[var(--accent)]
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-colors duration-150
                                `}
                            />
                        </div>

                        {/* 힌트 버튼 */}
                        {!isAnswered && hintsRemaining > 0 && (
                            <motion.button
                                type="button"
                                onClick={onHint}
                                disabled={isLoading}
                                className="px-4 py-2 border border-[var(--border-light)] bg-transparent font-mono text-xs text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <IconBulb size={14} />
                                <span>hint</span>
                                <span className="text-[var(--accent)]">[{hintsRemaining}]</span>
                            </motion.button>
                        )}

                        {/* 제출/다음 버튼 */}
                        {isAnswered ? (
                            <motion.button
                                type="button"
                                onClick={onSkip}
                                className="px-5 py-2 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer flex items-center gap-2 transition-opacity duration-150 hover:opacity-90"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>next</span>
                                <IconArrowRight size={16} />
                            </motion.button>
                        ) : (
                            <motion.button
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                className="px-5 py-2 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer flex items-center gap-2 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">checking...</span>
                                ) : (
                                    <>
                                        <IconCheck size={16} />
                                        <span>submit</span>
                                    </>
                                )}
                            </motion.button>
                        )}
                    </form>

                    {/* 단축키 안내 - 터미널 스타일 */}
                    <div className="mt-3 flex items-center gap-4 font-mono text-[10px] text-[var(--text-tertiary)]">
                        <span>
                            <span className="text-[var(--accent)]">Enter</span> submit
                        </span>
                        <span className="opacity-50">|</span>
                        <span>
                            <span className="text-[var(--accent)]">Tab</span> skip
                        </span>
                        <span className="opacity-50">|</span>
                        <span>
                            <span className="text-[var(--accent)]">ESC</span> exit
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
