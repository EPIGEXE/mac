/**
 * 퀴즈 결과 표시 컴포넌트
 * 터미널 스타일 디자인 적용
 */
import { IconCheck, IconX, IconRefresh, IconArrowRight } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { BlankInfo } from '../types'

interface AnswerDetail {
    blankId: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
}

interface QuizResultProps {
    totalBlanks: number
    correctCount: number
    wrongCount: number
    blanks: BlankInfo[]
    answers: Record<string, string>
    results: Record<string, boolean | null>
    onRetry: () => void
    onNext: () => void
    hasNextNote: boolean
}

export function QuizResult({
    totalBlanks,
    correctCount,
    wrongCount,
    blanks,
    answers,
    results,
    onRetry,
    onNext,
    hasNextNote,
}: QuizResultProps) {
    const accuracy = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0
    const isPerfect = correctCount === totalBlanks
    const isPassed = accuracy >= 60

    // 정답 상세 정보 생성
    const answerDetails: AnswerDetail[] = blanks.map((blank) => ({
        blankId: blank.id,
        userAnswer: answers[blank.id] || '',
        correctAnswer: blank.answer,
        isCorrect: results[blank.id] === true,
    }))

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
            <div className="max-w-[600px] mx-auto px-6 py-12">
                {/* 터미널 스타일 결과 헤더 */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* 터미널 명령어 스타일 */}
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-4">
                        <span className="text-[var(--accent)]">$</span> quiz --result
                    </div>

                    {/* 결과 메시지 박스 */}
                    <div
                        className={`
                            border-l-4 p-4 mb-6
                            ${isPerfect
                                ? 'border-l-green-500 bg-green-500/10'
                                : isPassed
                                    ? 'border-l-[var(--accent)] bg-[var(--accent)]/10'
                                    : 'border-l-red-500 bg-red-500/10'
                            }
                        `}
                    >
                        <div className="flex items-center gap-3">
                            {isPerfect ? (
                                <IconCheck size={24} className="text-green-500" />
                            ) : isPassed ? (
                                <IconCheck size={24} className="text-[var(--accent)]" />
                            ) : (
                                <IconX size={24} className="text-red-500" />
                            )}
                            <div>
                                <h2 className="font-display text-xl text-[var(--text-primary)]">
                                    {isPerfect ? 'Perfect!' : isPassed ? 'Good job!' : 'Try again'}
                                </h2>
                                <p className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                                    // {isPerfect ? '완벽합니다!' : isPassed ? '잘했어요!' : '다시 도전해보세요'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 점수 표시 - 터미널 스타일 */}
                <motion.div
                    className="mb-8 p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">
                        // score summary
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                        {/* 점수 */}
                        <div className="col-span-1">
                            <div className={`font-mono text-3xl font-bold ${
                                isPerfect ? 'text-green-500' : isPassed ? 'text-[var(--accent)]' : 'text-red-500'
                            }`}>
                                {accuracy}%
                            </div>
                            <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-1">
                                accuracy
                            </div>
                        </div>

                        {/* 구분선 */}
                        <div className="col-span-3 flex items-center gap-6 pl-4 border-l border-[var(--border-light)]">
                            {/* 정답 */}
                            <div>
                                <div className="font-mono text-2xl text-green-500">{correctCount}</div>
                                <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                                    correct
                                </div>
                            </div>

                            {/* 오답 */}
                            <div>
                                <div className="font-mono text-2xl text-red-500">{wrongCount}</div>
                                <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                                    wrong
                                </div>
                            </div>

                            {/* 전체 */}
                            <div>
                                <div className="font-mono text-2xl text-[var(--text-secondary)]">{totalBlanks}</div>
                                <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                                    total
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 정답 목록 - 터미널 스타일 */}
                {answerDetails.length > 0 && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3 flex items-center gap-2">
                            <span className="text-[var(--accent)]">{'>'}</span>
                            <span>answers --detail</span>
                        </div>

                        <div className="border border-[var(--border-light)] divide-y divide-[var(--border-light)]">
                            {answerDetails.map((detail, idx) => (
                                <motion.div
                                    key={detail.blankId}
                                    className={`
                                        flex items-start gap-3 p-3
                                        ${detail.isCorrect ? 'bg-green-500/5' : 'bg-red-500/5'}
                                    `}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: 0.3 + idx * 0.05 }}
                                >
                                    {/* 번호 */}
                                    <span className="font-mono text-xs text-[var(--text-tertiary)] w-6 flex-shrink-0">
                                        [{idx + 1}]
                                    </span>

                                    {/* 결과 아이콘 */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {detail.isCorrect ? (
                                            <IconCheck size={14} className="text-green-500" />
                                        ) : (
                                            <IconX size={14} className="text-red-500" />
                                        )}
                                    </div>

                                    {/* 내용 */}
                                    <div className="flex-1 min-w-0">
                                        {detail.isCorrect ? (
                                            <span className="font-mono text-sm text-green-600">
                                                {detail.correctAnswer}
                                            </span>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm text-red-500 line-through">
                                                        {detail.userAnswer || '(empty)'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">→</span>
                                                    <span className="font-mono text-sm text-green-600">
                                                        {detail.correctAnswer}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 액션 버튼 - 터미널 스타일 */}
                <motion.div
                    className="flex gap-3 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    <motion.button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-5 py-2.5 border border-[var(--border-light)] bg-transparent font-mono text-sm text-[var(--text-secondary)] cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <IconRefresh size={16} />
                        <span>:r retry</span>
                    </motion.button>

                    {hasNextNote && (
                        <motion.button
                            onClick={onNext}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer transition-opacity duration-150 hover:opacity-90"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>:n next</span>
                            <IconArrowRight size={16} />
                        </motion.button>
                    )}
                </motion.div>

                {/* 종료 안내 */}
                <motion.div
                    className="mt-6 text-center font-mono text-[10px] text-[var(--text-tertiary)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                >
                    press <span className="text-[var(--accent)]">ESC</span> to exit
                </motion.div>
            </div>
        </div>
    )
}
