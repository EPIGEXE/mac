/**
 * LLM 프롬프트 템플릿
 */
import type { DifficultyLevel } from '../types/study'

// ================================ 시스템 프롬프트 ================================

export const SYSTEM_PROMPTS = {
    // Stage 1: 개념 추출 전용
    CONCEPT_EXTRACTOR: `You are a technical document analyzer specializing in identifying key concepts for interview preparation.
Your task is to analyze technical documents and extract:
1. Document structure (sections/topics)
2. Key concepts with importance levels
3. Processes/sequences that should be tested

Always respond in valid JSON format only.`,

    // Stage 2: 퀴즈 생성 (개념 기반)
    QUIZ_GENERATOR: `You are a technical interview coach helping developers prepare for interviews.
Your task is to create fill-in-the-blank quizzes that test core concepts.

Key principles:
1. Each blank must have a UNIQUE answer - never repeat the same answer
2. Focus on interview-essential concepts that interviewers frequently ask about
3. Rephrase the content slightly to prevent memorization - test understanding, not recall
4. Select diverse technical terms across different aspects of the topic
5. Ensure ALL sections are covered - no section should be skipped

Always respond in valid JSON format only.`,

    ESSAY_GENERATOR: `You are a technical interviewer for developer positions.
You create thoughtful interview questions based on technical notes.
Questions should test deep understanding, not just memorization.
Always respond in valid JSON format only.`,

    ANSWER_EVALUATOR: `You are evaluating quiz answers for a developer study application.
Be lenient with minor typos and accept common synonyms or abbreviations.
Korean/English variations of the same term should be accepted.
Always respond in valid JSON format only.`,

    HINT_GENERATOR: `You are a helpful study assistant providing hints for quiz questions.
Give progressive hints that guide without revealing the answer.
Always respond in valid JSON format only.`,
}

// ================================ Stage 1: 개념 추출 프롬프트 ================================

interface ConceptExtractionParams {
    title: string
    content: string
}

// Stage 1 응답 타입
export interface ExtractedConcepts {
    sections: Array<{
        name: string
        description: string
    }>
    concepts: Array<{
        term: string
        section: string
        importance: 'critical' | 'high' | 'medium'
        type: 'term' | 'process' | 'comparison' | 'definition'
        specificity: 'abstract' | 'concept' | 'implementation' // NEW: 구체성 레벨
        context: string
    }>
    processes: Array<{
        name: string
        steps: string[]
        section: string
    }>
}

export function buildConceptExtractionPrompt(params: ConceptExtractionParams): string {
    const { title, content } = params

    return `Task: Analyze this technical document and extract key concepts for quiz generation.

Document Title: ${title}
Document Content:
${content}

## Instructions

1. **Identify ALL sections**: List every distinct topic/section in the document. Do NOT skip any section.

2. **Extract key concepts** (MAXIMUM 10 concepts total):
   - LIMIT: Extract only the TOP 10 most important concepts for interviews
   - Prioritize: critical > high > medium
   - Focus on specificity: concept/implementation over abstract
   - importance levels:
     - "critical": Must-know for interviews (limit to 3-5 max)
     - "high": Important supporting concepts
     - "medium": Nice-to-know details (avoid if possible)
   - types:
     - "term": Technical terminology (e.g., DOM, CSSOM, Reflow)
     - "process": Sequence/order that should be tested (e.g., rendering pipeline)
     - "comparison": Concepts that contrast with each other (e.g., Reflow vs Repaint)
     - "definition": Core definitions that explain what something IS
   - **specificity levels** (NEW - IMPORTANT):
     - "abstract": Category names, optimization strategies, general methods (e.g., "폰트 최적화", "이미지 최적화", "성능 개선")
       → These should NOT be used as quiz blanks
     - "concept": Core technical concepts, acronyms, phenomenon names (e.g., "CRP", "FOUC", "Reflow", "Repaint")
       → These are IDEAL for quiz blanks
     - "implementation": Specific APIs, attributes, properties, code syntax (e.g., "defer", "async", "preload", "font-display: swap")
       → These are IDEAL for quiz blanks

3. **Identify processes/sequences**: Any ordered steps or pipelines mentioned.

Return ONLY valid JSON:
{
  "sections": [
    { "name": "섹션명", "description": "섹션 설명" }
  ],
  "concepts": [
    {
      "term": "개념명",
      "section": "해당 섹션명",
      "importance": "critical|high|medium",
      "type": "term|process|comparison|definition",
      "specificity": "abstract|concept|implementation",
      "context": "이 개념이 등장하는 문맥 (한 문장)"
    }
  ],
  "processes": [
    {
      "name": "프로세스명",
      "steps": ["step1", "step2", "step3"],
      "section": "해당 섹션명"
    }
  ]
}

## SPECIFICITY EXAMPLES
✅ concept/implementation (GOOD for blanks):
  - "defer" (implementation) - specific HTML attribute
  - "FOUC" (concept) - specific phenomenon name
  - "preload" (implementation) - specific resource hint
  - "Reflow" (concept) - specific rendering concept

❌ abstract (BAD for blanks):
  - "폰트 최적화" (abstract) - general category
  - "이미지 최적화" (abstract) - general category
  - "CRP 최적화 전략" (abstract) - general strategy
  - "리소스 힌트 사용" (abstract) - general method

CRITICAL: Do NOT skip any section. Every section in the document must appear in the output.
CRITICAL: Correctly classify specificity - abstract concepts should NOT become quiz blanks.
CRITICAL: MAXIMUM 10 concepts total. Only extract the most interview-essential concepts.`
}

