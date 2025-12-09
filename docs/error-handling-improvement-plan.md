# 에러 처리 체계 개선 계획

## 현황 분석

### 1. 현재 에러 처리 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                        컴포넌트 / 훅                              │
│  (에러 처리 불일관: 없음 / 콘솔만 / state 저장 / toast 혼용)        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Zustand Store                              │
│              (noteStore: 에러 처리 없음 ❌)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DB Services                                 │
│         (withErrorHandling으로 래핑됨 ✅)                         │
│    에러 발생 시 DBError 계열로 throw → 상위로 전파                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. 에러 처리 현황 상세

| 위치 | 파일 | 에러 처리 | UI 피드백 | 평가 |
|------|------|---------|---------|------|
| DB 서비스 | `*Service.ts` | `withErrorHandling` | - | ✅ 좋음 |
| Store | `noteStore.ts` | 없음 | 없음 | ❌ 위험 |
| Hook | `useEssayQuiz.ts` | try-catch-finally | state + error | ✅ 최고 |
| Hook | `useWordQuiz.ts` | try-catch | state | ✅ 좋음 |
| Hook | `useWeakPointRecorder.ts` | try-catch | 콘솔만 | ⚠️ 미흡 |
| Component | `StudyViewer.tsx` | 없음 | 없음 | ❌ 위험 |
| Plugin | `imagePlugin.ts` | try-catch | 콘솔만 | ⚠️ 미흡 |

### 3. 기존 인프라

#### terminalToast (이미 구현됨)
```typescript
// src/features/Toast/toast.ts
export const terminalToast = {
    success: (message: string) => ...,
    error: (message: string) => ...,
    info: (message: string) => ...,
    warning: (message: string) => ...,
};
```

#### DB 에러 클래스 (이미 구현됨)
```typescript
// src/db/core/errors.ts
- DBError (기본)
- NotFoundError (엔티티 없음)
- InvalidInputError (잘못된 입력)
- DuplicateError (중복)
- DatabaseOperationError (DB 작업 실패)
```

#### handleStudyApiError (이미 구현됨)
```typescript
// src/features/Study/services/studyApi.ts
export function handleStudyApiError(error: unknown): string
```

---

## 개선 계획

### Phase 1: 공통 에러 핸들러 유틸 생성

**파일:** `src/utils/errorHandler.ts`

```typescript
import { terminalToast } from '../features/Toast/toast';
import { isDBError } from '../db/core/errors';
import { handleStudyApiError } from '../features/Study/services/studyApi';

// 에러 타입 판별
export type ErrorSource = 'db' | 'api' | 'unknown';

export function identifyErrorSource(error: unknown): ErrorSource {
    if (isDBError(error)) return 'db';
    if (error instanceof Error && 'code' in error) return 'api';
    return 'unknown';
}

// 에러 메시지 추출
export function getErrorMessage(error: unknown): string {
    const source = identifyErrorSource(error);

    switch (source) {
        case 'db':
            return (error as Error).message;
        case 'api':
            return handleStudyApiError(error);
        default:
            return error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.';
    }
}

// Toast와 함께 에러 처리
export async function withToastError<T>(
    fn: () => Promise<T>,
    options?: {
        errorMessage?: string;
        showSuccess?: boolean;
        successMessage?: string;
    }
): Promise<T | null> {
    try {
        const result = await fn();
        if (options?.showSuccess) {
            terminalToast.success(options.successMessage ?? '완료되었습니다.');
        }
        return result;
    } catch (error) {
        const message = options?.errorMessage ?? getErrorMessage(error);
        terminalToast.error(message);
        console.error('[Error]', error);
        return null;
    }
}

// 에러 상태 관리용 (훅에서 사용)
export interface ErrorState {
    hasError: boolean;
    message: string | null;
    source: ErrorSource | null;
}

export function createErrorState(error: unknown): ErrorState {
    return {
        hasError: true,
        message: getErrorMessage(error),
        source: identifyErrorSource(error),
    };
}

export const initialErrorState: ErrorState = {
    hasError: false,
    message: null,
    source: null,
};
```

---

### Phase 2: Zustand Store 에러 처리 추가

**파일:** `src/stores/noteStore.ts`

