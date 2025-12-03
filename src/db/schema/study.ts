/**
 * 학습 기록 - 문서별 학습 결과
 */
export interface StudyRecord {
    id: string;              // UUID
    noteId: string;          // systemNotes 또는 userNotes ID
    noteType: 'system' | 'user';
    sessionId: string;       // 학습 세션 ID
    totalQuestions: number;  // 총 문제 수
    correctCount: number;    // 정답 수
    wrongCount: number;      // 오답 수
    duration: number;        // 학습 시간 (초)
    createdAt: number;
    completedAt: number | null;
}

/**
 * 취약점/오답 기록 - 사용자가 틀린 내용
 */
export interface WeakPoint {
    id: string;              // UUID
    noteId: string;
    noteType: 'system' | 'user';
    questionId: string | null;  // 문제 ID (있는 경우)
    content: string;         // 틀린 내용/키워드
    userAnswer: string | null;
    correctAnswer: string | null;
    wrongCount: number;      // 틀린 횟수
    lastWrongAt: number;     // 마지막으로 틀린 시간
    isResolved: boolean;     // 해결됨 여부
    createdAt: number;
}

/**
 * 학습 세션 - 하나의 학습 시간대
 */
export interface StudySession {
    id: string;              // UUID
    startedAt: number;
    endedAt: number | null;
    totalDuration: number;   // 총 학습 시간 (초)
    noteIds: string[];       // 학습한 문서 ID 목록
}
