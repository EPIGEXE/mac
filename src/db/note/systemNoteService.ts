import { db } from '../db';
import type { SystemNote } from '../schema/note';
import { systemNotesData } from '../../data/systemNotes';

// ============================================================================
// System Note Service
// - 제공 문서 관리
// - 초기화 및 패치 적용
// ============================================================================

/**
 * 시스템 노트 초기화
 * - 앱 시작 시 호출
 * - systemNotes 테이블이 비어있으면 기본 데이터 로드
 */
export async function initializeSystemNotes(): Promise<void> {
    const count = await db.systemNotes.count();

    if (count === 0) {
        // 초기 데이터 로드
        await db.systemNotes.bulkAdd(systemNotesData);
        console.log(`Initialized ${systemNotesData.length} system notes`);
    }
}

/**
 * 시스템 노트 패치 적용
 * - 새로운 버전의 시스템 노트 적용
 * - 기존 노트는 버전이 높은 경우만 업데이트
 */
export async function applySystemNotesPatch(newNotes: SystemNote[]): Promise<{
    added: number;
    updated: number;
    unchanged: number;
}> {
    const result = { added: 0, updated: 0, unchanged: 0 };

    for (const newNote of newNotes) {
        const existing = await db.systemNotes.get(newNote.id);

        if (!existing) {
            // 새 노트 추가
            await db.systemNotes.add(newNote);
            result.added++;
        } else if (newNote.version > existing.version) {
            // 버전이 높으면 업데이트
            await db.systemNotes.put(newNote);
            result.updated++;
        } else {
            result.unchanged++;
        }
    }

    console.log(`Patch applied: ${result.added} added, ${result.updated} updated, ${result.unchanged} unchanged`);
    return result;
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
