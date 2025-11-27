import { useRef, useState, useEffect } from 'react'
import type { Note } from '../../../../lib/db'
import { mainCategories } from '../../../../data/categories'
import { CategorySection } from './CategorySection'
import { SidebarNav } from './SidebarNav'

interface ListViewProps {
    notes: Note[]
    categories: string[]
    onNoteClick: (noteId: string) => void
    onCreateNote: (category: string) => void
    showMainCategories?: boolean
}

export function ListView({ notes, categories, onNoteClick, onCreateNote, showMainCategories = false }: ListViewProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const categoryRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

    // 상위 카테고리별로 그룹화
    const groupedCategories = showMainCategories
        ? mainCategories.map((main) => ({
              ...main,
              subCategories: categories.filter((cat) => main.categories.includes(cat)),
          }))
        : null

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
        <div style={{ display: 'flex', gap: '48px', maxWidth: '1100px', margin: '0 auto', justifyContent: 'center' }}>
            {/* 메인 콘텐츠 */}
            <div style={{ flex: '0 1 800px', minWidth: 0 }}>
                {showMainCategories && groupedCategories
                    ? // 상위 카테고리 구분자와 함께 표시
                      groupedCategories.map((mainCat) => {
                          if (mainCat.subCategories.length === 0) return null
                          return (
                              <div key={mainCat.id} style={{ marginBottom: '64px' }}>
                                  {/* 상위 카테고리 구분자 */}
                                  <div
                                      style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '16px',
                                          marginBottom: '32px',
                                          paddingBottom: '16px',
                                          borderBottom: '2px solid var(--accent)',
                                      }}
                                  >
                                      <span
                                          style={{
                                              fontFamily: 'var(--font-mono)',
                                              fontSize: '13px',
                                              color: 'var(--accent)',
                                              padding: '4px 10px',
                                              border: '1px solid var(--accent)',
                                          }}
                                      >
                                          {mainCat.id.toUpperCase()}
                                      </span>
                                      <h2
                                          style={{
                                              fontFamily: 'var(--font-display)',
                                              fontSize: '24px',
                                              fontWeight: 'var(--font-weight-regular)',
                                              color: 'var(--text-primary)',
                                              letterSpacing: '0.02em',
                                          }}
                                      >
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