// ================================ Stage 2: 퀴즈 생성 프롬프트 (개념 기반) ================================

interface BlindQuizPromptParams {
    mode: 'word' | 'sentence'
    title: string
    content: string
    blankCount: number
    difficulty: DifficultyLevel
    extractedConcepts: ExtractedConcepts
}

export function buildBlindQuizPrompt(params: BlindQuizPromptParams): string {
    const { mode, title, content, blankCount, extractedConcepts } = params

    const modeGuide =
        mode === 'word'
            ? 'Select individual technical keywords (1-3 words each)'
            : 'Select complete key sentences or important phrases'

    // Stage 2: 개념 정보가 있는 경우 (2단계 파이프라인)
    // 방안 1: specificity 기반 필터링 - abstract 제외
    const quizWorthy = extractedConcepts.concepts
        .filter((c) => c.specificity !== 'abstract') // abstract 제외
        .filter((c) => c.importance === 'critical' || c.importance === 'high')

    // 개념 수 제한: blankCount의 1.5배 또는 최대 10개 중 작은 값
    const maxConcepts = Math.min(10, Math.ceil(blankCount * 1.5))

    // critical/high + non-abstract 개념 목록 (우선순위순, 최대 maxConcepts개)
    const sortedConcepts = quizWorthy.sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2 }
        return order[a.importance] - order[b.importance]
    })
    const limitedConcepts = sortedConcepts.slice(0, maxConcepts)

    const priorityConcepts = limitedConcepts
        .map((c) => `- "${c.term}" (${c.importance}, ${c.type}, ${c.specificity})`)
        .join('\n')

    // critical 개념 목록 (limitedConcepts 기반 - 제한된 개념 내에서만)
    const criticalConcepts = limitedConcepts.filter((c) => c.importance === 'critical').map((c) => c.term)

    // 제외된 abstract 개념 목록 (LLM에게 명시적으로 알려줌)
    const excludedAbstract = extractedConcepts.concepts.filter((c) => c.specificity === 'abstract').map((c) => c.term)

    // 프로세스 정보
    const processInfo = extractedConcepts.processes.map((p) => `- ${p.name}: ${p.steps.join(' → ')}`).join('\n')

    return `Task: Create an interview-prep fill-in-the-blank quiz based on extracted concepts.

## STRICT REQUIREMENTS

### 1. Concept Priority (NOT Section Coverage)
Focus on HIGH-VALUE technical concepts regardless of which section they belong to.
- Important sections may have 2-3 blanks
- Less important sections may have ZERO blanks - this is OK
- NEVER create a blank just to "cover" a section
- Prefer SPECIFIC terms over ABSTRACT category names

**Priority Concepts (use these first - specificity: concept/implementation only):**
${priorityConcepts}

**EXCLUDED - DO NOT USE AS BLANKS (specificity: abstract):**
${excludedAbstract.length > 0 ? excludedAbstract.map((t) => `❌ "${t}"`).join('\n') : '(none)'}

### 2. Critical Concepts (MUST include ALL)
These terms MUST appear as blanks: ${criticalConcepts.join(', ') || '(none - all critical concepts were abstract)'}

### 3. BLANK TYPES - Use DIVERSE question types (IMPORTANT!)
You MUST use at least 3 different blank types from below:

**Type A: 순서 빈칸 (Process Step)**
Test ONE step in a sequence. The answer is a single step.
Example: "렌더링 순서: DOM 생성 → [BLANK] 생성 → 렌더 트리 생성"
Answer: "CSSOM" ✅ (NOT the whole sequence)

**Type B: 정의 빈칸 (Definition)**
Test what something IS or means.
Example: "[BLANK]은 HTML 문서의 계층 구조를 객체 모델로 표현한 것이다"
Answer: "DOM" ✅

**Type C: 비교 빈칸 (Comparison)**
Test differences between related concepts.
Example: "[BLANK]은 레이아웃을 다시 계산하고, Repaint는 화면을 다시 그린다"
Answer: "Reflow" ✅

**Type D: 코드/속성 빈칸 (Code/Attribute)**
Test specific code syntax, attributes, or API names.
Example: \`<script src='app.js' [BLANK]></script>\`
Answer: "defer" ✅

**Type E: 결과/효과 빈칸 (Result/Effect)**
Test what happens or what is produced.
Example: "CSS 변경 시 레이아웃 재계산이 필요하면 [BLANK]가 발생한다"
Answer: "Reflow" ✅

### 3.5 QUESTION VARIATION STRATEGIES (방안 2: 변형 전략)
DO NOT just copy the original text with blanks. USE these variation strategies:

**Strategy 1: 역순 질문 (Reverse Question)**
Instead of: "defer를 사용하면 HTML 파싱 완료 후 실행된다"
Write: "[BLANK]를 사용하면 HTML 파싱 완료 후 스크립트가 실행된다"
→ Tests if user knows WHICH attribute has this effect

**Strategy 2: 비교 질문 (Comparison Question)**
Instead of: "defer는 순서를 보장한다"
Write: "[BLANK]는 실행 순서를 보장하지만, async는 순서를 보장하지 않는다"
→ Tests understanding of differences

**Strategy 3: 코드 완성 (Code Completion)**
Instead of: "preload를 사용하여 리소스를 미리 로드"
Write: \`<link rel="[BLANK]" href="font.woff2" as="font">\`
→ Tests practical coding knowledge

**Strategy 4: 결과 추론 (Result Inference)**
Instead of: "FOUC는 스타일 없이 콘텐츠가 보이는 현상"
Write: "CSS 로딩이 지연되면 스타일 없이 콘텐츠가 잠깐 보이는 [BLANK] 현상이 발생한다"
→ Tests if user knows the phenomenon name

**Strategy 5: 원인 추론 (Cause Inference)**
Instead of: "Reflow는 레이아웃을 다시 계산한다"
Write: "요소의 크기나 위치가 변경되면 브라우저는 [BLANK]를 수행해야 한다"
→ Tests understanding of when/why something happens

USE AT LEAST 3 DIFFERENT STRATEGIES in your quiz!

### 4. FORBIDDEN ANSWERS (NEVER use these as blanks)
❌ Generic verbs: 조작, 수정, 변경, 생성, 삭제, 추가, 처리, 실행
❌ Generic adjectives: 중요한, 필수적인, 다양한
❌ Common words: 화면, 요소, 과정, 단계, 결과
❌ Section titles or category names: 폰트 최적화, 이미지 최적화, 리소스 힌트, CRP 최적화 전략
❌ Abstract nouns ending with: ~최적화, ~전략, ~방법, ~방식, ~하기
❌ Abstract concepts marked above in EXCLUDED list
✅ ONLY use: Specific APIs, attributes, properties, acronyms, error/phenomenon names
   Good examples: defer, async, preload, prefetch, font-display, loading="lazy", CRP, Reflow

### 5. Process Sequences Available
${processInfo || '(no processes extracted)'}
For processes: Pick 1-2 INDIVIDUAL steps to test, NOT the entire sequence.

### 6. Answer Format Rules
- Each answer: 1-3 words ONLY (Korean or English term)
- NO long phrases, NO full sentences
- NO duplicate answers
- If a term appears multiple times, blank it only ONCE

### 7. Blank Distribution
Total blanks: ${blankCount}
- Focus on critical/high importance concepts with specificity: concept/implementation
- Use at least 3 different blank TYPES (A, B, C, D, E)
- Use at least 3 different VARIATION STRATEGIES (1, 2, 3, 4, 5)

## Original Document
Title: ${title}
Content:
${content}

## Output Format
- ${modeGuide}
- Return ONLY the keywords to be blanked (client will apply them to original content)
- Hint: Korean → 초성, English → first 2-3 letters

Return ONLY valid JSON:
{
  "blanks": [
    { "id": "1", "answer": "keyword (1-3 words)", "hint": "hint text", "section": "section name", "type": "process|definition|comparison|code|effect" }
  ]
}

NOTE: Do NOT include blindedContent. The client will find and replace these keywords in the original document.

## FINAL VALIDATION (CHECK ALL BEFORE RESPONDING)
□ All critical concepts included: ${criticalConcepts.join(', ') || '(none)'}
□ NO abstract concepts used as blanks
□ At least 3 different blank TYPES used
□ At least 3 different VARIATION STRATEGIES used
□ No answer is a section title or abstract category name
□ All answers are specific technical terms (specificity: concept/implementation)
□ No answer longer than 3 words
□ No duplicate answers
□ Total blanks = ${blankCount}`
}

