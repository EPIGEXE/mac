import type { StudyRecord, WeakPoint, StudySession } from '../schema/study';

// ============================================================================
// Study Service Input Types
// ============================================================================

/**
 * 학습 기록 저장 입력
 */
export interface RecordStudyInput {
    noteId: string;
    noteType: 'system' | 'user';
    sessionId: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    duration: number;
}

/**
 * 취약점 추가/업데이트 입력
 */
export interface AddWeakPointInput {
    noteId: string;
    noteType: 'system' | 'user';
    questionId?: string;
    content: string;
    userAnswer?: string;
    correctAnswer?: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * 전체 통계
 */
export interface OverallStats {
    totalStudyTime: number;           // 총 학습 시간 (초)
    totalSessions: number;            // 총 세션 수
    totalQuestionsAnswered: number;   // 총 답변 문제 수
    totalCorrect: number;             // 총 정답 수
    totalWrong: number;               // 총 오답 수
    overallAccuracy: number;          // 전체 정답률 (0-100)
    unresolvedWeakPoints: number;     // 미해결 취약점 수
    studiedNoteCount: number;         // 학습한 노트 수
}

/**
 * 노트별 통계
 */
export interface NoteStats {
    noteId: string;
    noteType: 'system' | 'user';
    studyCount: number;               // 학습 횟수
    totalTime: number;                // 총 학습 시간
    totalQuestions: number;           // 총 문제 수
    correctCount: number;             // 정답 수
    wrongCount: number;               // 오답 수
    accuracy: number;                 // 정답률
    lastStudiedAt: number | null;     // 마지막 학습 시간
    weakPointCount: number;           // 취약점 수
}

/**
 * 기간별 통계
 */
export interface PeriodStats {
    date: string;                     // YYYY-MM-DD
    studyTime: number;                // 학습 시간 (초)
    sessionCount: number;             // 세션 수
    questionsAnswered: number;        // 답변 문제 수
    accuracy: number;                 // 정답률
}

/**
 * 학습 추천 노트
 */
export interface RecommendedNote {
    noteId: string;
    noteType: 'system' | 'user';
    reason: 'not_studied_recently' | 'low_accuracy' | 'has_weak_points' | 'never_studied';
    priority: number; // 높을수록 추천
    lastStudiedAt?: number;
    accuracy?: number;
    weakPointCount?: number;
}
