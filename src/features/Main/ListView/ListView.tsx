import { useRef, useState, useEffect } from 'react'
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

export function ListView({ notes, categories, onNoteClick, onCreateNote, showMainCategories = false }: ListViewProps) {
    // ==================================== 상태 관리 =====================================
    const [activeCategory, setActiveCategory] = useState<string | null>(null) // 활성 카테고리

    // ==================================== Ref =====================================
    const categoryRefs = useRef<Map<string, HTMLDivElement | null>>(new Map()) // 카테고리 참조, 스크롤로 활성 카테고리 찾기 위해 사용

    // ==================================== 상수 =====================================
    // 상위 카테고리별로 그룹화
    const groupedCategories = showMainCategories
        ? mainCategories.map((main) => ({
              ...main,
              subCategories: categories.filter((cat) => main.categories.includes(cat)),
          }))
        : null

    // ==================================== useEffect =====================================
    // 스크롤 위치에 따라 활성 카테고리 업데이트
    useEffect(() => {
        const updateActiveCategory = () => {
            const categoryPositions: { category: string; top: number }[] = []

            for (const category of categories) {
                const el = categoryRefs.current.get(category)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    categoryPositions.push({ category, top: rect.top })
                }
            }

            categoryPositions.sort((a, b) => a.top - b.top)

            let current: string | null = null
            for (const { category, top } of categoryPositions) {
                if (top <= 150) {
                    current = category
                }
            }

            if (!current && categoryPositions.length > 0) {
                current = categoryPositions[0].category
            }

            setActiveCategory(current)
        }

        window.addEventListener('scroll', updateActiveCategory, { passive: true })
        const timer = setTimeout(updateActiveCategory, 100)

        return () => {
            window.removeEventListener('scroll', updateActiveCategory)
            clearTimeout(timer)
        }
    }, [categories])

    // 카테고리 클릭 시 스크롤
    const handleCategoryClick = (category: string) => {
        const el = categoryRefs.current.get(category)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setTimeout(() => setActiveCategory(category), 100)
        }
    }

    return (
        <div className="flex gap-12 max-w-[1100px] mx-auto justify-center">
            {/* 메인 콘텐츠 */}
            <div className="min-w-0 shrink basis-[800px] grow-0">
                {showMainCategories && groupedCategories
                    ? // 상위 카테고리 구분자와 함께 표시
                      groupedCategories.map((mainCat) => {
                          if (mainCat.subCategories.length === 0) return null
                          return (
                              <div key={mainCat.id} className="mb-16">
                                  {/* 상위 카테고리 구분자 */}
                                  <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-[var(--accent)]">
                                      <span className="font-mono text-[13px] text-[var(--accent)] px-2.5 py-1 border border-[var(--accent)]">
                                          {mainCat.id.toUpperCase()}
                                      </span>
                                      <h2 className="font-display text-2xl font-normal text-[var(--text-primary)] tracking-wide">
                                          {mainCat.label}
                                      </h2>
                                  </div>

                                  {/* 하위 카테고리들 */}
                                  {mainCat.subCategories.map((category) => (
                                      <CategorySection
                                          key={category}
                                          category={category}
                                          notes={notes.filter((n) => n.category === category)}
                                          onNoteClick={onNoteClick}
                                          onCreateNote={onCreateNote}
                                          ref={(el) => {
                                              categoryRefs.current.set(category, el)
                                          }}
                                      />
                                  ))}
                              </div>
                          )
                      })
                    : // 단순 카테고리 리스트
                      categories.map((category) => (
                          <CategorySection
                              key={category}
                              category={category}
                              notes={notes.filter((n) => n.category === category)}
                              onNoteClick={onNoteClick}
                              onCreateNote={onCreateNote}
                              ref={(el) => {
                                  categoryRefs.current.set(category, el)
                              }}
                          />
                      ))}
            </div>

            {/* 사이드바 네비게이션 */}
            <SidebarNav
                categories={categories}
                showMainCategories={showMainCategories}
                activeCategory={activeCategory}
                onCategoryClick={handleCategoryClick}
            />
        </div>
    )
}
