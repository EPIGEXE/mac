import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useTerminalLogStore } from './toaststore'

describe('useTerminalLogStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useTerminalLogStore.setState({
            logs: [],
            isVisible: false,
        })
    })

    describe('초기 상태', () => {
        it('초기 상태가 올바르게 설정되어야 함', () => {
            const state = useTerminalLogStore.getState()

            expect(state.logs).toEqual([])
            expect(state.isVisible).toBe(false)
        })
    })

    describe('addLog', () => {
        it('success 로그를 추가해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('success', '성공 메시지')
            })

            const state = useTerminalLogStore.getState()
            expect(state.logs).toHaveLength(1)
            expect(state.logs[0].type).toBe('success')
            expect(state.logs[0].text).toBe('성공 메시지')
            expect(state.isVisible).toBe(true)
        })

        it('error 로그를 추가해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('error', '에러 메시지')
            })

            const state = useTerminalLogStore.getState()
            expect(state.logs).toHaveLength(1)
            expect(state.logs[0].type).toBe('error')
            expect(state.logs[0].text).toBe('에러 메시지')
        })

        it('info 로그를 추가해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('info', '정보 메시지')
            })

            const state = useTerminalLogStore.getState()
            expect(state.logs[0].type).toBe('info')
        })

        it('warning 로그를 추가해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('warning', '경고 메시지')
            })

            const state = useTerminalLogStore.getState()
            expect(state.logs[0].type).toBe('warning')
        })

        it('로그에 고유 ID가 생성되어야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('info', 'First')
                useTerminalLogStore.getState().addLog('info', 'Second')
            })

            const state = useTerminalLogStore.getState()
            expect(state.logs[0].id).not.toBe(state.logs[1].id)
        })

        it('로그에 타임스탬프가 포함되어야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('info', 'Test')
            })

            const state = useTerminalLogStore.getState()
            // HH:MM:SS 형식 검증
            expect(state.logs[0].timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/)
        })

        it('여러 로그를 순서대로 추가해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('info', 'First')
                useTerminalLogStore.getState().addLog('success', 'Second')
                useTerminalLogStore.getState().addLog('error', 'Third')
            })

            const state = useTerminalLogStore.getState()
            expect(state.logs).toHaveLength(3)
            expect(state.logs[0].text).toBe('First')
            expect(state.logs[1].text).toBe('Second')
            expect(state.logs[2].text).toBe('Third')
        })

        it('로그 추가 시 isVisible이 true가 되어야 함', () => {
            expect(useTerminalLogStore.getState().isVisible).toBe(false)

            act(() => {
                useTerminalLogStore.getState().addLog('info', 'Test')
            })

            expect(useTerminalLogStore.getState().isVisible).toBe(true)
        })
    })

    describe('clearLogs', () => {
        it('모든 로그를 삭제해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('info', 'Log 1')
                useTerminalLogStore.getState().addLog('info', 'Log 2')
            })

            expect(useTerminalLogStore.getState().logs).toHaveLength(2)

            act(() => {
                useTerminalLogStore.getState().clearLogs()
            })

            expect(useTerminalLogStore.getState().logs).toHaveLength(0)
        })

        it('isVisible을 false로 설정해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('info', 'Test')
            })

            expect(useTerminalLogStore.getState().isVisible).toBe(true)

            act(() => {
                useTerminalLogStore.getState().clearLogs()
            })

            expect(useTerminalLogStore.getState().isVisible).toBe(false)
        })
    })

    describe('setVisible', () => {
        it('isVisible을 true로 설정할 수 있어야 함', () => {
            act(() => {
                useTerminalLogStore.getState().setVisible(true)
            })

            expect(useTerminalLogStore.getState().isVisible).toBe(true)
        })

        it('isVisible을 false로 설정할 수 있어야 함', () => {
            useTerminalLogStore.setState({ isVisible: true })

            act(() => {
                useTerminalLogStore.getState().setVisible(false)
            })

            expect(useTerminalLogStore.getState().isVisible).toBe(false)
        })

        it('로그를 유지하면서 visibility만 변경해야 함', () => {
            act(() => {
                useTerminalLogStore.getState().addLog('info', 'Test log')
            })

            act(() => {
                useTerminalLogStore.getState().setVisible(false)
            })

            const state = useTerminalLogStore.getState()
            expect(state.logs).toHaveLength(1)
            expect(state.isVisible).toBe(false)
        })
    })

    describe('타임스탬프 형식', () => {
        it('현재 시간이 HH:MM:SS 형식으로 저장되어야 함', () => {
            // Mock Date
            const mockDate = new Date('2024-01-15T14:30:45')
            vi.setSystemTime(mockDate)

            act(() => {
                useTerminalLogStore.getState().addLog('info', 'Test')
            })

            expect(useTerminalLogStore.getState().logs[0].timestamp).toBe('14:30:45')

            vi.useRealTimers()
        })

        it('한 자리 시간은 0으로 패딩되어야 함', () => {
            const mockDate = new Date('2024-01-15T09:05:03')
            vi.setSystemTime(mockDate)

            act(() => {
                useTerminalLogStore.getState().addLog('info', 'Test')
            })

            expect(useTerminalLogStore.getState().logs[0].timestamp).toBe('09:05:03')

            vi.useRealTimers()
        })
    })
})
