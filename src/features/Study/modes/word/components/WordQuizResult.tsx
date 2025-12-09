/**
 * 퀴즈 결과 표시 컴포넌트 (단어 모드)
 * - 문제 순서대로 리뷰 (정답/오답 분리 X)
 * - ✓/✗ 기호로 정답/오답 구분 (접근성)
 */
import { motion } from 'framer-motion'
import type { BlankInfo } from '../../../types'
import { ScoreMessage } from '../../../components/ScoreMessage'

interface QuizResultProps {
    totalBlanks: number // 총 빈칸 개수
    correctCount: number // 정답 개수
    wrongCount: number // 오답 개수
    blanks: BlankInfo[] // 빈칸 목록
    answers: Record<string, string> // 답변 목록
    results: Record<string, boolean | null> // 결과 목록
    onNext: () => void // 다음 버튼 클릭 핸들러
    hasNextNote: boolean // 다음 노트 존재 여부
}

export function WordQuizResult({
    totalBlanks,
    correctCount,
    wrongCount,
    blanks,
    answers,
    results,
    onNext,
    hasNextNote,
}: QuizResultProps) {
    // ================================ 상수 ================================
    const isPerfect = correctCount === totalBlanks // 정답률 100%인지
    const scorePercent = Math.round((correctCount / totalBlanks) * 100) // 정답률

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
            <div className="max-w-[700px] mx-auto px-6 py-12">
                {/*  점수 영역 */}
                <motion.div
                    className="mb-10 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* 점수 */}
                    <div className="mb-3">
                        <span className={`
                            font-score text-[100px] leading-none tracking-tight font-light
                            ${isPerfect ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}
                        `}>
                            {scorePercent}
                        </span>
                        <span className="font-score text-4xl text-[var(--text-secondary)] font-light">%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-[300px] mx-auto h-1.5 bg-[var(--bg-secondary)] mb-4">
                        <motion.div
                            className="h-full bg-[var(--accent)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${scorePercent}%` }}
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
                    <ScoreMessage score={scorePercent} isPerfect={isPerfect} />
                </motion.div>

                {/* 문제 리뷰 (순서대로) */}
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
                            <span className="font-mono text-base text-[var(--text-primary)]">Review</span>
                        </div>
                        <span className="font-mono text-sm text-[var(--text-secondary)]">
                            [{totalBlanks}]
                        </span>
                    </div>

                    {/* 문제 리스트 - 순서대로 */}
                    <div>
                        {blanks.map((blank, idx) => {
                            const blankKey = `BLANK_${blank.id}`
                            const userAnswer = answers[blankKey] || ''
                            const isCorrect = results[blankKey] === true
                            const isWrong = results[blankKey] === false

                            return (
                                <motion.div
                                    key={blank.id}
                                    className={`py-4 ${
                                        idx < blanks.length - 1
                                            ? 'border-b border-dashed border-[var(--border-light)]'
                                            : ''
                                    }`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.15, delay: 0.15 + idx * 0.02 }}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* 번호 + 상태 아이콘 */}
                                        <div className="flex items-center gap-2 shrink-0 w-14">
                                            <span className="font-mono text-sm text-[var(--text-secondary)]">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <span className={`font-mono text-base ${
                                                isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'
                                            }`}>
                                                {isCorrect ? '✓' : '✗'}
                                            </span>
                                        </div>

                                        {/* 내용 */}
                                        <div className="flex-1 min-w-0">
                                            {/* 정답 */}
                                            <div className="font-mono text-base text-[var(--text-primary)]">
                                                {blank.answer}
                                                {blank.hint && (
                                                    <span className="text-sm text-[var(--text-secondary)] ml-2">
                                                        // {blank.hint}
                                                    </span>
                                                )}
                                            </div>

                                            {/* 오답인 경우 사용자 입력 표시 */}
                                            {isWrong && (
                                                <div className="font-mono text-sm text-[var(--text-secondary)] mt-1">
                                                    입력: <span className="text-[var(--error)] line-through">{userAnswer || '—'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* 액션 버튼 */}
                <motion.div
                    className="pt-6 border-t border-[var(--border-light)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.3 }}
                >
                    <div className="flex gap-3">
                        {hasNextNote && (
                            <button
                                onClick={onNext}
                                className="flex-1 py-3 px-4 bg-[var(--accent)] text-white font-mono text-base cursor-pointer transition-opacity hover:opacity-90"
                            >
                                next →
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
