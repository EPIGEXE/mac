/**
 * 학습 모드 선택 모달
 * Radix Dialog + Framer Motion 터미널 스타일 애니메이션
 */
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
import type { StudyModeType } from '../types'

interface StudyModeSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedMode: StudyModeType
    onModeChange: (mode: StudyModeType) => void
    onStart: () => void
    isLoading: boolean
}

const MODES: { value: StudyModeType; label: string; mono: string; description: string }[] = [
    {
        value: 'word',
        mono: 'word',
        label: '단어',
        description: '핵심 키워드를 빈칸으로',
    },
    {
        value: 'sentence',
        mono: 'sent',
        label: '문장',
        description: '핵심 문장을 빈칸으로',
    },
    {
        value: 'essay',
        mono: 'essay',
        label: '서술형',
        description: '질문에 답변 작성',
    },
]

export function StudyModeSelector({
    open,
    onOpenChange,
    selectedMode,
    onModeChange,
    onStart,
    isLoading,
}: StudyModeSelectorProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        </Dialog.Overlay>

                        {/* Content */}
                        <Dialog.Content asChild>
                            <motion.div
                                className="fixed left-1/2 top-1/2 w-[90vw] max-w-[360px] bg-[var(--bg-paper)] border border-[var(--border-light)] shadow-2xl outline-none"
                                initial={{
                                    opacity: 0,
                                    x: '-50%',
                                    y: '-50%',
                                    scale: 0.95,
                                }}
                                animate={{
                                    opacity: 1,
                                    x: '-50%',
                                    y: '-50%',
                                    scale: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                    x: '-50%',
                                    y: '-50%',
                                    scale: 0.95,
                                }}
                                transition={{
                                    duration: 0.2,
                                    ease: [0.4, 0, 0.2, 1]
                                }}
                            >
                                {/* 터미널 스타일 상단 바 */}
                                <div className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-light)]">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    <span className="ml-3 font-mono text-xs text-[var(--text-tertiary)]">
                                        study --mode select
                                    </span>
                                    <Dialog.Close asChild>
                                        <button className="ml-auto p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                                            <IconX size={14} />
                                        </button>
                                    </Dialog.Close>
                                </div>

                                {/* Header */}
                                <motion.div
                                    className="p-5 border-b border-[var(--border-light)]"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.2 }}
                                >
                                    <Dialog.Title className="font-display text-xl text-[var(--text-primary)] tracking-wide">
                                        학습 모드
                                    </Dialog.Title>
                                    <Dialog.Description className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                                        // select study mode
                                    </Dialog.Description>
                                </motion.div>

                                {/* Body */}
                                <div className="p-5">
                                    {/* 모드 선택 */}
                                    <motion.div
                                        className="mb-6"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15, duration: 0.2 }}
                                    >
                                        <div className="font-mono text-xs text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
                                            // mode
                                        </div>
                                        <div className="flex flex-col border-l-2 border-[var(--border-light)]">
                                            {MODES.map((mode, index) => {
                                                const isSelected = selectedMode === mode.value

                                                return (
                                                    <motion.button
                                                        key={mode.value}
                                                        onClick={() => onModeChange(mode.value)}
                                                        className={`
                                                            group py-3 px-4 bg-transparent text-left cursor-pointer
                                                            transition-all duration-150 border-l-2 -ml-0.5
                                                            ${
                                                                isSelected
                                                                    ? 'border-l-[var(--accent)]'
                                                                    : 'border-l-transparent hover:border-l-[var(--text-tertiary)]'
                                                            }
                                                        `}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{
                                                            delay: 0.2 + index * 0.05,
                                                            duration: 0.2,
                                                            ease: [0.4, 0, 0.2, 1]
                                                        }}
                                                        whileHover={{ x: 4 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className="flex items-baseline gap-3">
                                                            {/* 터미널 스타일 화살표 */}
                                                            <span
                                                                className={`font-mono text-sm transition-colors duration-150 ${
                                                                    isSelected
                                                                        ? 'text-[var(--accent)]'
                                                                        : 'text-[var(--text-tertiary)] group-hover:text-[var(--accent)]'
                                                                }`}
                                                            >
                                                                {'>'}
                                                            </span>
                                                            {/* 모노 접두사 */}
                                                            <span
                                                                className={`font-mono text-[11px] ${
                                                                    isSelected
                                                                        ? 'text-[var(--accent)]'
                                                                        : 'text-[var(--text-tertiary)]'
                                                                }`}
                                                            >
                                                                {mode.mono}
                                                            </span>
                                                            {/* 라벨 */}
                                                            <span
                                                                className={`text-sm ${
                                                                    isSelected
                                                                        ? 'font-semibold text-[var(--text-primary)]'
                                                                        : 'font-normal text-[var(--text-secondary)]'
                                                                }`}
                                                            >
                                                                {mode.label}
                                                            </span>
                                                        </div>
                                                        {/* 설명 */}
                                                        <div className="font-mono text-xs text-[var(--text-tertiary)] mt-1 ml-6">
                                                            {mode.description}
                                                        </div>
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>

                                    {/* 시작 버튼 */}
                                    <motion.button
                                        onClick={onStart}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-[var(--accent)] text-white font-mono text-sm cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35, duration: 0.2 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isLoading ? (
                                            <span className="animate-pulse">generating quiz...</span>
                                        ) : (
                                            <>
                                                <span className="text-xs opacity-80">▶</span>
                                                start
                                            </>
                                        )}
                                    </motion.button>
                                </div>

                                {/* 하단 힌트 */}
                                <motion.div
                                    className="px-5 py-3 border-t border-[var(--border-light)] bg-[var(--bg-secondary)]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.2 }}
                                >
                                    <p className="font-mono text-[10px] text-[var(--text-tertiary)] text-center">
                                        press <span className="text-[var(--accent)]">ESC</span> to cancel
                                    </p>
                                </motion.div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    )
}
