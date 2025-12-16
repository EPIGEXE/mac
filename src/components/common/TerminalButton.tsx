import { cva } from 'class-variance-authority';

const buttonStyles = cva(
    'font-mono border px-3.5 py-3 text-sm cursor-pointer transition-all duration-150 flex items-center gap-1.5',
    {
        variants: {
            variant: {
                default:
                    'bg-transparent border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                danger:
                    'bg-transparent border-[var(--border-light)] text-[var(--warning)] hover:border-[var(--warning)] hover:text-[var(--warning)]',
                accent:
                    'bg-transparent border-[var(--accent)] text-[var(--accent)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                filled:
                    'bg-[var(--accent)] border-[var(--accent)] text-white hover:opacity-90',
            },
            active: {
                true: 'border-[var(--accent)] text-[var(--accent)]',
                false: '',
            },
            disabled: {
                true: 'opacity-50 cursor-not-allowed pointer-events-none',
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

interface TerminalButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
    variant?: 'default' | 'accent' | 'danger' | 'filled';
    disabled?: boolean;
    type?: 'button' | 'submit';
    className?: string;
}

// 터미널 스타일 버튼 컴포넌트
export function TerminalButton({
    children,
    onClick,
    active = false,
    variant = 'default',
    disabled = false,
    type = 'button',
    className = '',
}: TerminalButtonProps) {
    return (
        <button
            type={type}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`${buttonStyles({ variant, active, disabled })} ${className}`}
        >
            {children}
        </button>
    );
}