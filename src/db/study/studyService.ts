import { db } from '../core/db';
import type {
    StudyRecord,
    StudySession,
    WordStudyRecord,
    SentenceStudyRecord,
    EssayStudyRecord,
    StudyModeType,
    SessionSummary,
} from '../schema/study';
import type {
    RecordStudyInput,
    RecordWordStudyInput,
    RecordSentenceStudyInput,
    RecordEssayStudyInput,
    StartSessionInput,
    SessionHistoryItem,
    SessionFilter,
    SessionModeDetail,
} from './types';
import { NotFoundError, InvalidInputError, withErrorHandling } from '../core/errors';
import { generateId } from '../utils/idGenerator';

// Re-export for backward compatibility
export type { RecordStudyInput } from './types';

// ============================================================================
// Study Service
// - 학습 기록 관리 (모드별)
// - 세션 관리
// ============================================================================

// ============================================================================
// 세션 관리
// ============================================================================

/**
 * 새 학습 세션 시작 (NEW - 모드/순서 포함)
 */
export async function saveSession(input: StartSessionInput): Promise<StudySession> {
    return withErrorHandling('startSession', async () => {
        const now = Date.now();
        const session: StudySession = {
            id: generateId('session'),
            mode: input.mode,
            order: input.order,
            noteIds: input.noteIds,
            startedAt: now,
            endedAt: null,
            totalDuration: 0,
            summary: null,
        };

        await db.studySessions.add(session);
        return session;
    });
}

/**
 * 학습 세션 종료 (요약 포함)
 * summary가 없으면 학습 기록에서 자동 계산
 */
