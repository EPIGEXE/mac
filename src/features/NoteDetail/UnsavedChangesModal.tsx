import { TerminalModal } from '../../components/common/TerminalModal'

interface UnsavedChangesModalProps {
    unsavedModalOpen: boolean
    setUnsavedModalOpen: (open: boolean) => void
    handleDiscardAndClose: () => void
    handleSaveAndClose: () => void
}

export function UnsavedChangesModal({
    unsavedModalOpen,
    setUnsavedModalOpen,
    handleDiscardAndClose,
    handleSaveAndClose,
}: UnsavedChangesModalProps) {
    return (
        <TerminalModal
            open={unsavedModalOpen}
            onOpenChange={setUnsavedModalOpen}
            command="vim --unsaved"
            title="저장하지 않은 변경 사항"
            description="// unsaved changes detected"
            maxWidth="400px"
        >
            <div className="flex gap-3">
                <button
                    onClick={handleDiscardAndClose}
                    className="flex-1 p-3 border border-[var(--border-light)] hover:border-red-400 transition-colors text-center cursor-pointer"
                >
                    <div className="font-mono text-sm text-red-400">:q!</div>
                    <div className="font-mono text-xs text-[var(--text-secondary)] mt-1">저장하지 않고 나가기</div>
                </button>
                <button
                    onClick={handleSaveAndClose}
                    className="flex-1 p-3 border border-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors text-center cursor-pointer"
                >
                    <div className="font-mono text-sm text-[var(--accent)]">:wq</div>
                    <div className="font-mono text-xs text-[var(--text-secondary)] mt-1">저장하고 나가기</div>
                </button>
            </div>
        </TerminalModal>
    )
}
