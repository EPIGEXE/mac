
// ============================================================================
// Session Input Types
// ============================================================================

import type { NoteType, StudyModeType } from "../core/schema";

/** 세션 시작 입력 */
export interface StartSessionInput {
    mode: StudyModeType;
    order: 'sequential' | 'random';
    noteIds: string[];
}

// ============================================================================
// Statistics Types
// ============================================================================

/** 전체 통계 */
export interface OverallStats {
    totalStudyTime: number;
    totalSessions: number;
    totalQuestionsAnswered: number;
    totalCorrect: number;
    totalWrong: number;
    overallAccuracy: number;
    unresolvedWeakPoints: number;
    studiedNoteCount: number;
}

/** 모드별 통계 */
export interface ModeStats {
    mode: StudyModeType;
    totalSessions: number;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    totalTime: number;
    averageScore: number;
}

/** 모드별 통계 상세 */
export interface ModeBreakdownStats {
    count: number;       // 학습 횟수
    accuracy: number;    // 정답률
    avgScore: number;    // 평균 점수
}

/** 노트별 통계 */
export interface NoteStats {
    noteId: string;
    noteType: NoteType;
    studyCount: number;
    totalTime: number;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    lastStudiedAt: number | null;
    weakPointCount: number;
    // 모드별 세부
    modeBreakdown?: {
        word?: ModeBreakdownStats;
        sentence?: ModeBreakdownStats;
        essay?: ModeBreakdownStats;
    };
}

/** 기간별 통계 */
export interface PeriodStats {
    date: string;
    studyTime: number;
    sessionCount: number;
    questionsAnswered: number;
    accuracy: number;
    // 모드별 세부 (NEW)
    modeBreakdown?: {
        word?: number;
        sentence?: number;
        essay?: number;
    };
}

/** 학습 추천 노트 */
export interface RecommendedNote {
    noteId: string;
    noteType: NoteType;
    reason: 'not_studied_recently' | 'low_accuracy' | 'has_weak_points' | 'never_studied';
    priority: number;
    lastStudiedAt?: number;
    accuracy?: number;
    weakPointCount?: number;
}

// ============================================================================
// WeakPoint Summary Types
// ============================================================================

/** 취약점 요약 */
export interface WeakPointSummary {
    totalCount: number;
    unresolvedCount: number;
    resolvedCount: number;
    byMode: {
        word: number;
        sentence: number;
        essay: number;
    };
    recentlyAdded: number;      // 최근 7일 추가
}

/** 취약점 필터 옵션 */
export interface WeakPointFilter {
    mode?: StudyModeType;
    noteId?: string;
    isResolved?: boolean;
    sortBy?: 'wrongCount' | 'lastWrongAt' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
}

// ============================================================================
// Session History Types
// ============================================================================

/** 세션 내 모드별 성적 상세 */
export interface SessionModeDetail {
    mode: StudyModeType;
    noteCount: number;          // 해당 모드로 학습한 노트 수
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    avgScore: number;           // 평균 점수 (0-100)
    totalDuration: number;      // 해당 모드 학습 시간 (초)
}

/** 세션 히스토리 아이템 */
export interface SessionHistoryItem {
    id: string;
    mode: StudyModeType;
    order: 'sequential' | 'random';
    noteCount: number;
    startedAt: number;
    endedAt: number | null;
    totalDuration: number;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    averageScore: number;
}

/** 세션 필터 옵션 */
export interface SessionFilter {
    mode?: StudyModeType;
    startDate?: number;
    endDate?: number;
    limit?: number;
}
