import { motion } from 'framer-motion'

export function GenerateingQuizLoading({ error }: { error: string | null }) {
    return (
        <div className="flex-1 flex items-center justify-center">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="font-mono text-[var(--text-tertiary)] mb-2">
                        <span className="text-[var(--accent)]">$</span> generating quiz...
                    </div>
                    <motion.div
                        className="font-mono text-xs text-[var(--text-tertiary)]"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        // AI가 문제를 만들고 있습니다
                    </motion.div>
                    {error && <div className="mt-4 font-mono text-sm text-red-500">// error: {error}</div>}
                </motion.div>
            </div>
    )
}