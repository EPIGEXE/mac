import Dexie, { type Table } from 'dexie';
import type { ImageBlob, StudyRecord, StudySession, SystemNote, UserNote, UserOverride, WeakPoint } from './schema';

/**
 * Notree 데이터베이스
 * - v1: 초기 스키마 (mode 포함)
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
            studyRecords: 'id, noteId, sessionId, mode, createdAt',
            weakPoints: 'id, noteId, mode, wrongCount, isResolved',
            studySessions: 'id, mode, startedAt',
        });
    }
}

export const db = new NotreeDB();