// ================================ 서술형 질문 생성 프롬프트 ================================

interface EssayQuizPromptParams {
    title: string
    content: string
    difficulty: DifficultyLevel
}

// 한국 테크 기업 면접관 스타일
const KOREAN_TECH_COMPANIES = [
    { name: '네이버', style: '기술적 깊이와 확장성에 중점', focus: '대규모 트래픽 처리, 검색 최적화' },
    { name: '카카오', style: '실무 적용과 문제 해결 능력 중시', focus: '사용자 경험, 서비스 안정성' },
    { name: '쿠팡', style: '성능 최적화와 효율성 강조', focus: '이커머스 특화, 배송/물류 시스템' },
    { name: '토스', style: '클린 코드와 아키텍처 설계 중시', focus: '금융 서비스, 보안, 안정성' },
    { name: '당근', style: '사용자 관점과 실용적 해결책 강조', focus: '로컬 서비스, 커뮤니티' },
]

export function buildEssayQuizPrompt(params: EssayQuizPromptParams): string {
    const { title, content, difficulty } = params

    // 랜덤으로 회사 선택
    const company = KOREAN_TECH_COMPANIES[Math.floor(Math.random() * KOREAN_TECH_COMPANIES.length)]

    const difficultyGuide = {
        easy: '기본 개념 이해도를 확인하는 질문. 정의, 동작 원리, 기본 사용법 등.',
        medium: '실무 적용과 비교 분석 질문. 장단점, 트레이드오프, 선택 기준 등.',
        hard: '심층적 기술 이해와 문제 해결 질문. 최적화, 확장성, 장애 대응, 아키텍처 설계 등.',
    }

    return `Task: 한국 테크 기업 기술 면접관으로서 면접 질문을 생성하세요.

## 면접 설정
- **회사**: ${company.name}
- **면접관 스타일**: ${company.style}
- **회사 특화 관심사**: ${company.focus}
- **난이도**: ${difficulty} - ${difficultyGuide[difficulty]}

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
- 단순 정의만 묻는 질문 (난이도가 easy가 아닌 경우)
- 노트 내용을 그대로 암기해야 답할 수 있는 질문
- 예/아니오로 답할 수 있는 질문`
}

