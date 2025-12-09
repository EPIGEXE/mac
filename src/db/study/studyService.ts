import { db } from '../core/db';
import type { StudyRecord, StudySession } from '../schema/study';
import type { RecordStudyInput } from './types';
import { NotFoundError, InvalidInputError, withErrorHandling } from '../core/errors';
import { generateId } from '../utils/idGenerator';

// Re-export for backward compatibility
export type { RecordStudyInput } from './types';

// ============================================================================
// Study Service
// - 학습 기록 관리
// - 세션 관리
// ============================================================================

/**
 * 새 학습 세션 시작
 */
export async function startSession(): Promise<StudySession> {
    return withErrorHandling('startSession', async () => {
        const now = Date.now();
        const session: StudySession = {
            id: generateId('session'),
            startedAt: now,
            endedAt: null,
            totalDuration: 0,
            noteIds: [],
        };

        await db.studySessions.add(session);
        return session;
    });
}

/**
 * 학습 세션 종료
 */
export async function endSession(sessionId: string): Promise<StudySession> {
    return withErrorHandling('endSession', async () => {
        const session = await db.studySessions.get(sessionId);
        if (!session) {
            throw new NotFoundError('StudySession', sessionId);
        }

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
    });
}

/**
 * 세션에 노트 추가
 */
export async function addNoteToSession(sessionId: string, noteId: string): Promise<void> {
    return withErrorHandling('addNoteToSession', async () => {
        const session = await db.studySessions.get(sessionId);
        if (!session) {
            // 세션이 없으면 조용히 무시 (기존 동작 유지)
            return;
        }

        if (!session.noteIds.includes(noteId)) {
            await db.studySessions.update(sessionId, {
                noteIds: [...session.noteIds, noteId],
            });
        }
    });
}

/**
 * 학습 기록 저장
 */
export async function recordStudy(input: RecordStudyInput): Promise<StudyRecord> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.sessionId) {
        throw new InvalidInputError('sessionId is required', 'sessionId');
    }

    return withErrorHandling('recordStudy', async () => {
        const now = Date.now();
        const record: StudyRecord = {
            id: generateId('record'),
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
    });
}

/**
 * 노트별 학습 기록 조회
 */
export async function getStudyHistory(noteId: string): Promise<StudyRecord[]> {
    return withErrorHandling('getStudyHistory', async () => {
        return db.studyRecords.where('noteId').equals(noteId).reverse().sortBy('createdAt');
    });
}

/**
 * 세션 조회
 */
export async function getSession(sessionId: string): Promise<StudySession | undefined> {
    return withErrorHandling('getSession', async () => {
        return db.studySessions.get(sessionId);
    });
}

/**
 * 최근 세션 목록 조회
 */
export async function getRecentSessions(limit: number = 10): Promise<StudySession[]> {
    return withErrorHandling('getRecentSessions', async () => {
        return db.studySessions.orderBy('startedAt').reverse().limit(limit).toArray();
    });
}

/**
 * 모든 학습 기록 조회
 */
export async function getAllStudyRecords(): Promise<StudyRecord[]> {
    return withErrorHandling('getAllStudyRecords', async () => {
        return db.studyRecords.orderBy('createdAt').reverse().toArray();
    });
}
