import { Node, Fragment, Slice } from 'prosemirror-model'
import { schema } from './schema'

/**
 * 마크다운 → ProseMirror Doc 변환
 */
export function parseMarkdown(markdown: string): Node {
    // Windows 줄바꿈(\r\n)을 Unix 줄바꿈(\n)으로 정규화
    const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalizedMarkdown.split('\n')
    const blocks: Node[] = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()

        // 빈 줄 → 빈 paragraph (빈 줄 유지)
        if (!trimmed) {
            blocks.push(schema.nodes.paragraph.create())
            i++
            continue
        }

        // 코드 블록 (언어 지정 지원)
        const codeBlockMatch = trimmed.match(/^```(\w*)$/)
        if (codeBlockMatch) {
            const language = codeBlockMatch[1] || 'plaintext'
            const codeLines: string[] = []
            const startIndex = i
            i++
            // 안전장치: 최대 반복 횟수 제한 (무한 루프 방지)
            const maxIterations = lines.length - startIndex
            let iterations = 0
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                if (++iterations > maxIterations) {
                    console.error('Code block parsing exceeded max iterations, breaking loop')
                    break
                }
                codeLines.push(lines[i])
                i++
            }
            i++ // 닫는 ``` 스킵
            blocks.push(
                schema.nodes.code_block.create(
                    { language },
                    codeLines.length > 0 ? schema.text(codeLines.join('\n')) : null
                )
            )
            continue
        }

        // 제목
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/)
        if (headingMatch) {
            const level = headingMatch[1].length
            const content = headingMatch[2]
            blocks.push(schema.nodes.heading.create({ level }, content ? parseInlineContent(content) : null))
            i++
            continue
        }

        // 체크박스
        const checkboxMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)$/)
        if (checkboxMatch) {
            const checked = checkboxMatch[1].toLowerCase() === 'x'
            const content = checkboxMatch[2]
            blocks.push(schema.nodes.checkbox.create({ checked }, content ? parseInlineContent(content) : null))
            i++
            continue
        }

        // 글머리 기호 목록 (중첩 지원)
        if (/^(\s*)[-*]\s+/.test(line)) {
            const result = parseBulletList(lines, i)
            blocks.push(result.node)
            i = result.nextIndex
            continue
        }

        // 번호 목록 (중첩 지원)
        if (/^(\s*)\d+\.\s+/.test(line)) {
            const result = parseOrderedList(lines, i)
            blocks.push(result.node)
            i = result.nextIndex
            continue
        }

        // 가로선
        if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed) || /^___+$/.test(trimmed)) {
            blocks.push(schema.nodes.horizontal_rule.create())
            i++
            continue
        }

        // 인용문
        if (trimmed.startsWith('>')) {
            const quoteLines: string[] = []
            const startIndex = i
            const maxIterations = lines.length - startIndex
            let iterations = 0
            while (i < lines.length && lines[i].trim().startsWith('>')) {
                if (++iterations > maxIterations) {
                    console.error('Blockquote parsing exceeded max iterations')
                    break
                }
                quoteLines.push(lines[i].trim().replace(/^>\s*/, ''))
                i++
            }
            const quoteContent = quoteLines.join('\n')
            blocks.push(
                schema.nodes.blockquote.create(
                    null,
                    schema.nodes.paragraph.create(null, quoteContent ? parseInlineContent(quoteContent) : null)
                )
            )
            continue
        }

        // 테이블 (| 로 시작하는 줄)
        if (trimmed.startsWith('|')) {
            const result = parseTable(lines, i)
            if (result) {
                blocks.push(result.node)
                i = result.nextIndex
                continue
            }
        }

        // 일반 문단
        blocks.push(schema.nodes.paragraph.create(null, trimmed ? parseInlineContent(trimmed) : null))
        i++
    }

    // 빈 문서인 경우 빈 paragraph 추가
    if (blocks.length === 0) {
        blocks.push(schema.nodes.paragraph.create())
    }

    return schema.nodes.doc.create(null, blocks)
}

