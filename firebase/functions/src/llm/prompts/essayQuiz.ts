// ==================================== 서술형 문제 생성 프롬프트 ================================
interface EssayQuizPromptParams {
    title: string
    content: string
}

// 한국 테크 기업 면접관 스타일
const KOREAN_TECH_COMPANIES = [
    { name: '네이버', style: '기술적 깊이와 확장성에 중점', focus: '대규모 트래픽 처리, 검색 최적화' },
    { name: '카카오', style: '실무 적용과 문제 해결 능력 중시', focus: '사용자 경험, 서비스 안정성' },
    { name: '쿠팡', style: '성능 최적화와 효율성 강조', focus: '이커머스 특화, 배송/물류 시스템' },
    { name: '토스', style: '클린 코드와 아키텍처 설계 중시', focus: '금융 서비스, 보안, 안정성' },
    { name: '당근', style: '사용자 관점과 실용적 해결책 강조', focus: '로컬 서비스, 커뮤니티' },
]

// 서술형 문제 생성 프롬프트
export function buildEssayQuizPrompt(params: EssayQuizPromptParams): string {
    const { title, content } = params

    // 랜덤으로 회사 선택
    const company = KOREAN_TECH_COMPANIES[Math.floor(Math.random() * KOREAN_TECH_COMPANIES.length)]

    return `Task: 한국 테크 기업 기술 면접관으로서 면접 질문을 생성하세요.

## 면접 설정
- **회사**: ${company.name}
- **면접관 스타일**: ${company.style}
- **회사 특화 관심사**: ${company.focus}
- **난이도**: 실무 적용과 비교 분석 질문. 장단점, 트레이드오프, 선택 기준 등. or 심층적 기술 이해와 문제 해결 질문. 최적화, 확장성, 장애 대응, 아키텍처 설계 등.

## 참고 자료 (지원자가 준비한 내용)
제목: ${title}
내용:
${content}

## 질문 생성 규칙

### 1. 질문 유형 (난이도별)
**easy (기본):**
- "~이란 무엇인가요?"
- "~의 동작 원리를 설명해주세요"
- "~는 왜 필요한가요?"

**medium (중급):**
- "~와 ~의 차이점은 무엇인가요?"
- "~를 사용할 때 고려해야 할 점은?"
- "~를 선택한 이유를 설명해주세요"
- "실제 프로젝트에서 ~를 어떻게 적용하셨나요?"

**hard (고급):**
- "대규모 트래픽 상황에서 ~를 어떻게 최적화하시겠어요?"
- "~의 한계점과 이를 극복하기 위한 방법은?"
- "~에서 장애가 발생했을 때 어떻게 대응하시겠어요?"
- "~의 아키텍처를 설계한다면 어떤 점을 고려하시겠어요?"

### 2. 꼬리 질문 (followUp)
면접에서 자연스럽게 이어질 수 있는 심화 질문 2-3개 준비

### 3. 평가 기준 (expectedPoints)
좋은 답변에 포함되어야 할 핵심 포인트 3-5개
- 각 포인트는 구체적이고 검증 가능해야 함
- 단순 키워드가 아닌 개념 설명 형태

### 4. 모범 답변 가이드 (answerGuide)
면접관이 기대하는 이상적인 답변의 방향성 (2-3문장)

## Output Format
Return ONLY valid JSON:
{
  "company": "${company.name}",
  "question": "면접 질문 (한국어, 존댓말)",
  "questionType": "concept | comparison | application | optimization | troubleshooting | architecture",
  "followUpQuestions": [
    "꼬리 질문 1",
    "꼬리 질문 2"
  ],
  "expectedPoints": [
    "핵심 포인트 1: 구체적 설명",
    "핵심 포인트 2: 구체적 설명",
    "핵심 포인트 3: 구체적 설명"
  ],
  "answerGuide": "이상적인 답변의 방향성 설명"
}

## 좋은 질문 예시
✅ "${company.name} 기술 면접"
- "저희 서비스에서 사용자 수가 급증했을 때, ${title} 관련해서 어떤 문제가 발생할 수 있고 어떻게 대응하시겠어요?"
- "${title}를 실제 프로젝트에 적용하신 경험이 있으신가요? 어떤 상황에서 사용하셨나요?"

❌ 피해야 할 질문
- 단순 정의만 묻는 질문
- 노트 내용을 그대로 암기해야 답할 수 있는 질문
- 예/아니오로 답할 수 있는 질문`
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