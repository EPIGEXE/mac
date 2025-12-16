import { db } from '../core/db';
import type {
    WeakPoint,
    WordWeakPoint,
    SentenceWeakPoint,
    EssayWeakPoint,
    StudyModeType,
} from '../schema/study';
import type {
    AddWordWeakPointInput,
    AddSentenceWeakPointInput,
    AddEssayWeakPointInput,
    WeakPointFilter,
    WeakPointSummary,
} from './types';
import { NotFoundError, InvalidInputError, withErrorHandling } from '../core/errors';
import { generateId } from '../utils/idGenerator';

// ============================================================================
// WeakPoint Service - 모드별 취약점 관리
// ============================================================================

// ============================================================================
// 취약점 추가 - 모드별
// ============================================================================

/**
 * 단어 모드 취약점 추가/업데이트
 */
export async function addWordWeakPoint(input: AddWordWeakPointInput): Promise<WordWeakPoint> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.keyword) {
        throw new InvalidInputError('keyword is required', 'keyword');
    }

    return withErrorHandling('addWordWeakPoint', async () => {
        const now = Date.now();

        // 기존 취약점 찾기 (같은 노트의 같은 키워드)
        const existing = await db.weakPoints
            .where('noteId')
            .equals(input.noteId)
            .filter(wp => wp.mode === 'word' && (wp as WordWeakPoint).keyword === input.keyword && !wp.isResolved)
            .first() as WordWeakPoint | undefined;

        if (existing) {
            // 기존 항목 업데이트
            const wrongAnswers = [...existing.wrongAnswers];
            if (input.userAnswer && !wrongAnswers.includes(input.userAnswer)) {
                wrongAnswers.push(input.userAnswer);
                if (wrongAnswers.length > 5) wrongAnswers.shift(); // 최근 5개만 유지
            }

            const updated: Partial<WordWeakPoint> = {
                wrongCount: existing.wrongCount + 1,
                lastWrongAt: now,
                wrongAnswers,
            };

            await db.weakPoints.update(existing.id, updated);
            return { ...existing, ...updated };
        }

        // 새 취약점 생성
        const weakPoint: WordWeakPoint = {
            id: generateId('wp'),
            noteId: input.noteId,
            noteType: input.noteType,
            mode: 'word',
            keyword: input.keyword,
            hint: input.hint,
            wrongAnswers: input.userAnswer ? [input.userAnswer] : [],
            wrongCount: 1,
            lastWrongAt: now,
            isResolved: false,
            createdAt: now,
        };

        await db.weakPoints.add(weakPoint);
        return weakPoint;
    });
}

/**
 * 문장 모드 취약점 추가/업데이트
 */
export async function addSentenceWeakPoint(input: AddSentenceWeakPointInput): Promise<SentenceWeakPoint> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.questionId) {
        throw new InvalidInputError('questionId is required', 'questionId');
    }

    return withErrorHandling('addSentenceWeakPoint', async () => {
        const now = Date.now();

        // 기존 취약점 찾기 (같은 문제)
        const existing = await db.weakPoints
            .where('noteId')
            .equals(input.noteId)
            .filter(wp => wp.mode === 'sentence' && (wp as SentenceWeakPoint).questionId === input.questionId && !wp.isResolved)
            .first() as SentenceWeakPoint | undefined;

        if (existing) {
            const updated: Partial<SentenceWeakPoint> = {
                wrongCount: existing.wrongCount + 1,
                lastWrongAt: now,
                lastMissedPoints: input.missedPoints,
            };

            await db.weakPoints.update(existing.id, updated);
            return { ...existing, ...updated };
        }

        // 새 취약점 생성
        const weakPoint: SentenceWeakPoint = {
            id: generateId('wp'),
            noteId: input.noteId,
            noteType: input.noteType,
            mode: 'sentence',
            questionId: input.questionId,
            question: input.question,
            correctAnswer: input.correctAnswer,
            keyPoints: input.keyPoints,
            lastMissedPoints: input.missedPoints,
            wrongCount: 1,
            lastWrongAt: now,
            isResolved: false,
            createdAt: now,
        };

        await db.weakPoints.add(weakPoint);
        return weakPoint;
    });
}

