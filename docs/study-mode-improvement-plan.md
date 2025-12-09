# Study Mode 기능 흐름 개선 계획

## 현재 상태 분석

### 현재 Study Mode 진입 경로

```
┌─────────────────────────────────────────────────────────────────┐
│                        경로 1: NoteDetailPage                     │
│  노트 상세 → [Study 버튼] → StudyModeSelector 모달 → 즉시 학습    │
│  - 단일 노트만 학습                                               │
│  - URL: /study?noteId={id}&mode={mode}                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        경로 2: MainPage (미구현?)                  │
│  메인 → 섹션 Study → 해당 카테고리 노트들 학습                     │
│  - 카테고리 전체 학습                                             │
│  - URL: /study?category={cat}&mode={mode}&order={order}          │
└─────────────────────────────────────────────────────────────────┘
```

### 현재 파일 구조

```
src/
├── pages/
│   ├── MainPage.tsx              # 메인 (Study 버튼 없음)
│   ├── NoteDetailPage.tsx        # 노트 상세 (Study 버튼 있음)
│   └── StudyModePage.tsx         # 학습 진행 페이지
│
├── features/Study/
│   ├── StudyQuizViewer.tsx       # 퀴즈 라우터 (모드별 분기)
│   ├── StudyViewer.tsx           # 읽기 전용 뷰어 (사용 안함?)
│   ├── components/
│   │   ├── StudyModeSelector.tsx # 모드 선택 모달
│   │   └── ...
│   └── modes/
│       ├── word/                 # 단어 모드
│       ├── sentence/             # 문장 모드
│       └── essay/                # 서술형 모드
│
└── stores/
    └── noteStore.ts              # 노트 상태 (Study 관련 없음)
```

### 현재 문제점

1. **진입점 부족**: MainPage에서 Study Mode로 바로 진입하는 UI 없음
2. **노트 선택 불가**: 개별 노트 혹은 카테고리 단위만 가능, 커스텀 선택 불가
3. **진행 상황 파악 어려움**: 전체 몇 개 중 몇 번째인지 알기 어려움
4. **최종 결과 없음**: 노트별 결과만 있고, 전체 세션 결과 없음
5. **상태 관리 분산**: URL 파라미터와 로컬 상태만 사용, 전역 상태 없음

---

## 개선 방향

### 새로운 흐름

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────┐
│  MainPage   │ ──► │  StudySetupPage │ ──► │  StudyModePage  │ ──► │ FinalResult │
│             │     │  (공부 준비)     │     │  (퀴즈 진행)    │     │ (최종 결과) │
│ [Study 버튼]│     │  - 노트 선택    │     │  - 진행률 표시  │     │ - 전체 통계 │
└─────────────┘     │  - 모드 선택    │     │  - 노트별 퀴즈  │     │ - 노트별 요약│
                    │  - 순서 선택    │     └─────────────────┘     └─────────────┘
                    └─────────────────┘
                           │
                           │ 또는
                           ▼
┌─────────────────┐
│ NoteDetailPage  │
│                 │
│ [Study 버튼] ───┼──► 단일 노트 즉시 학습 (기존 유지)
└─────────────────┘
```

---

## 1. 동작의 흐름 (페이지 & 버튼)

### Phase 1: MainPage 수정

**변경 사항**:
- Header에 `[Study]` 버튼 추가

**버튼 동작**:
```
[Study 버튼 클릭] → /study/setup 페이지로 이동
```

**파일**: `src/features/Main/Header.tsx`

### Phase 2: StudySetupPage 신규 생성

**URL**: `/study/setup`

**UI 구성**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Header: < back                              [Start Study ▶]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  // 학습 모드 선택                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │  word   │ │  sent   │ │  essay  │                           │
│  │  단어   │ │  문장   │ │  서술형 │                           │
│  └─────────┘ └─────────┘ └─────────┘                           │
│                                                                 │
│  // 학습 순서                                                    │
│  ┌─────────────┐ ┌─────────────┐                               │
│  │ sequential  │ │   random    │                               │
│  └─────────────┘ └─────────────┘                               │
│                                                                 │
│  // 노트 선택 (선택됨: 5개)                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [전체 선택] [전체 해제]                                     │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ ▼ CS                                                       │ │
│  │   ☑ 운영체제 기초                                          │ │
│  │   ☑ 프로세스와 스레드                                       │ │
│  │   ☐ 메모리 관리                                            │ │
│  │ ▼ Frontend                                                 │ │
│  │   ☑ Critical Rendering Path                                │ │
│  │   ☑ Virtual DOM                                            │ │
│  │   ☐ React Hooks                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**동작**:
```
[Start Study 버튼 클릭]
  → studySessionStore에 세션 생성
  → /study 페이지로 이동 (noteIds는 store에서 관리)
