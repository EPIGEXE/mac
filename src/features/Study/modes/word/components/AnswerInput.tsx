/**
 * 답변 입력 컴포넌트
 * SentenceAnswerInput과 일관된 디자인 스타일 적용
 */
import { useState, useRef, useEffect } from 'react'
import { IconCheck, IconArrowRight } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnswerInputProps {
    blankId: string // Blank의 String ID (BLANK_1, BLANK_2, ...)
    blankIndex: number // Blank의 인덱스
    hint?: string // Blank의 힌트
    value: string // Blank의 답변
    result: boolean | null // Blank의 채점 결과
    correctAnswer?: string // 오답 시 정답 표시용
    isLoading: boolean // 평가 중인지
    onSubmit: (answer: string) => void // 답변 제출 핸들러
    totalBlanks: number // 총 빈칸 개수
    answeredCount: number // 답변 개수
    onShowResult?: () => void // 결과 화면 진입 핸들러
}

export function AnswerInput({
    blankId,
    blankIndex,
    hint,
    value,
    result,
    correctAnswer,
    isLoading,
    onSubmit,
    totalBlanks,
    answeredCount,
    onShowResult,
}: AnswerInputProps) {
    // ================================ 상태 관리 ================================
    const [inputValue, setInputValue] = useState(value) // 정답 입력 값

    // ================================ Ref ================================
    const inputRef = useRef<HTMLInputElement>(null) // 입력창 참조, 포커스 관리용

    // ================================ 상수 ================================
    const isCorrect = result === true // 정답인지
    const isWrong = result === false // 오답인지
    const isAnswered = result !== null // 답변됬는지
    const allAnswered = answeredCount === totalBlanks // 모든 빈칸 답변됬는지

    // ================================ useEffect ================================
    // blankId 변경 시 입력값 초기화 및 포커스
    useEffect(() => {
        setInputValue(value)
        inputRef.current?.focus()
    }, [blankId, value])

    // ================================ 핸들러 ================================
    // 답변 제출 핸들러
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim() && !isLoading && result === null) {
            onSubmit(inputValue.trim())
        }
    }

    return (
        <div
            className="border-t border-[var(--border-light)] bg-[var(--bg-paper)]"
        >
            <div className="px-6 py-4">
                <div className="max-w-[800px] mx-auto">
                    {/* 헤더: 배지 + 힌트 (SentenceAnswerInput 스타일) */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`
                            font-mono text-xs px-2 py-0.5
                            ${isCorrect
                                ? 'bg-green-500 text-white'
                                : isWrong
                                    ? 'bg-red-500 text-white'
                                    : 'bg-[var(--accent)] text-white'
                            }
                        `}>
                            B{String(blankIndex).padStart(2, '0')}
                        </span>
                        {hint && (
                            <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                                // {hint}
                            </span>
                        )}
                    </div>

                    {/* 결과 표시 */}
                    <AnimatePresence mode="wait">
                        {isAnswered && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mb-3 overflow-hidden"
                            >
                                <div
                                    className={`
                                        p-3 border-l-2 font-mono text-sm
                                        ${isCorrect
                                            ? 'bg-green-500/10 border-l-green-500 text-green-600'
                                            : 'bg-red-500/10 border-l-red-500 text-red-500'
                                        }
                                    `}
                                >
                                    {isCorrect ? (
                                        <span>// correct!</span>
                                    ) : (
                                        <div className="space-y-1">
                                            <div>// wrong</div>
                                            {correctAnswer && (
                                                <div className="text-[var(--text-secondary)]">
                                                    // answer: <span className="text-[var(--text-primary)]">{correctAnswer}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 입력 폼 */}
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        {/* 입력창 */}
                        <div className="flex-1 flex items-center gap-2">
                            <span className={`
                                font-mono text-sm select-none transition-colors
                                ${isAnswered ? 'text-[var(--text-tertiary)]' : 'text-[var(--accent)]'}
                            `}>
                                {'>'}
                            </span>
                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={isLoading || isAnswered}
                                    placeholder="답을 입력하세요..."
                                    className="
                                        w-full px-3 py-2
                                        font-mono text-sm
                                        bg-[var(--bg-primary)]
                                        border border-[var(--border-light)]
                                        text-[var(--text-primary)]
                                        placeholder:text-[var(--text-tertiary)]/50
                                        focus:outline-none focus:border-[var(--accent)]
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-colors duration-150
                                    "
                                />
                                {/* 커서 (빈 입력 + 포커스 + 미채점) */}
                                {!isAnswered && inputValue.length === 0 && (
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--accent)] animate-pulse pointer-events-none" />
                                )}
                            </div>
                        </div>

                        {/* 제출 버튼 */}
                        {!isAnswered && (
                            <button
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                className="px-4 py-2 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer flex items-center gap-2 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">...</span>
                                ) : (
                                    <>
                                        <IconCheck size={16} />
                                        <span>submit</span>
                                    </>
                                )}
                            </button>
                        )}
                    </form>

                    {/* 모든 문제 완료 시 결과 보기 버튼 */}
                    {allAnswered && onShowResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 pt-4 border-t border-dashed border-[var(--border-light)]"
                        >
                            <button
                                onClick={onShowResult}
                                className="w-full py-3 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer flex items-center justify-center gap-2 transition-opacity duration-150 hover:opacity-90"
                            >
                                <span>// 모든 문제 완료!</span>
                                <IconArrowRight size={16} />
                                <span>결과 보기</span>
                            </button>
                        </motion.div>
                    )}

                    {/* 단축키 안내 + 진행 상황 */}
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-4 font-mono text-[10px] text-[var(--text-tertiary)]">
                            <span>
                                <span className="text-[var(--accent)]">Enter</span> submit
                            </span>
                            <span className="opacity-50">|</span>
                            <span>
                                <span className="text-[var(--accent)]">Tab</span> next
                            </span>
                            <span className="opacity-50">|</span>
                            <span>
                                <span className="text-[var(--accent)]">Shift+Tab</span> prev
                            </span>
                            <span className="opacity-50">|</span>
                        </div>
                        {/* 진행 상황 */}
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                            {answeredCount}/{totalBlanks} completed
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
