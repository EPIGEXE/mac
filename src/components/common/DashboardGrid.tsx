/**
 * 대시보드 그리드 컴포넌트
 * - 4열 그리드 레이아웃
 * - DashboardCard와 함께 사용
 */

interface DashboardGridProps {
    children: React.ReactNode
    className?: string
}

export function DashboardGrid({ children, className = '' }: DashboardGridProps) {
    return (
        <div className={`grid grid-cols-4 gap-4 ${className}`}>
            {children}
        </div>
    )
}
