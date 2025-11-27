import { Node } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import { CodeBlockView } from './CodeBlockView'
import { CheckboxView } from './CheckBoxview'
import { HorizontalRuleView } from './HorizontalRuleView'
import { ImageView } from './ImageView'
import { TableView } from './table/TableView'

// 기본 cellMinWidth (Tiptap 기본값)
const DEFAULT_CELL_MIN_WIDTH = 100

/**
 * NodeView 팩토리
 * 노션 스타일 테이블 핸들이 포함된 TableView 사용
 */
export function createNodeViews(cellMinWidth = DEFAULT_CELL_MIN_WIDTH) {
    return {
        checkbox: (node: Node, view: EditorView, getPos: () => number | undefined) =>
            new CheckboxView(node, view, getPos),
        horizontal_rule: (node: Node, view: EditorView, getPos: () => number | undefined) =>
            new HorizontalRuleView(node, view, getPos),
        table: (node: Node, view: EditorView, getPos: () => number | undefined) =>
            new TableView(node, cellMinWidth, view, getPos),
        code_block: (node: Node, view: EditorView, getPos: () => number | undefined) =>
            new CodeBlockView(node, view, getPos),
        image: (node: Node, view: EditorView, getPos: () => number | undefined) =>
            new ImageView(node, view, getPos),
    }
}
