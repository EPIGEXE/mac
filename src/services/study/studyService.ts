import { db, type StudyRecord, type StudySession } from '../../lib/db';

// ============================================================================
// Study Service
// - 학습 기록 관리
// - 세션 관리
// ============================================================================

/**
 * 새 학습 세션 시작
 */
export async function startSession(): Promise<StudySession> {
    const now = Date.now();
    const session: StudySession = {
        id: `session-${now}`,
        startedAt: now,
        endedAt: null,
        totalDuration: 0,
        noteIds: [],
    };

    await db.studySessions.add(session);
    return session;
}

/**
 * 학습 세션 종료
 */
export async function endSession(sessionId: string): Promise<StudySession | null> {
    const session = await db.studySessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    const totalDuration = Math.floor((now - session.startedAt) / 1000);

    await db.studySessions.update(sessionId, {
        endedAt: now,
        totalDuration,
    });

    return {
        ...session,
        endedAt: now,
        totalDuration,
    };
}

/**
 * 세션에 노트 추가
 */
export async function addNoteToSession(sessionId: string, noteId: string): Promise<void> {
    const session = await db.studySessions.get(sessionId);
    if (!session) return;

    if (!session.noteIds.includes(noteId)) {
        await db.studySessions.update(sessionId, {
            noteIds: [...session.noteIds, noteId],
        });
    }
}

/**
 * 학습 기록 저장
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

export async function recordStudy(input: RecordStudyInput): Promise<StudyRecord> {
    const now = Date.now();
    const record: StudyRecord = {
        id: `record-${now}`,
        noteId: input.noteId,
        noteType: input.noteType,
        sessionId: input.sessionId,
        totalQuestions: input.totalQuestions,
        correctCount: input.correctCount,
        wrongCount: input.wrongCount,
        duration: input.duration,
        createdAt: now,
        completedAt: now,
    };

    await db.studyRecords.add(record);

    // 세션에 노트 추가
    await addNoteToSession(input.sessionId, input.noteId);

    return record;
}

/**
 * 노트별 학습 기록 조회
 */
export async function getStudyHistory(noteId: string): Promise<StudyRecord[]> {
    return db.studyRecords.where('noteId').equals(noteId).reverse().sortBy('createdAt');
}

/**
 * 세션 조회
 */
export async function getSession(sessionId: string): Promise<StudySession | undefined> {
    return db.studySessions.get(sessionId);
}

/**
 * 최근 세션 목록 조회
 */
export async function getRecentSessions(limit: number = 10): Promise<StudySession[]> {
    return db.studySessions.orderBy('startedAt').reverse().limit(limit).toArray();
}

/**
 * 모든 학습 기록 조회
 */
export async function getAllStudyRecords(): Promise<StudyRecord[]> {
    return db.studyRecords.orderBy('createdAt').reverse().toArray();
}
