/**
 * 학습 모드 아이콘
 * - 터미널/코드 스타일의 빈칸 채우기 컨셉
 * - word: 단일 빈칸 [_]
 * - sentence: 긴 빈칸 [___]
 * - essay: 여러 줄 블록
 */

interface IconProps {
    size?: number
    className?: string
}

// 단어 모드: 짧은 단일 빈칸
export function WordModeIcon({ size = 18, className = '' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
        >
            {/* 대괄호 [ - 위/세로/아래 세 획 */}
            <path
                d="M7 5H5V19H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 대괄호 ] - 위/세로/아래 세 획 */}
            <path
                d="M17 5H19V19H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 밑줄 _ (짧은 빈칸) */}
            <path
                d="M9 14H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
        </svg>
    )
}

// 문장 모드: 긴 빈칸
export function SentenceModeIcon({ size = 18, className = '' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
        >
            {/* 대괄호 [ */}
            <path
                d="M6 5H4V19H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 대괄호 ] */}
            <path
                d="M18 5H20V19H18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 긴 밑줄 ___ */}
            <path
                d="M7 14H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
        </svg>
    )
}

// 서술형 모드: 여러 줄 블록
export function EssayModeIcon({ size = 18, className = '' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
        >
            {/* 대괄호 [ */}
            <path
                d="M6 3H4V21H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 대괄호 ] */}
            <path
                d="M18 3H20V21H18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 첫 번째 줄 */}
            <path
                d="M7 8H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 두 번째 줄 */}
            <path
                d="M7 12H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
            {/* 세 번째 줄 (짧게) */}
            <path
                d="M7 16H13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
            />
        </svg>
    )
}
