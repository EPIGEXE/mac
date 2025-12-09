/**
 * 서술형 모드 질문 컴포넌트 (한국 테크기업 면접 스타일)
 * - 면접 회사 및 질문 표시
 * - 답변 입력 영역
 * - 꼬리 질문 미리보기
 */
import { useRef, useEffect, useState } from 'react'
import { IconBuilding, IconBulb, IconSend, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EssayQuestionInfo } from '../../../types'
import { COMPANY_COLORS, QUESTION_TYPE_LABELS } from '../constants'

interface EssayQuizQuestionProps {
    question: EssayQuestionInfo
    noteTitle: string
    noteCategory?: string
    answer: string
    onAnswerChange: (value: string) => void
    onSubmit: () => void
    isEvaluating: boolean
}

export function EssayQuizQuestion({
    question,
    answer,
    onAnswerChange,
    onSubmit,
    isEvaluating,
}: EssayQuizQuestionProps) {
    // ================================ 상태 관리 ================================
    const [showFollowUp, setShowFollowUp] = useState(false) // 꼬리 질문 미리보기 상태

    // ================================ Ref ================================
    const textareaRef = useRef<HTMLTextAreaElement>(null) // 답변 입력창 참조, 높이 조절용

    // ================================ 상수 ================================
    const companyStyle = COMPANY_COLORS[question.company] || COMPANY_COLORS['네이버'] // 회사 색상
    const questionTypeLabel = QUESTION_TYPE_LABELS[question.questionType] || question.questionType

    // ================================ 유틸 함수 ================================
    // 자동 높이 조절
    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`
        }
    }

    // ================================ useEffect ================================
    // 답변 변경 시 자동 높이 조절
    useEffect(() => {
        adjustHeight()
    }, [answer])

    // Enter + Ctrl/Cmd로 제출
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && answer.trim().length >= 50) {
            e.preventDefault()
            onSubmit()
        }
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
            <div className="max-w-[800px] mx-auto px-6 py-12">
                {/* 터미널 스타일 헤더 */}
                <motion.div
                    className="font-mono text-xs text-[var(--text-tertiary)] mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <span className="text-[var(--accent)]">$</span> interview --company {question.company} --type{' '}
                    {question.questionType}
                </motion.div>

                {/* 회사 배지 */}
                <motion.div
                    className={`inline-flex items-center gap-2 px-4 py-2 ${companyStyle.bg} ${companyStyle.border} border mb-6`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <IconBuilding size={18} className={companyStyle.text} />
                    <span className={`font-mono text-sm font-bold ${companyStyle.text}`}>
                        {question.company} 기술 면접
                    </span>
                    <span className="font-mono text-xs text-[var(--text-tertiary)] ml-2">[{questionTypeLabel}]</span>
                </motion.div>

                {/* 면접 질문 */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">// interviewer question</div>
                    <p className="font-display text-xl text-[var(--text-primary)] leading-relaxed">
                        "{question.question}"
                    </p>
                </motion.div>

                {/* 꼬리 질문 미리보기 (접기/펼치기) */}
                {question.followUpQuestions && question.followUpQuestions.length > 0 && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <button
                            type="button"
                            onClick={() => setShowFollowUp(!showFollowUp)}
                            className="flex items-center gap-2 font-mono text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
                        >
                            <IconBulb size={14} />
                            <span>예상 꼬리 질문 ({question.followUpQuestions.length}개)</span>
                            {showFollowUp ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </button>

                        <AnimatePresence>
                            {showFollowUp && (
                                <motion.div
                                    className="mt-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ul className="space-y-2">
                                        {question.followUpQuestions.map((q, i) => (
                                            <li key={i} className="font-mono text-sm text-[var(--text-secondary)]">
                                                <span className="text-[var(--accent)] mr-2">→</span>
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* 답변 입력 영역 */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3">// your answer</div>

                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                    onAnswerChange(e.target.value)
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="면접관의 질문에 대한 답변을 작성해주세요. 실제 면접처럼 구체적인 예시와 함께 설명하면 좋습니다..."
                            disabled={isEvaluating}
                            className={`
                                w-full p-4
                                font-mono text-sm leading-relaxed
                                bg-[var(--bg-secondary)]
                                border border-[var(--border-light)]
                                text-[var(--text-primary)]
                                placeholder:text-[var(--text-tertiary)]
                                focus:outline-none focus:border-[var(--accent)]
                                resize-none overflow-hidden
                                transition-colors duration-150
                                disabled:opacity-50
                            `}
                            style={{ minHeight: '200px' }}
                        />

                        {/* 글자 수 표시 */}
                        <div className="absolute bottom-3 right-3 font-mono text-[10px] text-[var(--text-tertiary)]">
                            <span
                                className={
                                    answer.length >= 500
                                        ? 'text-[var(--error)]'
                                        : answer.length >= 450
                                          ? 'text-[var(--warning)]'
                                          : answer.length >= 50
                                            ? 'text-[var(--success)]'
                                            : ''
                                }
                            >
                                {answer.length}
                            </span>
                            <span> / 500 (50~500자)</span>
                        </div>
                    </div>
                </motion.div>

                {/* 안내 문구 */}
                <motion.div
                    className="mb-6 p-3 bg-[var(--bg-secondary)] border-l-2 border-[var(--accent)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                >
                    <p className="font-mono text-xs text-[var(--text-tertiary)]">
                        <span className="text-[var(--accent)]">tip:</span> 면접에서는 "왜"와 "어떻게"를 설명하는 것이
                        중요합니다. 단순히 정의만 말하기보다 실제 경험이나 구체적인 예시를 함께 설명해보세요.
                    </p>
                </motion.div>

                {/* 제출 버튼 */}
                <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                >
                    <motion.button
                        onClick={onSubmit}
                        disabled={isEvaluating || answer.trim().length < 50}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isEvaluating ? (
                            <span className="animate-pulse">평가 중...</span>
                        ) : (
                            <>
                                <IconSend size={16} />
                                <span>답변 제출</span>
                            </>
                        )}
                    </motion.button>
                </motion.div>

                <div className="mt-4 text-center font-mono text-[10px] text-[var(--text-tertiary)]">
                    <span className="text-[var(--accent)]">Ctrl</span> +{' '}
                    <span className="text-[var(--accent)]">Enter</span> to submit
                </div>
            </div>
        </div>
    )
}
