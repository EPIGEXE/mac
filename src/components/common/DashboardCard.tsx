/**
 * 대시보드 카드 컴포넌트
 * - 통계/메트릭 표시용 카드
 * - 다양한 크기와 스타일 지원
 */

interface DashboardCardProps {
    label: string // 카드 라벨 (// label 형식)
    children: React.ReactNode // 카드 내용
    colSpan?: 1 | 2 // 그리드 컬럼 span
    rowSpan?: 1 | 2 // 그리드 로우 span
    className?: string
}

export function DashboardCard({
    label,
    children,
    colSpan = 1,
    rowSpan = 1,
    className = '',
}: DashboardCardProps) {
    const spanClasses = [
        colSpan === 2 ? 'col-span-2' : '',
        rowSpan === 2 ? 'row-span-2' : '',
    ].filter(Boolean).join(' ')

    return (
        <div
            className={`p-3 md:p-4 border border-[var(--border-light)] bg-[var(--bg-paper)] ${spanClasses} ${className}`}
        >
            <div className="font-mono text-sm text-[var(--text-secondary)] mb-2">
                // {label}
            </div>
            {children}
        </div>
    )
}
