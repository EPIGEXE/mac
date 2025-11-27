import Dexie, { type Table } from 'dexie';

// ============================================================================
// 문서 관련 타입
// ============================================================================

/**
 * 제공 문서 (System Notes) - 앱에서 기본 제공하는 문서
 */
export interface SystemNote {
    id: string;              // 고정 ID (예: "js-closure-001")
    version: number;         // 패치 버전
    title: string;
    content: string;         // 마크다운
    category: string;
    tags: string[];
    order: number;           // 정렬 순서
    createdAt: number;
}

/**
 * 사용자 문서 (User Notes) - 사용자가 직접 생성한 문서
 */
export interface UserNote {
    id: string;              // UUID
    title: string;
    content: string;         // 마크다운
    category: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

/**
 * 제공 문서 커스터마이징 (User Overrides)
 * - 제공 문서를 사용자가 수정하면 여기에 저장
 * - 원본은 보존되고, 이 레이어가 덮어씀
 */
export interface UserOverride {
    systemNoteId: string;    // PK, SystemNote.id 참조
    customTitle: string | null;
    customContent: string | null;
    isHidden: boolean;       // 사용자가 숨긴 경우
    updatedAt: number;
}

// ============================================================================
// 학습 관련 타입
// ============================================================================

/**
 * 학습 기록 - 문서별 학습 결과
 */
export interface StudyRecord {
    id: string;              // UUID
    noteId: string;          // systemNotes 또는 userNotes ID
    noteType: 'system' | 'user';
    sessionId: string;       // 학습 세션 ID
    totalQuestions: number;  // 총 문제 수
    correctCount: number;    // 정답 수
    wrongCount: number;      // 오답 수
    duration: number;        // 학습 시간 (초)
    createdAt: number;
    completedAt: number | null;
}

/**
 * 취약점/오답 기록 - 사용자가 틀린 내용
 */
export interface WeakPoint {
    id: string;              // UUID
    noteId: string;
    noteType: 'system' | 'user';
    questionId: string | null;  // 문제 ID (있는 경우)
    content: string;         // 틀린 내용/키워드
    userAnswer: string | null;
    correctAnswer: string | null;
    wrongCount: number;      // 틀린 횟수
    lastWrongAt: number;     // 마지막으로 틀린 시간
    isResolved: boolean;     // 해결됨 여부
    createdAt: number;
}

/**
 * 학습 세션 - 하나의 학습 시간대
 */
export interface StudySession {
    id: string;              // UUID
    startedAt: number;
    endedAt: number | null;
    totalDuration: number;   // 총 학습 시간 (초)
    noteIds: string[];       // 학습한 문서 ID 목록
}

// ============================================================================
// 이미지 관련 타입
// ============================================================================

export interface ImageBlob {
    id: string;              // UUID
    blob: Blob;              // 실제 이미지 데이터
    mimeType: string;        // 'image/png', 'image/jpeg' 등
    size: number;            // 파일 크기 (바이트)
    noteId?: string;         // 연결된 노트 ID (orphan cleanup용)
    createdAt: number;
}

// ============================================================================
// 통합 Note 타입 (UI에서 사용)
// ============================================================================

export interface Note {
    id: string;
    type: 'system' | 'user';
    title: string;
    content: string;
    category: string;
    tags: string[];
    isCustomized: boolean;   // system이고 override 있으면 true
    originalTitle?: string;  // 커스터마이징된 경우 원본
    originalContent?: string;
    createdAt: number;
    updatedAt?: number;
    order?: number;          // system note의 정렬 순서
}

// ============================================================================
// Legacy 타입 (마이그레이션용)
// ============================================================================

interface LegacyNote {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

// ============================================================================
// Database
// ============================================================================

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

        // v2: content가 Block[]에서 string(마크다운)으로 변경됨
        this.version(2).stores({
            notes: 'id, category, createdAt, updatedAt',
        });

        // v3: 이미지 저장소 추가
        this.version(3).stores({
            notes: 'id, category, createdAt, updatedAt',
            images: 'id, noteId, createdAt',
        });

        // v4: 새 구조로 마이그레이션
        // - notes → userNotes (기존 사용자 데이터 보존)
        // - systemNotes 추가 (제공 문서)
        // - userOverrides 추가 (커스터마이징)
        // - 학습 관련 테이블 추가
        this.version(4).stores({
            // 기존 notes 테이블 삭제
            notes: null,
            // 새 문서 테이블
            systemNotes: 'id, category, order',
            userNotes: 'id, category, createdAt, updatedAt',
            userOverrides: 'systemNoteId, updatedAt',
            // 이미지
            images: 'id, noteId, createdAt',
            // 학습
            studyRecords: 'id, noteId, sessionId, createdAt',
            weakPoints: 'id, noteId, wrongCount, isResolved',
            studySessions: 'id, startedAt',
        }).upgrade(async tx => {
            // 기존 notes 테이블의 데이터를 userNotes로 마이그레이션
            const oldNotesTable = tx.table('notes');
            const newUserNotesTable = tx.table('userNotes');

            try {
                const oldNotes = await oldNotesTable.toArray() as LegacyNote[];

                if (oldNotes.length > 0) {
                    // 기본 제공 노트 ID 목록 (이것들은 systemNotes로 이동하지 않고 버림)
                    const defaultNoteIds = [
                        'default-html-1', 'default-html-2',
                        'default-css-1', 'default-css-2',
                        'default-js-1', 'default-js-2', 'default-js-3',
                        'default-react-1', 'default-react-2',
                        'default-ts-1', 'default-ts-2',
                        'default-cs-1', 'default-cs-2',
                        'default-perf-1',
                        'default-sec-1', 'default-sec-2',
                    ];

                    // 사용자가 생성한 노트만 userNotes로 이동
                    const userNotes: UserNote[] = oldNotes
                        .filter(note => !defaultNoteIds.includes(note.id))
                        .map(note => ({
                            id: note.id,
                            title: note.title,
                            content: note.content,
                            category: note.category,
                            tags: note.tags,
                            createdAt: note.createdAt,
                            updatedAt: note.updatedAt,
                        }));

                    if (userNotes.length > 0) {
                        await newUserNotesTable.bulkAdd(userNotes);
                    }

                    console.log(`Migrated ${userNotes.length} user notes to new schema`);
                }
            } catch (error) {
                console.error('Migration error:', error);
                // 마이그레이션 실패해도 계속 진행 (새 테이블은 생성됨)
            }
        });
    }
}

export const db = new NotreeDB();