// ================================ 답변 평가 프롬프트 ================================

interface EvaluateBlankAnswerParams {
    correctAnswer: string
    userAnswer: string
}

export function buildEvaluateBlankPrompt(params: EvaluateBlankAnswerParams): string {
    const { correctAnswer, userAnswer } = params

    return `Task: Evaluate if the user's answer is correct.

Correct Answer: ${correctAnswer}
User Answer: ${userAnswer}

Rules:
- Allow minor typos (1-2 characters difference)
- Allow common synonyms or abbreviations (e.g., "JS" = "JavaScript")
- Korean/English variations are acceptable (e.g., "클로저" = "closure")
- Case insensitive for English
- Ignore extra whitespace

Return ONLY valid JSON:
{
  "isCorrect": true or false,
  "feedback": "Brief explanation if wrong, in Korean. Empty string if correct."
}`
}

interface EvaluateEssayAnswerParams {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    answerGuide: string
    userAnswer: string
}

export function buildEvaluateEssayPrompt(params: EvaluateEssayAnswerParams): string {
    const { company, question, questionType, expectedPoints, answerGuide, userAnswer } = params

    return `Task: 한국 테크 기업 기술 면접관으로서 지원자의 답변을 평가하세요.

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

### 1. 점수 산정 (0-100)
- **90-100**: 핵심 포인트 모두 충족 + 추가적인 인사이트나 실무 경험 언급
- **80-89**: 핵심 포인트 대부분 충족 + 논리적 설명
- **70-79**: 핵심 포인트 절반 이상 충족 + 기본 이해도 확인
- **60-69**: 기본 개념은 이해하나 깊이 부족
- **50-59**: 부분적 이해, 중요한 포인트 누락
- **0-49**: 오개념이 있거나 질문 의도 파악 못함

### 2. 면접관 피드백 스타일
- 긍정적인 부분 먼저 언급
- 부족한 점은 건설적으로 제시
- 실제 면접에서 줄 수 있는 조언 포함
- 한국어 존댓말 사용

### 3. 강점/약점 분석
- **strengths**: 답변에서 잘한 부분 (1-3개)
- **improvements**: 보완하면 좋을 부분 (1-3개)

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
  "feedback": "면접관의 종합 피드백 (2-4문장, 한국어 존댓말)",
  "tip": "실제 면접에서 참고할 수 있는 팁 (1문장)"
}`
}

