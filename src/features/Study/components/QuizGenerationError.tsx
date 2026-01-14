import { motion } from 'framer-motion'
import { TerminalButton } from '../../../components/common/TerminalButton'
import type { AppError } from '../../../errors'

interface QuizGenerationErrorProps {
    error: AppError
    onRetry: () => void
    onSkip: () => void
}

// 에러 아이콘 (원형 프로그레스와 동일한 크기)
function ErrorIcon() {
    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--error)"
                    strokeWidth="4"
                    opacity="0.2"
                />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--error)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="264"
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-3xl text-[var(--error)]">!</span>
            </div>
        </div>
    )
}

export function QuizGenerationError({ error, onRetry, onSkip }: QuizGenerationErrorProps) {
    return (
        <div className="flex-1 flex items-center justify-center relative">
            <motion.div
                className="flex flex-col items-center gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* 에러 아이콘 */}
                <ErrorIcon />

                {/* 에러 메시지 박스 (터미널 스타일) */}
                <div className="bg-[var(--bg-paper)] border border-[var(--error)]/30 p-4 rounded min-w-[360px]">
                    {/* 터미널 헤더 */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--error)]/20">
                        <span className="font-mono text-xs text-[var(--error)]">
                            error.log
                        </span>
                    </div>

                    {/* 에러 내용 */}
                    <div className="space-y-2">
                        <div className="font-mono text-sm flex items-start">
                            <span className="text-[var(--error)] mr-2 select-none">{'>'}</span>
                            <span className="text-[var(--error)]">throw</span>
                            <span className="text-[var(--text-primary)] ml-2">new Error("{error.userMessage}")</span>
                        </div>
                        <div className="font-mono text-sm flex items-start">
                            <span className="text-[var(--text-tertiary)] mr-2 select-none">{'>'}</span>
                            <span className="text-[var(--text-tertiary)]">// code: {error.code}</span>
                        </div>
                    </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-3">
                    <TerminalButton
                        variant="filled"
                        onClick={onRetry}
                        className="px-5 py-2"
                    >
                        다시 시도
                    </TerminalButton>
                    <TerminalButton
                        variant="default"
                        onClick={onSkip}
                        className="px-5 py-2"
                    >
                        넘어가기
                    </TerminalButton>
                </div>
            </motion.div>
        </div>
    )
}
