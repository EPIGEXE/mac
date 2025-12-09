import { useRef, useState, useEffect, useCallback } from 'react'
import { mainCategories } from '../../../data/categories'
import { CategorySection } from './CategorySection'
import { SidebarNav } from './SidebarNav'
import type { Note } from '../../../db/schema/note'

interface ListViewProps {
    notes: Note[] // 노트 목록
    categories: string[] // 카테고리 목록
    onNoteClick: (noteId: string) => void // 노트 클릭 핸들러
    onCreateNote: (category: string) => void // 노트 생성 핸들러
    showMainCategories?: boolean // 상위 카테고리 표시 여부
}

// 디버그 모드
const DEBUG = true
const log = (...args: unknown[]) => DEBUG && console.log('[ListView]', ...args)

export function ListView({ notes, categories, onNoteClick, onCreateNote, showMainCategories = false }: ListViewProps) {
    // ==================================== 상태 관리 =====================================
    const [activeCategory, setActiveCategory] = useState<string | null>(() => {
        // 초기값으로 첫 번째 카테고리 설정
        return categories.length > 0 ? categories[0] : null
    })

    // ==================================== Ref =====================================
    const categoryRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
    const observerRef = useRef<IntersectionObserver | null>(null)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ==================================== 상수 =====================================
    const groupedCategories = showMainCategories
        ? mainCategories.map((main) => ({
              ...main,
              subCategories: categories.filter((cat) => (main.categories as readonly string[]).includes(cat)),
          }))
        : null

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
                            log('INIT ENTER:', category)
                        }
                    })
                    // 초기 상태에서 보이는 카테고리가 있으면 첫 번째 것으로 설정
                    if (visibleCategories.size > 0) {
                        const firstVisible = categories.find((cat) => visibleCategories.has(cat))
                        if (firstVisible) {
                            log('Initial active from observer:', firstVisible)
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
                        log('ENTER:', category)
                    } else {
                        visibleCategories.delete(category)
                        log('LEAVE:', category)
                    }
                })

                // 보이는 카테고리 중 가장 위에 있는 것 선택
                if (visibleCategories.size > 0) {
                    const firstVisible = categories.find((cat) => visibleCategories.has(cat))
                    if (firstVisible) {
                        log('Active:', firstVisible, '| Visible:', [...visibleCategories])
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
                log('Observing:', category)
            }
        })

        log('Observer created with', categoryRefs.current.size, 'elements')
    }, [categories])

    // ==================================== 카테고리 Ref 콜백 =====================================
    const setCategoryRef = useCallback((category: string, el: HTMLDivElement | null) => {
        if (el) {
            categoryRefs.current.set(category, el)
            el.setAttribute('data-category', category)
        } else {
            categoryRefs.current.delete(category)
        }
    }, [])

    // ==================================== Observer 설정 =====================================
    useEffect(() => {
        // 약간의 지연 후 observer 생성 (DOM이 완전히 렌더링된 후)
        const timer = setTimeout(() => {
            createObserver()
        }, 100)

        return () => {
            clearTimeout(timer)
            observerRef.current?.disconnect()
            log('Observer disconnected')
        }
    }, [createObserver])

    // ==================================== 카테고리 변경 시 초기값 설정 =====================================
    useEffect(() => {
        if (categories.length > 0 && activeCategory === null) {
            setActiveCategory(categories[0])
            log('Initial category set:', categories[0])
        }
    }, [categories, activeCategory])

    // ==================================== 카테고리 클릭 핸들러 =====================================
    const handleCategoryClick = useCallback((category: string) => {
        const el = categoryRefs.current.get(category)
        if (!el) {
            log('Element not found:', category)
            return
        }

        log('=== CLICK START ===', category)

        // 1. 즉시 active 상태 변경
        setActiveCategory(category)

        // 2. Observer 일시 해제 (스크롤 중 간섭 방지)
        observerRef.current?.disconnect()
        log('Observer disconnected for click')

        // 3. 스크롤 실행
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })

        // 4. 스크롤 완료 후 Observer 재연결
        // scrollend 이벤트 사용 (Chrome, Firefox 지원)
        const scrollContainer = document.scrollingElement || document.documentElement

        const reconnectObserver = () => {
            log('=== CLICK END === Reconnecting observer')
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
    }, [createObserver])

    // ==================================== 클린업 =====================================
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [])

    // 사이드바 너비(180px) + gap(48px) = 228px
    // 양쪽에 동일한 여백을 줘서 메인 콘텐츠가 중앙 정렬되도록 함
    return (
        <div className="flex justify-center">
            {/* 왼쪽 여백 - 사이드바와 동일한 공간 확보 */}
            <div className="w-[228px] shrink-0 hidden min-[1400px]:block" />

            {/* 메인 콘텐츠 */}
            <main className="w-full max-w-[1000px]">
                {showMainCategories && groupedCategories
                    ? groupedCategories.map((mainCat) => {
                          if (mainCat.subCategories.length === 0) return null
                          return (
                              <div key={mainCat.id} className="mb-16">
                                  <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-[var(--accent)]">
                                      <span className="font-mono text-[13px] text-[var(--accent)] px-2.5 py-1 border border-[var(--accent)]">
                                          {mainCat.id.toUpperCase()}
                                      </span>
                                      <h2 className="font-display text-2xl font-normal text-[var(--text-primary)] tracking-wide">
                                          {mainCat.label}
                                      </h2>
                                  </div>

                                  {mainCat.subCategories.map((category) => (
                                      <CategorySection
                                          key={category}
                                          category={category}
                                          notes={notes.filter((n) => n.category === category)}
                                          onNoteClick={onNoteClick}
                                          onCreateNote={onCreateNote}
                                          ref={(el) => setCategoryRef(category, el)}
                                      />
                                  ))}
                              </div>
                          )
                      })
                    : categories.map((category) => (
                          <CategorySection
                              key={category}
                              category={category}
                              notes={notes.filter((n) => n.category === category)}
                              onNoteClick={onNoteClick}
                              onCreateNote={onCreateNote}
                              ref={(el) => setCategoryRef(category, el)}
                          />
                      ))}
            </main>

            {/* 사이드바 네비게이션 */}
            <div className="ml-12 shrink-0">
                <SidebarNav
                    categories={categories}
                    showMainCategories={showMainCategories}
                    activeCategory={activeCategory}
                    onCategoryClick={handleCategoryClick}
                />
            </div>
        </div>
    )
}