```

**파일**: `src/pages/StudySetupPage.tsx` (신규)

### Phase 3: StudyModePage 수정

**변경 사항**:
- 진행률 표시 추가 (Header에 "3/10" 형식)
- 전역 상태(studySessionStore)에서 노트 목록 읽기
- 마지막 노트 완료 시 → FinalResultPage로 이동

**UI 변경 (Header)**:
```
┌─────────────────────────────────────────────────────────────────┐
│  < exit     [word] 단어 모드      3/10  ████████░░░░░░  30%    │
└─────────────────────────────────────────────────────────────────┘
```

**동작**:
```
[노트별 결과에서 next 클릭]
  → 다음 노트가 있으면: 다음 노트로 이동
  → 마지막 노트면: /study/result 페이지로 이동
```

**파일**: `src/pages/StudyModePage.tsx` (수정)

### Phase 4: StudyFinalResultPage 신규 생성

**URL**: `/study/result`

**UI 구성**:
```
┌─────────────────────────────────────────────────────────────────┐
│                     // 학습 완료                                 │
│                                                                 │
│                        85%                                      │
│                   ████████████░░░                               │
│                   ✓ 17  ·  ✗ 3                                 │
│                                                                 │
│                 "잘 했어요! 조금만 더!"                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  // 노트별 결과                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 01  운영체제 기초           90%  ✓ 9  ✗ 1                  │ │
│  │ 02  프로세스와 스레드        80%  ✓ 4  ✗ 1                  │ │
│  │ 03  Critical Rendering     100%  ✓ 5  ✗ 0                  │ │
│  │ 04  Virtual DOM            60%  ✓ 3  ✗ 2                  │ │
│  │ 05  React Hooks            80%  ✓ 4  ✗ 1                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   :q 나가기      │  │  ▶ 다시 학습    │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

**동작**:
```
[나가기 클릭] → MainPage로 이동
[다시 학습 클릭] → 같은 노트들로 /study 다시 시작
```

**파일**: `src/pages/StudyFinalResultPage.tsx` (신규)

### Phase 5: NoteDetailPage 유지

**변경 없음**: 기존 단일 노트 즉시 학습 유지
- 단, 최종 결과 페이지는 스킵 (노트 1개이므로 불필요)

---

## 2. 전역 상태 설계 (studySessionStore)

### 필요성

현재 문제:
- URL 파라미터로 noteIds 전달 시 길이 제한
- 페이지 간 상태 공유 어려움
- 전체 세션 결과 누적 불가

해결:
- Zustand store로 학습 세션 전역 관리
- 노트 목록, 진행 상황, 결과 모두 store에서 관리

### Store 설계

**파일**: `src/stores/studySessionStore.ts`

```typescript
import { create } from 'zustand'
import type { StudyModeType } from '../features/Study/types'

// 노트별 결과
interface NoteResult {
    noteId: string
    noteTitle: string
    totalQuestions: number
    correctCount: number
    wrongCount: number
    score: number           // 0-100
    duration: number        // 초
}

// 학습 세션 상태
interface StudySession {
    // 설정
    selectedNoteIds: string[]       // 선택된 노트 ID들
    mode: StudyModeType             // 학습 모드
    order: 'sequential' | 'random'  // 순서

    // 진행 상황
    currentIndex: number            // 현재 노트 인덱스 (0-based)
    isActive: boolean               // 세션 활성화 여부

    // 결과
    noteResults: NoteResult[]       // 노트별 결과
    startedAt: number | null        // 시작 시간
    completedAt: number | null      // 완료 시간
}

interface StudySessionStore extends StudySession {
    // 세션 시작
    startSession: (params: {
        noteIds: string[]
        mode: StudyModeType
        order: 'sequential' | 'random'
    }) => void

    // 진행
    goToNextNote: () => boolean     // 다음 노트로 (마지막이면 false)
    getCurrentNoteId: () => string | null

    // 결과 기록
    recordNoteResult: (result: Omit<NoteResult, 'noteId'> & { noteId: string }) => void

    // 통계
    getTotalStats: () => {
        totalQuestions: number
        totalCorrect: number
        totalWrong: number
        averageScore: number
        totalDuration: number
    }

    // 세션 종료
    completeSession: () => void
    resetSession: () => void
}
```

### Store 사용 흐름

