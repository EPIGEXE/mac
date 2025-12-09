import { db } from '../core/db';
import type { WeakPoint } from '../schema/study';
import type { AddWeakPointInput } from './types';
import { NotFoundError, InvalidInputError, withErrorHandling } from '../core/errors';
import { generateId } from '../utils/idGenerator';

// Re-export for backward compatibility
export type { AddWeakPointInput } from './types';

// ============================================================================
// WeakPoint Service
// - 취약점/오답 관리
// - 사용자가 틀린 문제 추적
// ============================================================================

/**
 * 취약점 추가 또는 기존 항목 업데이트
 * - 같은 noteId + content 조합이 있으면 wrongCount 증가
 */
export async function addWeakPoint(input: AddWeakPointInput): Promise<WeakPoint> {
    if (!input.noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }
    if (!input.content) {
        throw new InvalidInputError('content is required', 'content');
    }

    return withErrorHandling('addWeakPoint', async () => {
        const now = Date.now();

        // 기존 취약점 찾기 (같은 노트의 같은 내용)
        const existing = await db.weakPoints
            .where('noteId')
            .equals(input.noteId)
            .filter(wp => wp.content === input.content && !wp.isResolved)
            .first();

        if (existing) {
            // 기존 항목 업데이트
            await db.weakPoints.update(existing.id, {
                wrongCount: existing.wrongCount + 1,
                lastWrongAt: now,
                userAnswer: input.userAnswer ?? existing.userAnswer,
                correctAnswer: input.correctAnswer ?? existing.correctAnswer,
            });

            return {
                ...existing,
                wrongCount: existing.wrongCount + 1,
                lastWrongAt: now,
                userAnswer: input.userAnswer ?? existing.userAnswer,
                correctAnswer: input.correctAnswer ?? existing.correctAnswer,
            };
        }

        // 새 취약점 생성
        const weakPoint: WeakPoint = {
            id: generateId('wp'),
            noteId: input.noteId,
            noteType: input.noteType,
            questionId: input.questionId ?? null,
            content: input.content,
            userAnswer: input.userAnswer ?? null,
            correctAnswer: input.correctAnswer ?? null,
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
 * 취약점 해결 처리
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
 * 취약점 해결 취소
 */
export async function unresolveWeakPoint(id: string): Promise<boolean> {
    return withErrorHandling('unresolveWeakPoint', async () => {
        const weakPoint = await db.weakPoints.get(id);
        if (!weakPoint) {
            throw new NotFoundError('WeakPoint', id);
        }

        await db.weakPoints.update(id, { isResolved: false });
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

/**
 * 노트별 취약점 조회
 */
export async function getWeakPointsByNote(noteId: string): Promise<WeakPoint[]> {
    return withErrorHandling('getWeakPointsByNote', async () => {
        return db.weakPoints
            .where('noteId')
            .equals(noteId)
            .reverse()
            .sortBy('lastWrongAt');
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

        // 전체 미해결 취약점 (틀린 횟수 순)
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
