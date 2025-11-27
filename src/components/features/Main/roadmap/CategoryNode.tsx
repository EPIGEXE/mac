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
        <div
            style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                minWidth: '160px',
                maxWidth: '220px',
            }}
        >
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />

            {/* 카테고리 헤더 - 터미널 스타일 */}
            <div
                style={{
                    padding: '10px 14px',
                    borderBottom: hasNotes ? '1px dashed var(--border-light)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '14px',
                            color: hasNotes ? 'var(--accent)' : 'var(--text-tertiary)',
                        }}
                    >
                        #
                    </span>
                    <span
                        style={{
                            fontFamily: 'var(--font-system)',
                            fontSize: '13px',
                            fontWeight: 'var(--font-weight-medium)',
                            color: hasNotes ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {data.label}
                    </span>
                </div>
                <span
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                    }}
                >
                    [{data.notes.length}]
                </span>
            </div>

            {/* 노트 목록 - 터미널 스타일 */}
            {hasNotes && (
                <div style={{ padding: '6px 0' }}>
                    {data.notes.slice(0, 4).map((note) => (
                        <div
                            key={note.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onNoteClick(note.id);
                            }}
                            style={{
                                padding: '6px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover)';
                                const arrow = e.currentTarget.querySelector('.note-arrow') as HTMLElement;
                                if (arrow) arrow.style.color = 'var(--accent)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                const arrow = e.currentTarget.querySelector('.note-arrow') as HTMLElement;
                                if (arrow) arrow.style.color = 'var(--text-tertiary)';
                            }}
                        >
                            <span
                                className="note-arrow"
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    transition: 'color 0.15s',
                                }}
                            >
                                {'>'}
                            </span>
                            <span
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    letterSpacing: '0.01em',
                                }}
                            >
                                {note.title}
                            </span>
                        </div>
                    ))}
                    {data.notes.length > 4 && (
                        <div
                            style={{
                                padding: '4px 14px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            +{data.notes.length - 4} more
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
