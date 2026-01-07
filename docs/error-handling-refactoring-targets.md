# 에러 처리 리팩토링 대상 파일

## 파일 목록 요약

| 구분 | 생성 | 수정 | 합계 |
|------|------|------|------|
| Core | 1 | 1 | 2 |
| Service | 0 | 1 | 1 |
| Hook | 0 | 7 | 7 |
| Store | 0 | 1 | 1 |
| Component | 0 | 3 | 3 |
| **합계** | **1** | **13** | **14** |

---

## 생성 파일 (1개)

### `src/utils/errors.ts` (신규)

```typescript
// AppError 클래스, ErrorCode 타입, ERROR_MESSAGES 상수
// normalizeFirebaseError(), normalizeDBError() 유틸
```

---

## 수정 파일 (13개)

### 우선순위 1: Core (기반 작업)

| 파일 | 현재 상태 | 수정 내용 |
|------|-----------|-----------|
| `src/db/core/errors.ts` | withErrorHandling 로깅 없음 | context 파라미터 추가, console.error 추가 |

---

### 우선순위 2: Service Layer

| 파일 | 현재 상태 | 수정 내용 |
|------|-----------|-----------|
| `src/features/Study/services/studyApi.ts` | handleStudyApiError 분산 | normalizeFirebaseError로 통합, AppError throw |

---

### 우선순위 3: Hook Layer (7개)

| 파일 | 현재 상태 | 수정 내용 |
|------|-----------|-----------|
| `src/features/Study/hooks/useWeakPointRecorder.ts` | console.error + Toast | Toast 제거, error 상태 반환 |
| `src/features/Study/hooks/queries/useGenerateQuiz.ts` | 에러 처리 위임 | retry 로직에 AppError.retryable 반영 |
| `src/features/Study/hooks/queries/useEvaluateEssay.ts` | onError에서 console만 | AppError 변환, 상태 반환 |
| `src/features/Study/hooks/queries/useEvaluateSentence.ts` | onError에서 console만 | AppError 변환, 상태 반환 |
| `src/features/Study/modes/word/hooks/useWordQuiz.ts` | Query error만 처리 | error 상태 정규화, 로깅 추가 |
| `src/features/Study/modes/sentence/hooks/useSentenceQuiz.ts` | 불완전한 에러 처리 | AppError 활용, 일관성 확보 |
| `src/features/Study/modes/essay/hooks/useEssayQuiz.ts` | try-catch만 (Toast 없음) | error 상태 반환으로 변경 |

---

### 우선순위 4: Store Layer

| 파일 | 현재 상태 | 수정 내용 |
|------|-----------|-----------|
| `src/stores/studySessionStore.ts` | completeSession 에러 처리 미완성 | error 상태 추가, 로깅 강화 |

---

### 우선순위 5: Component Layer (3개)

| 파일 | 현재 상태 | 수정 내용 |
|------|-----------|-----------|
| `src/features/Study/modes/word/WordQuizContainer.tsx` | 에러 UI 없음 | error 상태 기반 Toast/UI 추가 |
| `src/features/Study/modes/sentence/SentenceQuizContainer.tsx` | 에러 UI 없음 | error 상태 기반 Toast/UI 추가 |
| `src/features/Study/modes/essay/EssayQuizContainer.tsx` | 에러 UI 없음 | error 상태 기반 Toast/UI 추가 |

---

## 삭제/정리 대상

| 파일 | 현재 상태 | 조치 |
|------|-----------|------|
| `src/utils/errorHandler.ts` | 80% 미사용 | withToastError, identifyErrorSource, createErrorState, initialErrorState 삭제 |

---

## 작업 순서

```
1단계: 기반 작업
├─ [생성] src/utils/errors.ts
└─ [수정] src/db/core/errors.ts

2단계: Service 정규화
└─ [수정] src/features/Study/services/studyApi.ts

3단계: Hook 리팩토링
├─ [수정] useWeakPointRecorder.ts
├─ [수정] useGenerateQuiz.ts
├─ [수정] useEvaluateEssay.ts
├─ [수정] useEvaluateSentence.ts
├─ [수정] useWordQuiz.ts
├─ [수정] useSentenceQuiz.ts
└─ [수정] useEssayQuiz.ts

4단계: Store 보완
└─ [수정] studySessionStore.ts

5단계: Component UI 추가
├─ [수정] WordQuizContainer.tsx
├─ [수정] SentenceQuizContainer.tsx
└─ [수정] EssayQuizContainer.tsx

6단계: 정리
└─ [삭제] errorHandler.ts 미사용 함수
```

---

## 예상 영향도

| 영역 | 영향 | 비고 |
|------|------|------|
| 기존 테스트 | 중간 | useWeakPointRecorder 테스트 수정 필요 |
| 사용자 경험 | 개선 | 모든 에러에 피드백 제공 |
| 코드량 | 증가 | ~200줄 추가 예상 |
| 복잡도 | 감소 | 패턴 일관성으로 유지보수 용이 |
