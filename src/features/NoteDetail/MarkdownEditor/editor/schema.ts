import { Schema } from 'prosemirror-model'
import type { NodeSpec, MarkSpec } from 'prosemirror-model'

/**
 * 노트 에디터용 ProseMirror Schema
 *
 * 지원 블록:
 * - paragraph: 기본 문단
 * - heading: 제목 (h1, h2, h3)
 * - bullet_list / list_item: 글머리 기호 목록
 * - ordered_list: 번호 목록
 * - checkbox: 체크박스
 * - blockquote: 인용문
 * - code_block: 코드 블록
 */

// 노드 정의
const nodes: { [key: string]: NodeSpec } = {
    // 문서 루트
    doc: {
        content: 'block+',
    },

    // 기본 문단
    paragraph: {
        content: 'inline*',
        group: 'block',
        selectable: true,
        parseDOM: [{ tag: 'p' }],
        toDOM() {
            return ['p', 0]
        },
    },

    // 제목 (h1, h2, h3)
    heading: {
        attrs: { level: { default: 1 } },
        content: 'inline*',
        group: 'block',
        defining: true,
        selectable: true,
        parseDOM: [
            { tag: 'h1', attrs: { level: 1 } },
            { tag: 'h2', attrs: { level: 2 } },
            { tag: 'h3', attrs: { level: 3 } },
        ],
        toDOM(node) {
            return ['h' + node.attrs.level, 0]
        },
    },

    // 글머리 기호 목록
    bullet_list: {
        content: 'list_item+',
        group: 'block',
        selectable: true,
        parseDOM: [{ tag: 'ul' }],
        toDOM() {
            return ['ul', 0]
        },
    },

    // 번호 목록
    ordered_list: {
        attrs: { order: { default: 1 } },
        content: 'list_item+',
        group: 'block',
        selectable: true,
        parseDOM: [
            {
                tag: 'ol',
                getAttrs(dom) {
                    return {
                        order: (dom as HTMLElement).hasAttribute('start')
                            ? +(dom as HTMLElement).getAttribute('start')!
                            : 1,
                    }
                },
            },
        ],
        toDOM(node) {
            return node.attrs.order === 1 ? ['ol', 0] : ['ol', { start: node.attrs.order }, 0]
        },
    },

    // 목록 아이템
    list_item: {
        content: 'paragraph block*',
        parseDOM: [{ tag: 'li' }],
        toDOM() {
            return ['li', 0]
        },
        defining: true,
    },

    // 체크박스
    checkbox: {
        attrs: { checked: { default: false } },
        content: 'inline*',
        group: 'block',
        defining: true,
        selectable: true,
        parseDOM: [
            {
                tag: 'div[data-type="checkbox"]',
                getAttrs(dom) {
                    return {
                        checked: (dom as HTMLElement).getAttribute('data-checked') === 'true',
                    }
                },
            },
        ],
        toDOM(node) {
            return [
                'div',
                {
                    'data-type': 'checkbox',
                    'data-checked': node.attrs.checked ? 'true' : 'false',
                },
                0,
            ]
        },
    },

    // 인용문
    blockquote: {
        content: 'block+',
        group: 'block',
        defining: true,
        selectable: true,
        parseDOM: [{ tag: 'blockquote' }],
        toDOM() {
            return ['blockquote', 0]
        },
    },

    // 코드 블록
    code_block: {
        content: 'text*',
        marks: '',
        group: 'block',
        code: true,
        defining: true,
        selectable: true,
        attrs: {
            language: { default: null },
        },
        parseDOM: [
            {
                tag: 'pre',
                preserveWhitespace: 'full',
                getAttrs(dom) {
                    const code = (dom as HTMLElement).querySelector('code')
                    const className = code?.className || ''
                    const match = className.match(/language-(\w+)/)
                    return { language: match ? match[1] : null }
                },
            },
        ],
        toDOM(node) {
            const lang = node.attrs.language
            return ['pre', ['code', lang ? { class: `language-${lang}` } : {}, 0]]
        },
    },

    // 텍스트
    text: {
        group: 'inline',
    },

    // 하드 브레이크
    hard_break: {
        inline: true,
        group: 'inline',
        selectable: false,
        parseDOM: [{ tag: 'br' }],
        toDOM() {
            return ['br']
        },
    },

    // 가로선 (horizontal rule)
    horizontal_rule: {
        group: 'block',
        selectable: true,
        parseDOM: [{ tag: 'hr' }],
        toDOM() {
            return ['hr']
        },
    },

    // 이미지 (블록 레벨, atom으로 커서 진입 방지)
    image: {
        attrs: {
            src: {},
            alt: { default: null },
            title: { default: null },
            width: { default: null },
        },
        group: 'block',
        atom: true,
        draggable: true,
        selectable: true,
        parseDOM: [
            {
                tag: 'img[src]',
                getAttrs(dom) {
                    const width = (dom as HTMLElement).getAttribute('width')
                    return {
                        src: (dom as HTMLElement).getAttribute('src'),
                        alt: (dom as HTMLElement).getAttribute('alt'),
                        title: (dom as HTMLElement).getAttribute('title'),
                        width: width ? parseInt(width, 10) : null,
                    }
                },
            },
        ],
        toDOM(node) {
            const { src, alt, title, width } = node.attrs
            const attrs: Record<string, string | null> = { src, alt, title }
            if (width) attrs.width = String(width)
            return ['img', attrs]
        },
    },

    // 테이블 - Tiptap 스타일 (tableWrapper로 감싸기)
    table: {
        content: 'table_row+',
        group: 'block',
        tableRole: 'table',
        isolating: true,
        selectable: true,
        parseDOM: [
            { tag: 'table' },
            {
                tag: 'div.tableWrapper',
                getAttrs(dom) {
                    const table = (dom as HTMLElement).querySelector('table')
                    return table ? {} : false
                },
                contentElement: 'table tbody, table',
            },
        ],
        toDOM() {
            return ['div', { class: 'tableWrapper' }, ['table', ['tbody', 0]]]
        },
    },

    // 테이블 행
    table_row: {
        content: '(table_cell | table_header)+',
        tableRole: 'row',
        parseDOM: [{ tag: 'tr' }],
        toDOM() {
            return ['tr', 0]
        },
    },

    // 테이블 헤더 셀 - Tiptap 스타일 (content: block+)
    table_header: {
        content: 'block+',
        attrs: {
            colspan: { default: 1 },
            rowspan: { default: 1 },
            colwidth: { default: null },
        },
        tableRole: 'header_cell',
        isolating: true,
        parseDOM: [
            {
                tag: 'th',
                getAttrs(dom) {
                    const widthAttr = (dom as HTMLElement).getAttribute('colwidth')
                    const colwidth = widthAttr ? widthAttr.split(',').map((w) => parseInt(w, 10)) : null
                    return {
                        colspan: parseInt((dom as HTMLElement).getAttribute('colspan') || '1', 10),
                        rowspan: parseInt((dom as HTMLElement).getAttribute('rowspan') || '1', 10),
                        colwidth,
                    }
                },
            },
        ],
        toDOM(node) {
            const attrs: Record<string, string | undefined> = {}
            if (node.attrs.colspan !== 1) attrs.colspan = String(node.attrs.colspan)
            if (node.attrs.rowspan !== 1) attrs.rowspan = String(node.attrs.rowspan)
            if (node.attrs.colwidth) {
                attrs.colwidth = node.attrs.colwidth.join(',')
                attrs.style = `width: ${node.attrs.colwidth.reduce((a: number, b: number) => a + b, 0)}px`
            }
            return ['th', attrs, 0]
        },
    },

    // 테이블 셀 - Tiptap 스타일 (content: block+)
    table_cell: {
        content: 'block+',
        attrs: {
            colspan: { default: 1 },
            rowspan: { default: 1 },
            colwidth: { default: null },
        },
        tableRole: 'cell',
        isolating: true,
        parseDOM: [
            {
                tag: 'td',
                getAttrs(dom) {
                    const widthAttr = (dom as HTMLElement).getAttribute('colwidth')
                    const colwidth = widthAttr ? widthAttr.split(',').map((w) => parseInt(w, 10)) : null
                    return {
                        colspan: parseInt((dom as HTMLElement).getAttribute('colspan') || '1', 10),
                        rowspan: parseInt((dom as HTMLElement).getAttribute('rowspan') || '1', 10),
                        colwidth,
                    }
                },
            },
        ],
        toDOM(node) {
            const attrs: Record<string, string | undefined> = {}
            if (node.attrs.colspan !== 1) attrs.colspan = String(node.attrs.colspan)
            if (node.attrs.rowspan !== 1) attrs.rowspan = String(node.attrs.rowspan)
            if (node.attrs.colwidth) {
                attrs.colwidth = node.attrs.colwidth.join(',')
                attrs.style = `width: ${node.attrs.colwidth.reduce((a: number, b: number) => a + b, 0)}px`
            }
            return ['td', attrs, 0]
        },
    },
}

