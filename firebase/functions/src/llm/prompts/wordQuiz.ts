import { ExtractedConcepts } from "../../types/llmResponse"

interface WordQuizPromptParams {
    title: string
    content: string
    extractedConcepts: ExtractedConcepts
}

export function buildWordQuizPrompt(params: WordQuizPromptParams): string {
    const { title, content, extractedConcepts } = params

    // Stage 2: 개념 정보가 있는 경우 (2단계 파이프라인)
    // 방안 1: specificity 기반 필터링 - abstract 제외
    const quizWorthy = extractedConcepts.concepts
        .filter((c) => c.specificity !== 'abstract') // abstract 제외
        .filter((c) => c.importance === 'critical' || c.importance === 'high')

    // 개념 수 제한: 최대 10개
    const maxConcepts = 10

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

### 5. Answer Format Rules
- Each answer: 1-3 words ONLY (Korean or English term)
- NO long phrases, NO full sentences
- NO duplicate answers
- If a term appears multiple times, blank it only ONCE

### 6. Blank Distribution
Total blanks: 10
- Focus on critical/high importance concepts with specificity: concept/implementation
- Use at least 3 different blank TYPES (A, B, C, D, E)
- Use at least 3 different VARIATION STRATEGIES (1, 2, 3, 4, 5)

## Original Document
Title: ${title}
Content:
${content}

## Output Format
- Select individual technical keywords (1-3 words each)
- Return ONLY the keywords to be blanked (client will apply them to original content)
- Hint: Provide 3 multiple choice options as a comma-separated string (including the correct answer)
  - One option MUST be the correct answer
  - Two options should be plausible but incorrect distractors (related concepts from the same domain)
  - Shuffle the order randomly (correct answer should NOT always be first)
  - Format: "option1, option2, option3"

Return ONLY valid JSON:
{
  "blanks": [
    { "id": "1", "answer": "keyword", "hint": "option1, option2, option3", "section": "section name", "type": "process|definition|comparison|code|effect" }
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
□ Total blanks = 10`
}