import { cva } from "class-variance-authority";
import { useEffect, useState } from "react";
import type { LogEntry, LogType } from "../store";

// 로그 타입별 설정
const LOG_CONFIG: Record<LogType, { tag: string; prefix: string }> = {
    success: { tag: 'SUCCESS', prefix: '>' },
    error: { tag: 'ERROR', prefix: '!' },
    info: { tag: 'INFO', prefix: '$' },
    warning: { tag: 'WARN', prefix: '~' },
};

// cva로 로그 타입별 색상 스타일 정의
const logColorStyles = cva('font-semibold shrink-0', {
    variants: {
        type: {
            success: 'text-[var(--success)]',
            error: 'text-[var(--error)]',
            info: 'text-[var(--accent)]',
            warning: 'text-[var(--warning)]',
        },
        visible: {
            true: '',
            false: 'text-transparent',
        },
    },
    defaultVariants: {
        visible: true,
    },
});

interface LogLineProps {
    entry: LogEntry;
    isNew: boolean;
}

// 개별 로그 라인 컴포넌트
export function LogLine({ entry, isNew }: LogLineProps) {
    const [displayText, setDisplayText] = useState(isNew ? '' : entry.text);
    const [showCursor, setShowCursor] = useState(isNew);

    const config = LOG_CONFIG[entry.type];

    // 새 로그일 경우 타이핑 효과 적용
    useEffect(() => {
        if (!isNew) return;

        let index = 0;
        const typingInterval = setInterval(() => {
            if (index < entry.text.length) {
                setDisplayText(entry.text.slice(0, index + 1));
                index++;
            } else {
                clearInterval(typingInterval);
                setShowCursor(false);
            }
        }, 25);

        return () => clearInterval(typingInterval);
    }, [entry.text, isNew]);

    const lines = displayText.split('\n');

    return (
        <div className="font-mono text-xs py-0.5">
            {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex items-center gap-1.5 whitespace-nowrap">
                    {/* 타임스탬프 */}
                    <span className={`shrink-0 ${lineIndex === 0 ? 'text-[var(--text-tertiary)]' : 'text-transparent'}`}>
                        [{entry.timestamp}]
                    </span>
                    {/* 상태 태그 */}
                    <span className={logColorStyles({ type: entry.type, visible: lineIndex === 0 })}>
                        [{config.tag}]
                    </span>
                    {/* 접두사 */}
                    <span className={logColorStyles({ type: entry.type, visible: lineIndex === 0 })}>
                        {config.prefix}
                    </span>
                    {/* 메시지 */}
                    <span className="text-[var(--text-primary)]">
                        {line}
                        {lineIndex === lines.length - 1 && showCursor && (
                            <span
                                className="text-[var(--accent)] ml-px"
                                style={{ animation: 'blink 1s step-end infinite' }}
                            >_</span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}
