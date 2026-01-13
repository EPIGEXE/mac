import { Position, MarkerType, type Node, type Edge } from 'reactflow'
import dagre from 'dagre'
import type { RoadmapData, LayoutData, SectionDef, CategoryNodeDef } from './types'
import { categoryMapping, sections, categoryNodes, edgeDefinitions, sectionRootNodes, LAYOUT } from './config'
import type { Note } from '../../../db/core/schema'

// 노드 높이 계산 (노트 개수에 따라)
function getNodeHeight(noteCount: number): number {
    const headerHeight = 40
    const noteItemHeight = 28
    const displayCount = Math.min(noteCount, 4)
    const extraLine = noteCount > 4 ? 20 : 0
    return headerHeight + displayCount * noteItemHeight + extraLine + (noteCount > 0 ? 12 : 0)
}

// 노트를 카테고리별로 그룹화
function groupNotesByCategory(notes: Note[]): Record<string, { id: string; title: string }[]> {
    const grouped: Record<string, { id: string; title: string }[]> = {}
    notes.forEach((note) => {
        if (!grouped[note.category]) grouped[note.category] = []
        grouped[note.category].push({ id: note.id, title: note.title })
    })
    return grouped
}

// 섹션별 dagre 그래프 레이아웃 계산
function calculateSectionLayout(
    section: SectionDef,
    cats: CategoryNodeDef[],
    groupedNotes: Record<string, { id: string; title: string }[]>
): LayoutData {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph(LAYOUT.dagre)

    // 섹션 헤더 노드도 dagre에 추가
    const sectionNodeId = `section-${section.id}`
    g.setNode(sectionNodeId, {
        width: LAYOUT.sectionHeaderWidth,
        height: 60, // 섹션 헤더 높이
    })

    // 카테고리 노드 추가
    cats.forEach((cat) => {
        const mappedCategory = categoryMapping[cat.id]
        const noteCount = mappedCategory ? groupedNotes[mappedCategory]?.length || 0 : 0
        const height = getNodeHeight(noteCount)
        g.setNode(cat.id, { width: LAYOUT.nodeWidth, height })
    })

    // 섹션 → 루트 카테고리 엣지 추가
    const rootNodeIds = sectionRootNodes[section.id] || []
    rootNodeIds.forEach((rootId) => {
        if (cats.some((c) => c.id === rootId)) {
            g.setEdge(sectionNodeId, rootId)
        }
    })

    // 카테고리 간 엣지 추가
    const catIds = new Set(cats.map((c) => c.id))
    edgeDefinitions.forEach((edge) => {
        if (catIds.has(edge.from) && catIds.has(edge.to)) {
            g.setEdge(edge.from, edge.to)
        }
    })

    dagre.layout(g)

    // 섹션 너비/높이 계산 (섹션 노드 포함)
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity

    // 모든 노드 순회 (섹션 포함)
    g.nodes().forEach((nodeId) => {
        const pos = g.node(nodeId)
        minX = Math.min(minX, pos.x - pos.width / 2)
        maxX = Math.max(maxX, pos.x + pos.width / 2)
        minY = Math.min(minY, pos.y - pos.height / 2)
    })

    // 그래프 전체의 중심 X 계산
    const graphCenterX = (minX + maxX) / 2

    // 그래프 중심을 0으로 이동
    g.nodes().forEach((nodeId) => {
        const node = g.node(nodeId)
        node.x -= graphCenterX
    })

    // 중심 이동 후 다시 계산
    minX -= graphCenterX
    maxX -= graphCenterX

    return {
        section,
        cats,
        graph: g,
        width: maxX - minX,
        rootCenterX: 0,
        rootTopY: minY,
    }
}

// 섹션 offset 계산
function calculateSectionOffsets(layoutDataList: LayoutData[]): number[] {
    const offsets: number[] = []
    let currentOffsetX = 0

    layoutDataList.forEach((data, idx) => {
        const halfWidth = Math.max(data.width / 2, LAYOUT.sectionHeaderWidth / 2)
        if (idx === 0) {
            currentOffsetX = halfWidth
        }
        offsets.push(currentOffsetX)
        currentOffsetX += halfWidth + LAYOUT.sectionSpacing + (layoutDataList[idx + 1]?.width / 2 || 0)
    })

    return offsets
}

