/**
 * Study Mode 클라이언트 타입 정의
 */

// ================================ 학습 모드 ================================
export type StudyModeType = 'word' | 'sentence' | 'essay'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// ================================ 퀴즈 관련 ================================

/**
 * 빈칸 정보 (단어 모드 - 클라이언트에서 채점)
 * LLM은 핵심 키워드만 반환, 클라이언트에서 원본 콘텐츠의 해당 단어를 모두 blind 처리
 */
export interface BlankInfo {
    id: string           // 1, 2, 3, ... (숫자 문자열)
    answer: string       // 정답 키워드 (원본에서 이 단어를 모두 blind 처리)
    hint?: string        // 3지선다 힌트 (쉼표 구분: "option1, option2, option3")
}

/**
 * 문장 모드 질문 정보 (Q&A 형식 - 서버에서 LLM 평가)
 */
export interface SentenceQuestionInfo {
    id: string           // Q_1, Q_2, ...
    question: string     // 질문
    answer: string       // 정답 (설명형 문장)
    hint?: string        // 힌트 (핵심 키워드)
    keyPoints: string[]  // 정답에 포함되어야 할 핵심 포인트
}

/**
 * 서술형 모드 질문 정보 (한국 테크기업 면접 스타일)
 */
export interface EssayQuestionInfo {
    company: string                    // 면접 회사 (네이버, 카카오, 쿠팡, 토스, 당근)
    question: string                   // 면접 질문
    questionType: string               // concept | comparison | application | optimization | troubleshooting | architecture
    followUpQuestions: string[]        // 꼬리 질문들
    expectedPoints: string[]           // 평가 기준 (핵심 포인트)
    answerGuide: string                // 모범 답변 가이드
}

// ================================ API 요청/응답 ================================

/**
 * 퀴즈 생성 요청
 */
export interface GenerateQuizRequest {
    noteId: string
    noteContent: string
    noteTitle: string
    mode: StudyModeType
    blankCount?: number
}

/**
 * 퀴즈 생성 응답 (정답 포함)
 */
export interface GenerateQuizResponse {
    quizId: string
    mode: StudyModeType

    // word 모드 (LLM은 blanks만 반환, blindedContent는 클라이언트에서 생성)
    blanks?: BlankInfo[]

    // sentence 모드 (Q&A 형식)
    questions?: SentenceQuestionInfo[]

    // essay 모드 (한국 테크기업 면접 스타일)
    essay?: EssayQuestionInfo
}

/**
 * 서술형 답변 평가 요청 (한국 테크기업 면접 스타일)
 */
export interface EvaluateEssayRequest {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    answerGuide: string
    userAnswer: string
}

/**
 * 서술형 답변 평가 응답 (한국 테크기업 면접 스타일)
 */
export interface EvaluateEssayResponse {
    score: number
    grade: 'PASS' | 'BORDERLINE' | 'NEEDS_WORK'
    matchedPoints: string[]
    missedPoints: string[]
    strengths: string[]
    improvements: string[]
    feedback: string
    tip: string
}

/**
 * 문장 답변 일괄 평가 요청
 */
export interface EvaluateSentenceAnswersRequest {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}

/**
 * 문장 답변 평가 결과 (개별)
 */
export interface SentenceEvaluationResult {
    blankId: string
    isCorrect: boolean
    score: number
    matchedPoints: string[]
    missedPoints: string[]
    feedback: string
}

/**
 * 문장 답변 일괄 평가 응답
 */
export interface EvaluateSentenceAnswersResponse {
    results: SentenceEvaluationResult[]
    totalScore: number
    overallFeedback: string
}

/**
 * 힌트 요청
 */
export interface GetHintRequest {
    answer: string
    hintLevel: number
    previousHints: string[]
}

/**
 * 힌트 응답
 */
export interface GetHintResponse {
    hint: string
    remainingHints: number
}