export async function closeSession(sessionId: string, summary?: SessionSummary): Promise<StudySession> {
    return withErrorHandling('endSession', async () => {
        const session = await db.studySessions.get(sessionId);
        if (!session) {
            throw new NotFoundError('StudySession', sessionId);
        }

        const now = Date.now();
        const totalDuration = Math.floor((now - session.startedAt) / 1000);

        const updateData: Partial<StudySession> = {
            endedAt: now,
            totalDuration,
        };

        if (summary) {
            updateData.summary = summary;
        } else {
            // summary가 없으면 학습 기록에서 자동 계산
            const records = await db.studyRecords
                .where('sessionId')
                .equals(sessionId)
                .toArray();

            if (records.length > 0) {
                const totalQuestions = records.reduce((sum, r) => sum + r.totalQuestions, 0);
                const correctCount = records.reduce((sum, r) => sum + r.correctCount, 0);
                const wrongCount = records.reduce((sum, r) => sum + r.wrongCount, 0);
                const totalScore = records.reduce((sum, r) => sum + r.score, 0);
                const uniqueNoteIds = new Set(records.map(r => r.noteId));

                updateData.summary = {
                    totalNotes: session.noteIds.length,
                    completedNotes: uniqueNoteIds.size,
                    totalQuestions,
                    correctCount,
                    wrongCount,
                    averageScore: records.length > 0 ? Math.round(totalScore / records.length) : 0,
                };
            }
        }

        await db.studySessions.update(sessionId, updateData);

        return {
            ...session,
            ...updateData,
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
 * 세션 히스토리 조회 (필터 지원)
 * summary가 없는 기존 세션은 학습 기록에서 데이터를 가져옴
 */
export async function getSessionHistory(filter?: SessionFilter): Promise<SessionHistoryItem[]> {
    return withErrorHandling('getSessionHistory', async () => {
        const collection = db.studySessions.orderBy('startedAt').reverse();

        const sessions = await collection.toArray();

        // 필터 적용
        let filtered = sessions;

        if (filter?.mode) {
            filtered = filtered.filter(s => s.mode === filter.mode);
        }

        if (filter?.startDate) {
            filtered = filtered.filter(s => s.startedAt >= filter.startDate!);
        }

        if (filter?.endDate) {
            filtered = filtered.filter(s => s.startedAt <= filter.endDate!);
        }

        if (filter?.limit) {
            filtered = filtered.slice(0, filter.limit);
        }

        // SessionHistoryItem으로 변환 (summary 없으면 학습 기록에서 계산)
        const results: SessionHistoryItem[] = [];

        for (const s of filtered) {
            let totalQuestions = s.summary?.totalQuestions ?? 0;
            let correctCount = s.summary?.correctCount ?? 0;
            let wrongCount = s.summary?.wrongCount ?? 0;
            let averageScore = s.summary?.averageScore ?? 0;

            // summary가 없으면 학습 기록에서 계산
            if (!s.summary) {
                const records = await db.studyRecords
                    .where('sessionId')
                    .equals(s.id)
                    .toArray();

                if (records.length > 0) {
                    totalQuestions = records.reduce((sum, r) => sum + r.totalQuestions, 0);
                    correctCount = records.reduce((sum, r) => sum + r.correctCount, 0);
                    wrongCount = records.reduce((sum, r) => sum + r.wrongCount, 0);
                    const totalScore = records.reduce((sum, r) => sum + r.score, 0);
                    averageScore = Math.round(totalScore / records.length);
                }
            }

            results.push({
                id: s.id,
                mode: s.mode,
                order: s.order,
                noteCount: s.noteIds.length,
                startedAt: s.startedAt,
                endedAt: s.endedAt,
                totalDuration: s.totalDuration,
                totalQuestions,
                correctCount,
                wrongCount,
                averageScore,
            });
        }

        return results;
    });
}

// ============================================================================
// 학습 기록 - 모드별
// ============================================================================

/**
 * 단어 모드 학습 기록 저장
 */
export async function recordWordStudy(input: RecordWordStudyInput): Promise<WordStudyRecord> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.sessionId) {
        throw new InvalidInputError('sessionId is required', 'sessionId');
    }

    return withErrorHandling('recordWordStudy', async () => {
        const now = Date.now();

        const correctCount = input.blanks.filter(b => b.isCorrect).length;
        const wrongCount = input.blanks.filter(b => !b.isCorrect).length;
        const totalQuestions = input.blanks.length;
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        const record: WordStudyRecord = {
            id: generateId('record'),
            noteId: input.noteId,
            noteType: input.noteType,
            sessionId: input.sessionId,
            mode: 'word',
            totalQuestions,
            correctCount,
            wrongCount,
            score,
            duration: input.duration,
            createdAt: now,
            completedAt: now,
            details: {
                blanks: input.blanks,
            },
        };

        await db.studyRecords.add(record);
        await addNoteToSession(input.sessionId, input.noteId);

        return record;
    });
}

/**
 * 문장 모드 학습 기록 저장
 */
export async function recordSentenceStudy(input: RecordSentenceStudyInput): Promise<SentenceStudyRecord> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.sessionId) {
        throw new InvalidInputError('sessionId is required', 'sessionId');
    }

    return withErrorHandling('recordSentenceStudy', async () => {
        const now = Date.now();

        const correctCount = input.questions.filter(q => q.isCorrect).length;
        const wrongCount = input.questions.filter(q => !q.isCorrect).length;
        const totalQuestions = input.questions.length;

        const record: SentenceStudyRecord = {
            id: generateId('record'),
            noteId: input.noteId,
            noteType: input.noteType,
            sessionId: input.sessionId,
            mode: 'sentence',
            totalQuestions,
            correctCount,
            wrongCount,
            score: input.totalScore,
            duration: input.duration,
            createdAt: now,
            completedAt: now,
            details: {
                questions: input.questions,
                totalScore: input.totalScore,
                overallFeedback: input.overallFeedback,
            },
        };

        await db.studyRecords.add(record);
        await addNoteToSession(input.sessionId, input.noteId);

        return record;
    });
}

/**
 * 서술형 모드 학습 기록 저장
 */
export async function recordEssayStudy(input: RecordEssayStudyInput): Promise<EssayStudyRecord> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.sessionId) {
        throw new InvalidInputError('sessionId is required', 'sessionId');
    }

    return withErrorHandling('recordEssayStudy', async () => {
        const now = Date.now();

        const isCorrect = input.grade === 'PASS';

        const record: EssayStudyRecord = {
            id: generateId('record'),
            noteId: input.noteId,
            noteType: input.noteType,
            sessionId: input.sessionId,
            mode: 'essay',
            totalQuestions: 1,
            correctCount: isCorrect ? 1 : 0,
            wrongCount: isCorrect ? 0 : 1,
            score: input.score,
            duration: input.duration,
            createdAt: now,
            completedAt: now,
            details: {
                company: input.company,
                question: input.question,
                questionType: input.questionType,
                userAnswer: input.userAnswer,
                score: input.score,
                grade: input.grade,
                matchedPoints: input.matchedPoints,
                missedPoints: input.missedPoints,
                strengths: input.strengths,
                improvements: input.improvements,
                feedback: input.feedback,
                tip: input.tip,
            },
        };

        await db.studyRecords.add(record);
        await addNoteToSession(input.sessionId, input.noteId);

        return record;
    });
}