/**
 * 서술형 모드 취약점 추가/업데이트
 */
export async function addEssayWeakPoint(input: AddEssayWeakPointInput): Promise<EssayWeakPoint> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.question) {
        throw new InvalidInputError('question is required', 'question');
    }

    return withErrorHandling('addEssayWeakPoint', async () => {
        const now = Date.now();

        // 기존 취약점 찾기 (같은 회사, 같은 문제)
        const existing = await db.weakPoints
            .where('noteId')
            .equals(input.noteId)
            .filter(wp =>
                wp.mode === 'essay' &&
                (wp as EssayWeakPoint).company === input.company &&
                (wp as EssayWeakPoint).question === input.question &&
                !wp.isResolved
            )
            .first() as EssayWeakPoint | undefined;

        if (existing) {
            const updated: Partial<EssayWeakPoint> = {
                wrongCount: existing.wrongCount + 1,
                lastWrongAt: now,
                lastMissedPoints: input.missedPoints,
            };

            await db.weakPoints.update(existing.id, updated);
            return { ...existing, ...updated };
        }

        // 새 취약점 생성
        const weakPoint: EssayWeakPoint = {
            id: generateId('wp'),
            noteId: input.noteId,
            noteType: input.noteType,
            mode: 'essay',
            company: input.company,
            question: input.question,
            questionType: input.questionType,
            expectedPoints: input.expectedPoints,
            lastMissedPoints: input.missedPoints,
            wrongCount: 1,
            lastWrongAt: now,
            isResolved: false,
            createdAt: now,
        };

        await db.weakPoints.add(weakPoint);
        return weakPoint;
    });
}

// ============================================================================
// 취약점 상태 관리
// ============================================================================

/**
 * 취약점 수동 해결 처리
 */
export async function resolveWeakPoint(id: string): Promise<boolean> {
    return withErrorHandling('resolveWeakPoint', async () => {
        const weakPoint = await db.weakPoints.get(id);
        if (!weakPoint) {
            throw new NotFoundError('WeakPoint', id);
        }

        await db.weakPoints.update(id, { isResolved: true });
        return true;
    });
}

/**
 * 취약점 삭제
 */
export async function deleteWeakPoint(id: string): Promise<boolean> {
    return withErrorHandling('deleteWeakPoint', async () => {
        await db.weakPoints.delete(id);
        return true;
    });
}

// ============================================================================
// 취약점 조회
// ============================================================================

/**
 * 단일 취약점 조회
 */
export async function getWeakPoint(id: string): Promise<WeakPoint | undefined> {
    return withErrorHandling('getWeakPoint', async () => {
        return db.weakPoints.get(id);
    });
}

/**
 * 노트별 취약점 조회
 */
export async function getWeakPointsByNote(noteId: string, includeResolved: boolean = false): Promise<WeakPoint[]> {
    return withErrorHandling('getWeakPointsByNote', async () => {
        const collection = db.weakPoints.where('noteId').equals(noteId);

        if (!includeResolved) {
            const all = await collection.filter(wp => !wp.isResolved).toArray();
            return all.sort((a, b) => b.wrongCount - a.wrongCount);
        }

        const all = await collection.toArray();
        return all.sort((a, b) => b.lastWrongAt - a.lastWrongAt);
    });
}

/**
 * 모드별 취약점 조회
 */
export async function getWeakPointsByMode(mode: StudyModeType, includeResolved: boolean = false): Promise<WeakPoint[]> {
    return withErrorHandling('getWeakPointsByMode', async () => {
        const query = db.weakPoints.where('mode').equals(mode);

        if (!includeResolved) {
            const all = await query.filter(wp => !wp.isResolved).toArray();
            return all.sort((a, b) => b.wrongCount - a.wrongCount);
        }

        const all = await query.toArray();
        return all.sort((a, b) => b.lastWrongAt - a.lastWrongAt);
    });
}

/**
 * 필터 기반 취약점 조회
 */
