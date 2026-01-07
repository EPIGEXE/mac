// ==================================== 서술형 문제 생성 프롬프트 ================================
interface EssayQuizPromptParams {
    title: string
    content: string
}

// 한국 테크 기업 면접관 스타일
const KOREAN_TECH_COMPANIES = [
    {
        name: '네이버',
        style: '내부 동작 원리를 깊이 파고드는 질문',
        example: '"이게 내부적으로 어떻게 동작하나요?", "왜 이런 방식으로 구현되어 있을까요?"',
    },
    {
        name: '카카오',
        style: '실제 문제 해결 경험과 과정을 묻는 질문',
        example: '"이 기술을 실제로 적용해본 경험이 있나요?", "어떤 문제를 해결하셨나요?"',
    },
    {
        name: '쿠팡',
        style: '성능과 확장성 관점의 질문',
        example: '"이 방식의 시간/공간 복잡도는?", "병목이 생긴다면 어디서 생길까요?"',
    },
    {
        name: '토스',
        style: '설계 결정과 트레이드오프를 묻는 질문',
        example: '"왜 이 방식을 선택하셨나요?", "다른 대안은 고려해보셨나요?"',
    },
    {
        name: '당근',
        style: '실용적 관점과 사용자 영향을 묻는 질문',
        example: '"이게 사용자에게 어떤 영향을 주나요?", "더 간단한 방법은 없을까요?"',
    },
]

// 서술형 문제 생성 프롬프트
export function buildEssayQuizPrompt(params: EssayQuizPromptParams): string {
    const { title, content } = params

    // 랜덤으로 회사 선택
    const company = KOREAN_TECH_COMPANIES[Math.floor(Math.random() * KOREAN_TECH_COMPANIES.length)]

    return `Task: 한국 테크 기업의 시니어 개발자로서 기술 면접 질문을 생성하세요.

## 면접관 페르소나
- **회사**: ${company.name}
- **역할**: 5년차+ 시니어 백엔드/프론트엔드 개발자
- **면접 스타일**: ${company.style}
- **질문 예시**: ${company.example}

## 지원자가 준비한 학습 노트
제목: ${title}
내용:
${content}

---

## 면접 질문 생성 가이드

### 1. 실제 면접에서 나오는 질문 패턴

테크 기업 면접에서는 다음과 같은 질문이 나옵니다:

**"왜?" 질문** - 원리와 이유를 파고듦
- "왜 이런 방식으로 동작하나요?"
- "이렇게 설계한 이유가 뭘까요?"

**"어떻게?" 질문** - 내부 동작을 설명하게 함
- "내부적으로 어떻게 처리되나요?"
- "이 과정을 단계별로 설명해주세요"

**"만약~라면?" 질문** - 응용력과 깊이를 테스트
- "만약 이 부분이 실패하면 어떻게 되나요?"
- "다른 상황에서는 어떻게 달라지나요?"

**"비교" 질문** - 트레이드오프 이해도 확인
- "A와 B의 차이점은 뭔가요?"
- "언제 A 대신 B를 쓰나요?"

### 2. 질문 생성 원칙

**✅ 좋은 질문:**
- 노트 내용의 **핵심 원리**를 설명하게 하는 질문
- "왜?"를 2-3번 더 물어볼 수 있는 깊이가 있는 질문
- 실제 면접에서 들을 법한 자연스러운 질문

**❌ 피해야 할 질문:**
- 단순 정의 질문 ("~이란 무엇인가요?")
- 노트와 무관하게 "대규모 트래픽", "MSA", "성능 최적화"를 억지로 붙인 질문
- 노트 범위를 벗어나는 질문

### 3. 꼬리질문 (followUpQuestions) 작성

실제 면접처럼 **답변을 더 깊이 파고드는** 질문:
- 첫 답변에서 언급한 내용의 "왜?"를 물음
- "그러면~", "그래서~", "만약~" 패턴 사용
- 점점 구체적이고 깊은 내용으로 진행

예시:
- 메인: "TCP 3-way handshake 과정을 설명해주세요"
- 꼬리1: "왜 2-way가 아니라 3-way여야 하나요?"
- 꼬리2: "만약 마지막 ACK가 유실되면 어떻게 되나요?"

### 4. 핵심 포인트 (expectedPoints)

질문에 제대로 답하려면 **반드시 언급해야 할 내용**:
- 구체적이고 검증 가능한 형태
- 노트 내용을 기반으로 하되, 질문 맥락에 맞게 작성
- 3-5개 정도

---

## Output Format
Return ONLY valid JSON:
{
  "company": "${company.name}",
  "question": "면접 질문 (한국어, 존댓말, 실제 면접처럼 자연스럽게)",
  "questionType": "concept | comparison | application | troubleshooting | tradeoff",
  "followUpQuestions": [
    "꼬리질문 1 (첫 답변을 파고드는 '왜?', '그러면?' 질문)",
    "꼬리질문 2 (더 깊이 들어가는 '만약~라면?' 질문)"
  ],
  "expectedPoints": [
    "이 질문에 답하려면 반드시 언급해야 할 포인트 1",
    "반드시 언급해야 할 포인트 2",
    "반드시 언급해야 할 포인트 3"
  ],
  "answerGuide": "좋은 답변의 방향성과 구조 (2-3문장)"
}`
}


