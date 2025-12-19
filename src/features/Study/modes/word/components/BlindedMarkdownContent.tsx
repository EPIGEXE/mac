/**
 * 빈칸 퀴즈 콘텐츠 표시 컴포넌트
 * [BLANK_1], [BLANK_2] 등을 인터랙티브 빈칸으로 변환
 * pm-editor 스타일 적용으로 MarkdownEditor와 동일한 Look & Feel
 */
import { useMemo, useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { marked } from 'marked'
import type { BlankInfo } from '../../../types'
import { BlankButton } from './BlankButton'

// marked 설정 - 동기 모드로 변경
marked.use({
    async: false,
    gfm: true,
    breaks: true,
})

interface BlindedMarkdownContentProps {
    content: string // 블라인드 마크다운 컨텐츠
    blanks: BlankInfo[] // 풀어야하는 빈칸 몰골
    answers: Record<string, string> // 사용자 답변 목록
    results: Record<string, boolean | null> // 채점 결과 목록
    currentBlankStringId: string | null // 현재 빈칸 String ID (BLANK_1, BLANK_2, ...)
    onBlankClick: (blankId: string) => void // 빈칸 클릭 핸들러
}

/**
 * 마크다운 HTML을 빈칸과 함께 렌더링하는 별도 컴포넌트
 * 마크다운을 HTML로 변환 후 빈칸 버튼을 삽입
 *
 * HTML을 통째로 렌더링하고, useEffect에서 빈칸 플레이스홀더를 찾아 React Portal로 버튼 삽입
 */
export function BlindedMarkdownContent({
    content,
    blanks,
    answers,
    results,
    currentBlankStringId,
    onBlankClick,
}: BlindedMarkdownContentProps) {
    // ================================ 상태 관리 ================================
    const [blankElements, setBlankElements] = useState<Array<{ id: string; element: Element }>>([]) // 빈칸 요소의 ID와 DOM 요소 목록

    // ================================ Ref ================================
    // 컨테이너 참조
    // 빈칸 플레이스홀더를 찾기 위해 사용
    const containerRef = useRef<HTMLDivElement>(null)

    // ================================ 상수 ================================
    // 마크다운을 HTML로 변환 (빈칸은 span 플레이스홀더로)
    const html = useMemo(() => {
        // 먼저 마크다운을 HTML로 변환 (빈칸은 그대로 유지)
        const rawHtml = marked.parse(content) as string

        // 변환된 HTML에서 [BLANK_N] 패턴을 span 플레이스홀더로 교체
        // 코드 블록 내부에서도 정상 작동
        const htmlWithPlaceholders = rawHtml.replace(
            /\[BLANK_(\d+)\]/g,
            '<span class="quiz-blank-slot" data-blank-id="$1"></span>'
        )

        return htmlWithPlaceholders
    }, [content])

    // ================================ useEffect ================================
    // DOM이 렌더링된 후 빈칸 플레이스홀더 찾기
    useEffect(() => {
        if (!containerRef.current) return

        const slots = containerRef.current.querySelectorAll('.quiz-blank-slot')
        const elements: Array<{ id: string; element: Element }> = []

        slots.forEach((slot) => {
            const blankId = slot.getAttribute('data-blank-id')
            if (blankId) {
                elements.push({ id: blankId, element: slot })
            }
        })

        setBlankElements(elements)
    }, [html])

    return (
        <>
            <div ref={containerRef} className="pm-editor" dangerouslySetInnerHTML={{ __html: html }} />
            {/* React Portal로 빈칸 버튼들을 플레이스홀더 위치에 렌더링 */}
            {blankElements.map(({ id, element }) => {
                const blankKey = `BLANK_${id}`
                const blankInfo = blanks.find((b) => b.id === id)
                return createPortal(
                    <BlankButton
                        blankNum={blankKey}
                        correctAnswer={blankInfo?.answer || ''}
                        userAnswer={answers[blankKey]}
                        result={results[blankKey]}
                        currentBlankStringId={currentBlankStringId}
                        onBlankClick={onBlankClick}
                    />,
                    element
                )
            })}
        </>
    )
}
