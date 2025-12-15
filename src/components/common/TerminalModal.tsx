/**
 * 터미널 스타일 모달
 * Radix Dialog + Framer Motion
 */
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX } from '@tabler/icons-react'

interface TerminalModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    command: string // 상단 바에 표시될 명령어 (예: "study --mode select")
    title: string
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode // 하단 힌트 영역
    maxWidth?: string // 기본값 360px
}

export function TerminalModal({
    open,
    onOpenChange,
    command,
    title,
    description,
    children,
    footer,
    maxWidth = '360px',
}: TerminalModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        </Dialog.Overlay>

                        {/* Content */}
                        <Dialog.Content asChild>
                            <motion.div
                                className="fixed left-1/2 top-1/2 w-[90vw] bg-[var(--bg-paper)] border border-[var(--border-light)] shadow-2xl outline-none z-50"
                                style={{ maxWidth }}
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
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                            >
                                {/* 터미널 스타일 상단 바 */}
                                <div className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-light)]">
                                    <span className="ml-3 font-mono text-sm text-[var(--text-secondary)]">
                                        {command}
                                    </span>
                                    <Dialog.Close asChild>
                                        <button className="ml-auto p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
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
                                        {title}
                                    </Dialog.Title>
                                    {description && (
                                        <Dialog.Description className="font-mono text-xs text-[var(--text-tertiary)] mt-1">
                                            {description}
                                        </Dialog.Description>
                                    )}
                                </motion.div>

                                {/* Body */}
                                <motion.div
                                    className="p-5"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.15, duration: 0.2 }}
                                >
                                    {children}
                                </motion.div>

                                {/* Footer */}
                                {footer && (
                                    <motion.div
                                        className="px-5 py-3 border-t border-[var(--border-light)] bg-[var(--bg-secondary)]"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 0.2 }}
                                    >
                                        {footer}
                                    </motion.div>
                                )}
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    )
}