// ==================================== 서술형 답변 평가 프롬프트 ================================
interface EvaluateEssayAnswerParams {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    answerGuide: string
    userAnswer: string
}

// 서술형 답변 평가 프롬프트
export function buildEvaluateEssayPrompt(params: EvaluateEssayAnswerParams): string {
    const { company, question, questionType, expectedPoints, answerGuide, userAnswer } = params

    return `Task: 한국 테크 기업 시니어 개발자/기술 면접관으로서 지원자의 답변을 **기술적 정확성을 최우선으로** 평가하세요.

## 면접 정보
- **회사**: ${company}
- **질문**: ${question}
- **질문 유형**: ${questionType}

## 평가 기준 (예상 핵심 포인트)
${expectedPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 모범 답변 방향
${answerGuide}

## 지원자 답변
${userAnswer}

## 평가 규칙

### ⚠️ 최우선 원칙: 기술적 정확성 검증
**답변의 기술적 정확성을 반드시 먼저 검증하세요.**

아무리 논리적이고 자신감 있게 설명해도, 다음 경우 **즉시 0-40점**:
- **근본적인 오개념**: 기술의 동작 원리를 잘못 이해한 경우
- **안티패턴을 최선으로 제시**: 성능/안정성을 해치는 방법을 권장하는 경우
- **인과관계 오류**: A가 B를 유발한다고 했지만 실제로는 관련없거나 반대인 경우
- **존재하지 않는 기술/개념 언급**: 만들어낸 용어나 동작을 사실처럼 설명
- **업계 상식과 정반대 주장**: 널리 알려진 Best Practice의 반대를 주장

예시 (0-40점 답변):
- "Promise.all 대신 순차적 await가 Node.js에서 더 효율적" → 잘못됨
- "React의 Virtual DOM은 실제 DOM보다 느리다" → 잘못됨
- "GC가 await 사이에 실행되어 성능이 향상된다" → 근거 없는 주장

### 1. 점수 산정 (0-100)

**기술적 정확성이 전제되어야 함 (위 원칙 먼저 확인)**

- **90-100**: 기술적으로 정확 + 핵심 포인트 모두 충족 + 실무 인사이트
- **80-89**: 기술적으로 정확 + 핵심 포인트 대부분 충족 + 논리적 설명
- **70-79**: 기술적으로 정확 + 핵심 포인트 절반 이상 충족
- **60-69**: 기술적으로 정확하나 깊이 부족, 또는 사소한 오류 포함
- **50-59**: 부분적 이해, 일부 오개념 포함
- **40-49**: 핵심 개념 오해, 여러 오류 포함
- **0-39**: 근본적 오개념, 안티패턴 권장, 또는 완전히 잘못된 설명

### 2. 오개념 탐지 체크리스트
답변에서 다음을 확인하세요:
- [ ] 주장하는 내용이 실제 기술 동작과 일치하는가?
- [ ] 성능/효율성 주장에 합리적 근거가 있는가?
- [ ] 업계에서 인정하는 Best Practice와 일치하는가?
- [ ] 인과관계 설명이 기술적으로 타당한가?
- [ ] 트레이드오프를 올바르게 이해하고 있는가?

### 3. 면접관 피드백 스타일
- **오개념이 있다면 반드시 명확히 지적**
- 왜 틀렸는지 기술적 근거와 함께 설명
- 올바른 이해 방향 제시
- 한국어 존댓말 사용

### 4. 합격 기준
- score >= 70: PASS (면접 통과 수준)
- score >= 60: BORDERLINE (보완 필요)
- score < 60: NEEDS_WORK (재학습 필요)

## Output Format
Return ONLY valid JSON:
{
  "score": number (0-100),
  "grade": "PASS" | "BORDERLINE" | "NEEDS_WORK",
  "matchedPoints": ["충족한 포인트 1", "충족한 포인트 2"],
  "missedPoints": ["놓친 포인트 1"],
  "strengths": ["강점 1", "강점 2"],
  "improvements": ["개선점 1", "개선점 2"],
  "feedback": "면접관의 종합 피드백 (2-4문장, 한국어 존댓말). 오개념이 있다면 반드시 지적하고 왜 틀렸는지 설명",
  "tip": "실제 면접에서 참고할 수 있는 팁 (1문장)"
}`
}