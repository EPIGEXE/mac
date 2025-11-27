import Dexie, { type Table } from 'dexie';

export interface Note {
    id: string;
    title: string;
    content: string; // 마크다운 문자열
    category: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

export class NotreeDB extends Dexie {
    notes!: Table<Note>;

    constructor() {
        super('notree');
        // v2: content가 Block[]에서 string(마크다운)으로 변경됨
        this.version(2).stores({
            notes: 'id, category, createdAt, updatedAt',
        }).upgrade(tx => {
            // 기존 데이터 삭제 (형식이 완전히 다름)
            return tx.table('notes').clear();
        });
    }
}

export const db = new NotreeDB();
