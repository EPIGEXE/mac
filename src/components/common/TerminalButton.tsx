import { cva } from 'class-variance-authority';

const buttonStyles = cva(
    'font-mono bg-transparent border px-3.5 py-[5px] text-sm cursor-pointer transition-all duration-150 flex items-center gap-1.5',
    {
        variants: {
            variant: {
                default:
                    'border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                danger:
                    'border-[var(--border-light)] text-[var(--warning)] hover:border-[var(--warning)] hover:text-[var(--warning)]',
                accent:
                    'border-[var(--accent)] text-[var(--accent)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
            },
            active: {
                true: 'border-[var(--accent)] text-[var(--accent)]',
                false: '',
            },
            disabled: {
                true: 'opacity-50 cursor-not-allowed hover:border-[var(--border-light)] hover:text-[var(--text-tertiary)]',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            active: false,
            disabled: false,
        },
    }
);

// 터미널 스타일 버튼 컴포넌트
export function TerminalButton({
    children,
    onClick,
    active = false,
    variant = 'default',
    disabled = false,
}: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    variant?: 'default' | 'accent' | 'danger';
    disabled?: boolean;
}) {
    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={buttonStyles({ variant, active, disabled })}
        >
            {children}
        </button>
    );
}