import { Handle, Position } from 'reactflow';

export interface SectionNodeData {
    label: string;
    id: string;
}

// 터미널 스타일 섹션 노드
export function SectionNode({ data }: { data: SectionNodeData }) {
    return (
        <div className="py-3 px-6 bg-[var(--bg-primary)] border border-[var(--accent)] min-w-[160px]">
            <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
            <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
            <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-[0.05em]">
                    {data.id}
                </span>
                <span className="font-display text-base font-normal text-[var(--text-primary)] whitespace-nowrap">
                    {data.label}
                </span>
            </div>
        </div>
    );
}
