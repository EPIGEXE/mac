# 맥

마크다운 기반 학습 노트 애플리케이션. 노트 작성부터 AI 퀴즈 생성, 학습 통계 분석까지 한 곳에서 관리합니다.

## 주요 기능

### 노트 관리
- **마크다운 에디터**: ProseMirror 기반 WYSIWYG 에디터
  - 슬래시 커맨드 (`/`)로 블록 삽입
  - 드래그 핸들로 블록 재정렬
  - 테이블, 코드 블록(하이라이팅), 체크박스 지원
  - 이미지 붙여넣기 (IndexedDB 저장)
- **카테고리 분류**: JavaScript, React, TypeScript 등 주제별 노트 관리
- **로드맵 뷰**: React Flow 기반 카테고리별 노트 시각화

### AI 퀴즈 학습
노트 내용을 기반으로 3가지 학습 모드 제공:

| 모드 | 설명 |
|------|------|
| **단어(Word)** | 핵심 키워드 빈칸 채우기 |
| **문장(Sentence)** | 개념 설명 Q&A |
| **서술형(Essay)** | 실무 시나리오 기반 면접 문제 |

- 노트 단일/복수 선택하여 학습 세션 생성
- 순차/랜덤 출제 순서 지원
- AI가 답변 채점 및 피드백 제공

### 학습 분석
- **통계 대시보드**: 모드별 학습량, 정답률, 학습 시간 차트
- **취약점 분석**: 자주 틀리는 키워드/문제 추적
- **세션 히스토리**: 과거 학습 기록 조회

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | React 19, TypeScript, Vite 7 |
| 상태 관리 | Zustand, TanStack Query |
| 스타일링 | Tailwind CSS 4 |
| 에디터 | ProseMirror |
| DB | Dexie (IndexedDB) |
| 차트 | Recharts |
| 테스트 | Vitest, Playwright, MSW |
| 기타 | Firebase Analytics, Framer Motion |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드 (테스트 포함)
npm run build

# 테스트
npm test
```

## 프로젝트 구조

```
src/
├── components/          # 공통 컴포넌트
│   ├── common/          # Button, Badge, Modal 등
│   ├── ErrorBoundary/   # 에러 처리
│   ├── icons/           # 아이콘 컴포넌트
│   └── layouts/         # 레이아웃
│
├── features/            # 기능별 모듈
│   ├── Main/            # 메인 페이지
│   │   ├── ListView/    # 노트 리스트
│   │   └── roadmap/     # 로드맵 뷰 (React Flow)
│   ├── NoteDetail/      # 노트 상세
│   │   └── MarkdownEditor/  # ProseMirror 에디터
│   ├── Study/           # 퀴즈 학습
│   │   ├── modes/       # word, sentence, essay
│   │   ├── hooks/       # 퀴즈 관련 훅
│   │   └── services/    # AI API 연동
│   ├── StatisticsDashboard/ # 학습 통계
│   ├── WeakPoints/      # 취약점 분석
│   └── Toast/           # 터미널 스타일 토스트
│
├── db/                  # 데이터베이스
│   ├── core/            # Dexie 스키마 정의
│   └── service/         # CRUD 서비스
│
├── pages/               # 라우트 페이지
├── stores/              # Zustand 스토어
├── contexts/            # React Context (Theme)
├── hooks/               # 공통 훅
├── lib/                 # Firebase 등 외부 서비스
└── errors/              # 커스텀 에러 클래스
```

## 데이터 모델

```
SystemNote (기본 제공 노트)
UserNote (사용자 생성 노트)
UserOverride (기본 노트 커스터마이징)
    │
    └──> StudySession (학습 세션)
              │
              └──> StudyRecord (학습 기록: word/sentence/essay)
                        │
                        └──> WeakPoint (취약점)
```

## 페이지 라우팅

| 경로 | 페이지 |
|------|--------|
| `/` | 메인 (노트 리스트/로드맵) |
| `/note/:noteId` | 노트 상세/편집 |
| `/study/setup` | 학습 설정 |
| `/study` | 퀴즈 진행 |
| `/study/result` | 최종 결과 |
| `/statistics` | 통계 대시보드 |
| `/study/weak-points` | 취약점 목록 |
| `/study/sessions` | 세션 히스토리 |
