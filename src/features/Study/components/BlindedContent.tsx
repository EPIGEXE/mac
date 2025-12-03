/**
 * 빈칸 퀴즈 콘텐츠 표시 컴포넌트
 * [BLANK_1], [BLANK_2] 등을 인터랙티브 빈칸으로 변환
 * pm-editor 스타일 적용으로 MarkdownEditor와 동일한 Look & Feel
 */
import { useMemo, useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { marked } from 'marked'
import type { BlankInfo } from '../types'
import '../../../features/NoteDetail/MarkdownEditor/styles/editor.css'

// marked 설정 - 동기 모드로 변경
marked.use({
    async: false,
    gfm: true,
    breaks: true,
})

interface BlindedContentProps {
    content: string
    blanks: BlankInfo[]
    answers: Record<string, string> // blankId -> userAnswer
    results: Record<string, boolean | null> // blankId -> isCorrect (null = 미채점)
    currentBlankId: string | null
    onBlankClick: (blankId: string) => void
}

export function BlindedContent({
    content,
    blanks,
    answers,
    results,
    currentBlankId,
    onBlankClick,
}: BlindedContentProps) {
    // HTML 콘텐츠를 파싱하여 빈칸을 인터랙티브 버튼으로 변환
    const processedContent = useMemo(() => {
        // [BLANK_N]을 플레이스홀더로 변환
        const blankRegex = /\[BLANK_(\d+)\]/g

        // 먼저 빈칸을 고유 마커로 변환
        let processed = content.replace(blankRegex, '{{BLANK_MARKER_$1}}')

        // 마커를 기준으로 분리
        const parts = processed.split(/({{BLANK_MARKER_\d+}})/)

        return parts
    }, [content])

    // 빈칸 버튼 렌더링
    const renderBlank = (blankNum: string) => {
        const blankId = `BLANK_${blankNum}`
        const blank = blanks.find((b) => b.id === blankId)
        const answer = answers[blankId] || ''
        const result = results[blankId]
        const isCurrent = currentBlankId === blankId
        const isAnswered = answer.length > 0
        const isCorrect = result === true
        const isWrong = result === false

        // 스타일 결정
        let className = 'quiz-blank'
        if (isCurrent) className += ' quiz-blank--current'
        if (isCorrect) className += ' quiz-blank--correct'
        else if (isWrong) className += ' quiz-blank--wrong'
        else if (isAnswered) className += ' quiz-blank--answered'

        return (
            <button
                key={blankId}
                onClick={() => onBlankClick(blankId)}
                className={className}
            >
                {isAnswered ? (
                    <span className="quiz-blank__answer">{answer}</span>
                ) : (
                    <span className="quiz-blank__placeholder">
                        {blank?.hint ? `${blank.hint}...` : '___'}
                    </span>
                )}
            </button>
        )
    }

    return (
        <div className="quiz-content-wrapper">
            {/* pm-editor 스타일을 적용한 콘텐츠 영역 */}
            <div
                className="pm-editor quiz-blinded-content"
                dangerouslySetInnerHTML={{
                    __html: processedContent.map(part => {
                        const match = part.match(/{{BLANK_MARKER_(\d+)}}/)
                        if (match) {
                            // 나중에 React로 교체할 플레이스홀더
                            return `<span data-blank-id="${match[1]}" class="quiz-blank-placeholder"></span>`
                        }
                        return part
                    }).join('')
                }}
            />

            {/* 빈칸 버튼들을 오버레이로 렌더링 */}
            <div className="quiz-blanks-overlay">
                {processedContent.map((part, idx) => {
                    const match = part.match(/{{BLANK_MARKER_(\d+)}}/)
                    if (match) {
                        return renderBlank(match[1])
                    }
                    return null
                })}
            </div>

            {/* 실제 렌더링: dangerouslySetInnerHTML 대신 React로 처리 */}
            <div className="pm-editor" style={{ display: 'none' }}>
                {/* 이 부분은 스타일 참조용 */}
            </div>
        </div>
    )
}

/**
 * 마크다운 HTML을 빈칸과 함께 렌더링하는 별도 컴포넌트
 * 마크다운을 HTML로 변환 후 빈칸 버튼을 삽입
 *
 * 전략: HTML을 통째로 렌더링하고, useEffect에서 빈칸 플레이스홀더를 찾아 React Portal로 버튼 삽입
 */
export function BlindedMarkdownContent({
    content,
    blanks,
    answers,
    results,
    currentBlankId,
    onBlankClick,
}: BlindedContentProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [blankElements, setBlankElements] = useState<Array<{ id: string; element: Element }>>([])

    // 마크다운을 HTML로 변환 (빈칸은 span 플레이스홀더로)
    const html = useMemo(() => {
        // 1단계: 먼저 마크다운을 HTML로 변환 (빈칸은 그대로 유지)
        const rawHtml = marked.parse(content) as string

        // 2단계: 변환된 HTML에서 [BLANK_N] 패턴을 span 플레이스홀더로 교체
        // 코드 블록 내부에서도 정상 작동
        const htmlWithPlaceholders = rawHtml.replace(
            /\[BLANK_(\d+)\]/g,
            '<span class="quiz-blank-slot" data-blank-id="$1"></span>'
        )

        return htmlWithPlaceholders
    }, [content])

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

    // 빈칸 버튼 컴포넌트
    const BlankButton = ({ blankNum }: { blankNum: string }) => {
        const blankId = `BLANK_${blankNum}`
        const blank = blanks.find((b) => b.id === blankId)
        const answer = answers[blankId] || ''
        const result = results[blankId]
        const isCurrent = currentBlankId === blankId
        const isAnswered = answer.length > 0
        const isCorrect = result === true
        const isWrong = result === false

        let bgClass = 'bg-[var(--bg-secondary)]'
        let borderClass = 'border-[var(--border-medium)]'
        let textClass = 'text-[var(--text-tertiary)]'

        if (isCurrent) {
            borderClass = 'border-[var(--accent)]'
            bgClass = 'bg-[var(--accent)]/10'
        }

        if (isCorrect) {
            bgClass = 'bg-green-500/15'
            borderClass = 'border-green-500'
            textClass = 'text-green-600'
        } else if (isWrong) {
            bgClass = 'bg-red-500/15'
            borderClass = 'border-red-500'
            textClass = 'text-red-500'
        } else if (isAnswered) {
            textClass = 'text-[var(--text-primary)]'
            bgClass = 'bg-[var(--bg-hover)]'
        }

        return (
            <button
                onClick={() => onBlankClick(blankId)}
                className={`
                    inline-flex items-center justify-center
                    min-w-[80px] px-3 py-1 mx-0.5
                    border-2 border-dashed rounded
                    font-mono text-sm
                    cursor-pointer transition-all duration-150
                    ${bgClass} ${borderClass} ${textClass}
                    hover:border-[var(--accent)] hover:bg-[var(--accent)]/5
                    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30
                `}
            >
                {isAnswered ? (
                    <span className="font-medium">{answer}</span>
                ) : (
                    <span className="opacity-60 text-xs">
                        {blank?.hint ? `${blank.hint}...` : '[ ? ]'}
                    </span>
                )}
            </button>
        )
    }

    return (
        <>
            <div
                ref={containerRef}
                className="pm-editor"
                dangerouslySetInnerHTML={{ __html: html }}
            />
            {/* React Portal로 빈칸 버튼들을 플레이스홀더 위치에 렌더링 */}
            {blankElements.map(({ id, element }) =>
                createPortal(<BlankButton blankNum={id} />, element)
            )}
        </>
    )
}
