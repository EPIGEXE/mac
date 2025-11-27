import type { Node as ProseMirrorNode } from 'prosemirror-model'

/**
 * Tiptap colStyle.ts 기반
 * 컬럼 스타일 선언 반환
 */
export function getColStyleDeclaration(minWidth: number, width: number | undefined): [string, string] {
    if (width) {
        // 저장된 width가 설정된 최소 셀 너비보다 작으면 최소 너비 적용
        return ['width', `${Math.max(width, minWidth)}px`]
    }
    // 저장된 width가 없으면 min-width 설정
    return ['min-width', `${minWidth}px`]
}

/**
 * Tiptap TableView.ts의 updateColumns 함수 기반
 * colgroup 요소를 업데이트하고 테이블 너비 조정
 */
export function updateColumns(
    node: ProseMirrorNode,
    colgroup: HTMLTableColElement,
    table: HTMLTableElement,
    cellMinWidth: number,
    overrideCol?: number,
    overrideValue?: number
): void {
    let totalWidth = 0
    let fixedWidth = true
    let nextDOM = colgroup.firstChild
    const row = node.firstChild

    if (row !== null) {
        for (let i = 0, col = 0; i < row.childCount; i += 1) {
            const { colspan, colwidth } = row.child(i).attrs

            for (let j = 0; j < colspan; j += 1, col += 1) {
                const hasWidth = overrideCol === col ? overrideValue : ((colwidth && colwidth[j]) as number | undefined)
                const cssWidth = hasWidth ? `${hasWidth}px` : ''

                totalWidth += hasWidth || cellMinWidth

                if (!hasWidth) {
                    fixedWidth = false
                }

                if (!nextDOM) {
                    const colElement = document.createElement('col')
                    const [propertyKey, propertyValue] = getColStyleDeclaration(cellMinWidth, hasWidth)
                    colElement.style.setProperty(propertyKey, propertyValue)
                    colgroup.appendChild(colElement)
                } else {
                    if ((nextDOM as HTMLTableColElement).style.width !== cssWidth) {
                        const [propertyKey, propertyValue] = getColStyleDeclaration(cellMinWidth, hasWidth)
                        ;(nextDOM as HTMLTableColElement).style.setProperty(propertyKey, propertyValue)
                    }
                    nextDOM = nextDOM.nextSibling
                }
            }
        }
    }

    // 남은 col 요소 제거
    while (nextDOM) {
        const after = nextDOM.nextSibling
        nextDOM.parentNode?.removeChild(nextDOM)
        nextDOM = after
    }

    // 테이블 너비 설정
    if (fixedWidth) {
        table.style.width = `${totalWidth}px`
        table.style.minWidth = ''
    } else {
        table.style.width = ''
        table.style.minWidth = `${totalWidth}px`
    }
}
