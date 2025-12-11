import Dexie, { type Table } from 'dexie';
import type { SystemNote, UserNote, UserOverride } from '../schema/note';
import type {
    StudyRecord,
    WeakPoint,
    StudySession,
    LegacyStudyRecord,
    LegacyWeakPoint,
    LegacyStudySession,
    WordStudyRecord,
    WordWeakPoint,
} from '../schema/study';
import type { ImageBlob } from '../schema/image';

/**
 * Notree 데이터베이스
 * - v1: 초기 스키마
 * - v2: 학습 기록 모드별 분리, 취약점 강화, 세션 정보 추가
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

        // v1: 초기 스키마
        this.version(1).stores({
            systemNotes: 'id, category, order',
            userNotes: 'id, category, createdAt, updatedAt',
            userOverrides: 'systemNoteId, updatedAt',
            images: 'id, noteId, createdAt',
            studyRecords: 'id, noteId, sessionId, createdAt',
            weakPoints: 'id, noteId, wrongCount, isResolved',
            studySessions: 'id, startedAt',
        });

        // v2: 학습 기록 모드별 분리
        this.version(2).stores({
            systemNotes: 'id, category, order',
            userNotes: 'id, category, createdAt, updatedAt',
            userOverrides: 'systemNoteId, updatedAt',
            images: 'id, noteId, createdAt',
            // mode 인덱스 추가
            studyRecords: 'id, noteId, sessionId, mode, createdAt',
            weakPoints: 'id, noteId, mode, wrongCount, isResolved',
            studySessions: 'id, mode, startedAt',
        }).upgrade(async tx => {
            console.log('[DB Migration] v1 → v2: Starting migration...');

            // StudyRecord 마이그레이션
            const studyRecords = tx.table<LegacyStudyRecord & Partial<WordStudyRecord>>('studyRecords');
            await studyRecords.toCollection().modify(record => {
                // 이미 마이그레이션된 레코드는 스킵
                if ('mode' in record && record.mode) {
                    return;
                }

                // 레거시 레코드를 word 모드로 변환
                const legacyRecord = record as LegacyStudyRecord;
                const migratedRecord: Partial<WordStudyRecord> = {
                    mode: 'word',
                    score: legacyRecord.totalQuestions > 0
                        ? Math.round((legacyRecord.correctCount / legacyRecord.totalQuestions) * 100)
                        : 0,
                    details: { blanks: [] }, // 상세 정보는 복구 불가
                };

                Object.assign(record, migratedRecord);
            });

            // WeakPoint 마이그레이션
            const weakPoints = tx.table<LegacyWeakPoint & Partial<WordWeakPoint>>('weakPoints');
            await weakPoints.toCollection().modify(wp => {
                // 이미 마이그레이션된 레코드는 스킵
                if ('mode' in wp && wp.mode) {
                    return;
                }

                // 레거시 취약점을 word 모드로 변환
                const legacyWp = wp as LegacyWeakPoint;
                const migratedWp: Partial<WordWeakPoint> = {
                    mode: 'word',
                    keyword: legacyWp.content || '',
                    hint: '',
                    wrongAnswers: legacyWp.userAnswer ? [legacyWp.userAnswer] : [],
                    correctCount: 0,
                    lastCorrectAt: null,
                    consecutiveCorrect: 0,
                };

                // content 필드 제거 (keyword로 대체)
                delete (wp as any).content;
                delete (wp as any).userAnswer;
                delete (wp as any).correctAnswer;
                delete (wp as any).questionId;

                Object.assign(wp, migratedWp);
            });

            // StudySession 마이그레이션
            const studySessions = tx.table<LegacyStudySession & Partial<StudySession>>('studySessions');
            await studySessions.toCollection().modify(session => {
                // 이미 마이그레이션된 레코드는 스킵
                if ('mode' in session && session.mode) {
                    return;
                }

                // 레거시 세션을 word 모드로 변환
                const migratedSession: Partial<StudySession> = {
                    mode: 'word',
                    order: 'sequential',
                    summary: null,
                };

                Object.assign(session, migratedSession);
            });

            console.log('[DB Migration] v1 → v2: Migration completed');
        });
    }
}

export const db = new NotreeDB();
