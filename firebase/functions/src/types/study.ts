/**
 * Study Mode Firestore 스키마 타입 정의
 */
import { Timestamp } from 'firebase-admin/firestore'

// ================================ 학습 모드 ================================
export type StudyModeType = 'word' | 'sentence' | 'essay'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

// ================================ 퀴즈 관련 ================================

/**
 * 빈칸 정보 (word/sentence 모드)
 */
export interface BlankInfo {
    id: string           // BLANK_1, BLANK_2, ...
    answer: string       // 정답
    hint?: string        // 힌트 (첫 글자 등)
    position: number     // 원본 텍스트에서의 위치 (순서)
}

/**
 * 퀴즈 데이터 (Firestore: quizzes 컬렉션)
 */
export interface Quiz {
    id: string
    noteId: string
    mode: StudyModeType
    difficulty: DifficultyLevel
    createdAt: Timestamp

    // word/sentence 모드
    originalContent?: string   // 원본 콘텐츠
    blindedContent?: string    // [BLANK_1] 등으로 가려진 콘텐츠
    blanks?: BlankInfo[]       // 빈칸 정보 배열

    // essay 모드
    question?: string          // 생성된 질문
    expectedPoints?: string[]  // 예상 답변 포인트
}

// ================================ 학습 세션 ================================

/**
 * 학습 세션 (Firestore: studySessions 컬렉션)
 */
export interface StudySession {
    id: string
    userId: string
    startedAt: Timestamp
    endedAt?: Timestamp
    mode: StudyModeType
    difficulty: DifficultyLevel
    noteIds: string[]          // 학습 대상 노트 ID 목록
    status: SessionStatus
    totalQuestions: number
    correctCount: number
    wrongCount: number
    hintsUsed: number
}

// ================================ 학습 기록 ================================

/**
 * 개별 학습 기록 (Firestore: studyRecords 컬렉션)
 */
export interface StudyRecord {
    id: string
    sessionId: string
    userId: string
    noteId: string
    quizId: string
    mode: StudyModeType

    // 빈칸 문제
    blankId?: string
    correctAnswer?: string

    // 서술형 문제
    question?: string

    // 공통
    userAnswer: string
    isCorrect: boolean
    feedback?: string
    hintsUsed: number

    // 시간
    createdAt: Timestamp       // 문제 생성 시간
    answeredAt: Timestamp      // 답변 시간
    timeSpentMs: number        // 소요 시간 (ms)
}

// ================================ 약점 분석 ================================

/**
 * 약점 포인트 (Firestore: weakPoints 컬렉션)
 */
export interface WeakPoint {
    id: string
    userId: string
    noteId: string
    keyword?: string           // 틀린 키워드 (word 모드)
    concept?: string           // 틀린 개념 (sentence/essay 모드)
    wrongCount: number         // 틀린 횟수
    correctCount: number       // 맞은 횟수 (복습 후)
    lastWrongAt: Timestamp     // 마지막으로 틀린 시간
    lastCorrectAt?: Timestamp  // 마지막으로 맞은 시간
    isResolved: boolean        // 해결 여부 (3회 연속 정답 시)
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
}

/**
 * 답변 평가 요청
 */
export interface EvaluateAnswerRequest {
    quizId: string
    blankId?: string           // word/sentence 모드
    userAnswer: string
}

/**
 * 답변 평가 응답
 */
export interface EvaluateAnswerResponse {
    isCorrect: boolean
    feedback?: string
    correctAnswer?: string

    // essay 모드 추가 정보
    score?: number             // 0-100
    matchedPoints?: string[]   // 맞은 포인트
    missedPoints?: string[]    // 놓친 포인트
}

/**
 * 힌트 요청
 */
export interface GetHintRequest {
    quizId: string
    blankId: string
    hintLevel: number          // 1, 2, 3 (단계별 힌트)
}

/**
 * 힌트 응답
 */
export interface GetHintResponse {
    hint: string
    remainingHints: number
}
