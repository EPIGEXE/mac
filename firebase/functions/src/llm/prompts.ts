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

2. **Extract key concepts** from EACH section:
   - importance levels:
     - "critical": Must-know for interviews, core to the topic
     - "high": Important supporting concepts
     - "medium": Nice-to-know details
   - types:
     - "term": Technical terminology (e.g., DOM, CSSOM, Reflow)
     - "process": Sequence/order that should be tested (e.g., rendering pipeline)
     - "comparison": Concepts that contrast with each other (e.g., Reflow vs Repaint)
     - "definition": Core definitions that explain what something IS

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

CRITICAL: Do NOT skip any section. Every section in the document must appear in the output.`
}

// ================================ Stage 2: 퀴즈 생성 프롬프트 (개념 기반) ================================

interface BlindQuizPromptParams {
    mode: 'word' | 'sentence'
    title: string
    content: string
    blankCount: number
    difficulty: DifficultyLevel
    extractedConcepts?: ExtractedConcepts
}

export function buildBlindQuizPrompt(params: BlindQuizPromptParams): string {
    const { mode, title, content, blankCount, extractedConcepts } = params

    const modeGuide =
        mode === 'word'
            ? 'Select individual technical keywords (1-3 words each)'
            : 'Select complete key sentences or important phrases'

    // Stage 2: 개념 정보가 있는 경우 (2단계 파이프라인)
    if (extractedConcepts) {
        // critical/high 개념 목록 (우선순위순)
        const priorityConcepts = extractedConcepts.concepts
            .filter(c => c.importance === 'critical' || c.importance === 'high')
            .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2 }
                return order[a.importance] - order[b.importance]
            })
            .map(c => `- "${c.term}" (${c.importance}, ${c.type})`)
            .join('\n')

        // critical 개념 목록
        const criticalConcepts = extractedConcepts.concepts
            .filter(c => c.importance === 'critical')
            .map(c => c.term)

        // 프로세스 정보
        const processInfo = extractedConcepts.processes.map(p =>
            `- ${p.name}: ${p.steps.join(' → ')}`
        ).join('\n')

        return `Task: Create an interview-prep fill-in-the-blank quiz based on extracted concepts.

## STRICT REQUIREMENTS

### 1. Concept Priority (NOT Section Coverage)
Focus on HIGH-VALUE technical concepts regardless of which section they belong to.
- Important sections may have 2-3 blanks
- Less important sections may have ZERO blanks - this is OK
- NEVER create a blank just to "cover" a section
- Prefer SPECIFIC terms over ABSTRACT category names

**Priority Concepts (use these first):**
${priorityConcepts}

### 2. Critical Concepts (MUST include ALL)
These terms MUST appear as blanks: ${criticalConcepts.join(', ')}

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
Example: "<script src='app.js' [BLANK]></script>"
Answer: "defer" ✅

**Type E: 결과/효과 빈칸 (Result/Effect)**
Test what happens or what is produced.
Example: "CSS 변경 시 레이아웃 재계산이 필요하면 [BLANK]가 발생한다"
Answer: "Reflow" ✅

### 3.5. FORBIDDEN ANSWERS (NEVER use these as blanks)
❌ Generic verbs: 조작, 수정, 변경, 생성, 삭제, 추가, 처리, 실행
❌ Generic adjectives: 중요한, 필수적인, 다양한
❌ Common words: 화면, 요소, 과정, 단계, 결과
❌ Section titles or category names: 폰트 최적화, 이미지 최적화, 리소스 힌트, CRP 최적화 전략
❌ Abstract nouns ending with: ~최적화, ~전략, ~방법, ~방식, ~하기
❌ Generic category names that are not specific technical terms
✅ ONLY use: Specific APIs, attributes, properties, acronyms, error/phenomenon names
   Good examples: defer, async, preload, prefetch, FOUC, font-display, loading="lazy", CRP, Reflow

### 4. Process Sequences Available
${processInfo}
For processes: Pick 1-2 INDIVIDUAL steps to test, NOT the entire sequence.

### 5. Answer Format Rules
- Each answer: 1-3 words ONLY (Korean or English term)
- NO long phrases, NO full sentences
- NO duplicate answers
- If a term appears multiple times, blank it only ONCE

### 6. Blank Distribution
Total blanks: ${blankCount}
- Focus on critical/high importance concepts
- Use at least 3 different blank TYPES (A, B, C, D, E)

## Original Document
Title: ${title}
Content:
${content}

## Output Format
- ${modeGuide}
- Preserve markdown: ##, ###, -, **, \`, \\n
- Hint: Korean → 초성, English → first 2-3 letters

Return ONLY valid JSON:
{
  "blindedContent": "markdown content with [BLANK_N] placeholders",
  "blanks": [
    { "id": "BLANK_1", "answer": "1-3 word answer", "hint": "hint", "position": 0, "section": "section name", "type": "process|definition|comparison|code|effect" }
  ]
}

## FINAL VALIDATION (CHECK ALL BEFORE RESPONDING)
□ All critical concepts included: ${criticalConcepts.join(', ')}
□ At least 3 different blank TYPES used
□ No answer is a section title or abstract category name
□ All answers are specific technical terms
□ No answer longer than 3 words
□ No duplicate answers
□ Total blanks = ${blankCount}`
    }

    // 기존 로직 (Stage 1 없이 직접 생성) - fallback
    return `Task: Create an interview-prep fill-in-the-blank quiz.

