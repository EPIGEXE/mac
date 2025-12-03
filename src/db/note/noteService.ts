import { db } from '../db';
import type { Note, UserNote, UserOverride, SystemNote } from '../schema/note';
import { initializeSystemNotes, getAllSystemNotes, getSystemNoteById } from './systemNoteService';
import type { CreateNoteInput, UpdateNoteInput, GetAllNotesOptions } from './types';

// ============================================================================
// Note Service
// - 통합 문서 CRUD
// - SystemNote와 UserNote를 통합하여 관리
// ============================================================================

/**
 * 노트 서비스 초기화
 * - 앱 시작 시 호출
 */
export async function initializeNoteService(): Promise<void> {
    await initializeSystemNotes();
}

/**
 * 모든 노트 조회 (System + User 통합)
 */
export async function getAllNotes(options: GetAllNotesOptions = {}): Promise<Note[]> {
    const { includeHidden = false, category } = options;

    // 1. System Notes 로드
    let systemNotes: SystemNote[];
    if (category) {
        systemNotes = await db.systemNotes.where('category').equals(category).sortBy('order');
    } else {
        systemNotes = await getAllSystemNotes();
    }

    // 2. User Overrides 로드
    const overrides = await db.userOverrides.toArray();
    const overrideMap = new Map(overrides.map(o => [o.systemNoteId, o]));

    // 3. System Notes를 Note로 변환 (override 적용)
    const systemNotesAsNotes: Note[] = systemNotes
        .map(sn => {
            const override = overrideMap.get(sn.id);

            // 숨김 처리
            if (override?.isHidden && !includeHidden) {
                return null;
            }

            const isCustomized = !!(override?.customTitle || override?.customContent);

            return {
                id: sn.id,
                type: 'system' as const,
                title: override?.customTitle ?? sn.title,
                content: override?.customContent ?? sn.content,
                category: sn.category,
                tags: sn.tags,
                isCustomized,
                originalTitle: isCustomized ? sn.title : undefined,
                originalContent: isCustomized ? sn.content : undefined,
                createdAt: sn.createdAt,
                updatedAt: override?.updatedAt,
                order: sn.order,
            };
        })
        .filter((n): n is NonNullable<typeof n> => n !== null);

    // 4. User Notes 로드
    let userNotes: UserNote[];
    if (category) {
        userNotes = await db.userNotes.where('category').equals(category).toArray();
    } else {
        userNotes = await db.userNotes.toArray();
    }

    // 5. User Notes를 Note로 변환
    const userNotesAsNotes: Note[] = userNotes.map(un => ({
        id: un.id,
        type: 'user' as const,
        title: un.title,
        content: un.content,
        category: un.category,
        tags: un.tags,
        isCustomized: false,
        createdAt: un.createdAt,
        updatedAt: un.updatedAt,
    }));

    // 6. 통합 및 정렬
    // System 노트를 먼저, 그 다음 User 노트 (각각 updatedAt 기준 내림차순)
    const allNotes = [
        ...systemNotesAsNotes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        ...userNotesAsNotes.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    ];

    return allNotes;
}

/**
 * 노트 단일 조회
 */
export async function getNoteById(id: string, type: 'system' | 'user'): Promise<Note | null> {
    if (type === 'system') {
        const systemNote = await getSystemNoteById(id);
        if (!systemNote) return null;

        const override = await db.userOverrides.get(id);
        const isCustomized = !!(override?.customTitle || override?.customContent);

        return {
            id: systemNote.id,
            type: 'system',
            title: override?.customTitle ?? systemNote.title,
            content: override?.customContent ?? systemNote.content,
            category: systemNote.category,
            tags: systemNote.tags,
            isCustomized,
            originalTitle: isCustomized ? systemNote.title : undefined,
            originalContent: isCustomized ? systemNote.content : undefined,
            createdAt: systemNote.createdAt,
            updatedAt: override?.updatedAt,
            order: systemNote.order,
        };
    } else {
        const userNote = await db.userNotes.get(id);
        if (!userNote) return null;

        return {
            id: userNote.id,
            type: 'user',
            title: userNote.title,
            content: userNote.content,
            category: userNote.category,
            tags: userNote.tags,
            isCustomized: false,
            createdAt: userNote.createdAt,
            updatedAt: userNote.updatedAt,
        };
    }
}

