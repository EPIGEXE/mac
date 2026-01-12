/**
 * 서술형 모드 결과 컴포넌트 (한국 테크기업 면접 스타일)
 * - QuizResult/SentenceQuizResult와 동일한 디자인 컨셉
 * - 터미널/코드 에디터 스타일
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { EssayQuestionInfo, EvaluateEssayResponse } from '../../../types'
import { ScoreMessage } from '../../../components/ScoreMessage'
import { COMPANY_COLORS } from '../constants'
import { SectionTitle } from '../../../../../components/common/SectionTitle'

interface EssayQuizResultProps {
    question: EssayQuestionInfo // 질문 정보
    userAnswer: string // 사용자 답변
    result: EvaluateEssayResponse // 결과 정보
    onNext: () => void // 다음 노트로 이동
}

export function EssayQuizResult({ question, userAnswer, result, onNext }: EssayQuizResultProps) {
    // ================================ 상수 ================================
    const [showMyAnswer, setShowMyAnswer] = useState(false) // 내 답변 보기 상태
    const [showExpectedPoints, setShowExpectedPoints] = useState(false) // 평가 기준 보기 상태

    const companyStyle = COMPANY_COLORS[question.company] || COMPANY_COLORS['네이버'] // 회사 색상
    const isPerfect = result.score >= 90 // 완벽한 점수인지

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
                    {/* 회사 태그 */}
                    <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 ${companyStyle.bg} ${companyStyle.border} border mb-4`}
                    >
                        <span className={`font-mono text-sm font-bold ${companyStyle.text}`}>{question.company}</span>
                    </div>

                    {/* 점수 */}
                    <div className="mb-3">
                        <span
                            className={`
                            font-score text-[100px] leading-none tracking-tight font-light
                            ${isPerfect ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}
                        `}
                        >
                            {result.score}
                        </span>
                        <span className="font-score text-4xl text-[var(--text-secondary)] font-light">점</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-[300px] mx-auto h-1.5 bg-[var(--bg-secondary)] mb-4">
                        <motion.div
                            className="h-full bg-[var(--accent)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${result.score}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        />
                    </div>

                    {/* 점수 평가 메시지 */}
                    <ScoreMessage score={result.score} isPerfect={isPerfect} />
                </motion.div>

                <SectionTitle size="lg" className="mb-6">평가 결과</SectionTitle>

                {/*  원본 질문  */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                >
                    <div className="font-mono text-sm text-[var(--text-secondary)] mb-2">// question</div>
                    <p className="text-base text-[var(--text-primary)] leading-relaxed pl-4 border-l-2 border-[var(--border-medium)]">
                        "{question.question}"
                    </p>
                </motion.div>

                {/*  강점 & 개선점  */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                >
                    {/* 강점 */}
                    {result.strengths && result.strengths.length > 0 && (
                        <div className="mb-6">
                            <div className="font-mono text-sm text-[var(--success)] mb-3">
                                // strengths [{result.strengths.length}]
                            </div>
                            <ul className="pl-4 space-y-2">
                                {result.strengths.map((s, i) => (
                                    <li key={i} className="text-base text-[var(--text-primary)] leading-relaxed">
                                        <span className="text-[var(--success)] mr-2">+</span>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 개선점 */}
                    {result.improvements && result.improvements.length > 0 && (
                        <div className="mb-6">
                            <div className="font-mono text-sm text-[var(--warning)] mb-3">
                                // improvements [{result.improvements.length}]
                            </div>
                            <ul className="pl-4 space-y-2">
                                {result.improvements.map((s, i) => (
                                    <li key={i} className="text-base text-[var(--text-primary)] leading-relaxed">
                                        <span className="text-[var(--warning)] mr-2">→</span>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </motion.div>

                {/*  맞춘/놓친 포인트  */}
                <motion.div
                    className="mb-8 pb-8 border-b border-dashed border-[var(--border-light)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                >
                    {/* 맞춘 포인트 */}
                    {result.matchedPoints.length > 0 && (
                        <div className="mb-6">
                            <div className="font-mono text-sm text-[var(--success)] mb-3">
                                // matched [{result.matchedPoints.length}]
                            </div>
                            <ul className="pl-4 space-y-2">
                                {result.matchedPoints.map((p, i) => (
                                    <li key={i} className="text-base text-[var(--text-primary)]">
                                        <span className="text-[var(--success)] mr-2">✓</span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 놓친 포인트 */}
                    {result.missedPoints.length > 0 && (
                        <div>
                            <div className="font-mono text-sm text-[var(--error)] mb-3">
                                // missed [{result.missedPoints.length}]
                            </div>
                            <ul className="pl-4 space-y-2">
                                {result.missedPoints.map((p, i) => (
                                    <li key={i} className="text-base text-[var(--text-primary)]">
                                        <span className="text-[var(--error)] mr-2">✗</span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </motion.div>

                <SectionTitle size="lg" className="mb-6">피드백</SectionTitle>

                {/*  상세 분석  */}
                {result.analysis && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.25 }}
                    >
                        <div className="font-mono text-sm text-[var(--text-secondary)] mb-3">// analysis</div>
                        <div className="pl-4 space-y-3 border-l-2 border-[var(--border-medium)]">
                            <div>
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">상황 이해: </span>
                                <span className="text-sm text-[var(--text-primary)]">{result.analysis.situationUnderstanding}</span>
                            </div>
                            <div>
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">해결책: </span>
                                <span className="text-sm text-[var(--text-primary)]">{result.analysis.solutionQuality}</span>
                            </div>
                            <div>
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">기술 정확성: </span>
                                <span className="text-sm text-[var(--text-primary)]">{result.analysis.technicalAccuracy}</span>
                            </div>
                            <div>
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">사고의 깊이: </span>
                                <span className="text-sm text-[var(--text-primary)]">{result.analysis.depthOfThinking}</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/*  면접관 피드백  */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.3 }}
                >
                    <div className="font-mono text-sm text-[var(--accent)] mb-3">// feedback</div>
                    <p className="text-base text-[var(--text-primary)] leading-relaxed pl-4 border-l-2 border-[var(--accent)]">
                        {result.feedback}
                    </p>
                </motion.div>

                {/*  모범 답변 방향  */}
                {result.betterAnswer && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.35 }}
                    >
                        <div className="font-mono text-sm text-[var(--success)] mb-3">// better answer</div>
                        <p className="text-base text-[var(--text-primary)] leading-relaxed pl-4 border-l-2 border-[var(--success)]">
                            {result.betterAnswer}
                        </p>
                    </motion.div>
                )}

                {/*  펼치기 섹션  */}
                <motion.div
                    className="mb-8 space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.4 }}
                >
                    {/* 내 답변 보기 */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowMyAnswer(!showMyAnswer)}
                            className="flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        >
                            <span>{showMyAnswer ? '▼' : '▶'}</span>
                            <span>내 답변 보기</span>
                        </button>

                        <AnimatePresence>
                            {showMyAnswer && (
                                <motion.div
                                    className="mt-3 pl-4 border-l border-dashed border-[var(--border-medium)]"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <p className="text-base text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                                        {userAnswer}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 평가 기준 보기 */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowExpectedPoints(!showExpectedPoints)}
                            className="flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                        >
                            <span>{showExpectedPoints ? '▼' : '▶'}</span>
                            <span>평가 기준 보기</span>
                        </button>

                        <AnimatePresence>
                            {showExpectedPoints && (
                                <motion.div
                                    className="mt-3 pl-4 border-l border-dashed border-[var(--border-medium)]"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="font-mono text-sm text-[var(--text-secondary)] mb-3">
                                        // expected points
                                    </div>
                                    <ul className="pl-4 space-y-2 mb-4">
                                        {question.expectedPoints.map((p, i) => (
                                            <li key={i} className="text-base text-[var(--text-primary)]">
                                                <span className="text-[var(--text-secondary)] mr-2">{i + 1}.</span>
                                                {p}
                                            </li>
                                        ))}
                                    </ul>

                                    {question.answerGuide && (
                                        <>
                                            <div className="font-mono text-sm text-[var(--text-secondary)] mb-3">
                                                // answer guide
                                            </div>
                                            <p className="text-base text-[var(--text-primary)] leading-relaxed pl-4">
                                                {question.answerGuide}
                                            </p>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/*  액션 버튼  */}
                <motion.div
                    className="pt-6 border-t border-[var(--border-light)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.45 }}
                >
                    <div className="flex gap-3">
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
