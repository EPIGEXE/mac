import { db } from '../db';
import type { StudyRecord, WeakPoint, StudySession } from '../schema/study';

// ============================================================================
// Statistics Service
// - 학습 통계 계산
// - 대시보드용 데이터 제공
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
 * 전체 통계 조회
 */
export async function getOverallStats(): Promise<OverallStats> {
    const [records, sessions, weakPoints] = await Promise.all([
        db.studyRecords.toArray(),
        db.studySessions.toArray(),
        db.weakPoints.filter(wp => !wp.isResolved).toArray(),
    ]);

    const totalCorrect = records.reduce((sum, r) => sum + r.correctCount, 0);
    const totalWrong = records.reduce((sum, r) => sum + r.wrongCount, 0);
    const totalQuestions = totalCorrect + totalWrong;

    // 고유 노트 수
    const studiedNotes = new Set(records.map(r => r.noteId));

    return {
        totalStudyTime: sessions.reduce((sum, s) => sum + s.totalDuration, 0),
        totalSessions: sessions.length,
        totalQuestionsAnswered: totalQuestions,
        totalCorrect,
        totalWrong,
        overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        unresolvedWeakPoints: weakPoints.length,
        studiedNoteCount: studiedNotes.size,
    };
}

/**
 * 노트별 통계 조회
 */
export async function getNoteStats(noteId: string): Promise<NoteStats | null> {
    const [records, weakPoints] = await Promise.all([
        db.studyRecords.where('noteId').equals(noteId).toArray(),
        db.weakPoints.where('noteId').equals(noteId).filter(wp => !wp.isResolved).toArray(),
    ]);

    if (records.length === 0) {
        return null;
    }

    const totalQuestions = records.reduce((sum, r) => sum + r.totalQuestions, 0);
    const correctCount = records.reduce((sum, r) => sum + r.correctCount, 0);
    const wrongCount = records.reduce((sum, r) => sum + r.wrongCount, 0);
    const lastRecord = records.reduce((latest, r) =>
        r.createdAt > (latest?.createdAt ?? 0) ? r : latest, records[0]);

    return {
        noteId,
        noteType: lastRecord.noteType,
        studyCount: records.length,
        totalTime: records.reduce((sum, r) => sum + r.duration, 0),
        totalQuestions,
        correctCount,
        wrongCount,
        accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        lastStudiedAt: lastRecord.createdAt,
        weakPointCount: weakPoints.length,
    };
}

/**
 * 모든 노트의 통계 조회
 */
export async function getAllNoteStats(): Promise<NoteStats[]> {
    const [records, weakPoints] = await Promise.all([
        db.studyRecords.toArray(),
        db.weakPoints.filter(wp => !wp.isResolved).toArray(),
    ]);

    // 노트별로 그룹화
    const noteMap = new Map<string, StudyRecord[]>();
    records.forEach(r => {
        const existing = noteMap.get(r.noteId) || [];
        existing.push(r);
        noteMap.set(r.noteId, existing);
    });

    // 취약점도 노트별로 그룹화
    const weakPointMap = new Map<string, WeakPoint[]>();
    weakPoints.forEach(wp => {
        const existing = weakPointMap.get(wp.noteId) || [];
        existing.push(wp);
        weakPointMap.set(wp.noteId, existing);
    });

    // 통계 생성
    const stats: NoteStats[] = [];
    noteMap.forEach((noteRecords, noteId) => {
        const totalQuestions = noteRecords.reduce((sum, r) => sum + r.totalQuestions, 0);
        const correctCount = noteRecords.reduce((sum, r) => sum + r.correctCount, 0);
        const wrongCount = noteRecords.reduce((sum, r) => sum + r.wrongCount, 0);
        const lastRecord = noteRecords.reduce((latest, r) =>
            r.createdAt > (latest?.createdAt ?? 0) ? r : latest, noteRecords[0]);

        stats.push({
            noteId,
            noteType: lastRecord.noteType,
            studyCount: noteRecords.length,
            totalTime: noteRecords.reduce((sum, r) => sum + r.duration, 0),
            totalQuestions,
            correctCount,
            wrongCount,
            accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
            lastStudiedAt: lastRecord.createdAt,
            weakPointCount: weakPointMap.get(noteId)?.length ?? 0,
        });
    });

    // 마지막 학습 시간순 정렬
    return stats.sort((a, b) => (b.lastStudiedAt ?? 0) - (a.lastStudiedAt ?? 0));
}

/**
 * 기간별 통계 조회 (최근 N일)
 */