// 마크 정의 (인라인 포맷)
const marks: { [key: string]: MarkSpec } = {
    // 볼드
    bold: {
        parseDOM: [
            { tag: 'strong' },
            { tag: 'b' },
            {
                style: 'font-weight',
                getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
            },
        ],
        toDOM() {
            return ['strong', 0]
        },
    },

    // 이탤릭
    italic: {
        parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
        toDOM() {
            return ['em', 0]
        },
    },

    // 인라인 코드
    code: {
        parseDOM: [{ tag: 'code' }],
        toDOM() {
            return ['code', 0]
        },
    },

    // 링크
    link: {
        attrs: {
            href: {},
            title: { default: null },
        },
        inclusive: false,
        parseDOM: [
            {
                tag: 'a[href]',
                getAttrs(dom) {
                    return {
                        href: (dom as HTMLElement).getAttribute('href'),
                        title: (dom as HTMLElement).getAttribute('title'),
                    }
                },
            },
        ],
        toDOM(node) {
            const { href, title } = node.attrs
            return ['a', { href, title }, 0]
        },
    },

    // 취소선
    strikethrough: {
        parseDOM: [{ tag: 's' }, { tag: 'del' }, { tag: 'strike' }, { style: 'text-decoration=line-through' }],
        toDOM() {
            return ['s', 0]
        },
    },
}

// Schema 생성
export const schema = new Schema({
    nodes,
    marks,
})

export type EditorSchema = typeof schema
