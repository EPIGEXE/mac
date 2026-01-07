# 에러 처리 설계 문서

## 1. 설계 원칙

| 원칙 | 설명 |
|------|------|
| **단일 책임** | 각 레이어는 자신의 역할만 수행 |
| **에러 버블링** | 하위 → 상위로 전파, 최종 처리는 UI |
| **사용자 피드백** | 모든 실패는 사용자에게 알림 |
| **복구 가능성** | 재시도 가능한 에러는 재시도 옵션 제공 |

---

## 2. 레이어별 책임

```
┌─────────────────────────────────────────────────────────────────┐
│  Component Layer                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 책임: Toast 표시, 에러 UI, 재시도 버튼                      │  │
│  │ 방법: Hook이 반환한 error 상태 기반 렌더링                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ { data, error, retry }
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Hook Layer                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 책임: try-catch, 에러 상태 관리, 로깅                      │  │
│  │ 방법: catch → setError(normalize(e)) → return error       │  │
│  │ 금지: Toast 직접 호출 ❌                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ throw AppError
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Service Layer                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 책임: 외부 에러 → AppError 변환                            │  │
│  │ 방법: catch → throw new AppError(code, message, original) │  │
│  │ 금지: 에러 삼키기 ❌, Toast ❌, console.error ❌           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ throw (원본 에러)
                              │
┌─────────────────────────────────────────────────────────────────┐
│  External (IndexedDB, Firebase, Network)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 에러 타입 정의

### 3.1 ErrorCode

```typescript
export type ErrorCode =
  // 네트워크
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  // Firebase
  | 'FIREBASE_QUOTA_EXCEEDED'
  | 'FIREBASE_INVALID_ARGUMENT'
  | 'FIREBASE_INTERNAL'
  // DB
  | 'DB_NOT_FOUND'
  | 'DB_WRITE_FAILED'
  | 'DB_READ_FAILED'
  // 비즈니스
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'
```

### 3.2 AppError 클래스

```typescript
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public original?: unknown,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

### 3.3 사용자 메시지 매핑

```typescript
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  FIREBASE_QUOTA_EXCEEDED: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  FIREBASE_INVALID_ARGUMENT: '잘못된 요청입니다.',
  FIREBASE_INTERNAL: '서버 오류가 발생했습니다.',
  DB_NOT_FOUND: '데이터를 찾을 수 없습니다.',
  DB_WRITE_FAILED: '저장에 실패했습니다.',
  DB_READ_FAILED: '데이터를 불러오는데 실패했습니다.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
}
```

---

## 4. 레이어별 구현 패턴

### 4.1 Service Layer

```typescript
// Firebase 에러 정규화
function normalizeFirebaseError(error: unknown): AppError {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'functions/resource-exhausted':
        return new AppError('FIREBASE_QUOTA_EXCEEDED', '요청 한도 초과', error, true)
      case 'functions/invalid-argument':
        return new AppError('FIREBASE_INVALID_ARGUMENT', '잘못된 요청', error, false)
      default:
        return new AppError('FIREBASE_INTERNAL', '서버 오류', error, true)
    }
  }
  return new AppError('UNKNOWN', '알 수 없는 오류', error, false)
}

// 사용 예시
export async function generateQuiz(params: GenerateQuizRequest) {
  try {
    const result = await generateQuizFn(params)
    return result.data
  } catch (e) {
    throw normalizeFirebaseError(e)
  }
}
```

### 4.2 Hook Layer

```typescript
interface HookState<T> {
  data: T | null
  error: AppError | null
  isLoading: boolean
}

export function useExample() {
  const [state, setState] = useState<HookState<Data>>({
    data: null,
    error: null,
    isLoading: false,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, error: null, isLoading: true }))

    try {
      const data = await someService()
      setState({ data, error: null, isLoading: false })
      return { success: true, data }
    } catch (e) {
      const error = e instanceof AppError ? e : new AppError('UNKNOWN', '오류 발생', e)
      console.error('[useExample]', error.code, error.original)
      setState({ data: null, error, isLoading: false })
      return { success: false, error }
    }
  }, [])

  return { ...state, execute }
}
```

### 4.3 Component Layer

```typescript
function MyComponent() {
  const { data, error, isLoading, execute, clearError } = useExample()

  useEffect(() => {
    if (error) {
      terminalToast.error(ERROR_MESSAGES[error.code])
    }
  }, [error])

  if (error && !error.retryable) {
    return <ErrorDisplay message={ERROR_MESSAGES[error.code]} />
  }

  if (error && error.retryable) {
    return (
      <ErrorDisplay
        message={ERROR_MESSAGES[error.code]}
        onRetry={() => { clearError(); execute(); }}
      />
    )
  }

  return <div>{/* 정상 UI */}</div>
}
```

---

## 5. TanStack Query 에러 처리

```typescript
export function useGenerateQuiz(params: Params) {
  return useQuery({
    queryKey: studyKeys.quiz(params.noteId, params.mode),
    queryFn: () => generateQuiz(params),
    retry: (failureCount, error) => {
      if (error instanceof AppError && !error.retryable) {
        return false
      }
      return failureCount < 2
    },
  })
}

// 컴포넌트에서 사용
function QuizContainer() {
  const { data, error, refetch } = useGenerateQuiz(params)

  if (error) {
    const appError = error instanceof AppError ? error : new AppError('UNKNOWN', '', error)
    return (
      <ErrorDisplay
        message={ERROR_MESSAGES[appError.code]}
        onRetry={appError.retryable ? refetch : undefined}
      />
    )
  }
}
```

---

## 6. 기존 코드와의 호환

### 6.1 DBError → AppError 매핑

```typescript
function normalizeDBError(error: unknown): AppError {
  if (isNotFoundError(error)) {
    return new AppError('DB_NOT_FOUND', error.message, error, false)
  }
  if (isInvalidInputError(error)) {
    return new AppError('VALIDATION_ERROR', error.message, error, false)
  }
  if (isDBError(error)) {
    return new AppError('DB_WRITE_FAILED', error.message, error, true)
  }
  return new AppError('UNKNOWN', '알 수 없는 오류', error, false)
}
```

### 6.2 기존 withErrorHandling 확장

```typescript
// 기존 withErrorHandling에 로깅 추가
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (context) {
      console.error(`[${context}]`, error)
    }
    if (isDBError(error)) {
      throw error
    }
    throw new DatabaseOperationError('DB 작업 실패', error)
  }
}
```

---

## 7. 변경 전후 비교

| 항목 | Before | After |
|------|--------|-------|
| **Service** | 에러 삼키거나 그대로 throw | AppError로 정규화 후 throw |
| **Hook** | console.error + Toast | catch → 상태 저장 → 반환 |
| **Component** | 에러 무시 | error 상태 기반 UI/Toast |
| **재시도** | 없음 | retryable 플래그로 제어 |
| **메시지** | 하드코딩 | ERROR_MESSAGES 중앙 관리 |