export async function getPeriodStats(days: number = 7): Promise<PeriodStats[]> {
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);

    const [records, sessions] = await Promise.all([
        db.studyRecords.where('createdAt').above(startTime).toArray(),
        db.studySessions.where('startedAt').above(startTime).toArray(),
    ]);

    // 날짜별로 그룹화
    const dateMap = new Map<string, { records: StudyRecord[], sessions: StudySession[] }>();

    // 날짜 범위 초기화
    for (let i = 0; i < days; i++) {
        const date = new Date(now - (i * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { records: [], sessions: [] });
    }

    // 레코드 분배
    records.forEach(r => {
        const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        if (entry) {
            entry.records.push(r);
        }
    });

    // 세션 분배
    sessions.forEach(s => {
        const dateStr = new Date(s.startedAt).toISOString().split('T')[0];
        const entry = dateMap.get(dateStr);
        if (entry) {
            entry.sessions.push(s);
        }
    });

    // 통계 생성
    const stats: PeriodStats[] = [];
    dateMap.forEach((data, date) => {
        const totalCorrect = data.records.reduce((sum, r) => sum + r.correctCount, 0);
        const totalWrong = data.records.reduce((sum, r) => sum + r.wrongCount, 0);
        const totalQuestions = totalCorrect + totalWrong;

        stats.push({
            date,
            studyTime: data.sessions.reduce((sum, s) => sum + s.totalDuration, 0),
            sessionCount: data.sessions.length,
            questionsAnswered: totalQuestions,
            accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        });
    });

    // 날짜순 정렬 (오래된 것부터)
    return stats.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 오늘의 통계
 */
export async function getTodayStats(): Promise<PeriodStats> {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const [records, sessions] = await Promise.all([
        db.studyRecords
            .where('createdAt')
            .between(startOfDay, endOfDay)
            .toArray(),
        db.studySessions
            .where('startedAt')
            .between(startOfDay, endOfDay)
            .toArray(),
    ]);

    const totalCorrect = records.reduce((sum, r) => sum + r.correctCount, 0);
    const totalWrong = records.reduce((sum, r) => sum + r.wrongCount, 0);
    const totalQuestions = totalCorrect + totalWrong;

    return {
        date: today,
        studyTime: sessions.reduce((sum, s) => sum + s.totalDuration, 0),
        sessionCount: sessions.length,
        questionsAnswered: totalQuestions,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    };
}

/**
 * 학습 추천 노트 (오래 안 한 노트, 정답률 낮은 노트)
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

export async function getRecommendedNotes(limit: number = 5): Promise<RecommendedNote[]> {
    const [allStats, weakPoints] = await Promise.all([
        getAllNoteStats(),
        db.weakPoints.filter(wp => !wp.isResolved).toArray(),
    ]);

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recommendations: RecommendedNote[] = [];

    // 취약점이 많은 노트
    const weakPointByNote = new Map<string, number>();
    weakPoints.forEach(wp => {
        weakPointByNote.set(wp.noteId, (weakPointByNote.get(wp.noteId) || 0) + 1);
    });

    weakPointByNote.forEach((count, noteId) => {
        const stat = allStats.find(s => s.noteId === noteId);
        recommendations.push({
            noteId,
            noteType: stat?.noteType ?? 'system',
            reason: 'has_weak_points',
            priority: 80 + Math.min(count * 5, 20), // 80-100
            weakPointCount: count,
            lastStudiedAt: stat?.lastStudiedAt ?? undefined,
        });
    });

    // 정답률이 낮은 노트 (70% 미만)
    allStats
        .filter(s => s.accuracy < 70 && s.studyCount >= 2)
        .forEach(s => {
            if (!recommendations.find(r => r.noteId === s.noteId)) {
                recommendations.push({
                    noteId: s.noteId,
                    noteType: s.noteType,
                    reason: 'low_accuracy',
                    priority: 70 - s.accuracy + 30, // 정답률 낮을수록 높은 우선순위
                    accuracy: s.accuracy,
                    lastStudiedAt: s.lastStudiedAt ?? undefined,
                });
            }
        });

    // 오래 안 한 노트 (1주일 이상)
    allStats
        .filter(s => s.lastStudiedAt && s.lastStudiedAt < oneWeekAgo)
        .forEach(s => {
            if (!recommendations.find(r => r.noteId === s.noteId)) {
                const daysSinceStudy = Math.floor((now - s.lastStudiedAt!) / (24 * 60 * 60 * 1000));
                recommendations.push({
                    noteId: s.noteId,
                    noteType: s.noteType,
                    reason: 'not_studied_recently',
                    priority: Math.min(daysSinceStudy * 2, 60), // 최대 60
                    lastStudiedAt: s.lastStudiedAt ?? undefined,
                });
            }
        });

    // 우선순위 순으로 정렬하고 상위 N개 반환
    return recommendations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, limit);
}
