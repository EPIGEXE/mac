import type { Node, Edge } from 'reactflow';
import type dagre from 'dagre';
import type { Note } from '../../../lib/db';

// 필터 타입
export type TopicFilter = 'all' | 'cs' | 'frontend' | 'backend';

// 섹션 정의
export interface SectionDef {
    id: string;
    label: string;
}

// 카테고리 노드 정의
export interface CategoryNodeDef {
    id: string;
    label: string;
    section: string;
}

// 엣지 정의
export interface EdgeDef {
    from: string;
    to: string;
    dashed?: boolean;
}

// 레이아웃 계산 결과
export interface LayoutData {
    section: SectionDef;
    cats: CategoryNodeDef[];
    graph: dagre.graphlib.Graph;
    width: number;
    rootCenterX: number;
    rootTopY: number;
}

// 빌드 결과
export interface RoadmapData {
    nodes: Node[];
    edges: Edge[];
}
