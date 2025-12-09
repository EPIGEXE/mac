/**
 * 점수에 따른 평가 메시지 컴포넌트
 * - 점수 범위별 메시지와 스타일
 */
import { motion } from 'framer-motion'

interface ScoreMessageProps {
    score: number // 0-100
    isPerfect?: boolean
}

// 점수 범위별 메시지 설정
function getScoreConfig(score: number, isPerfect: boolean) {
    if (isPerfect) {
        return {
            message: 'Perfect!',
            subMessage: '완벽합니다',
            color: 'text-[var(--success)]',
            bgColor: 'bg-[var(--success)]/10',
            borderColor: 'border-[var(--success)]',
        }
    }
    if (score >= 80) {
        return {
            message: 'Excellent!',
            subMessage: '훌륭해요',
            color: 'text-[var(--success)]',
            bgColor: 'bg-[var(--success)]/10',
            borderColor: 'border-[var(--success)]',
        }
    }
    if (score >= 60) {
        return {
            message: 'Good Job!',
            subMessage: '잘했어요',
            color: 'text-[var(--accent)]',
            bgColor: 'bg-[var(--accent)]/10',
            borderColor: 'border-[var(--accent)]',
        }
    }
    if (score >= 40) {
        return {
            message: 'Not Bad',
            subMessage: '조금 더 노력해봐요',
            color: 'text-[var(--warning)]',
            bgColor: 'bg-[var(--warning)]/10',
            borderColor: 'border-[var(--warning)]',
        }
    }
    return {
        message: 'Try Again',
        subMessage: '다시 도전해보세요',
        color: 'text-[var(--error)]',
        bgColor: 'bg-[var(--error)]/10',
        borderColor: 'border-[var(--error)]',
    }
}

export function ScoreMessage({ score, isPerfect = false }: ScoreMessageProps) {
    const config = getScoreConfig(score, isPerfect)

    return (
        <motion.div
            className={`
                inline-flex items-center gap-3 px-4 py-2
                border-l-2 ${config.borderColor} ${config.bgColor}
            `}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
        >
            <span className={`font-score text-2xl font-medium tracking-wide ${config.color}`}>
                {config.message}
            </span>
            <span className="font-mono text-xs text-[var(--text-tertiary)]">
                // {config.subMessage}
            </span>
        </motion.div>
    )
}
