/**
 * 로드맵 자동 생성 유틸리티
 * - categories.ts를 Single Source of Truth로 사용
 * - roadmapTree와 categoryMapping을 자동 생성
 */

import { mainCategories, type RoadmapNode } from './categories'

// ============================================================================
// 로드맵 트리 생성
// ============================================================================

interface RoadmapTree {
    label: string
    children: Record<string, RoadmapNode>
}

/**
 * categories.ts에서 로드맵 트리 구조를 자동 생성
 * roadmapTree.json을 대체합니다.
 */
export function generateRoadmapTree(): Record<string, RoadmapTree> {
    const tree: Record<string, RoadmapTree> = {}

    mainCategories.forEach((mainCat) => {
        // roadmap 섹션 ID는 원래 JSON과 맞추기 위해 변환
        // cs → cs, frontend → fe, backend → be
        const sectionId = mainCat.id === 'frontend' ? 'fe' : mainCat.id === 'backend' ? 'be' : mainCat.id

        tree[sectionId] = {
            label: mainCat.roadmapLabel,
            children: mainCat.roadmap,
        }
    })

    return tree
}

// ============================================================================
// 카테고리 매핑 생성
// ============================================================================

/**
 * roadmap 노드 ID → Category 이름 매핑을 자동 생성
 * 예: hardwareSystem → HardwareSystem, javascript → JavaScript
 */
export function generateCategoryMapping(): Record<string, string> {
    const mapping: Record<string, string> = {}

    function traverse(roadmap: Record<string, RoadmapNode>, categories: readonly string[]) {
        Object.entries(roadmap).forEach(([key, node]) => {
            // camelCase key를 PascalCase category와 매칭
            const matchedCategory = categories.find(
                (cat) => cat.toLowerCase() === key.toLowerCase().replace(/-/g, '')
            )

            if (matchedCategory) {
                mapping[key] = matchedCategory
            }

            // 자식 노드도 탐색
            if (node.children) {
                traverse(node.children, categories)
            }
        })
    }

    mainCategories.forEach((mainCat) => {
        traverse(mainCat.roadmap, mainCat.categories)
    })

    return mapping
}

// ============================================================================
// 캐시된 결과 (매번 재계산 방지)
// ============================================================================

export const roadmapTree = generateRoadmapTree()
export const categoryMapping = generateCategoryMapping()