/**
 * ID로 노트 조회 (타입 자동 감지)
 */
export async function findNoteById(id: string): Promise<Note | null> {
    // System Note 먼저 확인
    const systemNote = await getSystemNoteById(id);
    if (systemNote) {
        return getNoteById(id, 'system');
    }

    // User Note 확인
    const userNote = await db.userNotes.get(id);
    if (userNote) {
        return getNoteById(id, 'user');
    }

    return null;
}

/**
 * 새 노트 생성 (User Note만)
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
    const now = Date.now();
    const id = `note-${now}`;

    const newNote: UserNote = {
        id,
        title: input.title ?? '새 노트',
        content: input.content ?? '',
        category: input.category,
        tags: input.tags ?? [],
        createdAt: now,
        updatedAt: now,
    };

    await db.userNotes.add(newNote);

    return {
        id: newNote.id,
        type: 'user',
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags: newNote.tags,
        isCustomized: false,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
    };
}

/**
 * 노트 수정
 */
export async function updateNote(
    id: string,
    type: 'system' | 'user',
    input: UpdateNoteInput
): Promise<Note | null> {
    const now = Date.now();

    if (type === 'system') {
        // System Note는 UserOverride에 저장
        const systemNote = await getSystemNoteById(id);
        if (!systemNote) return null;

        const existingOverride = await db.userOverrides.get(id);

        // 원본과 비교하여 변경된 것만 저장
        const customTitle = input.title !== undefined && input.title !== systemNote.title
            ? input.title
            : existingOverride?.customTitle ?? null;

        const customContent = input.content !== undefined && input.content !== systemNote.content
            ? input.content
            : existingOverride?.customContent ?? null;

        const override: UserOverride = {
            systemNoteId: id,
            customTitle,
            customContent,
            isHidden: existingOverride?.isHidden ?? false,
            updatedAt: now,
        };

        await db.userOverrides.put(override);

        return getNoteById(id, 'system');
    } else {
        // User Note는 직접 수정
        const userNote = await db.userNotes.get(id);
        if (!userNote) return null;

        const updates: Partial<UserNote> = {
            ...input,
            updatedAt: now,
        };

        await db.userNotes.update(id, updates);

        return getNoteById(id, 'user');
    }
}

/**
 * 노트 삭제
 * - User Note: 실제 삭제
 * - System Note: 숨김 처리
 */
export async function deleteNote(id: string, type: 'system' | 'user'): Promise<boolean> {
    if (type === 'system') {
        // System Note는 숨김 처리
        const existingOverride = await db.userOverrides.get(id);

        const override: UserOverride = {
            systemNoteId: id,
            customTitle: existingOverride?.customTitle ?? null,
            customContent: existingOverride?.customContent ?? null,
            isHidden: true,
            updatedAt: Date.now(),
        };

        await db.userOverrides.put(override);
        return true;
    } else {
        // User Note는 실제 삭제
        await db.userNotes.delete(id);
        return true;
    }
}

/**
 * System Note 원래대로 복원
 * - UserOverride 삭제
 */
export async function resetToOriginal(systemNoteId: string): Promise<Note | null> {
    await db.userOverrides.delete(systemNoteId);
    return getNoteById(systemNoteId, 'system');
}

/**
 * 숨긴 System Note 복원
 */
export async function unhideSystemNote(systemNoteId: string): Promise<Note | null> {
    const existingOverride = await db.userOverrides.get(systemNoteId);

    if (existingOverride) {
        await db.userOverrides.update(systemNoteId, {
            isHidden: false,
            updatedAt: Date.now(),
        });
    }

    return getNoteById(systemNoteId, 'system');
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories(): Promise<string[]> {
    const systemCategories = await db.systemNotes.orderBy('category').uniqueKeys();
    const userCategories = await db.userNotes.orderBy('category').uniqueKeys();

    const allCategories = new Set([
        ...systemCategories as string[],
        ...userCategories as string[],
    ]);

    return Array.from(allCategories).sort();
}
