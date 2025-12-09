# 스터디 모드 시스템 설계

## 1. 시스템 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  단어 모드   │  │  문장 모드   │  │  서술형 모드  │             │
│  │  (word)     │  │  (sentence) │  │  (essay)    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   Study Service Layer │                          │
│              └───────────┬───────────┘                          │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Backend                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Cloud Functions (Node.js)                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │ generateQuiz│  │ evaluateAns │  │ getHint     │      │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │   │
│  │         └────────────────┼────────────────┘              │   │
│  │                          ▼                               │   │
│  │              ┌───────────────────────┐                   │   │
│  │              │   Groq API (LLaMA)    │                   │   │
│  │              └───────────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Firestore                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │studySessions│  │studyRecords │  │ weakPoints  │      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 학습 모드 상세

| 모드 | 설명 | LLM 역할 |
|------|------|----------|
| **단어 (word)** | 핵심 키워드를 `[___]`로 가림 | 가릴 단어 선정, 정답 평가 |
| **문장 (sentence)** | 핵심 문장을 `[___]`로 가림 | 가릴 문장 선정, 정답 평가 |
| **서술형 (essay)** | 내용 기반 질문 생성 | 질문 생성, 답변 평가 및 피드백 |

---

## 3. Groq API 설정

### 3.1 Groq 특징

| 항목 | 내용 |
|------|------|
| **모델** | LLaMA 3.1 70B / LLaMA 3.1 8B |
| **장점** | 매우 빠른 추론 속도 (수백 토큰/초) |
| **비용** | Claude 대비 약 1/10 |
| **Rate Limit** | Free tier: 30 RPM, 14,400 RPD |

### 3.2 모델 선택 전략

| 용도 | 모델 | 이유 |
|------|------|------|
| 퀴즈 생성 | `llama-3.1-70b-versatile` | 정확도 중요 |
| 서술형 평가 | `llama-3.1-70b-versatile` | 정확도 중요 |
| 단순 정답 평가 | `llama-3.1-8b-instant` | 속도 중요 |
| 힌트 생성 | `llama-3.1-8b-instant` | 속도 중요 |

### 3.3 비용 예측

| 항목 | Groq (LLaMA 3.1 70B) |
|------|---------------------|
| Input | $0.59 / 1M tokens |
| Output | $0.79 / 1M tokens |
| 퀴즈 생성 1회 | ~$0.001 |
| 평가 1회 | ~$0.0005 |
| **일일 100회 학습** | **~$0.10** |

---

## 4. Cloud Functions API

### 4.1 퀴즈 생성 API

```typescript
// POST /generateQuiz
interface GenerateQuizRequest {
    noteId: string
    noteContent: string
    noteTitle: string
    mode: 'word' | 'sentence' | 'essay'
    difficulty?: 'easy' | 'medium' | 'hard'
}

interface GenerateQuizResponse {
    quizId: string
    mode: 'word' | 'sentence' | 'essay'

    // word/sentence 모드
    blindedContent?: string
    blanks?: {
        id: string
        hint?: string
    }[]

    // essay 모드
    question?: string
}
```

### 4.2 답변 평가 API

```typescript
// POST /evaluateAnswer
interface EvaluateAnswerRequest {
    quizId: string
    blankId?: string
    userAnswer?: string
    essayAnswer?: string
}

interface EvaluateAnswerResponse {
    isCorrect: boolean
    feedback?: string
    correctAnswer?: string

    // essay 모드
    score?: number
    matchedPoints?: string[]
    missedPoints?: string[]
}
```

### 4.3 힌트 요청 API

```typescript
// POST /getHint
interface GetHintRequest {
    quizId: string
    blankId: string
    hintLevel: number
}

interface GetHintResponse {
    hint: string
    remainingHints: number
}
```

---

## 5. Firestore 스키마

### 5.1 studySessions

```typescript
interface StudySession {
    id: string
    userId: string
    startedAt: Timestamp
    endedAt?: Timestamp
    mode: 'word' | 'sentence' | 'essay'
    noteIds: string[]
    status: 'in_progress' | 'completed' | 'abandoned'
    totalQuestions: number
    correctCount: number
    wrongCount: number
}
```

### 5.2 studyRecords

```typescript
interface StudyRecord {
    id: string
    sessionId: string
    noteId: string
    quizId: string
    mode: 'word' | 'sentence' | 'essay'
    blankId?: string
    question?: string
    userAnswer: string
    isCorrect: boolean
    feedback?: string
    createdAt: Timestamp
    answeredAt: Timestamp
    timeSpentMs: number
}
```

### 5.3 weakPoints

```typescript
interface WeakPoint {
    id: string
    userId: string
    noteId: string
    keyword?: string
    concept?: string
    wrongCount: number
    lastWrongAt: Timestamp
    isResolved: boolean
}
```

---

## 6. LLM 프롬프트

### 6.1 단어/문장 블라인드 생성

```
You are a study assistant for developer interview preparation.

Task: Create a fill-in-the-blank quiz from the following note.

Mode: {word | sentence}
Count: Select exactly {n} important {keywords | sentences}

Note Title: {title}
Note Content:
{content}

Instructions:
1. Identify the {n} most important technical terms/key sentences
2. Replace each with [BLANK_1], [BLANK_2], etc.
3. Provide hints (first character for Korean, first 2 letters for English)

Return ONLY valid JSON:
{
  "blindedContent": "content with [BLANK_1], [BLANK_2]...",
  "blanks": [
    { "id": "BLANK_1", "answer": "actual answer", "hint": "ㅋ" }
  ]
}
```

