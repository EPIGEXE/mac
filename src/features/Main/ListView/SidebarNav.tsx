import { mainCategories } from '../../../data/categories'

export interface NavItem {
    type: 'main' | 'sub'
    id: string
    label: string
}

interface SidebarNavProps {
    categories: string[]
    showMainCategories: boolean
    activeCategory: string | null
    onCategoryClick: (category: string) => void
}

// 네비게이션 아이템 생성
function buildNavItems(categories: string[], showMainCategories: boolean): NavItem[] {
    if (showMainCategories) {
        return mainCategories.flatMap((main) => {
            const subCats = categories.filter((cat) => main.categories.includes(cat))
            return [
                { type: 'main' as const, id: main.id, label: main.label },
                ...subCats.map((cat) => ({ type: 'sub' as const, id: cat, label: cat })),
            ]
        })
    }
    return categories.map((cat) => ({ type: 'sub' as const, id: cat, label: cat }))
}

// 메인 페이지 사이드바 네비게이션
export function SidebarNav({ categories, showMainCategories, activeCategory, onCategoryClick }: SidebarNavProps) {
    // ==================================== 상수 =====================================
    const navItems = buildNavItems(categories, showMainCategories) // 네비게이션 아이템

    return (
        <aside className="w-[180px] shrink-0 sticky top-[100px] h-fit hidden min-[1100px]:block">
            <div className="font-mono text-xs text-[var(--text-tertiary)] mb-4 uppercase tracking-wider">
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
                                className="font-mono text-[11px] text-[var(--accent)] pt-3.5 pb-1.5 uppercase tracking-wider border-t border-dashed border-[var(--border-light)] mt-2"
                            >
                                {item.label}
                            </div>
                        )
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onCategoryClick(item.id)}
                            className={`py-2 px-3 bg-transparent border-l-2 text-left cursor-pointer text-[13px] transition-all duration-150 ${
                                isActive
                                    ? 'text-[var(--accent)] border-l-[var(--accent)]'
                                    : 'text-[var(--text-tertiary)] border-l-transparent hover:text-[var(--text-secondary)]'
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
