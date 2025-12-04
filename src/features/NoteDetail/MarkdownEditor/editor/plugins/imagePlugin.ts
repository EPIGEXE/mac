/**
 * 이미지 드롭/붙여넣기 처리 플러그인
 * - 드래그 앤 드롭으로 이미지 삽입
 * - 클립보드 붙여넣기로 이미지 삽입
 * - local:// URL로 IndexedDB에 저장
 */
import { Plugin } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { terminalToast } from '../../../../Toast/toast'
import { saveImageFromFile } from '../../../../../db/image/imageStorage'
import { parseMarkdown } from '../markdown'

/**
 * 파일 목록에서 이미지 파일만 필터링
 */
function getImageFiles(files: FileList | File[]): File[] {
    return Array.from(files).filter(file => file.type.startsWith('image/'))
}

/**
 * 빈줄 제거 (코드 블럭 내부는 유지)
 */
function removeEmptyLines(text: string): string {
    const lines = text.split('\n')
    const result: string[] = []
    let inCodeBlock = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // 코드 블럭 시작/끝 감지
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock
            result.push(line)
            continue
        }

        // 코드 블럭 내부는 그대로 유지
        if (inCodeBlock) {
            result.push(line)
            continue
        }

        // 코드 블럭 외부: 빈줄 제거
        if (trimmed === '') {
            continue
        }

        result.push(line)
    }

    return result.join('\n')
}

/**
 * 텍스트가 마크다운처럼 보이는지 확인
 */
function looksLikeMarkdown(text: string): boolean {
    // 마크다운 패턴 감지
    return (
        /^#{1,6}\s/.test(text) ||           // 헤딩: # ~ ######
        /^```[\w]*$/m.test(text) ||         // 코드 블록
        /^\|.+\|$/m.test(text) ||           // 테이블
        /^[-*]\s+/.test(text) ||            // 불릿 리스트
        /^\d+\.\s+/.test(text) ||           // 순서 리스트
        /^>\s+/.test(text) ||               // 인용문
        /\*\*[^*]+\*\*/.test(text) ||       // 볼드
        /\*[^*]+\*/.test(text) ||           // 이탤릭
        /`[^`]+`/.test(text) ||             // 인라인 코드
        /\[.+\]\(.+\)/.test(text) ||        // 링크
        /^---$/.test(text)                  // 수평선
    )
}

/**
 * 에디터에 이미지 노드 삽입 (블록 레벨)
 */
async function insertImage(view: EditorView, file: File, pos?: number): Promise<void> {
    try {
        // IndexedDB에 저장하고 local:// URL 받기
        const localURL = await saveImageFromFile(file)

        const { state, dispatch } = view
        const { schema } = state

        // 이미지 노드 생성
        const imageNode = schema.nodes.image.create({
            src: localURL,
            alt: file.name,
            title: file.name,
        })

        let tr = state.tr

        if (pos !== undefined) {
            // 드롭 위치에 삽입
            tr = tr.insert(pos, imageNode)
        } else {
            // 현재 선택 위치의 블록 끝에 삽입
            const $from = state.selection.$from
            const insertPos = $from.after($from.depth)
            tr = tr.insert(insertPos, imageNode)
        }

        dispatch(tr)
        view.focus()
    } catch (error) {
        console.error('이미지 삽입 실패:', error)
    }
}

/**
 * 이미지 드롭/붙여넣기 플러그인 생성
 */
export function createImagePlugin(): Plugin {
    let removedImageCount = 0

    return new Plugin({
        props: {
            // HTML 붙여넣기 전에 처리 불가능한 이미지 제거
            transformPastedHTML(html) {
                const parser = new DOMParser()
                const doc = parser.parseFromString(html, 'text/html')
                const images = doc.querySelectorAll('img')

                removedImageCount = 0

                images.forEach(img => {
                    const src = img.getAttribute('src')
                    if (!src) {
                        img.remove()
                        removedImageCount++
                        return
                    }

                    // 처리 가능한 src: http, https, data:image
                    const isProcessable = src.startsWith('http://') ||
                                          src.startsWith('https://') ||
                                          src.startsWith('data:image/')

                    if (!isProcessable) {
                        img.remove()
                        removedImageCount++
                    }
                })

                if (removedImageCount > 0) {
                    // 토스트는 handlePaste에서 표시 (transformPastedHTML은 여러 번 호출될 수 있음)
                }

                return doc.body.innerHTML
            },

            // 드래그 앤 드롭 처리
            handleDrop(view, event, _slice, moved) {
                // 이미 에디터 내부에서 이동 중이면 기본 동작
                if (moved) return false

                const files = event.dataTransfer?.files
                if (!files || files.length === 0) return false

                const imageFiles = getImageFiles(files)
                if (imageFiles.length === 0) return false

                event.preventDefault()

                // 드롭 위치 계산
                const pos = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                })

                // 각 이미지 파일 삽입
                imageFiles.forEach((file, index) => {
                    // 순차적으로 삽입 (위치 조정)
                    const insertPos = pos ? pos.pos + index : undefined
                    insertImage(view, file, insertPos)
                })

                return true
            },

            // 붙여넣기 처리
            handlePaste(view, event) {
                const clipboardData = event.clipboardData
                if (!clipboardData) return false

                // 제거된 이미지가 있으면 토스트 표시
                if (removedImageCount > 0) {
                    terminalToast.error(`${removedImageCount}개의 이미지를 처리할 수 없습니다.\n지원되지 않는 형식입니다`)
                }

                // 이미지 파일 확인 (스크린샷 등 직접 붙여넣기)
                const files = clipboardData.files
                const imageFiles = getImageFiles(files)

                if (imageFiles.length > 0) {
                    event.preventDefault()

                    imageFiles.forEach(file => {
                        insertImage(view, file)
                    })

                    return true
                }

                // plain text가 마크다운처럼 보이면 파싱하여 삽입
                const plainText = clipboardData.getData('text/plain')
                if (plainText && looksLikeMarkdown(plainText)) {
                    event.preventDefault()

                    // 빈줄 제거 후 파싱
                    const textWithoutEmptyLines = removeEmptyLines(plainText)
                    const doc = parseMarkdown(textWithoutEmptyLines)
                    const { tr } = view.state
                    const insertPos = view.state.selection.from

                    // 문서의 content를 현재 위치에 삽입
                    tr.replaceWith(insertPos, view.state.selection.to, doc.content)
                    view.dispatch(tr)

                    return true
                }

                // 나머지는 기본 처리 (transformPastedHTML에서 이미 이미지 제거됨)
                return false
            },
        },
    })
}
