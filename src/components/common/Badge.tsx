/**
 * 뱃지 컴포넌트
 * - 터미널 스타일 라벨/태그
 */

interface BadgeProps {
    children: React.ReactNode
    variant?: 'accent' | 'outline' | 'muted'
    size?: 'xxs' | 'xs' | 'sm' | 'md'
    className?: string
}

export function Badge({ children, variant = 'accent', size = 'xs', className = '' }: BadgeProps) {
    const variantStyles = {
        accent: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
        outline: 'bg-transparent text-[var(--accent)] border-[var(--accent)]',
        muted: 'bg-[var(--bg-primary)] text-[var(--text-tertiary)] border-[var(--border-light)]',
    }

    const sizeStyles = {
        xxs: 'text-[10px] px-1 py-0.5',
        xs: 'text-xs px-1.5 py-0.5',
        sm: 'text-sm px-2 py-1',
        md: 'text-base px-2.5 py-1.5',
    }

    return (
        <span
            className={`font-mono border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        >
            {children}
        </span>
    )
}
