import { useCallback, useEffect, useRef, useState } from 'react'
import { LogLine } from './LogLine'
import { useTerminalLogStore } from '../toaststore'

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
    const [isHovered, setIsHovered] = useState(false) // hover 상태

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

    // 자동 숨김 타이머 시작 함수
    const startHideTimer = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
        }
        hideTimeoutRef.current = window.setTimeout(() => {
            clearLogs()
        }, 3000)
    }, [clearLogs])

    // 자동 숨김 타이머 (hover 중이 아닐 때만)
    useEffect(() => {
        if (logs.length > 0 && !isHovered) {
            startHideTimer()
        }

        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current)
            }
        }
    }, [logs, isHovered, clearLogs])

    // hover 시 타이머 정지
    const handleMouseEnter = () => {
        setIsHovered(true)
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
        }
    }

    // hover 해제 시 3초 후 닫힘
    const handleMouseLeave = () => {
        setIsHovered(false)
    }

    if (!isVisible || logs.length === 0) return null

    return (
        <div
            className="fixed bottom-5 left-5 z-[9999] bg-[var(--bg-paper)] border border-[var(--border-medium)] rounded-sm shadow-[var(--shadow-elevated)] max-w-[600px] max-h-[200px] overflow-hidden flex flex-col"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
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
