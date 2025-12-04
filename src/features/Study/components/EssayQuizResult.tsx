/**
 * 서술형 모드 결과 컴포넌트 (한국 테크기업 면접 스타일)
 * - 면접 평가 결과 (점수, 등급)
 * - 강점/개선점 분석
 * - 맞춘/놓친 포인트
 * - 면접관 피드백 및 팁
 */
import { IconCheck, IconX, IconRefresh, IconArrowRight, IconBulb, IconTrophy, IconAlertCircle, IconTarget, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { EssayQuestionInfo, EvaluateEssayResponse } from '../types'

// 회사별 브랜드 색상
const COMPANY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    '네이버': { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
    '카카오': { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    '쿠팡': { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
    '토스': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
    '당근': { bg: 'bg-orange-400/10', text: 'text-orange-400', border: 'border-orange-400/30' },
}

// 등급별 스타일
const GRADE_STYLES = {
    PASS: {
        icon: IconTrophy,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        label: '합격 수준',
        message: '면접 통과 수준의 답변입니다!',
    },
    BORDERLINE: {
        icon: IconAlertCircle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        label: '보완 필요',
        message: '기본은 알고 있지만 좀 더 깊이 있는 답변이 필요합니다.',
    },
    NEEDS_WORK: {
        icon: IconTarget,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        label: '재학습 필요',
        message: '해당 개념을 다시 학습해보시기 바랍니다.',
    },
}

interface EssayQuizResultProps {
    question: EssayQuestionInfo
    userAnswer: string
    result: EvaluateEssayResponse
    onRetry: () => void
    onNext: () => void
    hasNextNote: boolean
}

export function EssayQuizResult({
    question,
    userAnswer,
    result,
    onRetry,
    onNext,
    hasNextNote,
}: EssayQuizResultProps) {
    const [showMyAnswer, setShowMyAnswer] = useState(false)
    const [showExpectedPoints, setShowExpectedPoints] = useState(false)

    const companyStyle = COMPANY_COLORS[question.company] || COMPANY_COLORS['네이버']
    const gradeStyle = GRADE_STYLES[result.grade]
    const GradeIcon = gradeStyle.icon

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
            <div className="max-w-[800px] mx-auto px-6 py-12">
                {/* 터미널 스타일 헤더 */}
                <motion.div
                    className="font-mono text-xs text-[var(--text-tertiary)] mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <span className="text-[var(--accent)]">$</span> interview --result
                </motion.div>

                {/* 회사 & 점수 헤더 */}
                <motion.div
                    className={`mb-8 p-6 ${gradeStyle.bg} ${gradeStyle.border} border`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        {/* 회사 */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 ${companyStyle.bg} ${companyStyle.border} border`}>
                            <span className={`font-mono text-sm font-bold ${companyStyle.text}`}>
                                {question.company}
                            </span>
                        </div>

                        {/* 등급 */}
                        <div className={`flex items-center gap-2 ${gradeStyle.color}`}>
                            <GradeIcon size={24} />
                            <span className="font-mono text-lg font-bold">{gradeStyle.label}</span>
                        </div>
                    </div>

                    {/* 점수 */}
                    <div className="flex items-end gap-4">
                        <div className={`font-mono text-5xl font-bold ${gradeStyle.color}`}>
                            {result.score}
                        </div>
                        <div className="font-mono text-sm text-[var(--text-tertiary)] mb-2">
                            / 100점
                        </div>
                    </div>

                    <p className="font-mono text-sm text-[var(--text-secondary)] mt-3">
                        {gradeStyle.message}
                    </p>
                </motion.div>

                {/* 원본 질문 */}
                <motion.div
                    className="mb-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">
                        // question
                    </div>
                    <p className="font-mono text-sm text-[var(--text-primary)]">
                        "{question.question}"
                    </p>
                </motion.div>

                {/* 강점 */}
                {result.strengths && result.strengths.length > 0 && (
                    <motion.div
                        className="mb-6 p-4 bg-green-500/5 border border-green-500/20"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <IconCheck size={16} className="text-green-500" />
                            <span className="font-mono text-xs text-green-500 uppercase tracking-wider">
                                Strengths
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {result.strengths.map((s, i) => (
                                <li key={i} className="font-mono text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                    <span className="text-green-500">+</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* 개선점 */}
                {result.improvements && result.improvements.length > 0 && (
                    <motion.div
                        className="mb-6 p-4 bg-yellow-500/5 border border-yellow-500/20"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <IconAlertCircle size={16} className="text-yellow-500" />
                            <span className="font-mono text-xs text-yellow-500 uppercase tracking-wider">
                                Improvements
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {result.improvements.map((s, i) => (
                                <li key={i} className="font-mono text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                    <span className="text-yellow-500">→</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* 맞춘/놓친 포인트 */}
                <motion.div
                    className="mb-6 grid grid-cols-2 gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    {/* 맞춘 포인트 */}
                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                        <div className="font-mono text-xs text-green-500 mb-3 uppercase tracking-wider">
                            ✓ matched ({result.matchedPoints.length})
                        </div>
                        {result.matchedPoints.length > 0 ? (
                            <ul className="space-y-1">
                                {result.matchedPoints.map((p, i) => (
                                    <li key={i} className="font-mono text-xs text-[var(--text-secondary)]">
                                        - {p}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="font-mono text-xs text-[var(--text-tertiary)]">없음</p>
                        )}
                    </div>

                    {/* 놓친 포인트 */}
                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                        <div className="font-mono text-xs text-red-500 mb-3 uppercase tracking-wider">
                            ✗ missed ({result.missedPoints.length})
                        </div>
                        {result.missedPoints.length > 0 ? (
                            <ul className="space-y-1">
                                {result.missedPoints.map((p, i) => (
                                    <li key={i} className="font-mono text-xs text-[var(--text-secondary)]">
                                        - {p}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="font-mono text-xs text-[var(--text-tertiary)]">없음</p>
                        )}
                    </div>
                </motion.div>

                {/* 면접관 피드백 */}
                <motion.div
                    className="mb-6 p-4 bg-[var(--bg-secondary)] border-l-4 border-[var(--accent)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.45 }}
                >
                    <div className="font-mono text-xs text-[var(--accent)] mb-2 uppercase tracking-wider">
                        // interviewer feedback
                    </div>
                    <p className="font-mono text-sm text-[var(--text-secondary)] leading-relaxed">
                        {result.feedback}
                    </p>
                </motion.div>

                {/* 면접 팁 */}
                {result.tip && (
                    <motion.div
                        className="mb-6 p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    >
                        <div className="flex items-start gap-2">
                            <IconBulb size={16} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                            <p className="font-mono text-xs text-[var(--text-secondary)]">
                                <span className="text-[var(--accent)] font-bold">TIP:</span> {result.tip}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* 내 답변 보기 (접기/펼치기) */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.55 }}
                >
                    <button
                        type="button"
                        onClick={() => setShowMyAnswer(!showMyAnswer)}
                        className="flex items-center gap-2 font-mono text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                    >
                        <span>내 답변 보기</span>
                        {showMyAnswer ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    </button>

                    <AnimatePresence>
                        {showMyAnswer && (
                            <motion.div
                                className="mt-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="font-mono text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                                    {userAnswer}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* 예상 평가 기준 보기 (접기/펼치기) */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                >
                    <button
                        type="button"
                        onClick={() => setShowExpectedPoints(!showExpectedPoints)}
                        className="flex items-center gap-2 font-mono text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                    >
                        <span>평가 기준 보기</span>
                        {showExpectedPoints ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    </button>

                    <AnimatePresence>
                        {showExpectedPoints && (
                            <motion.div
                                className="mt-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">
                                    // expected points
                                </div>
                                <ul className="space-y-1">
                                    {question.expectedPoints.map((p, i) => (
                                        <li key={i} className="font-mono text-sm text-[var(--text-secondary)]">
                                            {i + 1}. {p}
                                        </li>
                                    ))}
                                </ul>
                                {question.answerGuide && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                                        <div className="font-mono text-xs text-[var(--text-tertiary)] mb-2">
                                            // answer guide
                                        </div>
                                        <p className="font-mono text-sm text-[var(--text-secondary)]">
                                            {question.answerGuide}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* 액션 버튼 */}
                <motion.div
                    className="flex gap-3 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
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
                    transition={{ duration: 0.3, delay: 0.8 }}
                >
                    press <span className="text-[var(--accent)]">ESC</span> to exit
                </motion.div>
            </div>
        </div>
    )
}