// ================================ 문장 모드 전용 프롬프트 ================================

interface SentenceQuizPromptParams {
    title: string
    content: string
    blankCount: number
    difficulty: DifficultyLevel
}

// 문장 모드 응답 타입 (Q&A 형식)
export interface SentenceQuestion {
    id: string
    question: string // 질문
    answer: string // 정답 (설명형 문장)
    hint: string // 힌트 (핵심 키워드)
    keyPoints: string[] // 정답에 포함되어야 할 핵심 포인트
}

export function buildSentenceQuizPrompt(params: SentenceQuizPromptParams): string {
    const { title, content, blankCount, difficulty } = params

    const difficultyGuide = {
        easy: '기본 정의나 개념을 묻는 질문',
        medium: '동작 원리나 비교를 묻는 질문',
        hard: '트레이드오프나 세부 메커니즘을 묻는 질문',
    }

    return `Task: Create Q&A format quiz questions for developer interview preparation.

## IMPORTANT: This is SENTENCE mode (Q&A format)
- Create QUESTIONS that require EXPLANATION as answers
- Answers should be complete sentences (20-80 characters)
- Questions should test understanding of key concepts from the document
- DO NOT show the original document to the user (원본 노트 비공개)

## Document (for reference only - user will NOT see this)
Title: ${title}
Content:
${content}

## Requirements

1. **Create ${blankCount} interview-style questions**
   - Difficulty: ${difficulty} - ${difficultyGuide[difficulty]}
   - Questions should be answerable if the user understands the topic
   - Focus on concepts frequently asked in interviews

2. **Question Types (use variety!):**

   **Type A: 정의 질문 (Definition)**
   - "DOM이란 무엇인가요?"
   - "Reflow가 무엇인지 설명하세요."
   - Answer: Complete definition (20-50 chars)

   **Type B: 비교 질문 (Comparison)**
   - "defer와 async의 차이점은 무엇인가요?"
   - "Reflow와 Repaint의 차이를 설명하세요."
   - Answer: Key difference explanation

   **Type C: 원리 질문 (Mechanism)**
   - "브라우저 렌더링 과정을 순서대로 설명하세요."
   - "CSSOM이 생성되는 과정은?"
   - Answer: Process/mechanism explanation

   **Type D: 이유 질문 (Reason/Purpose)**
   - "왜 CSSOM이 필요한가요?"
   - "defer를 사용하는 이유는?"
   - Answer: Purpose/benefit explanation

   **Type E: 상황 질문 (When/What happens)**
   - "언제 Reflow가 발생하나요?"
   - "CSS 변경 시 어떤 일이 일어나나요?"
   - Answer: Condition/result explanation

3. **Answer Format:**
   - 20-80 characters (complete sentence)
   - Self-contained explanation (원본 없이 이해 가능)
   - Must be verifiable against the document content

4. **keyPoints (2-4 per question):**
   - Core concepts the answer MUST mention
   - User's answer will be evaluated against these
   - Example:
     Q: "DOM이란 무엇인가요?"
     A: "HTML 문서의 구조를 객체 모델로 표현한 트리 구조"
     keyPoints: ["HTML", "객체 모델", "트리 구조"]

5. **Hint:**
   - Give ONE keyword or short phrase from the answer
   - Should guide without revealing the full answer
   - Example: "객체 모델" or "트리 구조"

## Output Format
Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "Q_1",
      "question": "DOM이란 무엇인가요?",
      "answer": "HTML 문서의 구조를 객체 모델로 표현한 트리 구조입니다",
      "hint": "객체 모델",
      "keyPoints": ["HTML", "객체 모델", "트리 구조"]
    },
    {
      "id": "Q_2",
      "question": "Reflow와 Repaint의 차이점은 무엇인가요?",
      "answer": "Reflow는 레이아웃을 재계산하고, Repaint는 시각적 요소만 다시 그립니다",
      "hint": "레이아웃 vs 시각적",
      "keyPoints": ["Reflow", "레이아웃 계산", "Repaint", "시각적 요소"]
    }
  ]
}

## GOOD Examples:
✅ Q: "브라우저 렌더링의 첫 번째 단계는?"
   A: "HTML을 파싱하여 DOM 트리를 생성합니다" (구체적 설명)

✅ Q: "defer 속성을 사용하면 스크립트는 언제 실행되나요?"
   A: "HTML 파싱이 완료된 후 순서대로 실행됩니다" (동작 설명)

✅ Q: "CSSOM이 필요한 이유는?"
   A: "CSS 스타일 정보를 트리 구조로 관리하여 렌더 트리 생성에 사용하기 위해" (목적 설명)

## BAD Examples:
❌ Q: "DOM이 뭔가요?" A: "DOM" (단어만 - 너무 짧음)
❌ Q: "다음 빈칸을 채우세요: [___]은 트리 구조이다" (빈칸 채우기 형식 X)
❌ Q: "HTML 파싱 및 DOM 트리 생성에 대해 설명하세요" (너무 넓은 범위)

CRITICAL:
- Use "Q_1, Q_2" format for ids (NOT "BLANK_1")
- Questions must be answerable without seeing the original document
- Each answer must be a COMPLETE sentence (20-80 chars)
- Mix different question types for variety`
}

