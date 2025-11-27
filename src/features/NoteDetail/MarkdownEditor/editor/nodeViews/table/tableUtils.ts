import type { Fragment, Node as ProseMirrorNode, NodeType, Schema, NodeSpec } from 'prosemirror-model'

// NodeSpec 확장 인터페이스
interface NodeSpecWithTableRole extends NodeSpec {
    tableRole?: string
}

// 스키마별 테이블 노드 타입을 캐싱하기 위한 WeakMap
// (스키마 객체가 가비지 컬렉션되면 캐시도 자동으로 사라짐)
const schemaTableNodeTypesCache = new WeakMap<Schema, { [key: string]: NodeType }>()

/**
 * Tiptap getTableNodeTypes.ts 기반
 * 스키마에서 테이블 관련 노드 타입 가져오기
 */
export function getTableNodeTypes(schema: Schema): { [key: string]: NodeType } {
    // 1. 캐시 확인
    const cached = schemaTableNodeTypesCache.get(schema)
    if (cached) {
        return cached
    }

    // 2. 캐시가 없으면 계산
    const roles: { [key: string]: NodeType } = {}

    Object.keys(schema.nodes).forEach((type) => {
        const nodeType = schema.nodes[type]
        // NodeSpec 단언은 불가피하지만, 이는 스키마 정의에 의존하는 부분임
        const spec = nodeType.spec as NodeSpecWithTableRole

        if (spec.tableRole) {
            roles[spec.tableRole] = nodeType
        }
    })

    // 3. 캐시 저장
    schemaTableNodeTypesCache.set(schema, roles)

    return roles
}

/**
 * Tiptap createCell.ts 기반
 * 테이블 셀 생성
 */
export function createCell(
    cellType: NodeType,
    cellContent?: Fragment | ProseMirrorNode | Array<ProseMirrorNode>
): ProseMirrorNode | null | undefined {
    if (cellContent) {
        return cellType.createChecked(null, cellContent)
    }
    return cellType.createAndFill()
}

/**
 * Tiptap createTable.ts 기반
 * 테이블 생성
 */
export function createTable(
    schema: Schema,
    rowsCount: number,
    colsCount: number,
    withHeaderRow: boolean,
    cellContent?: Fragment | ProseMirrorNode | Array<ProseMirrorNode>
): ProseMirrorNode {
    const types = getTableNodeTypes(schema)
    const headerCells: ProseMirrorNode[] = []
    const cells: ProseMirrorNode[] = []

    for (let index = 0; index < colsCount; index += 1) {
        const cell = createCell(types.cell, cellContent)
        if (cell) {
            cells.push(cell)
        }

        if (withHeaderRow) {
            const headerCell = createCell(types.header_cell, cellContent)
            if (headerCell) {
                headerCells.push(headerCell)
            }
        }
    }

    const rows: ProseMirrorNode[] = []

    for (let index = 0; index < rowsCount; index += 1) {
        rows.push(types.row.createChecked(null, withHeaderRow && index === 0 ? headerCells : cells))
    }

    return types.table.createChecked(null, rows)
}
