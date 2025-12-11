// LLM이 반환하는 타입

// ==================================== 개념 추출 요청에 대한 요청 타입 ====================================
// 개념 추출은 단어 문제, 문장 문제 시 문제 품질을 올리기 위해서 미리 핵심 단어를 뽑는 과정임
// 개념 추출 요청 타입

// 개념 추출 응답 타입
export interface ExtractedConcepts {
    concepts: Array<{
        term: string
        section: string
        importance: 'critical' | 'high' | 'medium'
        type: 'term' | 'process' | 'comparison' | 'definition'
        specificity: 'abstract' | 'concept' | 'implementation'
        context: string
    }>
}

// ==================================== 문제 요청에 대한 LLM 응답 타입 ====================================
// LLM 응답 타입 (키워드만 반환, blindedContent는 클라이언트에서 생성)
export interface WordQuizLLMResponse {
    blanks: {
        id: string
        answer: string
        hint: string
        section?: string
        type?: string
    }[]
}

// 문장 모드 응답 타입 (Q&A 형식)
export interface SentenceQuestion {
    id: string
    question: string // 질문
    answer: string // 정답 (설명형 문장)
    hint: string // 힌트 (핵심 키워드)
    keyPoints: string[] // 정답에 포함되어야 할 핵심 포인트
}

// 문장 모드 LLM 응답 타입 (Q&A 형식)
export interface SentenceQuizLLMResponse {
    questions: SentenceQuestion[]
}

// 서술형 모드 LLM 응답 타입 (한국 테크기업 면접 스타일)
export interface EssayQuizLLMResponse {
    company: string
    question: string
    questionType: 'concept' | 'comparison' | 'application' | 'optimization' | 'troubleshooting' | 'architecture'
    followUpQuestions: string[]
    expectedPoints: string[]
    answerGuide: string
}

// ==================================== 답변 평가 요청에 대한 요청 타입 및 LLM 응답 타입 ====================================
// 서술형 답변 평가 요청 타입 (한국 테크기업 면접 스타일)
export interface EvaluateEssayRequest {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    answerGuide: string
    userAnswer: string
}

// 서술형 평가 LLM 응답 타입
export interface EssayEvaluationResponse {
    score: number
    grade: 'PASS' | 'BORDERLINE' | 'NEEDS_WORK'
    matchedPoints: string[]
    missedPoints: string[]
    strengths: string[]
    improvements: string[]
    feedback: string
    tip: string
}

// 문장 모드 요청 타입
export interface EvaluateSentenceAnswersRequest {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}

// 문장 모드 LLM 응답 타입
export interface SentenceEvaluationResponse {
    results: Array<{
        blankId: string
        isCorrect: boolean
        score: number
        matchedPoints: string[]
        missedPoints: string[]
        feedback: string
    }>
    totalScore: number
    overallFeedback: string
}