### 6.2 서술형 질문 생성

```
You are a technical interviewer for developer positions.

Task: Create ONE thoughtful interview question based on this note.

Note Title: {title}
Note Content:
{content}

Instructions:
1. Create an open-ended question testing deep understanding
2. Define 3-5 key points a good answer should include
3. Question should be in Korean

Return ONLY valid JSON:
{
  "question": "질문 내용",
  "expectedPoints": ["포인트1", "포인트2", "포인트3"]
}
```

### 6.3 답변 평가

```
You are evaluating a quiz answer.

Correct Answer: {correctAnswer}
User Answer: {userAnswer}

Rules:
- Allow minor typos (1-2 characters)
- Allow common synonyms or abbreviations
- Korean/English variations are acceptable

Return ONLY valid JSON:
{
  "isCorrect": true or false,
  "feedback": "Brief explanation if wrong, in Korean"
}
```

---

## 7. 클라이언트 UI 플로우

### 7.1 모드 선택 화면

```
┌─────────────────────────────────────────────────────────────┐
│                    Study Mode Entry                          │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ 📝 단어     │  │ 📄 문장     │  │ 💭 서술형    │        │
│   │   word      │  │  sentence   │  │   essay     │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│   난이도: [쉬움] [보통] [어려움]                              │
│                                                              │
│                    [▶ 학습 시작]                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 퀴즈 화면

```
┌─────────────────────────────────────────────────────────────┐
│   # JavaScript > 클로저란 무엇인가?         [1/5] ███░░     │
│   ─────────────────────────────────────────────────────────  │
│                                                              │
│   클로저는 함수와 그 함수가 선언된 [______] 환경의           │
│   조합입니다. 내부 함수에서 외부 함수의 [______]에           │
│   접근할 수 있게 해줍니다.                                   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ 입력: 렉시컬                                         │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   [💡 힌트] [건너뛰기]                      [확인]          │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 피드백 화면

```
┌─────────────────────────────────────────────────────────────┐
│   ✓ 정답입니다!                                             │
│   ─────────────────────────────────────────────────────────  │
│                                                              │
│   또는                                                       │
│                                                              │
│   ✗ 아쉽습니다!                                             │
│   ─────────────────────────────────────────────────────────  │
│   정답: 렉시컬 (lexical)                                    │
│                                                              │
│   💬 "렉시컬 환경은 코드가 작성된 위치를 기준으로            │
│      변수의 유효 범위를 결정합니다."                         │
│                                                              │
│                                        [다음 문제 →]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 보안

### 8.1 API 보안

```typescript
export const generateQuiz = functions.https.onCall(async (data, context) => {
    // 1. 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required')
    }

    // 2. Rate limiting
    await checkRateLimit(context.auth.uid, 'generateQuiz', 10)

    // 3. 입력 검증
    const validated = validateQuizRequest(data)

    // ...
})
```

### 8.2 정답 보호

- 정답은 서버(Firestore)에만 저장
- 클라이언트에는 `quizId`만 전달
- 평가 시 서버에서 정답 대조

### 8.3 Rate Limiting

```typescript
const LIMITS = {
    generateQuiz: { maxPerMinute: 5, maxPerDay: 50 },
    evaluateAnswer: { maxPerMinute: 10, maxPerDay: 200 },
    getHint: { maxPerMinute: 10, maxPerDay: 100 }
}
```

---

## 9. 파일 구조

```
src/
├── features/
│   └── Study/
│       ├── components/
│       │   ├── StudyModeSelector.tsx
│       │   ├── QuizScreen.tsx
│       │   ├── BlindedContent.tsx
│       │   ├── AnswerInput.tsx
│       │   ├── FeedbackModal.tsx
│       │   └── StudyProgress.tsx
│       ├── hooks/
│       │   ├── useStudySession.ts
│       │   ├── useQuiz.ts
│       │   └── useStudyStats.ts
│       ├── services/
│       │   └── studyApi.ts
│       └── types.ts
│
firebase/
├── functions/
│   ├── src/
│   │   ├── quiz/
│   │   │   ├── generateQuiz.ts
│   │   │   ├── evaluateAnswer.ts
│   │   │   └── getHint.ts
│   │   ├── llm/
│   │   │   ├── groqClient.ts
│   │   │   └── prompts.ts
│   │   └── utils/
│   │       ├── rateLimit.ts
│   │       └── validation.ts
│   └── index.ts
├── firestore.rules
└── firestore.indexes.json
```

---

## 10. 구현 우선순위

| 단계 | 작업 | 복잡도 |
|------|------|--------|
| 1 | Firebase 프로젝트 설정 + Firestore 스키마 | 낮음 |
| 2 | Cloud Functions 기본 구조 + Groq API 연동 | 중간 |
| 3 | 단어 모드 (word) 구현 | 중간 |
| 4 | 문장 모드 (sentence) 구현 | 낮음 |
| 5 | 서술형 모드 (essay) 구현 | 높음 |
| 6 | 학습 기록 + 약점 분석 | 중간 |
| 7 | 통계 대시보드 | 중간 |

---

## 11. 환경 변수

```bash
# Firebase Functions
firebase functions:secrets:set GROQ_API_KEY

# 로컬 개발 (.env.local)
GROQ_API_KEY=gsk_xxxxxxxxxxxx
```
