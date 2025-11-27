# Notree 데이터 아키텍처 설계

## 1. 개요

### 1.1 목표
- 제공 문서(System)와 사용자 문서(User) 분리
- 제공 문서 패치 시 사용자 데이터 보호
- 제공 문서 커스터마이징 지원
- 학습 시스템 통합 (취약점 기록, 학습 통계)

### 1.2 핵심 원칙
- **원본 보존**: 제공 문서 원본은 항상 유지
- **Overlay 패턴**: 사용자 수정은 별도 레이어로 관리
- **독립성**: 패치가 사용자 커스터마이징에 영향 없음

---

## 2. 데이터 모델

### 2.1 테이블 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IndexedDB (Dexie)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [systemNotes] - 제공 문서 원본 (읽기 전용)                           │
│  ├── id: string              // 고정 ID (예: "js-closure-001")      │
│  ├── version: number         // 패치 버전                           │
│  ├── title: string                                                  │
│  ├── content: string         // 마크다운                            │
│  ├── category: string                                               │
│  ├── tags: string[]                                                 │
│  ├── order: number           // 정렬 순서                           │
│  └── createdAt: number                                              │
│                                                                     │
│  [userNotes] - 사용자 생성 문서                                      │
│  ├── id: string              // UUID                                │
│  ├── title: string                                                  │
│  ├── content: string                                                │
│  ├── category: string                                               │
│  ├── tags: string[]                                                 │
│  ├── createdAt: number                                              │
│  └── updatedAt: number                                              │
│                                                                     │
│  [userOverrides] - 제공 문서 커스터마이징                             │
│  ├── systemNoteId: string    // PK, systemNotes.id 참조             │
│  ├── customTitle: string?    // null이면 원본 사용                   │
│  ├── customContent: string?  // null이면 원본 사용                   │
│  ├── isHidden: boolean       // 사용자가 숨긴 경우                   │
│  └── updatedAt: number                                              │
│                                                                     │
│  [images] - 이미지 Blob 저장소 (기존)                                │
│  ├── id: string                                                     │
│  ├── blob: Blob                                                     │
│  ├── mimeType: string                                               │
│  ├── size: number                                                   │
│  ├── noteId: string?                                                │
│  └── createdAt: number                                              │
│                                                                     │
│  [studyRecords] - 학습 기록                                          │
│  ├── id: string              // UUID                                │
│  ├── noteId: string          // systemNotes 또는 userNotes ID       │
│  ├── noteType: 'system'|'user'                                      │
│  ├── sessionId: string       // 학습 세션 ID                        │
│  ├── totalQuestions: number  // 총 문제 수                          │
│  ├── correctCount: number    // 정답 수                             │
│  ├── wrongCount: number      // 오답 수                             │
│  ├── duration: number        // 학습 시간 (초)                      │
│  ├── createdAt: number                                              │
│  └── completedAt: number?                                           │
│                                                                     │
│  [weakPoints] - 취약점/오답 기록                                     │
│  ├── id: string              // UUID                                │
│  ├── noteId: string                                                 │
│  ├── noteType: 'system'|'user'                                      │
│  ├── questionId: string?     // 문제 ID (있는 경우)                  │
│  ├── content: string         // 틀린 내용/키워드                     │
│  ├── userAnswer: string?     // 사용자 답변                          │
│  ├── correctAnswer: string?  // 정답                                │
│  ├── wrongCount: number      // 틀린 횟수                           │
│  ├── lastWrongAt: number     // 마지막으로 틀린 시간                  │
│  ├── isResolved: boolean     // 해결됨 여부                          │
│  └── createdAt: number                                              │
│                                                                     │
│  [studySessions] - 학습 세션                                         │
│  ├── id: string              // UUID                                │
│  ├── startedAt: number                                              │
│  ├── endedAt: number?                                               │
│  ├── totalDuration: number   // 총 학습 시간 (초)                   │
│  └── noteIds: string[]       // 학습한 문서 ID 목록                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 TypeScript 인터페이스

```typescript
// lib/db.ts

export interface SystemNote {
    id: string;
    version: number;
    title: string;
    content: string;
    category: string;
    tags: string[];
    order: number;
    createdAt: number;
}

export interface UserNote {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

export interface UserOverride {
    systemNoteId: string;
    customTitle: string | null;
    customContent: string | null;
    isHidden: boolean;
    updatedAt: number;
}

export interface StudyRecord {
    id: string;
    noteId: string;
    noteType: 'system' | 'user';
    sessionId: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    duration: number;
    createdAt: number;
    completedAt: number | null;
}

export interface WeakPoint {
    id: string;
    noteId: string;
    noteType: 'system' | 'user';
    questionId: string | null;
    content: string;
    userAnswer: string | null;
    correctAnswer: string | null;
    wrongCount: number;
    lastWrongAt: number;
    isResolved: boolean;
    createdAt: number;
}

export interface StudySession {
    id: string;
    startedAt: number;
    endedAt: number | null;
    totalDuration: number;
    noteIds: string[];
}
```

