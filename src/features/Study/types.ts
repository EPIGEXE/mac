/**
 * Study Mode 클라이언트 타입 정의
 */

// ================================ 학습 모드 ================================
export type StudyModeType = 'word' | 'sentence' | 'essay'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// ================================ 퀴즈 관련 ================================

/**
 * 빈칸 정보 (정답 포함 - 클라이언트에서 채점)
 */
export interface BlankInfo {
    id: string           // BLANK_1, BLANK_2, ...
    answer: string       // 정답
    hint?: string        // 힌트 (첫 글자 등)
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

    // word/sentence 모드
    blindedContent?: string
    blanks?: BlankInfo[]

    // essay 모드
    question?: string
    expectedPoints?: string[]
}

/**
 * 서술형 답변 평가 요청
 */
export interface EvaluateEssayRequest {
    question: string
    expectedPoints: string[]
    userAnswer: string
}

/**
 * 서술형 답변 평가 응답
 */
export interface EvaluateEssayResponse {
    isCorrect: boolean
    score: number
    matchedPoints: string[]
    missedPoints: string[]
    feedback: string
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
