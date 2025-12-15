/**
 * 마크다운 헤딩 기반 목차 네비게이션
 * - h1 ~ h3 추출
 * - 터미널 스타일: // toc 라벨 + 미니맵 바 + hover 시 전체 목차
 */
import { useMemo, useState, useEffect, useCallback } from 'react'

export interface HeadingItem {
    id: string
    text: string
    level: 1 | 2 | 3
}

interface TableOfContentsProps {
    content: string
    onHeadingClick?: (id: string) => void
}

/**
 * 마크다운 콘텐츠에서 헤딩(h1~h3) 추출
 */
function extractHeadings(content: string): HeadingItem[] {
    const headings: HeadingItem[] = []

    if (!content) {
        return headings
    }

    // Windows 줄바꿈(\r\n) 정규화
    // 정규화하지 않으면 #~### 패턴 매칭이 제대로 안될 수 있음
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalizedContent.split('\n')

    lines.forEach((line, index) => {
        // # ~ ### 패턴 매칭
        const match = line.match(/^(#{1,3})\s+(.+)$/)
        if (match) {
            const level = match[1].length as 1 | 2 | 3
            const text = match[2].trim()

            // 빈 텍스트는 스킵
            if (!text) return

            // ID 생성: 텍스트 기반 + 인덱스 (중복 방지)
            const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-')}`

            headings.push({ id, text, level })
        }
    })

    return headings
}

export function TableOfContents({ content, onHeadingClick }: TableOfContentsProps) {
    // ==================================== 상태 관리 =====================================
    // 마우스 오버 상태, hover 시 전체 목차 표시
    const [isHovered, setIsHovered] = useState(false) 
    // 현재 활성 헤딩 인덱스, 스크롤 위치에 따라 업데이트 / 클릭 시 활성 헤딩 인덱스 업데이트
    const [activeIndex, setActiveIndex] = useState(0) 

    // ==================================== 상수 =====================================
    // 컨텐츠에서 감지된 heading 추출
    const headings = useMemo(() => extractHeadings(content), [content])

    // 스크롤 위치에 따라 현재 활성 헤딩 추적용
    const updateActiveHeading = useCallback(() => {
        const editorContent = document.querySelector('.markdown-content, .ProseMirror')
        if (!editorContent) return

        const allHeadings = editorContent.querySelectorAll('h1, h2, h3')
        if (allHeadings.length === 0) return

        // 뷰포트 상단에서 가장 가까운 헤딩 찾기
        let closestIndex = 0
        let closestDistance = Infinity

        allHeadings.forEach((heading, index) => {
            const rect = heading.getBoundingClientRect()
            const distance = Math.abs(rect.top - 100) // 상단에서 100px 기준

            if (rect.top <= 150 && distance < closestDistance) {
                closestDistance = distance
                closestIndex = index
            }
        })

        setActiveIndex(closestIndex)
    }, [])

    // ================================== useEffect =====================================
    // 스크롤 위치에 따라 현재 활성 헤딩 추적
    useEffect(() => {
        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto')
        if (!scrollContainer) return

        const handleScroll = () => {
            requestAnimationFrame(updateActiveHeading)
        }

        scrollContainer.addEventListener('scroll', handleScroll)
        // 초기 위치 설정
        updateActiveHeading()

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll)
        }
    }, [updateActiveHeading, headings])

    if (headings.length === 0) {
        return null
    }

    // ================================== 핸들러 =====================================
    // 헤딩 클릭 시 스크롤 이동 및 활성 헤딩 인덱스 업데이트
    const handleClick = (id: string, index: number) => {
        const editorContent = document.querySelector('.markdown-content, .ProseMirror')
        if (editorContent) {
            const allHeadings = editorContent.querySelectorAll('h1, h2, h3')
            const targetHeading = allHeadings[index]
            if (targetHeading) {
                targetHeading.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }
        onHeadingClick?.(id)
    }

    return (
        <div
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 미니맵 인디케이터 (기본 상태) - 터미널 스타일 */}
            <div
                className={`flex flex-col items-end transition-opacity duration-200 ${
                    isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
            >
                {/* // toc 라벨 */}
                <div className="font-mono text-sm text-[var(--text-primary)] mb-2 writing-mode-vertical">
                    <span>//</span> toc
                </div>

                {/* 미니맵 바 */}
                <div
                    className="flex flex-col gap-3 p-2 border-r-2 border-[var(--border-light)]"
                    style={{ maxHeight: '70vh' }}
                >
                    {headings.map((heading, index) => (
                        <button
                            key={heading.id}
                            onClick={() => handleClick(heading.id, index)}
                            className={`h-1.5 rounded-sm transition-all duration-150 cursor-pointer border-none p-0 ${
                                index === activeIndex
                                    ? 'bg-[var(--accent)]'
                                    : 'bg-[var(--text-tertiary)] opacity-50 hover:opacity-80'
                            }`}
                            style={{
                                width: heading.level === 1 ? '40px' : heading.level === 2 ? '30px' : '20px',
                                marginLeft: `${(heading.level - 1) * 10}px`,
                            }}
                            title={heading.text}
                        />
                    ))}
                </div>
            </div>

            {/* 전체 목차 (hover 상태) - 터미널 스타일 */}
            <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 bg-[var(--bg-paper)] border border-[var(--border-light)] p-3 min-w-[220px] max-w-[300px] transition-all duration-200 ${
                    isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
                }`}
                style={{ maxHeight: '70vh' }}
            >
                {/* 헤더 - 터미널 스타일 */}
                <div className="font-mono text-sm text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-light)]">
                    <span className="text-[var(--accent)]">$</span> cat ./toc
                </div>

                {/* 목차 항목들 */}
                <nav className="flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
                    {headings.map((heading, index) => (
                        <button
                            key={heading.id}
                            onClick={() => handleClick(heading.id, index)}
                            className={`text-left bg-transparent border-none cursor-pointer transition-colors duration-150 group py-1 ${
                                index === activeIndex ? 'bg-[var(--accent)]/10' : ''
                            }`}
                            style={{
                                paddingLeft: `${(heading.level - 1) * 12}px`,
                            }}
                        >
                            <span className="flex items-center gap-1.5 min-w-0">
                                <span className={`font-mono text-sm shrink-0 ${
                                    index === activeIndex ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] opacity-50'
                                }`}>
                                    {'#'.repeat(heading.level)}
                                </span>
                                <span
                                    className={`font-mono text-xs truncate ${
                                        index === activeIndex
                                            ? 'text-[var(--accent)]'
                                            : heading.level === 1
                                              ? 'text-[var(--text-primary)]'
                                              : heading.level === 2
                                                ? 'text-[var(--text-primary)]'
                                                : 'text-[var(--text-secondary)]'
                                    } group-hover:text-[var(--accent)]`}
                                    title={heading.text}
                                >
                                    {heading.text}
                                </span>
                            </span>
                        </button>
                    ))}
                </nav>

                {/* 푸터 - 진행률 표시 */}
                <div className="font-mono text-sm text-[var(--text-tertiary)] mt-3 pt-2 border-t border-[var(--border-light)] opacity-60">
                    [{activeIndex + 1}/{headings.length}] sections
                </div>
            </div>
        </div>
    )
}