---

## 3. 아키텍처 구조

### 3.1 디렉토리 구조

```
src/
├── lib/
│   ├── db.ts                      # Dexie 스키마 정의
│   └── imageStorage.ts            # 이미지 저장소 (기존)
│
├── data/
│   └── systemNotes.json           # 제공 문서 원본 (빌드 포함)
│
├── services/
│   ├── index.ts                   # 배럴 export
│   │
│   ├── note/
│   │   ├── index.ts
│   │   ├── noteService.ts         # 통합 문서 CRUD
│   │   ├── systemNoteService.ts   # 제공 문서 관리
│   │   └── types.ts               # 통합 Note 타입
│   │
│   └── study/
│       ├── index.ts
│       ├── studyService.ts        # 학습 기록 관리
│       ├── weakPointService.ts    # 취약점 관리
│       └── statisticsService.ts   # 통계 계산
│
└── hooks/
    ├── useNotes.ts                # 문서 관련 훅
    ├── useStudy.ts                # 학습 관련 훅
    └── useStatistics.ts           # 대시보드 통계 훅
```

### 3.2 서비스 레이어 설계

#### noteService.ts - 통합 문서 서비스

```typescript
// 통합 Note 타입 (UI에서 사용)
interface Note {
    id: string;
    type: 'system' | 'user';
    title: string;
    content: string;
    category: string;
    tags: string[];
    isCustomized: boolean;      // system이고 override 있으면 true
    originalTitle?: string;     // 커스터마이징된 경우 원본
    originalContent?: string;
    createdAt: number;
    updatedAt?: number;
}

// 주요 메서드
getAllNotes(): Promise<Note[]>
getNoteById(id: string, type: 'system' | 'user'): Promise<Note | null>
createNote(data: CreateNoteInput): Promise<Note>
updateNote(id: string, type: 'system' | 'user', data: UpdateNoteInput): Promise<Note>
deleteNote(id: string, type: 'system' | 'user'): Promise<void>
resetToOriginal(systemNoteId: string): Promise<Note>  // override 삭제
hideSystemNote(systemNoteId: string): Promise<void>
unhideSystemNote(systemNoteId: string): Promise<void>
```

#### systemNoteService.ts - 제공 문서 관리

```typescript
loadSystemNotes(): Promise<void>           // 앱 시작 시 호출
applyPatch(notes: SystemNote[]): Promise<PatchResult>
getVersion(): Promise<number>
checkForUpdates(): Promise<boolean>
```

#### studyService.ts - 학습 기록

```typescript
startSession(): Promise<StudySession>
endSession(sessionId: string): Promise<void>
recordStudy(data: RecordStudyInput): Promise<StudyRecord>
getStudyHistory(noteId: string): Promise<StudyRecord[]>
```

#### weakPointService.ts - 취약점 관리

```typescript
addWeakPoint(data: AddWeakPointInput): Promise<WeakPoint>
resolveWeakPoint(id: string): Promise<void>
getWeakPointsByNote(noteId: string): Promise<WeakPoint[]>
getAllWeakPoints(): Promise<WeakPoint[]>
getMostFrequentWeakPoints(limit: number): Promise<WeakPoint[]>
```

#### statisticsService.ts - 대시보드 통계

```typescript
interface DashboardStats {
    totalStudyTime: number;           // 총 학습 시간
    totalSessions: number;            // 총 세션 수
    totalQuestionsAnswered: number;   // 총 답변 문제 수
    overallAccuracy: number;          // 전체 정답률
    streakDays: number;               // 연속 학습 일수

    byNote: NoteStats[];              // 문서별 통계
    byCategory: CategoryStats[];      // 카테고리별 통계
    recentActivity: ActivityItem[];   // 최근 활동
    weakPointsSummary: WeakPointSummary;
}

interface NoteStats {
    noteId: string;
    noteType: 'system' | 'user';
    title: string;
    totalStudyTime: number;
    totalQuestions: number;
    correctCount: number;
    accuracy: number;
    weakPointCount: number;
    lastStudiedAt: number;
}

getDashboardStats(): Promise<DashboardStats>
getNoteStats(noteId: string): Promise<NoteStats>
getWeeklyProgress(): Promise<WeeklyProgress>
getAccuracyTrend(days: number): Promise<AccuracyTrend[]>
```

---

## 4. 핵심 로직 흐름

### 4.1 문서 목록 조회

```
1. systemNotes 전체 로드
2. userOverrides 전체 로드
3. 병합 처리:
   - override.isHidden === true → 제외
   - override.customTitle/customContent → 덮어쓰기
   - isCustomized 플래그 설정
4. userNotes 전체 로드
5. 통합 정렬 (카테고리 → order/createdAt)
6. Note[] 반환
```

### 4.2 문서 수정

