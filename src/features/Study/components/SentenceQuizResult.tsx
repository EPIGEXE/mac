/**
 * 문장 모드 퀴즈 결과 표시 컴포넌트 (Q&A 형식)
 * - LLM 평가 결과 (점수, 맞은 포인트, 놓친 포인트, 피드백)
 * - 각 질문별 상세 결과
 */
import { IconCheck, IconX, IconRefresh, IconArrowRight, IconInfoCircle } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { SentenceQuestionInfo, SentenceEvaluationResult } from '../types'

interface SentenceQuizResultProps {
    questions: SentenceQuestionInfo[]
    answers: Record<string, string>
    evaluationResults: SentenceEvaluationResult[]
    totalScore: number
    overallFeedback: string
    onRetry: () => void
    onNext: () => void
    hasNextNote: boolean
}

export function SentenceQuizResult({
    questions,
    answers,
    evaluationResults,
    totalScore,
    overallFeedback,
    onRetry,
    onNext,
    hasNextNote,
}: SentenceQuizResultProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const correctCount = evaluationResults.filter((r) => r.isCorrect).length
    const totalQuestions = questions.length
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    const isPerfect = correctCount === totalQuestions
    const isPassed = accuracy >= 60

    // 결과 맵 생성
    const resultMap = new Map(evaluationResults.map((r) => [r.blankId, r]))

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
            <div className="max-w-[700px] mx-auto px-6 py-12">
                {/* 터미널 스타일 결과 헤더 */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-4">
                        <span className="text-[var(--accent)]">$</span> qa-quiz --result
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

                {/* 점수 표시 */}
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
                        {/* LLM 총점 */}
                        <div className="col-span-1">
                            <div className={`font-mono text-3xl font-bold ${
                                totalScore >= 80 ? 'text-green-500' : totalScore >= 60 ? 'text-[var(--accent)]' : 'text-red-500'
                            }`}>
                                {totalScore}
                            </div>
                            <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-1">
                                total score
                            </div>
                        </div>

                        {/* 구분선 */}
                        <div className="col-span-3 flex items-center gap-6 pl-4 border-l border-[var(--border-light)]">
                            <div>
                                <div className="font-mono text-2xl text-green-500">{correctCount}</div>
                                <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                                    correct
                                </div>
                            </div>

                            <div>
                                <div className="font-mono text-2xl text-red-500">{totalQuestions - correctCount}</div>
                                <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                                    wrong
                                </div>
                            </div>

                            <div>
                                <div className="font-mono text-2xl text-[var(--accent)]">{accuracy}%</div>
                                <div className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                                    accuracy
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 전체 피드백 */}
                {overallFeedback && (
                    <motion.div
                        className="mb-8 p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                    >
                        <div className="flex items-start gap-3">
                            <IconInfoCircle size={18} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">
                                    // overall feedback
                                </div>
                                <p className="font-mono text-sm text-[var(--text-secondary)] leading-relaxed">
                                    {overallFeedback}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 개별 결과 목록 */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3 flex items-center gap-2">
                        <span className="text-[var(--accent)]">{'>'}</span>
                        <span>answers --detail --feedback</span>
                    </div>

                    <div className="border border-[var(--border-light)] divide-y divide-[var(--border-light)]">
                        {questions.map((q, idx) => {
                            const result = resultMap.get(q.id)
                            const userAnswer = answers[q.id] || ''
                            const isExpanded = expandedId === q.id
                            const isCorrect = result?.isCorrect ?? false

                            return (
                                <motion.div
                                    key={q.id}
                                    className={`
                                        ${isCorrect ? 'bg-green-500/5' : 'bg-red-500/5'}
                                    `}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: 0.3 + idx * 0.05 }}
                                >
                                    {/* 메인 행 */}
                                    <div
                                        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-[var(--bg-secondary)]/50 transition-colors"
                                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                    >
                                        <span className="font-mono text-xs text-[var(--text-tertiary)] w-6 flex-shrink-0">
                                            [{idx + 1}]
                                        </span>

                                        <div className="flex-shrink-0 mt-0.5">
                                            {isCorrect ? (
                                                <IconCheck size={14} className="text-green-500" />
                                            ) : (
                                                <IconX size={14} className="text-red-500" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* 질문 표시 */}
                                            <div className="font-mono text-xs text-[var(--text-tertiary)] mb-1">
                                                Q: {q.question}
                                            </div>

                                            {/* 점수 표시 */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-mono text-xs ${
                                                    (result?.score ?? 0) >= 80 ? 'text-green-500' :
                                                    (result?.score ?? 0) >= 60 ? 'text-yellow-500' : 'text-red-500'
                                                }`}>
                                                    score: {result?.score ?? 0}
                                                </span>
                                            </div>

                                            {/* 사용자 답변 */}
                                            <div className={`font-mono text-sm ${
                                                isCorrect ? 'text-green-600' : 'text-red-500'
                                            }`}>
                                                A: {userAnswer || '(empty)'}
                                            </div>

                                            {/* 펼치기 힌트 */}
                                            <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-1">
                                                {isExpanded ? '▼ 접기' : '▶ 피드백 보기'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 상세 내용 (펼침) */}
                                    <AnimatePresence>
                                        {isExpanded && result && (
                                            <motion.div
                                                className="px-12 pb-4 space-y-3"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {/* 정답 */}
                                                <div>
                                                    <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                        // correct answer:
                                                    </span>
                                                    <p className="font-mono text-sm text-green-600 mt-1">
                                                        {q.answer}
                                                    </p>
                                                </div>

                                                {/* 맞은 포인트 */}
                                                {result.matchedPoints.length > 0 && (
                                                    <div>
                                                        <span className="font-mono text-xs text-green-500">
                                                            ✓ matched points:
                                                        </span>
                                                        <ul className="mt-1 space-y-1">
                                                            {result.matchedPoints.map((point, i) => (
                                                                <li key={i} className="font-mono text-xs text-[var(--text-secondary)] pl-3">
                                                                    - {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* 놓친 포인트 */}
                                                {result.missedPoints.length > 0 && (
                                                    <div>
                                                        <span className="font-mono text-xs text-red-500">
                                                            ✗ missed points:
                                                        </span>
                                                        <ul className="mt-1 space-y-1">
                                                            {result.missedPoints.map((point, i) => (
                                                                <li key={i} className="font-mono text-xs text-[var(--text-secondary)] pl-3">
                                                                    - {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* 피드백 */}
                                                {result.feedback && (
                                                    <div className="p-2 bg-[var(--bg-primary)] border-l-2 border-[var(--accent)]">
                                                        <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                                            // feedback:
                                                        </span>
                                                        <p className="font-mono text-sm text-[var(--text-secondary)] mt-1">
                                                            {result.feedback}
                                                        </p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* 액션 버튼 */}
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
