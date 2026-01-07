import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../core/db'
import {
    getOverallStats,
    getNoteStats,
    getAllNoteStats,
    getWeakNotes,
    getTodayStats,
    getModeStats,
    getAllModeStats,
} from './statisticsService'
import { saveSession, recordWordStudy, closeSession } from './studyService'

describe('statisticsService', () => {
    beforeEach(async () => {
        // 테스트 전 DB 초기화
        await db.studySessions.clear()
        await db.studyRecords.clear()
        await db.weakPoints.clear()
    })

    // ========================================
    // 전체 통계 테스트
    // ========================================
    describe('getOverallStats', () => {
        it('데이터가 없을 때 기본값을 반환해야 함', async () => {
            const stats = await getOverallStats()

            expect(stats.totalStudyTime).toBe(0)
            expect(stats.totalSessions).toBe(0)
            expect(stats.totalQuestionsAnswered).toBe(0)
            expect(stats.totalCorrect).toBe(0)
            expect(stats.totalWrong).toBe(0)
            expect(stats.overallAccuracy).toBe(0)
            expect(stats.unresolvedWeakPoints).toBe(0)
            expect(stats.studiedNoteCount).toBe(0)
        })

        it('학습 데이터가 있을 때 올바른 통계를 반환해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1', 'note-2'],
                mode: 'word',
                order: 'sequential',
            })

            await recordWordStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 60,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'C', isCorrect: false, hint: 'B' },
                ],
            })

            await recordWordStudy({
                noteId: 'note-2',
                noteType: 'user',
                sessionId: session.id,
                duration: 30,
                blanks: [{ blankId: '1', answer: 'X', userAnswer: 'X', isCorrect: true, hint: 'X' }],
            })

            await closeSession(session.id)

            const stats = await getOverallStats()

            expect(stats.totalSessions).toBe(1)
            expect(stats.totalQuestionsAnswered).toBe(3)
            expect(stats.totalCorrect).toBe(2)
            expect(stats.totalWrong).toBe(1)
            expect(stats.overallAccuracy).toBe(67) // 2/3 * 100
            expect(stats.studiedNoteCount).toBe(2)
        })
    })

    // ========================================
    // 노트별 통계 테스트
    // ========================================
    describe('getNoteStats', () => {
        it('학습 기록이 없는 노트는 null을 반환해야 함', async () => {
            const stats = await getNoteStats('non-existent-note')
            expect(stats).toBeNull()
        })

        it('노트별 통계를 올바르게 계산해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            await recordWordStudy({
                noteId: 'note-1',
                noteType: 'system',
                sessionId: session.id,
                duration: 120,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'B', isCorrect: true, hint: 'B' },
                    { blankId: '3', answer: 'C', userAnswer: 'D', isCorrect: false, hint: 'C' },
                ],
            })

            const stats = await getNoteStats('note-1')

            expect(stats).not.toBeNull()
            expect(stats?.noteId).toBe('note-1')
            expect(stats?.noteType).toBe('system')
            expect(stats?.studyCount).toBe(1)
            expect(stats?.totalQuestions).toBe(3)
            expect(stats?.correctCount).toBe(2)
            expect(stats?.wrongCount).toBe(1)
            expect(stats?.accuracy).toBe(67)
            expect(stats?.totalTime).toBe(120)
        })
    })

    // ========================================
    // 전체 노트 통계 테스트
    // ========================================
    describe('getAllNoteStats', () => {
        it('모든 노트의 통계를 반환해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1', 'note-2'],
                mode: 'word',
                order: 'sequential',
            })

            await recordWordStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 60,
                blanks: [{ blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' }],
            })

            await recordWordStudy({
                noteId: 'note-2',
                noteType: 'system',
                sessionId: session.id,
                duration: 30,
                blanks: [{ blankId: '1', answer: 'B', userAnswer: 'B', isCorrect: true, hint: 'B' }],
            })

            const allStats = await getAllNoteStats()

            expect(allStats).toHaveLength(2)
            expect(allStats.map((s) => s.noteId)).toContain('note-1')
            expect(allStats.map((s) => s.noteId)).toContain('note-2')
        })

        it('모드별 breakdown을 포함해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            await recordWordStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 60,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'C', isCorrect: false, hint: 'B' },
                ],
            })

            const allStats = await getAllNoteStats()
            const noteStat = allStats.find((s) => s.noteId === 'note-1')

            expect(noteStat?.modeBreakdown).toBeDefined()
            expect(noteStat?.modeBreakdown?.word).toBeDefined()
            expect(noteStat?.modeBreakdown?.word?.count).toBe(1)
            expect(noteStat?.modeBreakdown?.word?.accuracy).toBe(50)
        })
    })

    // ========================================
    // 취약 노트 테스트
    // ========================================
    describe('getWeakNotes', () => {
        it('정답률이 낮은 노트를 반환해야 함', async () => {
            const session1 = await saveSession({
                noteIds: ['note-weak'],
                mode: 'word',
                order: 'sequential',
            })

            // 첫 번째 학습 - 0% 정답률
            await recordWordStudy({
                noteId: 'note-weak',
                noteType: 'user',
                sessionId: session1.id,
                duration: 60,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'X', isCorrect: false, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'Y', isCorrect: false, hint: 'B' },
                ],
            })

            const session2 = await saveSession({
                noteIds: ['note-weak'],
                mode: 'word',
                order: 'sequential',
            })

            // 두 번째 학습 - 50% 정답률
            await recordWordStudy({
                noteId: 'note-weak',
                noteType: 'user',
                sessionId: session2.id,
                duration: 60,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'X', isCorrect: false, hint: 'B' },
                ],
            })

            const weakNotes = await getWeakNotes(70)

            expect(weakNotes.length).toBeGreaterThanOrEqual(1)
            expect(weakNotes[0].noteId).toBe('note-weak')
            expect(weakNotes[0].accuracy).toBeLessThan(70)
        })

        it('학습 횟수가 2회 미만인 노트는 제외해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-once'],
                mode: 'word',
                order: 'sequential',
            })

            // 한 번만 학습 - 0% 정답률
            await recordWordStudy({
                noteId: 'note-once',
                noteType: 'user',
                sessionId: session.id,
                duration: 60,
                blanks: [{ blankId: '1', answer: 'A', userAnswer: 'X', isCorrect: false, hint: 'A' }],
            })

            const weakNotes = await getWeakNotes(70)

            // 1회만 학습한 노트는 포함되지 않아야 함
            expect(weakNotes.find((n) => n.noteId === 'note-once')).toBeUndefined()
        })
    })

    // ========================================
    // 오늘의 통계 테스트
    // ========================================
    describe('getTodayStats', () => {
        it('오늘 학습 데이터가 없으면 0을 반환해야 함', async () => {
            const stats = await getTodayStats()

            expect(stats.sessionCount).toBe(0)
            expect(stats.questionsAnswered).toBe(0)
            expect(stats.accuracy).toBe(0)
        })

        it('오늘 학습 데이터를 올바르게 계산해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            await recordWordStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 60,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'B', isCorrect: true, hint: 'B' },
                ],
            })

            await closeSession(session.id)

            const stats = await getTodayStats()

            expect(stats.sessionCount).toBe(1)
            expect(stats.questionsAnswered).toBe(2)
            expect(stats.accuracy).toBe(100)
        })
    })

    // ========================================
    // 모드별 통계 테스트
    // ========================================
    describe('getModeStats', () => {
        it('특정 모드의 통계를 반환해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            await recordWordStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 60,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'C', isCorrect: false, hint: 'B' },
                ],
            })

            await closeSession(session.id)

            const stats = await getModeStats('word')

            expect(stats.mode).toBe('word')
            expect(stats.totalSessions).toBe(1)
            expect(stats.totalQuestions).toBe(2)
            expect(stats.correctCount).toBe(1)
            expect(stats.wrongCount).toBe(1)
            expect(stats.accuracy).toBe(50)
        })

        it('학습 기록이 없는 모드는 0을 반환해야 함', async () => {
            const stats = await getModeStats('essay')

            expect(stats.mode).toBe('essay')
            expect(stats.totalSessions).toBe(0)
            expect(stats.totalQuestions).toBe(0)
            expect(stats.accuracy).toBe(0)
        })
    })

    describe('getAllModeStats', () => {
        it('모든 모드의 통계를 반환해야 함', async () => {
            const allStats = await getAllModeStats()

            expect(allStats).toHaveLength(3)
            expect(allStats.map((s) => s.mode)).toContain('word')
            expect(allStats.map((s) => s.mode)).toContain('sentence')
            expect(allStats.map((s) => s.mode)).toContain('essay')
        })
    })
})
