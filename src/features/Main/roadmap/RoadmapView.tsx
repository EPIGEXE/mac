import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { filterToSections } from './config';
import { buildRoadmapData } from './layout';
import { SectionNode } from './nodes/SectionNode';
import { CategoryNode } from './nodes/CategoryNode';
import type { TopicFilter } from '../MainHeader';
import type { Note } from '../../../db/schema/note';


// 컴포넌트 Props
export interface RoadmapViewProps {
    notes: Note[];
    onNoteClick: (noteId: string) => void;
    topicFilter: TopicFilter;
}

const nodeTypes = {
    section: SectionNode,
    category: CategoryNode,
};

export function RoadmapView({ notes, onNoteClick, topicFilter }: RoadmapViewProps) {
    const visibleSections = filterToSections[topicFilter];
    const { nodes, edges } = buildRoadmapData(notes, onNoteClick, visibleSections);

    return (
        <div className="w-full h-full min-h-0">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{ type: 'smoothstep' }}
                className="bg-[var(--bg-primary)]"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="var(--border-light)" gap={32} size={1} />
                <Controls className="border border-[var(--border-light)] bg-[var(--bg-primary)]" />
            </ReactFlow>
        </div>
    );
}