export async function getWeakPoints(filter?: WeakPointFilter): Promise<WeakPoint[]> {
    return withErrorHandling('getWeakPoints', async () => {
        let results = await db.weakPoints.toArray();

        // 필터 적용
        if (filter?.mode) {
            results = results.filter(wp => wp.mode === filter.mode);
        }

        if (filter?.noteId) {
            results = results.filter(wp => wp.noteId === filter.noteId);
        }

        if (filter?.isResolved !== undefined) {
            results = results.filter(wp => wp.isResolved === filter.isResolved);
        }

        // 정렬
        const sortBy = filter?.sortBy ?? 'wrongCount';
        const sortOrder = filter?.sortOrder ?? 'desc';

        results.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'wrongCount':
                    comparison = a.wrongCount - b.wrongCount;
                    break;
                case 'lastWrongAt':
                    comparison = a.lastWrongAt - b.lastWrongAt;
                    break;
                case 'createdAt':
                    comparison = a.createdAt - b.createdAt;
                    break;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

        // 제한
        if (filter?.limit) {
            results = results.slice(0, filter.limit);
        }

        return results;
    });
}

/**
 * 미해결 취약점만 조회
 */
export async function getUnresolvedWeakPoints(noteId?: string): Promise<WeakPoint[]> {
    return withErrorHandling('getUnresolvedWeakPoints', async () => {
        if (noteId) {
            const all = await db.weakPoints
                .where('noteId')
                .equals(noteId)
                .filter(wp => !wp.isResolved)
                .toArray();
            return all.sort((a, b) => b.wrongCount - a.wrongCount);
        }

        const all = await db.weakPoints.filter(wp => !wp.isResolved).toArray();
        return all.sort((a, b) => b.wrongCount - a.wrongCount);
    });
}

/**
 * 자주 틀리는 취약점 조회 (상위 N개)
 */
export async function getTopWeakPoints(limit: number = 10): Promise<WeakPoint[]> {
    return withErrorHandling('getTopWeakPoints', async () => {
        const all = await db.weakPoints
            .filter(wp => !wp.isResolved)
            .toArray();

        return all
            .sort((a, b) => b.wrongCount - a.wrongCount)
            .slice(0, limit);
    });
}

/**
 * 모든 취약점 조회
 */
export async function getAllWeakPoints(): Promise<WeakPoint[]> {
    return withErrorHandling('getAllWeakPoints', async () => {
        return db.weakPoints.orderBy('lastWrongAt').reverse().toArray();
    });
}

// ============================================================================
// 취약점 통계/요약
// ============================================================================

/**
 * 취약점 요약 조회
 */
export async function getWeakPointSummary(): Promise<WeakPointSummary> {
    return withErrorHandling('getWeakPointSummary', async () => {
        const all = await db.weakPoints.toArray();
        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

        const unresolved = all.filter(wp => !wp.isResolved);
        const resolved = all.filter(wp => wp.isResolved);
        const recentlyAdded = all.filter(wp => wp.createdAt >= oneWeekAgo);

        const byMode = {
            word: unresolved.filter(wp => wp.mode === 'word').length,
            sentence: unresolved.filter(wp => wp.mode === 'sentence').length,
            essay: unresolved.filter(wp => wp.mode === 'essay').length,
        };

        return {
            totalCount: all.length,
            unresolvedCount: unresolved.length,
            resolvedCount: resolved.length,
            byMode,
            recentlyAdded: recentlyAdded.length,
        };
    });
}

/**
 * 노트별 취약점 개수 조회
 */
export async function getWeakPointCountByNote(noteId: string): Promise<number> {
    return withErrorHandling('getWeakPointCountByNote', async () => {
        return db.weakPoints
            .where('noteId')
            .equals(noteId)
            .filter(wp => !wp.isResolved)
            .count();
    });
}

/**
 * 모드별 취약점 개수 조회
 */
export async function getWeakPointCountByMode(mode: StudyModeType): Promise<number> {
    return withErrorHandling('getWeakPointCountByMode', async () => {
        return db.weakPoints
            .where('mode')
            .equals(mode)
            .filter(wp => !wp.isResolved)
            .count();
    });
}
