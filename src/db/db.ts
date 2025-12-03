import Dexie, { type Table } from 'dexie';
import type { SystemNote, UserNote, UserOverride } from './schema/note';
import type { StudyRecord, WeakPoint, StudySession } from './schema/study';
import type { ImageBlob } from './schema/image';

/**
 * Notree 데이터베이스
 */
export class NotreeDB extends Dexie {
    // 문서 테이블
    systemNotes!: Table<SystemNote>;
    userNotes!: Table<UserNote>;
    userOverrides!: Table<UserOverride>;

    // 학습 테이블
    studyRecords!: Table<StudyRecord>;
    weakPoints!: Table<WeakPoint>;
    studySessions!: Table<StudySession>;

    // 이미지 테이블
    images!: Table<ImageBlob>;

    constructor() {
        super('notree');

        this.version(1).stores({
            systemNotes: 'id, category, order',
            userNotes: 'id, category, createdAt, updatedAt',
            userOverrides: 'systemNoteId, updatedAt',
            images: 'id, noteId, createdAt',
            studyRecords: 'id, noteId, sessionId, createdAt',
            weakPoints: 'id, noteId, wrongCount, isResolved',
            studySessions: 'id, startedAt',
        });
    }
}

export const db = new NotreeDB();