/**
 * 인라인 콘텐츠 파싱 (bold, italic, code, strikethrough, link)
 */
function parseInlineContent(text: string): Fragment {
    const nodes: Node[] = []

    // 인라인 마크다운 패턴
    // 순서: 이미지 → 링크 → 볼드 → 이탤릭 → 코드 → 취소선
    const patterns = [
        // 이미지: ![alt](url) - 링크보다 먼저
        { regex: /!\[([^\]]*)\]\(([^)]+)\)/, type: 'image' },
        // 링크: [text](url)
        { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: 'link' },
        // 볼드: **text**
        { regex: /\*\*([^*]+)\*\*/, type: 'bold' },
        // 취소선: ~~text~~
        { regex: /~~([^~]+)~~/, type: 'strikethrough' },
        // 인라인 코드: `code`
        { regex: /`([^`]+)`/, type: 'code' },
        // 이탤릭: *text* (단독 *)
        { regex: /(?<!\*)\*([^*]+)\*(?!\*)/, type: 'italic' },
    ]

    let remaining = text

    while (remaining.length > 0) {
        let earliestMatch: { index: number; length: number; type: string; content: string; href?: string } | null = null

        // 가장 먼저 나오는 패턴 찾기
        for (const pattern of patterns) {
            const match = remaining.match(pattern.regex)
            if (match && match.index !== undefined) {
                if (!earliestMatch || match.index < earliestMatch.index) {
                    earliestMatch = {
                        index: match.index,
                        length: match[0].length,
                        type: pattern.type,
                        content: pattern.type === 'link' ? match[1] : match[1],
                        href: pattern.type === 'link' ? match[2] : undefined,
                    }
                }
            }
        }

        if (earliestMatch) {
            // 매치 이전의 일반 텍스트
            if (earliestMatch.index > 0) {
                nodes.push(schema.text(remaining.slice(0, earliestMatch.index)))
            }

            // 이미지는 노드로 처리
            if (earliestMatch.type === 'image') {
                nodes.push(
                    schema.nodes.image.create({
                        src: earliestMatch.href,
                        alt: earliestMatch.content,
                    })
                )
            } else {
                // 마크가 적용된 텍스트
                const mark =
                    earliestMatch.type === 'link'
                        ? schema.marks.link.create({ href: earliestMatch.href })
                        : schema.marks[earliestMatch.type].create()
                nodes.push(schema.text(earliestMatch.content, [mark]))
            }

            // 나머지 텍스트
            remaining = remaining.slice(earliestMatch.index + earliestMatch.length)
        } else {
            // 더 이상 패턴 없음 → 나머지 전체를 일반 텍스트로
            nodes.push(schema.text(remaining))
            break
        }
    }

    return Fragment.from(nodes)
}

/**
 * 테이블 파싱
 * 마크다운 테이블 형식:
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 */
function parseTable(lines: string[], startIndex: number): { node: Node; nextIndex: number } | null {
    const tableLines: string[] = []
    let i = startIndex

    // 테이블 줄 수집 (| 로 시작하는 연속된 줄들)
    const maxIterations = lines.length - startIndex
    let iterations = 0
    while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (++iterations > maxIterations) {
            console.error('Table parsing exceeded max iterations')
            break
        }
        tableLines.push(lines[i].trim())
        i++
    }

    // 최소 2줄 필요 (헤더 + 구분선)
    if (tableLines.length < 2) {
        return null
    }

    // 두 번째 줄이 구분선인지 확인 (|---|---|)
    const separatorLine = tableLines[1]
    if (!/^\|[\s\-:|]+\|$/.test(separatorLine)) {
        return null
    }

    const rows: Node[] = []

    // 첫 번째 줄은 헤더
    const headerCells = parseTableRow(tableLines[0])
    if (headerCells.length === 0) return null

    const headerNodes = headerCells.map((cellContent) =>
        schema.nodes.table_header.create(
            null,
            schema.nodes.paragraph.create(null, cellContent ? parseInlineContent(cellContent) : null)
        )
    )
    rows.push(schema.nodes.table_row.create(null, headerNodes))

    // 세 번째 줄부터 데이터 행
    for (let j = 2; j < tableLines.length; j++) {
        const cells = parseTableRow(tableLines[j])
        // 셀 수가 헤더와 다르면 빈 셀로 채움
        while (cells.length < headerCells.length) {
            cells.push('')
        }

        const cellNodes = cells
            .slice(0, headerCells.length)
            .map((cellContent) =>
                schema.nodes.table_cell.create(
                    null,
                    schema.nodes.paragraph.create(null, cellContent ? parseInlineContent(cellContent) : null)
                )
            )
        rows.push(schema.nodes.table_row.create(null, cellNodes))
    }

    return {
        node: schema.nodes.table.create(null, rows),
        nextIndex: i,
    }
}

/**
 * 테이블 행 파싱 - | 로 구분된 셀들을 배열로 반환
 */
function parseTableRow(line: string): string[] {
    // 양 끝의 | 제거 후 | 로 분리
    const trimmed = line.replace(/^\||\|$/g, '')
    return trimmed.split('|').map((cell) => cell.trim())
}

/**
 * 글머리 기호 목록 파싱 (중첩 지원)
 */
function parseBulletList(
    lines: string[],
    startIndex: number,
    baseIndent: number = 0
): { node: Node; nextIndex: number } {
    const items: Node[] = []
    let i = startIndex
    const maxIterations = lines.length - startIndex
    let iterations = 0

    while (i < lines.length) {
        if (++iterations > maxIterations) {
            console.error('Bullet list parsing exceeded max iterations')
            break
        }
        const line = lines[i]
        const match = line.match(/^(\s*)([-*])\s+(.*)$/)

        if (!match) break

        const indent = match[1].length
        const content = match[3]

        // 현재 레벨보다 들여쓰기가 적으면 종료
        if (indent < baseIndent) break

        // 현재 레벨과 같은 들여쓰기
        if (indent === baseIndent) {
            const itemContent: Node[] = []

            // 아이템 내용을 paragraph로
            itemContent.push(schema.nodes.paragraph.create(null, content ? parseInlineContent(content) : null))

            i++

            // 다음 줄이 더 깊은 들여쓰기면 중첩 목록
            if (i < lines.length) {
                const nextLine = lines[i]
                const nextBulletMatch = nextLine.match(/^(\s*)([-*])\s+/)
                const nextOrderedMatch = nextLine.match(/^(\s*)\d+\.\s+/)

                if (nextBulletMatch && nextBulletMatch[1].length > baseIndent) {
                    const nested = parseBulletList(lines, i, nextBulletMatch[1].length)
                    itemContent.push(nested.node)
                    i = nested.nextIndex
                } else if (nextOrderedMatch && nextOrderedMatch[1].length > baseIndent) {
                    const nested = parseOrderedList(lines, i, nextOrderedMatch[1].length)
                    itemContent.push(nested.node)
                    i = nested.nextIndex
                }
            }

            items.push(schema.nodes.list_item.create(null, itemContent))
        } else {
            // 더 깊은 들여쓰기면 중첩 목록으로 처리 (이미 위에서 처리됨)
            break
        }
    }

    return {
        node: schema.nodes.bullet_list.create(null, items),
        nextIndex: i,
    }
}

/**
 * 번호 목록 파싱 (중첩 지원)
 */
function parseOrderedList(
    lines: string[],
    startIndex: number,
    baseIndent: number = 0
): { node: Node; nextIndex: number } {
    const items: Node[] = []
    let i = startIndex
    let startOrder = 1
    const maxIterations = lines.length - startIndex
    let iterations = 0

    while (i < lines.length) {
        if (++iterations > maxIterations) {
            console.error('Ordered list parsing exceeded max iterations')
            break
        }
        const line = lines[i]
        const match = line.match(/^(\s*)(\d+)\.\s+(.*)$/)

        if (!match) break

        const indent = match[1].length
        const orderNum = parseInt(match[2], 10)
        const content = match[3]

        // 첫 번째 아이템의 번호를 시작 번호로
        if (items.length === 0) {
            startOrder = orderNum
        }

        // 현재 레벨보다 들여쓰기가 적으면 종료
        if (indent < baseIndent) break

        // 현재 레벨과 같은 들여쓰기
        if (indent === baseIndent) {
            const itemContent: Node[] = []

            // 아이템 내용을 paragraph로
            itemContent.push(schema.nodes.paragraph.create(null, content ? parseInlineContent(content) : null))

            i++

            // 다음 줄이 더 깊은 들여쓰기면 중첩 목록
            if (i < lines.length) {
                const nextLine = lines[i]
                const nextBulletMatch = nextLine.match(/^(\s*)([-*])\s+/)
                const nextOrderedMatch = nextLine.match(/^(\s*)\d+\.\s+/)

                if (nextBulletMatch && nextBulletMatch[1].length > baseIndent) {
                    const nested = parseBulletList(lines, i, nextBulletMatch[1].length)
                    itemContent.push(nested.node)
                    i = nested.nextIndex
                } else if (nextOrderedMatch && nextOrderedMatch[1].length > baseIndent) {
                    const nested = parseOrderedList(lines, i, nextOrderedMatch[1].length)
                    itemContent.push(nested.node)
                    i = nested.nextIndex
                }
            }

            items.push(schema.nodes.list_item.create(null, itemContent))
        } else {
            break
        }
    }

    return {
        node: schema.nodes.ordered_list.create({ order: startOrder }, items),
        nextIndex: i,
    }
}

/**
 * ProseMirror Doc → 마크다운 변환
 */
export function serializeToMarkdown(doc: Node): string {
    const lines: string[] = []

    doc.forEach((node) => {
        const serialized = serializeNode(node)
        lines.push(serialized)
    })

    // 빈 paragraph는 빈 문자열로 직렬화되므로 \n으로 구분
    return lines.join('\n')
}

function serializeNode(node: Node): string {
    switch (node.type.name) {
        case 'paragraph':
            return serializeInline(node)

        case 'heading': {
            const prefix = '#'.repeat(node.attrs.level)
            return `${prefix} ${serializeInline(node)}`
        }

        case 'checkbox': {
            const checkbox = node.attrs.checked ? '[x]' : '[ ]'
            return `- ${checkbox} ${serializeInline(node)}`
        }

        case 'bullet_list':
            return serializeList(node, '-')

        case 'ordered_list':
            return serializeOrderedList(node, node.attrs.order)

        case 'blockquote': {
            const quoteContent: string[] = []
            node.forEach((child) => {
                quoteContent.push(`> ${serializeNode(child)}`)
            })
            return quoteContent.join('\n')
        }

        case 'code_block': {
            const lang = node.attrs.language || ''
            return '```' + lang + '\n' + node.textContent + '\n```'
        }
        case 'horizontal_rule':
            return '---'

        case 'table':
            return serializeTable(node)

        case 'list_item':
            // list_item은 부모에서 처리
            return ''

        case 'table_row':
        case 'table_cell':
        case 'table_header':
            // 테이블 관련 노드는 부모에서 처리
            return ''

        default:
            return node.textContent
    }
}

function serializeInline(node: Node): string {
    let text = ''

    node.forEach((child) => {
        if (child.isText) {
            let content = child.text || ''

            // 마크 적용
            child.marks.forEach((mark) => {
                switch (mark.type.name) {
                    case 'bold':
                        content = `**${content}**`
                        break
                    case 'italic':
                        content = `*${content}*`
                        break
                    case 'code':
                        content = `\`${content}\``
                        break
                    case 'strikethrough':
                        content = `~~${content}~~`
                        break
                    case 'link':
                        content = `[${content}](${mark.attrs.href})`
                        break
                }
            })

            text += content
        } else if (child.type.name === 'hard_break') {
            text += '\n'
        } else if (child.type.name === 'image') {
            const alt = child.attrs.alt || ''
            const src = child.attrs.src || ''
            text += `![${alt}](${src})`
        }
    })

    return text
}