/**
 * 학습 기록 저장 (Legacy - 호환성 유지)
 * @deprecated recordWordStudy, recordSentenceStudy, recordEssayStudy 사용 권장
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
        const score = input.totalQuestions > 0
            ? Math.round((input.correctCount / input.totalQuestions) * 100)
            : 0;

        const record: WordStudyRecord = {
            id: generateId('record'),
            noteId: input.noteId,
            noteType: input.noteType,
            sessionId: input.sessionId,
            mode: 'word',
            totalQuestions: input.totalQuestions,
            correctCount: input.correctCount,
            wrongCount: input.wrongCount,
            score,
            duration: input.duration,
            createdAt: now,
            completedAt: now,
            details: {
                blanks: [],
            },
        };

        await db.studyRecords.add(record);
        await addNoteToSession(input.sessionId, input.noteId);

        return record;
    });
}

// ============================================================================
// 학습 기록 조회
// ============================================================================

/**
 * 노트별 학습 기록 조회
 */
export async function getStudyHistory(noteId: string): Promise<StudyRecord[]> {
    return withErrorHandling('getStudyHistory', async () => {
        return db.studyRecords.where('noteId').equals(noteId).reverse().sortBy('createdAt');
    });
}

/**
 * 모드별 학습 기록 조회
 */
export async function getStudyHistoryByMode(mode: StudyModeType, limit?: number): Promise<StudyRecord[]> {
    return withErrorHandling('getStudyHistoryByMode', async () => {
        const collection = db.studyRecords.where('mode').equals(mode);
        const records = await collection.reverse().sortBy('createdAt');
        return limit ? records.slice(0, limit) : records;
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

/**
 * 세션별 학습 기록 조회
 */
export async function getStudyRecordsBySession(sessionId: string): Promise<StudyRecord[]> {
    return withErrorHandling('getStudyRecordsBySession', async () => {
        return db.studyRecords.where('sessionId').equals(sessionId).toArray();
    });
}

/**
 * 세션별 모드 상세 정보 조회
 * - 해당 세션에서 각 모드별로 어떤 성적을 받았는지 계산
 */
export async function getSessionModeDetails(sessionId: string): Promise<SessionModeDetail[]> {
    return withErrorHandling('getSessionModeDetails', async () => {
        const records = await db.studyRecords.where('sessionId').equals(sessionId).toArray();

        // 모드별로 그룹화
        const modeMap = new Map<StudyModeType, StudyRecord[]>();
        records.forEach(record => {
            const existing = modeMap.get(record.mode) || [];
            existing.push(record);
            modeMap.set(record.mode, existing);
        });

        // 각 모드별 통계 계산
        const details: SessionModeDetail[] = [];
        modeMap.forEach((modeRecords, mode) => {
            const noteIds = new Set(modeRecords.map(r => r.noteId));
            const totalQuestions = modeRecords.reduce((sum, r) => sum + r.totalQuestions, 0);
            const correctCount = modeRecords.reduce((sum, r) => sum + r.correctCount, 0);
            const wrongCount = modeRecords.reduce((sum, r) => sum + r.wrongCount, 0);
            const totalScore = modeRecords.reduce((sum, r) => sum + r.score, 0);
            const totalDuration = modeRecords.reduce((sum, r) => sum + r.duration, 0);

            details.push({
                mode,
                noteCount: noteIds.size,
                totalQuestions,
                correctCount,
                wrongCount,
                avgScore: modeRecords.length > 0 ? Math.round(totalScore / modeRecords.length) : 0,
                totalDuration,
            });
        });

        // 모드 순서 정렬 (word -> sentence -> essay)
        const modeOrder: StudyModeType[] = ['word', 'sentence', 'essay'];
        details.sort((a, b) => modeOrder.indexOf(a.mode) - modeOrder.indexOf(b.mode));

        return details;
    });
}
