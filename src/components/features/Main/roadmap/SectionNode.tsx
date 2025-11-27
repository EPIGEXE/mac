import { Handle, Position } from 'reactflow';

export interface SectionNodeData {
    label: string;
    id: string;
}

// 터미널 스타일 섹션 노드
export function SectionNode({ data }: { data: SectionNodeData }) {
    return (
        <div
            style={{
                padding: '12px 24px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--accent)',
                minWidth: '160px',
            }}
        >
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Left} id="left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    {data.id}
                </span>
                <span
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '16px',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {data.label}
                </span>
            </div>
        </div>
    );
}
