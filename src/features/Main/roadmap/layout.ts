import { Position, MarkerType, type Node, type Edge } from 'reactflow';
import dagre from 'dagre';
import type { Note } from '../../../db/schema/note';
import type { RoadmapData, LayoutData, SectionDef, CategoryNodeDef } from './types';
import {
    categoryMapping,
    sections,
    categoryNodes,
    edgeDefinitions,
    LAYOUT,
} from './config';

// 노드 높이 계산 (노트 개수에 따라)
function getNodeHeight(noteCount: number): number {
    const headerHeight = 40;
    const noteItemHeight = 28;
    const displayCount = Math.min(noteCount, 4);
    const extraLine = noteCount > 4 ? 20 : 0;
    return headerHeight + displayCount * noteItemHeight + extraLine + (noteCount > 0 ? 12 : 0);
}

// 노트를 카테고리별로 그룹화
function groupNotesByCategory(notes: Note[]): Record<string, { id: string; title: string }[]> {
    const grouped: Record<string, { id: string; title: string }[]> = {};
    notes.forEach((note) => {
        if (!grouped[note.category]) grouped[note.category] = [];
        grouped[note.category].push({ id: note.id, title: note.title });
    });
    return grouped;
}

// 섹션별 dagre 그래프 레이아웃 계산
function calculateSectionLayout(
    section: SectionDef,
    cats: CategoryNodeDef[],
    groupedNotes: Record<string, { id: string; title: string }[]>
): LayoutData {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph(LAYOUT.dagre);

    // 노드 추가
    cats.forEach((cat) => {
        const mappedCategory = categoryMapping[cat.id];
        const noteCount = mappedCategory ? (groupedNotes[mappedCategory]?.length || 0) : 0;
        const height = getNodeHeight(noteCount);
        g.setNode(cat.id, { width: LAYOUT.nodeWidth, height });
    });

    // 엣지 추가
    const catIds = new Set(cats.map((c) => c.id));
    edgeDefinitions.forEach((edge) => {
        if (catIds.has(edge.from) && catIds.has(edge.to)) {
            g.setEdge(edge.from, edge.to);
        }
    });

    dagre.layout(g);

    // 섹션 너비 계산
    let minX = Infinity,
        maxX = -Infinity;
    cats.forEach((cat) => {
        const pos = g.node(cat.id);
        minX = Math.min(minX, pos.x - pos.width / 2);
        maxX = Math.max(maxX, pos.x + pos.width / 2);
    });

    const rootPos = g.node(cats[0].id);

    return {
        section,
        cats,
        graph: g,
        width: maxX - minX,
        rootCenterX: rootPos.x,
        rootTopY: rootPos.y - rootPos.height / 2,
    };
}

// 섹션 offset 계산
function calculateSectionOffsets(layoutDataList: LayoutData[]): number[] {
    const offsets: number[] = [];
    let currentOffsetX = 0;

    layoutDataList.forEach((data, idx) => {
        const halfWidth = Math.max(data.width / 2, LAYOUT.sectionHeaderWidth / 2);
        if (idx === 0) {
            currentOffsetX = halfWidth;
        }
        offsets.push(currentOffsetX);
        currentOffsetX += halfWidth + LAYOUT.sectionSpacing + (layoutDataList[idx + 1]?.width / 2 || 0);
    });

    return offsets;
}

// ReactFlow 노드 생성
function createNodes(
    layoutDataList: LayoutData[],
    sectionOffsets: number[],
    groupedNotes: Record<string, { id: string; title: string }[]>,
    onNoteClick: (noteId: string) => void
): Node[] {
    const nodes: Node[] = [];

    layoutDataList.forEach((data, idx) => {
        const offsetX = sectionOffsets[idx];
        const { section, cats, graph: g, rootCenterX, rootTopY } = data;

        // 섹션 헤더 노드
        nodes.push({
            id: `section-${section.id}`,
            type: 'section',
            position: { x: offsetX - LAYOUT.sectionHeaderWidth / 2, y: 0 },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            data: { label: section.label, id: section.id },
        });

        // 카테고리 노드
        cats.forEach((cat) => {
            const pos = g.node(cat.id);
            const mappedCategory = categoryMapping[cat.id];
            const notesForCat = mappedCategory ? (groupedNotes[mappedCategory] || []) : [];

            nodes.push({
                id: cat.id,
                type: 'category',
                position: {
                    x: offsetX + (pos.x - rootCenterX) - pos.width / 2,
                    y: pos.y - rootTopY - pos.height / 2 + 80,
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
    });

    return nodes;
}

// ReactFlow 엣지 생성
function createEdges(layoutDataList: LayoutData[]): Edge[] {
    const edges: Edge[] = [];

    layoutDataList.forEach((data) => {
        const { section, cats } = data;

        // 섹션 → 첫 카테고리 엣지
        edges.push({
            id: `edge-section-${section.id}-${cats[0].id}`,
            source: `section-${section.id}`,
            target: cats[0].id,
            type: 'smoothstep',
            style: { stroke: 'var(--accent)', strokeWidth: 1.5 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: 'var(--accent)',
                width: 16,
                height: 16,
            },
        });

        // 카테고리 간 엣지
        const catIds = new Set(cats.map((c) => c.id));
        edgeDefinitions.forEach((edge) => {
            if (catIds.has(edge.from) && catIds.has(edge.to)) {
                edges.push({
                    id: `edge-${edge.from}-${edge.to}`,
                    source: edge.from,
                    target: edge.to,
                    type: 'smoothstep',
                    style: {
                        stroke: edge.dashed ? 'var(--border-medium)' : 'var(--accent)',
                        strokeWidth: edge.dashed ? 1 : 1.5,
                        strokeDasharray: edge.dashed ? '4,4' : undefined,
                    },
                    markerEnd: edge.dashed
                        ? undefined
                        : {
                              type: MarkerType.ArrowClosed,
                              color: 'var(--accent)',
                              width: 16,
                              height: 16,
                          },
                });
            }
        });
    });

    return edges;
}

// 메인 빌드 함수
export function buildRoadmapData(
    notes: Note[],
    onNoteClick: (noteId: string) => void,
    visibleSections: string[]
): RoadmapData {
    const groupedNotes = groupNotesByCategory(notes);

    // 보이는 섹션만 필터링
    const filteredSections = sections.filter((s) => visibleSections.includes(s.id));

    // 각 섹션별 레이아웃 계산
    const layoutDataList: LayoutData[] = [];
    filteredSections.forEach((section) => {
        const cats = categoryNodes.filter((c) => c.section === section.id);
        if (cats.length === 0) return;

        const layoutData = calculateSectionLayout(section, cats, groupedNotes);
        layoutDataList.push(layoutData);
    });

    // 섹션 offset 계산
    const sectionOffsets = calculateSectionOffsets(layoutDataList);

    // 노드와 엣지 생성
    const nodes = createNodes(layoutDataList, sectionOffsets, groupedNotes, onNoteClick);
    const edges = createEdges(layoutDataList);

    return { nodes, edges };
}