```typescript
import { terminalToast } from '../features/Toast/toast';
import { getErrorMessage } from '../utils/errorHandler';

interface NoteStore {
    // 기존 상태
    notes: Note[];
    selectedNoteId: string | null;
    selectedNoteType: 'system' | 'user' | null;
    isEditing: boolean;
    isLoading: boolean;

    // 에러 상태 추가
    error: string | null;

    // Actions
    loadNotes: () => Promise<void>;
    createNote: (category: string) => Promise<string | null>;
    updateNote: (...) => Promise<boolean>;
    deleteNote: (...) => Promise<boolean>;
    clearError: () => void;
    // ...
}

export const useNoteStore = create<NoteStore>((set, get) => ({
    // ...기존 상태
    error: null,

    loadNotes: async () => {
        set({ isLoading: true, error: null });
        try {
            await initializeNoteService();
            const notes = await getAllNotes();
            set({ notes, isLoading: false });
        } catch (error) {
            const message = getErrorMessage(error);
            set({ error: message, isLoading: false });
            terminalToast.error('노트를 불러오는데 실패했습니다.');
        }
    },

    createNote: async (category: string) => {
        try {
            const newNote = await createNoteService({ category });
            set((state) => ({
                notes: [...state.notes, newNote],
                selectedNoteId: newNote.id,
                selectedNoteType: 'user',
                isEditing: true,
            }));
            return newNote.id;
        } catch (error) {
            terminalToast.error('노트 생성에 실패했습니다.');
            return null;
        }
    },

    updateNote: async (id, type, updates) => {
        try {
            const updatedNote = await updateNoteService(id, type, updates);
            if (updatedNote) {
                set((state) => ({
                    notes: state.notes.map((note) =>
                        note.id === id ? updatedNote : note
                    ),
                }));
            }
            return true;
        } catch (error) {
            terminalToast.error('노트 저장에 실패했습니다.');
            return false;
        }
    },

    deleteNote: async (id, type) => {
        try {
            await deleteNoteService(id, type);
            set((state) => ({
                notes: state.notes.filter(note => note.id !== id),
                selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
                selectedNoteType: state.selectedNoteId === id ? null : state.selectedNoteType,
            }));
            terminalToast.success('노트가 삭제되었습니다.');
            return true;
        } catch (error) {
            terminalToast.error('노트 삭제에 실패했습니다.');
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));
```

---

### Phase 3: 훅 에러 처리 표준화

**기준 패턴:** `useEssayQuiz.ts`

```typescript
// 표준 패턴
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

const someAction = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
        const result = await apiCall();
        // 성공 처리
    } catch (err) {
        setError(getErrorMessage(err));
        // 선택: toast 표시
        terminalToast.error('작업에 실패했습니다.');
    } finally {
        setIsLoading(false);
    }
}, []);

return { error, isLoading, someAction };
```

**수정 대상:**

| 파일 | 현재 | 개선 |
|------|------|------|
| `useWeakPointRecorder.ts` | 콘솔만 | toast 추가 (실패해도 무시 가능) |
| `StudyViewer.tsx` | 없음 | try-catch + error state 추가 |

---

### Phase 4: 컴포넌트 에러 UI

**에러 표시 컴포넌트:**

```typescript
// src/components/ErrorDisplay.tsx
interface ErrorDisplayProps {
    error: string | null;
    onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    if (!error) return null;

    return (
        <div className="error-container">
            <span className="error-message">{error}</span>
            {onRetry && (
                <button onClick={onRetry}>다시 시도</button>
            )}
        </div>
    );
}
```

---

## 구현 우선순위

| 순서 | 작업 | 영향도 | 난이도 | 비고 |
|------|------|--------|--------|------|
| 1 | `errorHandler.ts` 유틸 생성 | 높음 | 낮음 | 다른 작업의 기반 |
| 2 | `noteStore.ts` 에러 처리 | 높음 | 중간 | 앱 크래시 방지 |
| 3 | `StudyViewer.tsx` 에러 처리 | 중간 | 낮음 | 무한 로딩 방지 |
| 4 | `useWeakPointRecorder.ts` toast 추가 | 낮음 | 낮음 | UX 개선 |
| 5 | `imagePlugin.ts` toast 추가 | 낮음 | 낮음 | UX 개선 |

---

## 에러 메시지 가이드

### 사용자 친화적 메시지

| 상황 | 기술적 에러 | 사용자 메시지 |
|------|------------|--------------|
| 노트 로드 실패 | `DatabaseOperationError` | "노트를 불러오는데 실패했습니다." |
| 노트 저장 실패 | `DatabaseOperationError` | "노트 저장에 실패했습니다." |
| 노트 없음 | `NotFoundError` | "노트를 찾을 수 없습니다." |
| 입력 오류 | `InvalidInputError` | 원본 메시지 그대로 |
| API 한도 초과 | `resource-exhausted` | "요청 한도를 초과했습니다." |
| 서버 오류 | `internal` | "서버 오류가 발생했습니다." |
| 이미지 저장 실패 | `Error` | "이미지 저장에 실패했습니다." |

### Toast 사용 기준

| 상황 | Toast 타입 | 표시 여부 |
|------|-----------|---------|
| 노트 생성 성공 | - | 표시 안 함 (명확함) |
| 노트 삭제 성공 | `success` | 표시 |
| 저장 실패 | `error` | 표시 |
| 약점 기록 실패 | `warning` | 선택적 (치명적이지 않음) |
| 이미지 저장 실패 | `error` | 표시 |

---

## 테스트 시나리오

### 1. DB 오류 시뮬레이션
- IndexedDB 접근 실패
- 스토리지 용량 초과

### 2. API 오류 시뮬레이션
- 네트워크 오프라인
- Firebase 함수 에러

### 3. 사용자 시나리오
- 노트 로드 중 오류 → 에러 메시지 표시 + 재시도 버튼
- 저장 중 오류 → toast + 내용 유지
- 이미지 삽입 실패 → toast (에디터 상태 유지)

---

## 완료 기준

- [ ] `errorHandler.ts` 유틸 구현
- [ ] `noteStore.ts` 모든 액션에 에러 처리 추가
- [ ] `StudyViewer.tsx` 에러 처리 추가
- [ ] `useWeakPointRecorder.ts` toast 추가
- [ ] `imagePlugin.ts` toast 추가
- [ ] 에러 발생 시 사용자에게 명확한 피드백 제공
- [ ] 콘솔에 상세 로그 유지 (디버깅용)
