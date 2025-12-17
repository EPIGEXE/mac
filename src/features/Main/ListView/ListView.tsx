import { useRef, useCallback, useMemo } from 'react'
import { mainCategories } from '../../../data/categories'
import { CategorySection } from './CategorySection'
import { SidebarNav } from './SidebarNav'
import { Badge } from '../../../components/common/Badge'
import type { Note } from '../../../db/schema/note'

interface ListViewProps {
    notes: Note[] // 노트 목록
    categories: string[] // 카테고리 목록
    onNoteClick: (noteId: string) => void // 노트 클릭 핸들러
    onCreateNote: (category: string) => void // 노트 생성 핸들러
    showMainCategories?: boolean // 상위 카테고리 표시 여부
}

export function ListView({ notes, categories, onNoteClick, onCreateNote, showMainCategories = false }: ListViewProps) {
    // ==================================== Ref =====================================
     // 카테고리 Ref, 네비게이션에 카테고리 섹션 위치 제공하는 역할
    const categoryRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

    // ==================================== 메모이제이션 =====================================
    const groupedCategories = showMainCategories
        ? mainCategories.map((main) => ({
              ...main,
              subCategories: categories.filter((cat) => (main.categories as readonly string[]).includes(cat)),
          }))
        : null

    // 카테고리별 노트 맵
    const notesByCategory = useMemo(() => {
        const map = new Map<string, Note[]>()
        categories.forEach((cat) => {
            map.set(cat, notes.filter((n) => n.category === cat))
        })
        return map
    }, [notes, categories])

    // ==================================== 카테고리 Ref 콜백 =====================================
    const setCategoryRef = useCallback((category: string, el: HTMLDivElement | null) => {
        if (el) {
            categoryRefs.current.set(category, el)
            el.setAttribute('data-category', category)
        } else {
            categoryRefs.current.delete(category)
        }
    }, [])

    // 사이드바 너비(180px) + gap(48px) = 228px
    // 양쪽에 동일한 여백을 줘서 메인 콘텐츠가 중앙 정렬되도록 함
    return (
        <div className="flex justify-center">
            {/* 왼쪽 여백 - 사이드바와 동일한 공간 확보 */}
            <div className="w-[228px] shrink-0 hidden min-[1400px]:block" />

            {/* 메인 콘텐츠 - min-height로 CLS 방지 */}
            <main className="w-full max-w-[1000px] min-h-[80vh]">
                {showMainCategories && groupedCategories
                    ? groupedCategories.map((mainCat) => {
                          if (mainCat.subCategories.length === 0) return null
                          return (
                              <div key={mainCat.id} className="mb-16">
                                  <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-[var(--accent)]">
                                      <Badge variant="outline" size="sm">
                                          {mainCat.id.toUpperCase()}
                                      </Badge>
                                      <h2 className="font-display text-2xl font-normal text-[var(--text-primary)] tracking-wide">
                                          {mainCat.label}
                                      </h2>
                                  </div>

                                  {mainCat.subCategories.map((category) => (
                                      <CategorySection
                                          key={category}
                                          category={category}
                                          notes={notesByCategory.get(category) || []}
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
                              notes={notesByCategory.get(category) || []}
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
                    categoryRefs={categoryRefs}
                />
            </div>
        </div>
    )
}
