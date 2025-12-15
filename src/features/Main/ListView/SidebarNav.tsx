import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { mainCategories } from '../../../data/categories'

export interface NavItem {
    type: 'main' | 'sub'
    id: string
    label: string
}

interface SidebarNavProps {
    categories: string[]
    showMainCategories: boolean
    categoryRefs: RefObject<Map<string, HTMLDivElement | null>>
}

// 네비게이션 아이템 생성
function buildNavItems(categories: string[], showMainCategories: boolean): NavItem[] {
    if (showMainCategories) {
        return mainCategories.flatMap((main) => {
            const subCats = categories.filter((cat) => (main.categories as readonly string[]).includes(cat))
            return [
                { type: 'main' as const, id: main.id, label: main.label },
                ...subCats.map((cat) => ({ type: 'sub' as const, id: cat, label: cat })),
            ]
        })
    }
    return categories.map((cat) => ({ type: 'sub' as const, id: cat, label: cat }))
}

// 메인 페이지 사이드바 네비게이션
export function SidebarNav({ categories, showMainCategories, categoryRefs }: SidebarNavProps) {
    // ==================================== 상태 관리 =====================================
    const [activeCategory, setActiveCategory] = useState<string | null>(() => {
        // 초기값으로 첫 번째 카테고리 설정
        return categories.length > 0 ? categories[0] : null
    })

    const observerRef = useRef<IntersectionObserver | null>(null)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ==================================== Observer 생성 함수 =====================================
    const createObserver = useCallback(() => {
        // 기존 observer 정리
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        // 현재 보이는 카테고리 추적
        const visibleCategories = new Set<string>()
        // 초기 콜백 무시 플래그 (observe() 호출 시 발생하는 초기 이벤트)
        let isInitialCallback = true

        observerRef.current = new IntersectionObserver(
            (entries) => {
                // 첫 번째 콜백은 모든 요소의 초기 상태 - 이 때 visibleCategories 구축
                if (isInitialCallback) {
                    isInitialCallback = false
                    entries.forEach((entry) => {
                        const category = entry.target.getAttribute('data-category')
                        if (!category) return
                        if (entry.isIntersecting) {
                            visibleCategories.add(category)
                        }
                    })
                    // 초기 상태에서 보이는 카테고리가 있으면 첫 번째 것으로 설정
                    if (visibleCategories.size > 0) {
                        const firstVisible = categories.find((cat) => visibleCategories.has(cat))
                        if (firstVisible) {
                            setActiveCategory(firstVisible)
                        }
                    }
                    return
                }

                entries.forEach((entry) => {
                    const category = entry.target.getAttribute('data-category')
                    if (!category) return

                    if (entry.isIntersecting) {
                        visibleCategories.add(category)
                    } else {
                        visibleCategories.delete(category)
                    }
                })

                // 보이는 카테고리 중 가장 위에 있는 것 선택
                if (visibleCategories.size > 0) {
                    const firstVisible = categories.find((cat) => visibleCategories.has(cat))
                    if (firstVisible) {
                        setActiveCategory(firstVisible)
                    }
                }
            },
            {
                // 뷰포트 상단 0px부터, 하단 50% 위까지 감지
                // 상단 절반 영역에 들어오면 활성화
                rootMargin: '0px 0px -50% 0px',
                threshold: 0,
            }
        )

        // 모든 카테고리 요소 관찰
        categoryRefs.current.forEach((el, category) => {
            if (el) {
                observerRef.current?.observe(el)
            }
        })
    }, [categories])

    // ==================================== useEffect =====================================
    // Observer 설정
    useEffect(() => {
        // 약간의 지연 후 observer 생성 (DOM이 완전히 렌더링된 후)
        const timer = setTimeout(() => {
            createObserver()
        }, 100)

        return () => {
            clearTimeout(timer)
            observerRef.current?.disconnect()
        }
    }, [createObserver])

    // 카테고리 변경 시 초기값 설정
    useEffect(() => {
        if (categories.length > 0 && activeCategory === null) {
            setActiveCategory(categories[0])
        }
    }, [categories, activeCategory])

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [])

    // ==================================== 핸들러 =====================================
    const handleCategoryClick = useCallback(
        (category: string) => {
            const el = categoryRefs.current.get(category)
            if (!el) {
                return
            }

            // 1. 즉시 active 상태 변경
            setActiveCategory(category)

            // 2. Observer 일시 해제 (스크롤 중 간섭 방지)
            observerRef.current?.disconnect()

            // 3. 스크롤 실행
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })

            // 4. 스크롤 완료 후 Observer 재연결
            // scrollend 이벤트 사용 (Chrome, Firefox 지원)
            const scrollContainer = document.scrollingElement || document.documentElement

            const reconnectObserver = () => {
                createObserver()
            }

            // scrollend 이벤트 리스너
            const handleScrollEnd = () => {
                reconnectObserver()
                scrollContainer.removeEventListener('scrollend', handleScrollEnd)
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current)
                    scrollTimeoutRef.current = null
                }
            }

            scrollContainer.addEventListener('scrollend', handleScrollEnd, { once: true })

            // Safari 폴백 (scrollend 미지원)
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
            scrollTimeoutRef.current = setTimeout(() => {
                scrollContainer.removeEventListener('scrollend', handleScrollEnd)
                reconnectObserver()
                scrollTimeoutRef.current = null
            }, 1000)
        },
        [createObserver]
    )

    // ==================================== 상수 =====================================
    const navItems = buildNavItems(categories, showMainCategories) // 네비게이션 아이템

    return (
        <aside className="w-[180px] shrink-0 sticky top-[100px] h-fit hidden min-[1100px]:block">
            <div className="font-mono text-sm text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                // navigation
            </div>
            <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = activeCategory === item.id
                    const isMain = item.type === 'main'

                    if (isMain) {
                        return (
                            <div
                                key={item.id}
                                className="font-mono text-xs text-[var(--accent)] pt-3.5 pb-1.5 uppercase tracking-wider border-t border-dashed border-[var(--border-light)] mt-2"
                            >
                                {item.label}
                            </div>
                        )
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleCategoryClick(item.id)}
                            className={`py-1.5 px-3 bg-transparent border-l-2 text-left cursor-pointer text-xs transition-all duration-150 ${
                                isActive
                                    ? 'text-[var(--accent)] border-l-[var(--accent)]'
                                    : 'text-[var(--text-secondary)] border-l-transparent hover:text-[var(--text-secondary)]'
                            }`}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </nav>
        </aside>
    )
}