Context: This is for developer interview preparation. The quiz should test concepts that are commonly asked in technical interviews.

Note Title: ${title}
Note Content:
${content}

Requirements:
1. **Preserve Markdown format**: Keep the original markdown structure in blindedContent:
   - Headers: ## 제목, ### 소제목
   - Lists: - 항목, 1. 번호항목
   - Bold: **중요**, Italic: *강조*
   - Code: \`코드\`
   - Line breaks: \\n for new lines

2. **Rephrase the content**: Don't copy the original text exactly. Rewrite it in a slightly different way while preserving the meaning and markdown structure. This tests understanding, not memorization.

3. **Select ${blankCount} UNIQUE keywords**: Each blank must have a DIFFERENT answer. Never use the same word/term twice.
   - ${modeGuide}
   - Focus on: core concepts, technical terms, important mechanisms, key differences
   - Avoid: generic words, articles, prepositions, common verbs

4. **Interview-level difficulty**: Select terms that:
   - Interviewers commonly ask about
   - Demonstrate deep understanding of the topic
   - Are essential to explaining the concept correctly

5. **Diverse coverage**: Spread blanks across different aspects:
   - Definitions and core concepts
   - How it works (mechanisms)
   - Why it matters (benefits/purposes)
   - Related concepts or comparisons

6. **Hint format**:
   - Korean words: first consonant (초성) e.g., "클로저" → "ㅋㄹㅈ"
   - English words: first 2-3 letters e.g., "closure" → "clo"

Return ONLY valid JSON:
{
  "blindedContent": "## 주제\\n\\n[BLANK_1]은 중요한 개념입니다.\\n\\n### 특징\\n- 첫 번째 특징: [BLANK_2]\\n- 두 번째 특징",
  "blanks": [
    { "id": "BLANK_1", "answer": "unique_answer_1", "hint": "힌트", "position": 0 },
    { "id": "BLANK_2", "answer": "unique_answer_2", "hint": "hin", "position": 1 }
  ]
}

IMPORTANT: blindedContent MUST preserve markdown formatting (##, -, **, \`, \\n) from the original note.

CRITICAL: All ${blankCount} answers MUST be different from each other.`
}

// ================================ 서술형 질문 생성 프롬프트 ================================

interface EssayQuizPromptParams {
    title: string
    content: string
    difficulty: DifficultyLevel
}

export function buildEssayQuizPrompt(params: EssayQuizPromptParams): string {
    const { title, content, difficulty } = params

    const difficultyGuide = {
        easy: 'Ask about basic concepts and definitions.',
        medium: 'Ask about applications and comparisons.',
        hard: 'Ask about trade-offs, edge cases, and deep technical details.',
    }

    return `Task: Create ONE thoughtful interview question based on this note.

Difficulty: ${difficulty} - ${difficultyGuide[difficulty]}

Note Title: ${title}
Note Content:
${content}

Instructions:
1. Create an open-ended question testing deep understanding
2. The question should be answerable based on the note content
3. Define 3-5 key points a good answer should include
4. Question MUST be in Korean
5. Expected points should also be in Korean

Return ONLY valid JSON:
{
  "question": "질문 내용을 한국어로 작성하세요",
  "expectedPoints": ["포인트1", "포인트2", "포인트3"]
}`
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
    question: string
    expectedPoints: string[]
    userAnswer: string
}

export function buildEvaluateEssayPrompt(params: EvaluateEssayAnswerParams): string {
    const { question, expectedPoints, userAnswer } = params

    return `Task: Evaluate the user's essay answer.

Question: ${question}

Expected Points:
${expectedPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

User Answer:
${userAnswer}

Instructions:
1. Check which expected points the answer covers
2. Identify any important points that were missed
3. Give a score from 0-100
4. Provide constructive feedback in Korean

Return ONLY valid JSON:
{
  "isCorrect": boolean (true if score >= 60),
  "score": number (0-100),
  "matchedPoints": ["covered point 1", "covered point 2"],
  "missedPoints": ["missed point 1"],
  "feedback": "Constructive feedback in Korean"
}`
}

// ================================ 힌트 생성 프롬프트 ================================

interface HintPromptParams {
    answer: string
    hintLevel: number
    previousHints: string[]
}

export function buildHintPrompt(params: HintPromptParams): string {
    const { answer, hintLevel, previousHints } = params

    const levelGuide = {
        1: 'Give a vague category or context hint',
        2: 'Give more specific characteristics without revealing the answer',
        3: 'Give a strong hint that almost reveals the answer',
    }

    return `Task: Generate a hint for a quiz answer.

Answer (DO NOT reveal): ${answer}
Hint Level: ${hintLevel} - ${levelGuide[hintLevel as 1 | 2 | 3]}
${previousHints.length > 0 ? `Previous Hints Given: ${previousHints.join(', ')}` : ''}

Instructions:
1. Provide a helpful hint WITHOUT revealing the exact answer
2. Hint should be in Korean
3. Each level should be progressively more helpful

Return ONLY valid JSON:
{
  "hint": "Your hint in Korean"
}`
}
