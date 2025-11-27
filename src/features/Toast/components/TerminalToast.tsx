import { useEffect, useRef, useState } from 'react'
import { useTerminalLogStore } from '../store'
import { LogLine } from './LogLine'

// 터미널 토스트 컨테이너
export function TerminalToast() {
    // ==================================== Hooks =====================================
    const {
        logs, // 로그 모음(토스트 메시지 모음)
        isVisible, // 토스트 메시지 표시 여부
        clearLogs, // 로그 모음 초기화
    } = useTerminalLogStore()

    // ==================================== 상태 관리 =====================================
    const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set()) // 새 로그 ID 모음

    // ==================================== 참조 관리 =====================================
    const containerRef = useRef<HTMLDivElement>(null) // 컨테이너 참조, 스크롤 이동을 위해
    const hideTimeoutRef = useRef<number | null>(null) // 자동 숨김 타이머 참조

    // ==================================== useEffect =====================================
    // 새 로그가 추가되면 타이핑 효과를 위해 추적
    useEffect(() => {
        if (logs.length > 0) {
            const latestLog = logs[logs.length - 1]
            setNewLogIds((prev) => new Set(prev).add(latestLog.id))

            // 타이핑 완료 후 newLogIds에서 제거
            const timeout = setTimeout(
                () => {
                    setNewLogIds((prev) => {
                        const next = new Set(prev)
                        next.delete(latestLog.id)
                        return next
                    })
                },
                latestLog.text.length * 25 + 100
            )

            return () => clearTimeout(timeout)
        }
    }, [logs])

    // ==================================== useEffect =====================================
    // 스크롤을 최신 로그로 이동
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [logs])

    // 자동 숨김 타이머 (마지막 로그 후 5초)
    useEffect(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
        }

        if (logs.length > 0) {
            hideTimeoutRef.current = window.setTimeout(() => {
                clearLogs()
            }, 5000)
        }

        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current)
            }
        }
    }, [logs, clearLogs])

    if (!isVisible || logs.length === 0) return null

    return (
        <div className="fixed bottom-5 left-5 z-[9999] bg-[var(--bg-paper)] border border-[var(--border-medium)] rounded-sm shadow-[var(--shadow-elevated)] max-w-[600px] max-h-[200px] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
                <span className="font-mono text-[11px] text-[var(--text-secondary)] font-semibold">
                    TERMINAL
                </span>
                <button
                    onClick={clearLogs}
                    className="bg-transparent border-none text-[var(--text-tertiary)] cursor-pointer font-mono text-[11px] px-1.5 py-0.5 hover:text-[var(--text-primary)]"
                >
                    ✕
                </button>
            </div>
            {/* 로그 영역 */}
            <div ref={containerRef} className="px-3 py-2 overflow-y-auto overflow-x-hidden">
                {logs.map((entry) => (
                    <LogLine key={entry.id} entry={entry} isNew={newLogIds.has(entry.id)} />
                ))}
            </div>
        </div>
    )
}
