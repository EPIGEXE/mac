/**
 * 문장 모드 퀴즈 결과 표시 컴포넌트
 * - QuizResult와 동일한 디자인 스타일
 * - LLM 평가 결과 (점수, 맞은 포인트, 놓친 포인트, 피드백)
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import type { SentenceQuestionInfo, SentenceEvaluationResult } from '../../../types'
import { ScoreMessage } from '../../../components/ScoreMessage'

interface SentenceQuizResultProps {
    questions: SentenceQuestionInfo[]
    answers: Record<string, string>
    evaluationResults: SentenceEvaluationResult[]
    totalScore: number
    overallFeedback: string
    onNext: () => void
}

export function SentenceQuizResult({
    questions,
    answers,
    evaluationResults,
    totalScore,
    overallFeedback,
    onNext,
}: SentenceQuizResultProps) {
    // ================================ 상태 관리 ================================
    const [expandedId, setExpandedId] = useState<string | null>(null) // 펼쳐진 질문 ID

    // ================================ 상수 ================================
    const correctCount = evaluationResults.filter((r) => r.isCorrect).length // 정답 개수
    const wrongCount = questions.length - correctCount // 오답 개수
    const totalQuestions = questions.length // 총 문제 개수
    const isPerfect = correctCount === totalQuestions // 완벽한 점수인지

    const resultMap = new Map(evaluationResults.map((r) => [r.blankId, r])) // 결과 맵

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
            <div className="max-w-[700px] mx-auto px-6 py-12">
                {/*  점수 영역  */}
                <motion.div
                    className="mb-10 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* 점수 */}
                    <div className="mb-3">
                        <span
                            className={`
                            font-score text-[100px] leading-none tracking-tight font-light
                            ${isPerfect ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}
                        `}
                        >
                            {totalScore}
                        </span>
                        <span className="font-score text-4xl text-[var(--text-secondary)] font-light">점</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-[300px] mx-auto h-1.5 bg-[var(--bg-secondary)] mb-4">
                        <motion.div
                            className="h-full bg-[var(--accent)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${totalScore}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        />
                    </div>

                    {/* 정답/오답 카운트 */}
                    <div className="font-mono text-base text-[var(--text-secondary)] mb-4">
                        <span className="text-[var(--success)]">✓ {correctCount}</span>
                        <span className="mx-2">·</span>
                        <span className="text-[var(--error)]">✗ {wrongCount}</span>
                    </div>

                    {/* 점수 평가 메시지 */}
                    <ScoreMessage score={totalScore} isPerfect={isPerfect} />
                </motion.div>

                {/*  전체 피드백  */}
                {overallFeedback && (
                    <motion.div
                        className="mb-8 p-4 border-l-2 border-[var(--accent)] bg-[var(--accent)]/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.15 }}
                    >
                        <div className="font-mono text-sm text-[var(--text-secondary)] mb-2">// feedback</div>
                        <p className="text-[var(--text-primary)] leading-relaxed">{overallFeedback}</p>
                    </motion.div>
                )}

                {/*  문제 리뷰 (순서대로)  */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-light)]">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[var(--accent)]">#</span>
                            <span className="font-mono text-[var(--text-primary)]">Review</span>
                        </div>
                        <span className="font-mono text-sm text-[var(--text-secondary)]">[{totalQuestions}]</span>
                    </div>

                    {/* 문제 리스트 - 순서대로 */}
                    <div>
                        {questions.map((q, idx) => {
                            const result = resultMap.get(q.id)
                            const userAnswer = answers[q.id] || ''
                            const isExpanded = expandedId === q.id
                            const isCorrect = result?.isCorrect ?? false
                            const questionScore = result?.score ?? 0

                            return (
                                <motion.div
                                    key={q.id}
                                    className={`py-4 ${
                                        idx < questions.length - 1
                                            ? 'border-b border-dashed border-[var(--border-light)]'
                                            : ''
                                    }`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.15, delay: 0.15 + idx * 0.02 }}
                                >
                                    {/* 메인 행 */}
                                    <div
                                        className="flex items-start gap-3 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                    >
                                        {/* 번호 + 상태 아이콘 */}
                                        <div className="flex items-center gap-2 shrink-0 w-14">
                                            <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <span
                                                className={`font-mono text-base ${
                                                    isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'
                                                }`}
                                            >
                                                {isCorrect ? '✓' : '✗'}
                                            </span>
                                        </div>

                                        {/* 내용 */}
                                        <div className="flex-1 min-w-0">
                                            {/* 질문 */}
                                            <div className="font-mono text-sm text-[var(--text-secondary)] mb-2">
                                                Q: {q.question}
                                            </div>

                                            {/* 사용자 답변 */}
                                            <div
                                                className={`text-base mb-2 ${
                                                    isCorrect ? 'text-[var(--text-primary)]' : 'text-[var(--error)]'
                                                }`}
                                            >
                                                {userAnswer || '(답변 없음)'}
                                            </div>

                                            {/* 점수 + 펼치기 힌트 */}
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`font-mono text-sm ${
                                                        questionScore >= 80
                                                            ? 'text-[var(--success)]'
                                                            : questionScore >= 60
                                                              ? 'text-[var(--warning)]'
                                                              : 'text-[var(--error)]'
                                                    }`}
                                                >
                                                    {questionScore}점
                                                </span>
                                                {isExpanded ? (
                                                    <IconChevronDown size={16} className="text-[var(--text-secondary)]" />
                                                ) : (
                                                    <IconChevronRight size={16} className="text-[var(--text-secondary)]" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 상세 내용 (펼침) */}
                                    <AnimatePresence>
                                        {isExpanded && result && (
                                            <motion.div
                                                className="mt-4 ml-14 pl-4 border-l border-dashed border-[var(--border-medium)]"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {/* 모범 답안 */}
                                                <div className="mb-4">
                                                    <div className="font-mono text-sm text-[var(--success)] mb-2">
                                                        // answer
                                                    </div>
                                                    <p className="text-base text-[var(--text-primary)] leading-relaxed pl-4">
                                                        {q.answer}
                                                    </p>
                                                </div>

                                                {/* 맞은 포인트 */}
                                                {result.matchedPoints.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="font-mono text-sm text-[var(--success)] mb-2">
                                                            // matched [{result.matchedPoints.length}]
                                                        </div>
                                                        <ul className="pl-4 space-y-2">
                                                            {result.matchedPoints.map((point, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="text-base text-[var(--text-primary)] leading-relaxed"
                                                                >
                                                                    <span className="text-[var(--success)] mr-2">
                                                                        +
                                                                    </span>
                                                                    {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* 놓친 포인트 */}
                                                {result.missedPoints.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="font-mono text-sm text-[var(--error)] mb-2">
                                                            // missed [{result.missedPoints.length}]
                                                        </div>
                                                        <ul className="pl-4 space-y-2">
                                                            {result.missedPoints.map((point, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="text-base text-[var(--text-primary)] leading-relaxed"
                                                                >
                                                                    <span className="text-[var(--error)] mr-2">-</span>
                                                                    {point}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* 개별 피드백 */}
                                                {result.feedback && (
                                                    <div className="mb-2">
                                                        <div className="font-mono text-sm text-[var(--text-secondary)] mb-2">
                                                            // feedback
                                                        </div>
                                                        <p className="text-base text-[var(--text-secondary)] leading-relaxed pl-4 italic">
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

                {/*  액션 버튼  */}
                <motion.div
                    className="pt-6 border-t border-[var(--border-light)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.3 }}
                >
                    <div className="flex">
                        <button
                            onClick={onNext}
                            className="flex-1 py-3 px-4 bg-[var(--accent)] text-white font-mono text-base cursor-pointer transition-opacity hover:opacity-90"
                        >
                            next →
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