```
if (note.type === 'system') {
    // UserOverrides에 upsert
    await db.userOverrides.put({
        systemNoteId: note.id,
        customTitle: newTitle !== original.title ? newTitle : null,
        customContent: newContent !== original.content ? newContent : null,
        isHidden: false,
        updatedAt: Date.now()
    });
} else {
    // UserNotes에 update
    await db.userNotes.update(note.id, {
        title: newTitle,
        content: newContent,
        updatedAt: Date.now()
    });
}
```

### 4.3 제공 문서 패치

```
1. 새 systemNotes.json fetch (또는 번들에서 로드)
2. 현재 DB의 systemNotes와 버전 비교
3. 변경된 문서만 업데이트:
   - 새 문서 → insert
   - 버전 증가 → update (원본만, override 유지)
   - 삭제된 문서 → soft delete 또는 유지
4. UserOverrides는 그대로 유지
5. (선택) 원본 크게 변경 시 사용자 알림
```

### 4.4 학습 기록 흐름

```
1. 학습 시작 → startSession()
2. 문서 학습 완료 → recordStudy()
3. 오답 발생 → addWeakPoint()
4. 학습 종료 → endSession()
5. 대시보드 조회 → getDashboardStats()
```

---

## 5. DB 마이그레이션

### 5.1 Dexie 버전 관리

```typescript
// lib/db.ts

class NotreeDB extends Dexie {
    systemNotes!: Table<SystemNote>;
    userNotes!: Table<UserNote>;
    userOverrides!: Table<UserOverride>;
    images!: Table<ImageBlob>;
    studyRecords!: Table<StudyRecord>;
    weakPoints!: Table<WeakPoint>;
    studySessions!: Table<StudySession>;

    constructor() {
        super('notree');

        // v4: 새 구조로 마이그레이션
        this.version(4).stores({
            systemNotes: 'id, category, order',
            userNotes: 'id, category, createdAt, updatedAt',
            userOverrides: 'systemNoteId, updatedAt',
            images: 'id, noteId, createdAt',
            studyRecords: 'id, noteId, sessionId, createdAt',
            weakPoints: 'id, noteId, wrongCount, isResolved',
            studySessions: 'id, startedAt',
            // 기존 notes 테이블 삭제
            notes: null,
        }).upgrade(async tx => {
            // 기존 notes → userNotes 마이그레이션
            const oldNotes = await tx.table('notes').toArray();
            const userNotes = oldNotes.map(note => ({
                ...note,
                // 필요한 변환
            }));
            await tx.table('userNotes').bulkAdd(userNotes);
        });
    }
}
```

---

## 6. 제공 문서 관리

### 6.1 systemNotes.json 구조

```json
{
    "version": 1,
    "updatedAt": "2024-01-15T00:00:00Z",
    "notes": [
        {
            "id": "js-closure-001",
            "version": 1,
            "title": "JavaScript 클로저 이해하기",
            "content": "# 클로저란?\n\n클로저는...",
            "category": "JavaScript",
            "tags": ["closure", "scope", "function"],
            "order": 1
        },
        {
            "id": "js-promise-001",
            "version": 1,
            "title": "Promise와 비동기 처리",
            "content": "# Promise\n\n...",
            "category": "JavaScript",
            "tags": ["promise", "async", "await"],
            "order": 2
        }
    ]
}
```

### 6.2 패치 전략

| 방식 | 장점 | 단점 |
|------|------|------|
| **번들 포함** | 오프라인 지원, 빠른 로드 | 앱 업데이트 필요 |
| **서버 fetch** | 즉시 반영 | 네트워크 의존 |
| **하이브리드** | 양쪽 장점 | 복잡도 증가 |

**추천: 하이브리드**
- 기본: 번들에 포함된 systemNotes.json 사용
- 앱 시작 시 서버에서 최신 버전 체크
- 업데이트 있으면 백그라운드 다운로드 후 적용

---

## 7. 결정 필요 사항

| 항목 | 옵션 | 추천 |
|------|------|------|
| 문서 ID 체계 | prefix (`sys-`, `usr-`) vs type 필드 | type 필드 |
| 카테고리 관리 | System/User 공유 vs 분리 | 공유 |
| 정렬 기준 | System 먼저 vs 통합 | 카테고리 내 통합 |
| 삭제된 System 문서 | 숨김 vs 완전 삭제 | 숨김 (isHidden) |
| 학습 데이터 보존 | 영구 vs 기간 제한 | 영구 (사용자 선택 삭제) |

---

## 8. 향후 확장

### 8.1 동기화 (선택적)
- 사용자 계정 연동 시 클라우드 동기화
- userNotes, userOverrides, 학습 데이터 동기화
- systemNotes는 서버에서 항상 최신 버전 제공

### 8.2 내보내기/가져오기
- 사용자 데이터 JSON export/import
- 학습 기록 포함 선택

### 8.3 분석 고도화
- 망각 곡선 기반 복습 추천
- 취약 카테고리 자동 감지
- 학습 패턴 분석
