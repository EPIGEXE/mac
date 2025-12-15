/**
 * 섹션 타이틀 컴포넌트
 * - # prefix 스타일 타이틀
 */

interface SectionTitleProps {
    size?: 'base' | 'lg' | 'xl' | 'xxl'
    children: React.ReactNode
    className?: string
}

export function SectionTitle({ size = 'base', children, className = '' }: SectionTitleProps) {
    const sizeStyles = {
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        xxl: 'text-2xl',

    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className={`font-mono text-[var(--accent)] ${sizeStyles[size]}`}>#</span>
            <span className={`text-[var(--text-primary)] ${sizeStyles[size]}`}>{children}</span>
        </div>
    )
}
