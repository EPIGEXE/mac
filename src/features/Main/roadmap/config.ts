import type { TopicFilter, SectionDef, CategoryNodeDef, EdgeDef } from './types';
import { roadmapTree as generatedRoadmapTree, categoryMapping as generatedCategoryMapping } from '../../../data/roadmapGenerator';

// ============================================================================
// 트리 타입 정의
// ============================================================================

/** 트리 노드 정의 */
interface TreeNodeDef {
    label: string;
    dashed?: boolean;
    children?: Record<string, TreeNodeDef>;
}

/** 섹션 트리 정의 */
interface SectionTreeDef {
    label: string;
    children: Record<string, TreeNodeDef>;
}

// categories.ts에서 자동 생성된 트리 사용
const tree = generatedRoadmapTree as Record<string, SectionTreeDef>;

// ============================================================================
// 트리 → 플랫 구조 변환 (layout.ts에서 사용)
// ============================================================================

/** 트리에서 섹션 목록 추출 */
function buildSections(): SectionDef[] {
    return Object.entries(tree).map(([id, section]) => ({
        id,
        label: section.label,
    }));
}

/** 트리에서 카테고리 노드 추출 */
function buildCategoryNodes(): CategoryNodeDef[] {
    const nodes: CategoryNodeDef[] = [];

    function traverse(sectionId: string, subtree: Record<string, TreeNodeDef>) {
        Object.entries(subtree).forEach(([id, node]) => {
            nodes.push({ id, label: node.label, section: sectionId });
            if (node.children) {
                traverse(sectionId, node.children);
            }
        });
    }

    Object.entries(tree).forEach(([sectionId, section]) => {
        traverse(sectionId, section.children);
    });

    return nodes;
}

/** 트리에서 엣지 추출 */
function buildEdges(): EdgeDef[] {
    const edges: EdgeDef[] = [];

    function traverse(parentId: string | null, subtree: Record<string, TreeNodeDef>) {
        Object.entries(subtree).forEach(([id, node]) => {
            if (parentId) {
                edges.push({ from: parentId, to: id, dashed: node.dashed });
            }
            if (node.children) {
                traverse(id, node.children);
            }
        });
    }

    Object.values(tree).forEach((section) => {
        traverse(null, section.children);
    });

    return edges;
}

/** 섹션별 루트 노드 ID 추출 (섹션의 직계 자식들) */
function buildSectionRootNodes(): Record<string, string[]> {
    const rootNodes: Record<string, string[]> = {};

    Object.entries(tree).forEach(([sectionId, section]) => {
        rootNodes[sectionId] = Object.keys(section.children);
    });

    return rootNodes;
}

// 캐시된 결과 (매번 재계산 방지)
export const sections = buildSections();
export const categoryNodes = buildCategoryNodes();
export const edgeDefinitions = buildEdges();
export const sectionRootNodes = buildSectionRootNodes();

// ============================================================================
// 기타 설정
// ============================================================================

// 카테고리 매핑 (노드 id → 실제 카테고리명)
// categories.ts에서 자동 생성됨
export const categoryMapping = generatedCategoryMapping;

// TopicFilter → 섹션 ID 매핑
export const filterToSections: Record<TopicFilter, string[]> = {
    all: ['cs', 'fe', 'be'],
    cs: ['cs'],
    frontend: ['fe'],
    backend: ['be'],
};

// 레이아웃 상수
export const LAYOUT = {
    nodeWidth: 200,
    sectionHeaderWidth: 180,
    sectionSpacing: 180,
    dagre: {
        rankdir: 'TB' as const,
        ranksep: 60,   // 레벨 간 간격 (위아래)
        nodesep: 50,   // 같은 레벨 노드 간 간격 (좌우)
        marginx: 20,
        marginy: 20,
    },
};
