import type { EditorState, Transaction } from 'prosemirror-state';
import { CellSelection, deleteTable } from 'prosemirror-tables';

/**
 * Tiptap isCellSelection.ts 기반
 */
export function isCellSelection(value: unknown): value is CellSelection {
  return value instanceof CellSelection;
}

/**
 * 테이블 내 노드 찾기
 */
function findTableNode(
  state: EditorState,
  $from: ReturnType<typeof state.doc.resolve>
): { node: ReturnType<typeof state.doc.nodeAt>; pos: number } | null {
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'table') {
      return { node, pos: $from.before(d) };
    }
  }
  return null;
}

/**
 * 모든 셀이 선택되었을 때 테이블 삭제
 */
export function deleteTableWhenAllCellsSelected(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const { selection } = state;

  if (!isCellSelection(selection)) {
    return false;
  }

  let cellCount = 0;
  const $from = selection.ranges[0].$from;
  const tableResult = findTableNode(state, $from);

  if (!tableResult) {
    return false;
  }

  tableResult.node?.descendants((node) => {
    if (node.type.name === 'table') {
      return false;
    }
    if (['table_cell', 'table_header'].includes(node.type.name)) {
      cellCount += 1;
    }
    return true;
  });

  const allCellsSelected = cellCount === selection.ranges.length;

  if (!allCellsSelected) {
    return false;
  }

  if (dispatch) {
    deleteTable(state, dispatch);
  }

  return true;
}
