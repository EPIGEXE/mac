/**
 * 학습 기록 스키마
 * - 모드별 상세 기록 지원 (word, sentence, essay)
 * - 취약점 모드별 분리
 * - 세션 정보 강화
 */

// ============================================================================
// 공통 타입
// ============================================================================

export type StudyModeType = 'word' | 'sentence' | 'essay';
export type NoteType = 'system' | 'user';

// ============================================================================
// StudyRecord - 모드별 학습 기록
// ============================================================================

/** 공통 필드 */
interface StudyRecordBase {
    id: string;
    noteId: string;
    noteType: NoteType;
    sessionId: string;
    mode: StudyModeType;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    score: number;              // 0-100
    duration: number;           // 초
    createdAt: number;
    completedAt: number | null;
}

/** 단어 모드 - 빈칸 채우기 상세 */
export interface WordBlankDetail {
    blankId: string;
    answer: string;             // 정답
    userAnswer: string;         // 사용자 입력
    isCorrect: boolean;
    hint: string;
}

export interface WordStudyRecord extends StudyRecordBase {
    mode: 'word';
    details: {
        blanks: WordBlankDetail[];
    };
}

/** 문장 모드 - Q&A 상세 */
export interface SentenceQuestionDetail {
    questionId: string;
    question: string;
    answer: string;             // 모범 답안
    userAnswer: string;
    isCorrect: boolean;
    score: number;              // 개별 점수
    keyPoints: string[];
    matchedPoints: string[];
    missedPoints: string[];
    feedback: string;
}

export interface SentenceStudyRecord extends StudyRecordBase {
    mode: 'sentence';
    details: {
        questions: SentenceQuestionDetail[];
        totalScore: number;
        overallFeedback: string;
    };
}

/** 서술형 모드 - 면접 상세 */
export interface EssayStudyRecord extends StudyRecordBase {
    mode: 'essay';
    details: {
        company: string;
        question: string;
        questionType: string;
        userAnswer: string;
        score: number;
        grade: 'PASS' | 'BORDERLINE' | 'NEEDS_WORK';
        matchedPoints: string[];
        missedPoints: string[];
        strengths: string[];
        improvements: string[];
        feedback: string;
        tip: string;
    };
}

/** Union 타입 */
export type StudyRecord = WordStudyRecord | SentenceStudyRecord | EssayStudyRecord;

// ============================================================================
// WeakPoint - 모드별 취약점
// ============================================================================

/** 공통 필드 */
interface WeakPointBase {
    id: string;
    noteId: string;
    noteType: NoteType;
    mode: StudyModeType;
    wrongCount: number;         // 틀린 횟수
    lastWrongAt: number;
    isResolved: boolean;        // 사용자가 수동으로 해제
    createdAt: number;
}

/** 단어 모드 취약점 */
export interface WordWeakPoint extends WeakPointBase {
    mode: 'word';
    keyword: string;            // 틀린 키워드
    hint: string;
    wrongAnswers: string[];     // 틀린 답변 이력 (최근 5개)
}

/** 문장 모드 취약점 */
export interface SentenceWeakPoint extends WeakPointBase {
    mode: 'sentence';
    questionId: string;
    question: string;
    correctAnswer: string;
    keyPoints: string[];
    lastMissedPoints: string[]; // 마지막 놓친 포인트
}

/** 서술형 모드 취약점 */
export interface EssayWeakPoint extends WeakPointBase {
    mode: 'essay';
    company: string;
    question: string;
    questionType: string;
    expectedPoints: string[];
    lastMissedPoints: string[]; // 마지막 놓친 포인트
}

/** Union 타입 */
export type WeakPoint = WordWeakPoint | SentenceWeakPoint | EssayWeakPoint;

// ============================================================================
// StudySession - 학습 세션
// ============================================================================

/** 세션 요약 */
export interface SessionSummary {
    totalNotes: number;
    completedNotes: number;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    averageScore: number;
}

/** 학습 세션 */
export interface StudySession {
    id: string;
    mode: StudyModeType;
    order: 'sequential' | 'random';
    noteIds: string[];

    // 시간
    startedAt: number;
    endedAt: number | null;
    totalDuration: number;      // 초

    // 결과 요약
    summary: SessionSummary | null;
}

