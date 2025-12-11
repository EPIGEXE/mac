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
- Questions must be answerable without seeing the original document
- Each answer must be a COMPLETE sentence (20-80 chars)
- Mix different question types for variety`
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