function serializeList(node: Node, marker: string, indent: number = 0): string {
    const items: string[] = []
    const indentStr = '  '.repeat(indent)

    node.forEach((item) => {
        const lines: string[] = []
        let firstLine = true

        item.forEach((child) => {
            if (child.type.name === 'paragraph') {
                if (firstLine) {
                    lines.push(`${indentStr}${marker} ${serializeInline(child)}`)
                    firstLine = false
                } else {
                    lines.push(`${indentStr}  ${serializeInline(child)}`)
                }
            } else if (child.type.name === 'bullet_list') {
                lines.push(serializeList(child, '-', indent + 1))
            } else if (child.type.name === 'ordered_list') {
                lines.push(serializeOrderedListWithIndent(child, child.attrs.order, indent + 1))
            } else {
                lines.push(serializeNode(child))
            }
        })

        items.push(lines.join('\n'))
    })

    return items.join('\n')
}

function serializeOrderedListWithIndent(node: Node, startOrder: number, indent: number = 0): string {
    const items: string[] = []
    let order = startOrder
    const indentStr = '  '.repeat(indent)

    node.forEach((item) => {
        const lines: string[] = []
        let firstLine = true

        item.forEach((child) => {
            if (child.type.name === 'paragraph') {
                if (firstLine) {
                    lines.push(`${indentStr}${order}. ${serializeInline(child)}`)
                    firstLine = false
                } else {
                    lines.push(`${indentStr}   ${serializeInline(child)}`)
                }
            } else if (child.type.name === 'bullet_list') {
                lines.push(serializeList(child, '-', indent + 1))
            } else if (child.type.name === 'ordered_list') {
                lines.push(serializeOrderedListWithIndent(child, child.attrs.order, indent + 1))
            } else {
                lines.push(serializeNode(child))
            }
        })

        items.push(lines.join('\n'))
        order++
    })

    return items.join('\n')
}

