import { mainCategories } from '../../../../data/categories'

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
        <aside
            style={{
                width: '180px',
                flexShrink: 0,
                position: 'sticky',
                top: '100px',
                height: 'fit-content',
                display: 'none',
            }}
            className="sidebar-nav"
        >
            <style>{`
                @media (min-width: 1100px) {
                    .sidebar-nav { display: block !important; }
                }
            `}</style>
            <div
                style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
                // navigation
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navItems.map((item) => {
                    const isActive = activeCategory === item.id
                    const isMain = item.type === 'main'

                    if (isMain) {
                        return (
                            <div
                                key={item.id}
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11px',
                                    color: 'var(--accent)',
                                    padding: '14px 0 6px 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderTop: '1px dashed var(--border-light)',
                                    marginTop: '8px',
                                }}
                            >
                                {item.label}
                            </div>
                        )
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onCategoryClick(item.id)}
                            style={{
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-system)',
                                fontSize: '13px',
                                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.color = 'var(--text-tertiary)'
                            }}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </nav>
        </aside>
    )
}