// ReactFlow 노드 생성
function createNodes(
    layoutDataList: LayoutData[],
    sectionOffsets: number[],
    groupedNotes: Record<string, { id: string; title: string }[]>,
    onNoteClick: (noteId: string) => void
): Node[] {
    const nodes: Node[] = []

    layoutDataList.forEach((data, idx) => {
        const offsetX = sectionOffsets[idx]
        const { section, cats, graph: g, rootTopY } = data
        const sectionNodeId = `section-${section.id}`

        // 섹션 헤더 노드 - dagre에서 계산된 위치 사용
        const sectionPos = g.node(sectionNodeId)
        nodes.push({
            id: sectionNodeId,
            type: 'section',
            position: {
                x: offsetX + sectionPos.x - sectionPos.width / 2,
                y: sectionPos.y - rootTopY - sectionPos.height / 2,
            },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            data: { label: section.label, id: section.id },
        })

        // 카테고리 노드
        cats.forEach((cat) => {
            const pos = g.node(cat.id)
            const mappedCategory = categoryMapping[cat.id]
            const notesForCat = mappedCategory ? groupedNotes[mappedCategory] || [] : []

            nodes.push({
                id: cat.id,
                type: 'category',
                position: {
                    x: offsetX + pos.x - pos.width / 2,
                    y: pos.y - rootTopY - pos.height / 2,
                },
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom,
                data: {
                    label: cat.label,
                    notes: notesForCat,
                    onNoteClick,
                },
            })
        })
    })

    return nodes
}

// 엣지 스타일 생성 헬퍼
function createEdgeStyle(dashed?: boolean) {
    const color = dashed ? 'var(--text-tertiary)' : 'var(--accent)'
    return {
        style: {
            stroke: color,
            strokeWidth: dashed ? 1.5 : 2,
            strokeDasharray: dashed ? '6,4' : undefined,
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 14,
            height: 14,
        },
    }
}

// ReactFlow 엣지 생성
function createEdges(layoutDataList: LayoutData[]): Edge[] {
    const edges: Edge[] = []

    layoutDataList.forEach((data) => {
        const { graph: g } = data

        // dagre 그래프에서 모든 엣지 가져오기
        g.edges().forEach((e) => {
            const sourceId = e.v
            const targetId = e.w

            // 엣지 스타일 결정
            let dashed = false

            // edgeDefinitions에서 dashed 속성 확인
            const edgeDef = edgeDefinitions.find((def) => def.from === sourceId && def.to === targetId)
            if (edgeDef?.dashed) {
                dashed = true
            }

            const edgeStyle = createEdgeStyle(dashed)
            edges.push({
                id: `edge-${sourceId}-${targetId}`,
                source: sourceId,
                target: targetId,
                type: 'smoothstep',
                ...edgeStyle,
            })
        })
    })

    return edges
}

// 메인 빌드 함수
export function buildRoadmapData(
    notes: Note[],
    onNoteClick: (noteId: string) => void,
    visibleSections: string[]
): RoadmapData {
    const groupedNotes = groupNotesByCategory(notes)

    // 보이는 섹션만 필터링
    const filteredSections = sections.filter((s) => visibleSections.includes(s.id))

    // 각 섹션별 레이아웃 계산
    const layoutDataList: LayoutData[] = []
    filteredSections.forEach((section) => {
        const cats = categoryNodes.filter((c) => c.section === section.id)
        if (cats.length === 0) return

        const layoutData = calculateSectionLayout(section, cats, groupedNotes)
        layoutDataList.push(layoutData)
    })

    // 섹션 offset 계산
    const sectionOffsets = calculateSectionOffsets(layoutDataList)

    // 노드와 엣지 생성
    const nodes = createNodes(layoutDataList, sectionOffsets, groupedNotes, onNoteClick)
    const edges = createEdges(layoutDataList)

    return { nodes, edges }
}
