import ReactFlow, {
    Background,
    Controls,
    type Node,
    type Edge,
    Position,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import type { Note } from '../../../../lib/db';
import { SectionNode, CategoryNode } from '../roadmap';
import type { TopicFilter } from '../Header';

const nodeTypes = {
    section: SectionNode,
    category: CategoryNode,
};

// TopicFilter → 섹션 ID 매핑
const filterToSections: Record<TopicFilter, string[]> = {
    all: ['cs', 'fe', 'be'],
    cs: ['cs'],
    frontend: ['fe'],
    backend: ['be'],
};

interface RoadmapViewProps {
    notes: Note[];
    onNoteClick: (noteId: string) => void;
    topicFilter: TopicFilter;
}

export function RoadmapView({ notes, onNoteClick, topicFilter }: RoadmapViewProps) {
    const visibleSections = filterToSections[topicFilter];
    const { nodes, edges } = buildRoadmapData(notes, onNoteClick, visibleSections);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: 0 }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{ type: 'smoothstep' }}
                style={{ background: 'var(--bg-primary)' }}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="var(--border-light)" gap={32} size={1} />
                <Controls
                    style={{
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-primary)',
                    }}
                />
            </ReactFlow>
        </div>
    );
}

function buildRoadmapData(
    notes: Note[],
    onNoteClick: (noteId: string) => void,
    visibleSections: string[]
): { nodes: Node[]; edges: Edge[] } {
    // 카테고리 매핑 (노드 id → 실제 카테고리명)
    const categoryMapping: Record<string, string> = {
        'cs': 'CS',
        'html': 'HTML',
        'css': 'CSS',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'react': 'React',
        'performance': 'Performance',
        'security': 'Security',
    };

    // 카테고리별 노트 그룹화
    const groupedNotes: Record<string, { id: string; title: string }[]> = {};
    notes.forEach((note) => {
        if (!groupedNotes[note.category]) groupedNotes[note.category] = [];
        groupedNotes[note.category].push({ id: note.id, title: note.title });
    });

    // 노드 높이 계산 (노트 개수에 따라)
    const getNodeHeight = (noteCount: number) => {
        const headerHeight = 40;
        const noteItemHeight = 28;
        const displayCount = Math.min(noteCount, 4);
        const extraLine = noteCount > 4 ? 20 : 0;
        return headerHeight + (displayCount * noteItemHeight) + extraLine + (noteCount > 0 ? 12 : 0);
    };

    // 섹션 정의 (필터링된 것만)
    const allSections = [
        { id: 'cs', label: 'CS 기초' },
        { id: 'fe', label: '프론트엔드' },
        { id: 'be', label: '백엔드 / 공통' },
    ];
    const sectionNodes = allSections.filter(s => visibleSections.includes(s.id));

    // 카테고리 노드 정의
    const categoryNodes = [
        // CS 기초
        { id: 'cs', label: 'CS 기초', section: 'cs' },
        { id: 'network', label: '네트워크', section: 'cs' },
        { id: 'os', label: '운영체제', section: 'cs' },
        { id: 'database', label: '데이터베이스', section: 'cs' },
        // 프론트엔드
        { id: 'internet', label: '인터넷', section: 'fe' },
        { id: 'html', label: 'HTML', section: 'fe' },
        { id: 'css', label: 'CSS', section: 'fe' },
        { id: 'sass', label: 'Sass', section: 'fe' },
        { id: 'tailwind', label: 'Tailwind', section: 'fe' },
        { id: 'javascript', label: 'JavaScript', section: 'fe' },
        { id: 'typescript', label: 'TypeScript', section: 'fe' },
        { id: 'npm', label: 'npm/yarn', section: 'fe' },
        { id: 'bundler', label: '번들러', section: 'fe' },
        { id: 'vite', label: 'Vite', section: 'fe' },
        { id: 'react', label: 'React', section: 'fe' },
        { id: 'nextjs', label: 'Next.js', section: 'fe' },
        { id: 'state', label: '상태관리', section: 'fe' },
        { id: 'testing', label: '테스팅', section: 'fe' },
        // 백엔드 / 공통
        { id: 'performance', label: 'Performance', section: 'be' },
        { id: 'security', label: 'Security', section: 'be' },
        { id: 'deploy', label: '배포', section: 'be' },
    ];

    // 엣지 정의
    const edgeDefinitions = [
        // CS
        { from: 'cs', to: 'network', dashed: true },
        { from: 'cs', to: 'os', dashed: true },
        { from: 'cs', to: 'database', dashed: true },
        // 프론트엔드
        { from: 'internet', to: 'html' },
        { from: 'html', to: 'css' },
        { from: 'css', to: 'sass', dashed: true },
        { from: 'css', to: 'tailwind', dashed: true },
        { from: 'css', to: 'javascript' },
        { from: 'javascript', to: 'typescript', dashed: true },
        { from: 'javascript', to: 'npm', dashed: true },
        { from: 'javascript', to: 'bundler' },
        { from: 'bundler', to: 'vite', dashed: true },
        { from: 'bundler', to: 'react' },
        { from: 'react', to: 'nextjs', dashed: true },
        { from: 'react', to: 'state', dashed: true },
        { from: 'react', to: 'testing', dashed: true },
        // 백엔드
        { from: 'performance', to: 'security', dashed: true },
        { from: 'security', to: 'deploy', dashed: true },
    ];

    const nodeWidth = 180;
    const sectionHeaderWidth = 180;
    const sectionSpacing = 120;

    // 섹션별 레이아웃 계산
    type LayoutData = {
        section: typeof sectionNodes[0];
        cats: typeof categoryNodes;
        graph: dagre.graphlib.Graph;
        width: number;
        rootCenterX: number;
        rootTopY: number;
    };
    const layoutDataList: LayoutData[] = [];

    sectionNodes.forEach((section) => {
        const cats = categoryNodes.filter(c => c.section === section.id);
        if (cats.length === 0) return;

        const g = new dagre.graphlib.Graph();
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph({
            rankdir: 'TB',
            ranksep: 40,
            nodesep: 20,
            marginx: 16,
            marginy: 16,
        });

        cats.forEach((cat) => {
            const mappedCategory = categoryMapping[cat.id];
            const noteCount = mappedCategory ? (groupedNotes[mappedCategory]?.length || 0) : 0;
            const height = getNodeHeight(noteCount);
            g.setNode(cat.id, { width: nodeWidth, height });
        });

        const catIds = new Set(cats.map(c => c.id));
        edgeDefinitions.forEach((edge) => {
            if (catIds.has(edge.from) && catIds.has(edge.to)) {
                g.setEdge(edge.from, edge.to);
            }
        });

        dagre.layout(g);

        let minX = Infinity, maxX = -Infinity;
        cats.forEach((cat) => {
            const pos = g.node(cat.id);
            minX = Math.min(minX, pos.x - pos.width / 2);
            maxX = Math.max(maxX, pos.x + pos.width / 2);
        });

        const rootPos = g.node(cats[0].id);

        layoutDataList.push({
            section,
            cats,
            graph: g,
            width: maxX - minX,
            rootCenterX: rootPos.x,
            rootTopY: rootPos.y - rootPos.height / 2,
        });
    });

    // 섹션 offsetX 계산
    let currentOffsetX = 0;
    const sectionOffsets: number[] = [];

    layoutDataList.forEach((data, idx) => {
        const halfWidth = Math.max(data.width / 2, sectionHeaderWidth / 2);
        if (idx === 0) {
            currentOffsetX = halfWidth;
        }
        sectionOffsets.push(currentOffsetX);
        currentOffsetX += halfWidth + sectionSpacing + (layoutDataList[idx + 1]?.width / 2 || 0);
    });

    // 노드와 엣지 생성
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    layoutDataList.forEach((data, idx) => {
        const offsetX = sectionOffsets[idx];
        const { section, cats, graph: g, rootCenterX, rootTopY } = data;

        // 섹션 헤더 노드
        allNodes.push({
            id: `section-${section.id}`,
            type: 'section',
            position: { x: offsetX - sectionHeaderWidth / 2, y: 0 },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            data: { label: section.label, id: section.id },
        });

        // 카테고리 노드
        cats.forEach((cat) => {
            const pos = g.node(cat.id);
            const mappedCategory = categoryMapping[cat.id];
            const notesForCat = mappedCategory ? (groupedNotes[mappedCategory] || []) : [];

            allNodes.push({
                id: cat.id,
                type: 'category',
                position: {
                    x: offsetX + (pos.x - rootCenterX) - pos.width / 2,
                    y: (pos.y - rootTopY) - pos.height / 2 + 80,
                },
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom,
                data: {
                    label: cat.label,
                    notes: notesForCat,
                    onNoteClick,
                },
            });
        });

        // 섹션 → 첫 카테고리 엣지
        allEdges.push({
            id: `edge-section-${section.id}-${cats[0].id}`,
            source: `section-${section.id}`,
            target: cats[0].id,
            type: 'smoothstep',
            style: { stroke: 'var(--accent)', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)', width: 16, height: 16 },
        });

        // 카테고리 간 엣지
        const catIds = new Set(cats.map(c => c.id));
        edgeDefinitions.forEach((edge) => {
            if (catIds.has(edge.from) && catIds.has(edge.to)) {
                allEdges.push({
                    id: `edge-${edge.from}-${edge.to}`,
                    source: edge.from,
                    target: edge.to,
                    type: 'smoothstep',
                    style: {
                        stroke: edge.dashed ? 'var(--border-medium)' : 'var(--accent)',
                        strokeWidth: edge.dashed ? 1 : 1.5,
                        strokeDasharray: edge.dashed ? '4,4' : undefined,
                    },
                    markerEnd: edge.dashed ? undefined : {
                        type: MarkerType.ArrowClosed,
                        color: 'var(--accent)',
                        width: 16,
                        height: 16,
                    },
                });
            }
        });
    });

    return { nodes: allNodes, edges: allEdges };
}
