# Error Boundary 구현 계획

## 개요

React Error Boundary를 도입하여 렌더링 중 발생하는 에러를 graceful하게 처리합니다.

## 현재 에러 처리와의 차이

| 구분 | try-catch + toast | Error Boundary |
|------|------------------|----------------|
| 비동기 에러 (API, DB) | ✅ 처리 | ❌ 처리 불가 |
| 이벤트 핸들러 에러 | ✅ 처리 | ❌ 처리 불가 |
| 렌더링 중 에러 | ❌ 처리 불가 | ✅ 처리 |
| useEffect 동기 에러 | ❌ 처리 불가 | ✅ 처리 |

**결론**: 두 방식은 상호 보완적입니다.

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    AppErrorBoundary (최상위)                      │
│         - 예상치 못한 크래시 방지                                   │
│         - 전체 앱 fallback UI + 새로고침 버튼                       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   NoteList    │    │  NoteDetail   │    │    Study      │
│  (boundary X) │    │  ErrorBoundary│    │ ErrorBoundary │
│               │    │               │    │               │
│ - 단순 목록   │    │ - 에디터 에러 │    │ - 퀴즈 에러   │
│ - 크래시 적음 │    │   격리 필요   │    │   격리 필요   │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 구현 계획

### Phase 1: ErrorBoundary 컴포넌트 생성

**파일**: `src/components/ErrorBoundary/ErrorBoundary.tsx`

```typescript
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
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
```

### Phase 2: Fallback UI 컴포넌트들

**파일**: `src/components/ErrorBoundary/ErrorFallback.tsx`

```typescript
// 기본 에러 표시 (섹션용)
export function ErrorFallback({ error, onReset }: ErrorFallbackProps) { ... }

// 전체 페이지 에러 (App 크래시용)
export function AppCrashFallback({ error }: { error: Error }) { ... }
```

### Phase 3: 적용 위치

| 파일 | Boundary | 이유 |
|------|----------|------|
| `App.tsx` | `AppErrorBoundary` | 전체 앱 크래시 방지 |
| `NoteDetail.tsx` | `ErrorBoundary` | ProseMirror 에디터 에러 격리 |
| `StudyModePage.tsx` | `ErrorBoundary` | 퀴즈 렌더링 에러 격리 |

---

## 파일 구조

```
src/components/ErrorBoundary/
├── index.ts
├── ErrorBoundary.tsx      # 핵심 클래스 컴포넌트
└── ErrorFallback.tsx      # Fallback UI들
```

---

## 구현 순서

- [x] `ErrorBoundary.tsx` 컴포넌트 생성 ✅
- [x] `ErrorFallback.tsx` Fallback UI 생성 ✅
- [x] `index.ts` export 설정 ✅
- [x] `App.tsx`에 최상위 ErrorBoundary 적용 ✅
- [x] `NoteDetailPage.tsx`에 에디터 ErrorBoundary 적용 ✅
- [x] `StudyModePage.tsx`에 ErrorBoundary 적용 ✅

---

## 구현 완료 요약 (2024-12)

### 생성된 파일
- `src/components/ErrorBoundary/ErrorBoundary.tsx` - 핵심 클래스 컴포넌트
- `src/components/ErrorBoundary/ErrorFallback.tsx` - Fallback UI (섹션용 + 앱 크래시용)
- `src/components/ErrorBoundary/index.ts` - export 설정

### 수정된 파일
- `src/App.tsx` - 최상위 `AppCrashFallback` 적용
- `src/pages/NoteDetailPage.tsx` - MarkdownEditor에 `ErrorFallback` 적용
- `src/pages/StudyModePage.tsx` - StudyQuizViewer에 `ErrorFallback` 적용

---

## Fallback UI 디자인

프로젝트의 터미널 스타일 유지:

```
┌────────────────────────────────────┐
│  // runtime error                  │
│                                    │
│  > Cannot read property 'x'        │
│    of undefined                    │
│                                    │
│  [ :retry ]  [ :reload ]           │
└────────────────────────────────────┘
```

---

## 주의사항

1. **Error Boundary는 class 컴포넌트로만 구현 가능** (React 제약)
2. **비동기 에러는 잡지 못함** - 기존 try-catch 유지 필요
3. **이벤트 핸들러 에러도 잡지 못함** - 기존 try-catch 유지 필요
4. **개발 모드에서는 에러 오버레이가 먼저 표시됨** - 정상 동작