```
1. StudySetupPage
   └─ startSession({ noteIds, mode, order })

2. StudyModePage
   ├─ getCurrentNoteId() → 현재 노트 로드
   ├─ recordNoteResult() → 노트 완료 시 결과 저장
   └─ goToNextNote() → 다음 노트 또는 결과 페이지

3. StudyFinalResultPage
   ├─ noteResults → 노트별 결과 표시
   ├─ getTotalStats() → 전체 통계
   └─ resetSession() → 세션 초기화
```

---

## 3. 라우팅 변경

### 새로운 라우트 구조

```typescript
// App.tsx
<Routes>
    <Route element={<RootLayout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/note/:noteId" element={<NoteDetailWrapper />} />

        {/* Study Mode 라우트 */}
        <Route path="/study/setup" element={<StudySetupPage />} />
        <Route path="/study" element={<StudyModePage />} />
        <Route path="/study/result" element={<StudyFinalResultPage />} />
    </Route>
</Routes>
```

### URL 파라미터 정리

| 페이지 | URL | 파라미터 |
|--------|-----|---------|
| StudySetupPage | `/study/setup` | 없음 (store 사용) |
| StudyModePage | `/study` | `?mode={mode}` (호환성) |
| StudyFinalResultPage | `/study/result` | 없음 (store 사용) |
| 단일 노트 학습 | `/study?noteId={id}&mode={mode}` | 기존 유지 |

---

## 4. 구현 순서

| Phase | 작업 | 파일 | 우선순위 |
|-------|------|------|---------|
| 1 | studySessionStore 생성 | `stores/studySessionStore.ts` | 높음 |
| 2 | StudySetupPage 생성 | `pages/StudySetupPage.tsx` | 높음 |
| 3 | Header에 Study 버튼 추가 | `features/Main/Header.tsx` | 높음 |
| 4 | StudyModePage 수정 (진행률, store 연동) | `pages/StudyModePage.tsx` | 높음 |
| 5 | StudyFinalResultPage 생성 | `pages/StudyFinalResultPage.tsx` | 높음 |
| 6 | App.tsx 라우트 추가 | `App.tsx` | 높음 |
| 7 | 노트별 결과 → store 연동 | `modes/*/Container.tsx` | 중간 |
| 8 | 단일 노트 학습 호환성 유지 | `StudyModePage.tsx` | 중간 |

---

## 5. 컴포넌트 분리 계획

### StudySetupPage 하위 컴포넌트

```
src/features/Study/components/
├── StudyModeSelector.tsx      # 기존 (모달 → 인라인으로 변경 가능)
├── StudyOrderSelector.tsx     # 신규: 순서 선택 (sequential/random)
├── NoteSelector/              # 신규: 노트 선택
│   ├── NoteSelector.tsx       # 메인 컨테이너
│   ├── CategoryGroup.tsx      # 카테고리별 그룹
│   └── NoteCheckbox.tsx       # 개별 노트 체크박스
└── StudyProgress.tsx          # 신규: 진행률 표시 (Header용)
```

### StudyFinalResultPage 하위 컴포넌트

```
src/features/Study/components/
├── FinalScoreSummary.tsx      # 신규: 전체 점수 요약
├── NoteResultList.tsx         # 신규: 노트별 결과 목록
└── NoteResultItem.tsx         # 신규: 노트별 결과 아이템
```

---

## 6. 마이그레이션 고려사항

### 기존 기능 호환성

1. **단일 노트 학습** (NoteDetailPage → Study)
   - URL 파라미터 `noteId` 있으면 기존 방식으로 동작
   - store 사용하지 않음, 최종 결과 페이지 스킵

2. **카테고리 학습** (기존 URL 파라미터 방식)
   - `category` 파라미터 지원 유지
   - 단, 신규 흐름(SetupPage)으로 유도 권장

### 점진적 마이그레이션

```
Step 1: Store + SetupPage + FinalResultPage 추가 (신규 흐름)
Step 2: MainPage Header에 Study 버튼 추가
Step 3: 기존 URL 파라미터 방식 deprecation 경고 (선택)
Step 4: 기존 방식 제거 (선택, 나중에)
```

---

## 구현 완료 기준

- [ ] `studySessionStore.ts` 생성 및 테스트
- [ ] `StudySetupPage.tsx` 생성 (노트 선택, 모드 선택, 순서 선택)
- [ ] `Header.tsx`에 Study 버튼 추가
- [ ] `StudyModePage.tsx` 수정 (진행률 표시, store 연동)
- [ ] `StudyFinalResultPage.tsx` 생성 (전체 결과)
- [ ] `App.tsx` 라우트 추가
- [ ] 노트별 결과 → store 연동 (WordQuizContainer 등)
- [ ] 단일 노트 학습 호환성 확인
