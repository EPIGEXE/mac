import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

// 타이핑 애니메이션용 텍스트 라인들
const codeLines = [
    { prefix: 'import', text: ' { Quiz } from "ai-engine"', delay: 0 },
    { prefix: 'const', text: ' blanks = extractKeywords(note)', delay: 0.8 },
    { prefix: 'const', text: ' hints = generateHints(blanks)', delay: 1.6 },
    { prefix: 'return', text: ' Quiz.compile({ blanks, hints })', delay: 2.4 },
]

// 원형 프로그레스 SVG
function CircularProgress() {
    return (
        <div className="relative w-24 h-24">
            {/* 배경 원 */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--border-light)"
                    strokeWidth="4"
                />
                {/* 애니메이션 원 */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="264"
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: [264, 0, 264] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </svg>
            {/* 중앙 아이콘 */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="font-mono text-2xl text-[var(--accent)]"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {'</>'}
                </motion.div>
            </div>
        </div>
    )
}

// 타이핑 라인 컴포넌트
function TypedLine({ prefix, text, delay }: { prefix: string; text: string; delay: number }) {
    const [displayText, setDisplayText] = useState('')
    const [showCursor, setShowCursor] = useState(false)

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            setShowCursor(true)
            let currentIndex = 0
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setDisplayText(text.slice(0, currentIndex))
                    currentIndex++
                } else {
                    clearInterval(interval)
                    setTimeout(() => setShowCursor(false), 500)
                }
            }, 30)
            return () => clearInterval(interval)
        }, delay * 1000)

        return () => clearTimeout(startTimeout)
    }, [text, delay])

    return (
        <motion.div
            className="font-mono text-sm flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.2 }}
        >
            <span className="text-[var(--text-tertiary)] mr-2 select-none w-4">{'>'}</span>
            <span className="text-[var(--accent)] pr-2">{prefix}</span>
            <span className="text-[var(--text-primary)]">{displayText}</span>
            {showCursor && (
                <motion.span
                    className="inline-block w-2 h-4 bg-[var(--accent)] ml-0.5"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            )}
        </motion.div>
    )
}

// 플로팅 파티클
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-[var(--accent)]/30 rounded-full"
                    style={{
                        left: `${15 + i * 15}%`,
                        top: '50%',
                    }}
                    animate={{
                        y: [-20, -60, -20],
                        opacity: [0, 0.6, 0],
                        scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 2 + i * 0.3,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    )
}

export function GeneratingQuizLoading() {
    return (
        <div className="flex-1 flex items-center justify-center relative">
            <FloatingParticles />

            <motion.div
                className="flex flex-col items-center gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* 원형 프로그레스 */}
                <CircularProgress />

                {/* 코드 타이핑 영역 */}
                <div className="bg-[var(--bg-paper)] border border-[var(--border-light)] p-4 rounded min-w-[360px]">
                    {/* 터미널 헤더 */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-light)]">
                        <span className="font-mono text-xs text-[var(--text-tertiary)] ml-2">
                            quiz-generator.ts
                        </span>
                    </div>

                    {/* 코드 라인들 */}
                    <div className="space-y-2">
                        {codeLines.map((line, i) => (
                            <TypedLine key={i} {...line} />
                        ))}
                    </div>
                </div>

                {/* 상태 메시지 */}
                <motion.div
                    className="font-mono text-sm text-[var(--text-secondary)]"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    // AI가 문제를 생성하고 있습니다...
                </motion.div>
            </motion.div>
        </div>
    )
}