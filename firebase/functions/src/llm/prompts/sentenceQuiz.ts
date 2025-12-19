// ==================================== 문장 모드 문제 생성 프롬프트 ================================
interface SentenceQuizPromptParams {
    title: string
    content: string
}

// 문장 모드 문제 생성 프롬프트
export function buildSentenceQuizPrompt(params: SentenceQuizPromptParams): string {
    const { title, content } = params

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

1. **Create 5-10 interview-style questions**
   - Difficulty: 동작 원리나 비교를 묻는 질문 or 트레이드오프나 세부 메커니즘을 묻는 질문
   - Questions should be answerable if the user understands the topic
   - Focus on concepts frequently asked in interviews

2. **Question Types (use variety!) - 중복 금지!**

   **Type A: 비교 질문 (A vs B)**
   - "defer와 async의 차이점은?"
   - "Reflow와 Repaint는 어떻게 다른가요?"
   - Answer: 두 개념의 핵심 차이점

   **Type B: 조건/시점 질문 (When)**
   - "언제 Reflow가 발생하나요?"
   - "CORS preflight 요청이 발생하는 조건은?"
   - Answer: 특정 조건이나 시점 설명

   **Type C: 목적/이유 질문 (Why)**
   - "왜 Virtual DOM을 사용하나요?"
   - "CORS가 필요한 이유는?"
   - Answer: 목적이나 이점 설명

   **Type D: 해결/방법 질문 (How to)**
   - "CORS 에러를 해결하는 방법은?"
   - "Reflow를 최소화하려면 어떻게 해야 하나요?"
   - Answer: 구체적인 해결책이나 방법

   **Type E: 결과/영향 질문 (What happens)**
   - "JavaScript가 DOM을 수정하면 어떤 일이 발생하나요?"
   - "async 스크립트가 먼저 로드되면?"
   - Answer: 결과나 영향 설명

   ⚠️ IMPORTANT: 같은 개념에 대해 여러 유형의 질문을 만들지 마세요!
   - ❌ "CORS란?" + "CORS의 원리는?" (중복 - 답변이 비슷함)
   - ✅ "CORS 에러가 발생하는 조건은?" (Type B - 조건)
   - ✅ "CORS 에러를 해결하는 방법은?" (Type D - 해결)

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
✅ Q: "defer와 async의 차이점은?" (Type A - 비교)
   A: "defer는 순서를 보장하고, async는 먼저 로드된 순서로 실행됩니다"

✅ Q: "언제 Reflow가 발생하나요?" (Type B - 조건)
   A: "요소의 크기나 위치가 변경될 때 발생합니다"

✅ Q: "Virtual DOM을 사용하는 이유는?" (Type C - 목적)
   A: "실제 DOM 조작을 최소화하여 성능을 향상시키기 위해"

✅ Q: "CORS 에러를 해결하는 방법은?" (Type D - 해결)
   A: "서버에서 Access-Control-Allow-Origin 헤더를 설정합니다"

## BAD Examples:
❌ Q: "DOM이란?" + "DOM의 원리는?" (중복 - 같은 개념, 비슷한 답변)
❌ Q: "CORS란?" + "CORS를 설명하세요" (중복 - 표현만 다름)
❌ Q: "DOM이 뭔가요?" A: "DOM" (단어만 - 너무 짧음)
❌ Q: "다음 빈칸을 채우세요: [___]은 트리 구조이다" (빈칸 채우기 형식 X)

CRITICAL:
- 같은 개념에 대해 1개의 질문만 생성 (중복 금지!)
- Questions must be answerable without seeing the original document
- Each answer must be a COMPLETE sentence (20-80 chars)
- Use all 5 question types (A, B, C, D, E) for variety`
}

// ==================================== 문장 모드 답변 일괄 평가 프롬프트 ================================
interface EvaluateSentenceAnswersParams {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}

// 문장 모드 답변 일괄 평가 프롬프트
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