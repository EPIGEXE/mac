import { db } from '../core/db';
import { systemNotesData } from '../../data/systemNotes';
import type { SystemNote } from '../core/schema';

// ============================================================================
// System Note Service
// - 제공 문서 관리
// - 자동 동기화: 새 노트 추가, 업데이트된 노트 반영
// ============================================================================

/**
 * 시스템 노트 초기화 및 동기화
 * - 앱 시작 시 호출
 * - 새로운 시스템 노트 자동 추가
 * - 버전이 높아진 노트 자동 업데이트
 */
export async function initializeSystemNotes(): Promise<void> {
    const isDemo = import.meta.env.VITE_IS_DEMO === 'true';

    // 데모 모드면 시스템 노트 강제 초기화
    if (isDemo) {
        await db.systemNotes.clear();
        await db.systemNotes.bulkAdd(systemNotesData);
        console.log(`[SystemNotes] Demo mode: force reset ${systemNotesData.length} notes`);
        return;
    }

    const result = { added: 0, updated: 0, unchanged: 0 };

    for (const note of systemNotesData) {
        const existing = await db.systemNotes.get(note.id);

        if (!existing) {
            // 새 노트 추가
            await db.systemNotes.add(note);
            result.added++;
        } else if (note.version > existing.version) {
            // 버전이 높으면 업데이트
            await db.systemNotes.put(note);
            result.updated++;
        } else {
            result.unchanged++;
        }
    }

    if (result.added > 0 || result.updated > 0) {
        console.log(`[SystemNotes] Synced: ${result.added} added, ${result.updated} updated`);
    }
}

/**
 * 모든 시스템 노트 조회
 */
export async function getAllSystemNotes(): Promise<SystemNote[]> {
    return db.systemNotes.orderBy('order').toArray();
}

/**
 * 시스템 노트 단일 조회
 */
export async function getSystemNoteById(id: string): Promise<SystemNote | undefined> {
    return db.systemNotes.get(id);
}

/**
 * 카테고리별 시스템 노트 조회
 */
export async function getSystemNotesByCategory(category: string): Promise<SystemNote[]> {
    return db.systemNotes.where('category').equals(category).sortBy('order');
}

/**
 * 시스템 노트 강제 리셋
 * - 모든 시스템 노트 삭제 후 재초기화
 */
export async function resetSystemNotes(): Promise<void> {
    await db.systemNotes.clear();
    await db.systemNotes.bulkAdd(systemNotesData);
    console.log('System notes reset to default');
}