// 기존 serializeOrderedList를 유지 (호환성)
function serializeOrderedList(node: Node, startOrder: number): string {
    return serializeOrderedListWithIndent(node, startOrder, 0)
}

/**
 * 테이블 직렬화
 */
function serializeTable(node: Node): string {
    const rows: string[][] = []
    let isFirstRow = true

    // 각 행 처리
    node.forEach((row) => {
        const cells: string[] = []
        row.forEach((cell) => {
            // 셀 내부의 첫 번째 paragraph 내용만 추출
            let cellContent = ''
            cell.forEach((child) => {
                if (child.type.name === 'paragraph') {
                    cellContent += serializeInline(child)
                }
            })
            cells.push(cellContent)
        })
        rows.push(cells)

        if (isFirstRow) {
            isFirstRow = false
        }
    })

    if (rows.length === 0) return ''

    const lines: string[] = []

    // 헤더 행
    lines.push('| ' + rows[0].join(' | ') + ' |')

    // 구분선 (각 열의 너비에 맞춰)
    const separator = rows[0].map((cell) => {
        const width = Math.max(cell.length, 3)
        return '-'.repeat(width)
    })
    lines.push('| ' + separator.join(' | ') + ' |')

    // 데이터 행
    for (let i = 1; i < rows.length; i++) {
        lines.push('| ' + rows[i].join(' | ') + ' |')
    }

    return lines.join('\n')
}

/**
 * Slice(복사된 콘텐츠)를 마크다운으로 변환
 * clipboardTextSerializer에서 사용
 */
export function serializeSliceToMarkdown(slice: Slice): string {
    const lines: string[] = []

    // Slice의 content를 순회
    slice.content.forEach((node) => {
        const serialized = serializeNode(node)
        lines.push(serialized)
    })

    // 블록 사이에 빈 줄 추가 (가독성 향상)
    return lines.join('\n\n')
}