// 문장 모드 답변 일괄 평가 프롬프트
interface EvaluateSentenceAnswersParams {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}

export function buildEvaluateSentenceAnswersPrompt(params: EvaluateSentenceAnswersParams): string {
    const { blanks } = params

    const blanksInfo = blanks
        .map(
            (b, i) => `
### 문제 ${i + 1} (${b.id})
정답: ${b.correctAnswer}
핵심 포인트: ${b.keyPoints.join(', ')}
사용자 답변: ${b.userAnswer}
`
        )
        .join('\n')

    return `Task: Evaluate multiple sentence-completion answers.

You are evaluating answers for a developer study quiz. Be lenient but accurate.

## Answers to Evaluate
${blanksInfo}

## Evaluation Rules
1. **Focus on meaning, not exact wording**
   - Synonyms and paraphrasing are acceptable
   - Korean/English variations are OK
   - Order of concepts doesn't matter

2. **Check keyPoints coverage**
   - The answer should mention or imply most keyPoints
   - Missing 1 keyPoint out of 3-4 is still acceptable
   - Completely missing a critical concept = incorrect

3. **Be lenient with:**
   - Minor typos
   - Different phrasing with same meaning
   - Additional correct information

4. **Mark incorrect if:**
   - Answer is factually wrong
   - Missing more than half of keyPoints
   - Answer describes something completely different

## Output Format
Return ONLY valid JSON:
{
  "results": [
    {
      "blankId": "BLANK_1",
      "isCorrect": true,
      "score": 85,
      "matchedPoints": ["HTML", "객체 모델"],
      "missedPoints": ["계층 구조"],
      "feedback": "정확합니다! 계층 구조에 대한 언급이 있으면 더 완벽한 답변이 됩니다."
    }
  ],
  "totalScore": 85,
  "overallFeedback": "전반적으로 잘 이해하고 있습니다. 몇 가지 세부사항을 보완하면 좋겠습니다."
}`
}
