/**
 * Error Boundary 컴포넌트
 * - 렌더링 중 발생하는 에러를 catch
 * - Fallback UI 표시 및 복구 기능 제공
 */
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
    /** 에러 발생 시 표시할 UI. 함수면 (error, reset) => ReactNode */
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
    /** 에러 발생 시 호출되는 콜백 (로깅 등) */
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo)
        this.props.onError?.(error, errorInfo)
    }

    reset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError && this.state.error) {
            const { fallback } = this.props

            if (typeof fallback === 'function') {
                return fallback(this.state.error, this.reset)
            }

            return fallback ?? null
        }

        return this.props.children
    }
}
