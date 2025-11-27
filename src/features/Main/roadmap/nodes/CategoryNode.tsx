import { Handle, Position } from 'reactflow';

export interface CategoryNodeData {
    label: string;
    notes: { id: string; title: string }[];
    onNoteClick: (noteId: string) => void;
}

// 터미널 스타일 카테고리 노드
export function CategoryNode({ data }: { data: CategoryNodeData }) {
    const hasNotes = data.notes.length > 0;

    return (
        <div className="bg-[var(--bg-primary)] border border-[var(--border-medium)] rounded min-w-[160px] max-w-[220px] shadow-sm">
            <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
            <Handle type="target" position={Position.Left} id="left" className="opacity-0" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
            <Handle type="source" position={Position.Right} id="right" className="opacity-0" />

            {/* 카테고리 헤더 */}
            <div
                className={`py-2.5 px-3.5 flex items-center justify-between gap-3 ${
                    hasNotes ? 'border-b border-dashed border-[var(--border-light)]' : ''
                }`}
            >
                <div className="flex items-center gap-1.5">
                    <span
                        className={`font-mono text-sm ${
                            hasNotes ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                        }`}
                    >
                        #
                    </span>
                    <span
                        className={`text-[13px] font-medium whitespace-nowrap ${
                            hasNotes ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                        }`}
                    >
                        {data.label}
                    </span>
                </div>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                    [{data.notes.length}]
                </span>
            </div>

            {/* 노트 목록 */}
            {hasNotes && (
                <div className="py-1.5">
                    {data.notes.slice(0, 4).map((note) => (
                        <div
                            key={note.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onNoteClick(note.id);
                            }}
                            className="group py-1.5 px-3.5 flex items-center gap-2 cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-hover)]"
                        >
                            <span className="font-mono text-xs text-[var(--text-tertiary)] transition-colors duration-150 group-hover:text-[var(--accent)]">
                                {'>'}
                            </span>
                            <span className="font-display text-xs text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis tracking-[0.01em]">
                                {note.title}
                            </span>
                        </div>
                    ))}
                    {data.notes.length > 4 && (
                        <div className="py-1 px-3.5 font-mono text-[11px] text-[var(--text-tertiary)]">
                            +{data.notes.length - 4} more
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
