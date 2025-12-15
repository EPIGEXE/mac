import { TerminalModal } from '../../components/common/TerminalModal'

interface DeleteConfirmModalProps {
    deleteModalOpen: boolean
    setDeleteModalOpen: (open: boolean) => void
    handleConfirmDelete: () => void
}

export function DeleteConfirmModal({
    deleteModalOpen,
    setDeleteModalOpen,
    handleConfirmDelete,
}: DeleteConfirmModalProps) {
    return (
        <TerminalModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            command="rm --confirm"
            title="노트 삭제"
            description="// this action cannot be undone"
            maxWidth="400px"
        >
            <div className="flex gap-3">
                <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 p-3 border border-[var(--border-light)] hover:border-[var(--text-tertiary)] transition-colors text-center cursor-pointer"
                >
                    <div className="font-mono text-sm text-[var(--text-primary)]">:q</div>
                    <div className="font-mono text-xs text-[var(--text-secondary)] mt-1">취소</div>
                </button>
                <button
                    onClick={handleConfirmDelete}
                    className="flex-1 p-3 border border-red-400 bg-red-400/10 hover:bg-red-400/20 transition-colors text-center cursor-pointer"
                >
                    <div className="font-mono text-sm text-red-400">:d!</div>
                    <div className="font-mono text-xs text-[var(--text-secondary)] mt-1">삭제하기</div>
                </button>
            </div>
        </TerminalModal>
    )
}
