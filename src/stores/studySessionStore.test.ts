import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStudySessionStore } from './studySessionStore'

// DB 서비스 모킹
vi.mock('../db/study/studyService', () => ({
    saveSession: vi.fn().mockResolvedValue({ id: 'mock-session-id' }),
    closeSession: vi.fn().mockResolvedValue({}),
}))

// ================================ 테스트 ================================
describe('studySessionStore', () => {
    // 모킹 초기화
    beforeEach(() => {
        // 스토어 초기화
        useStudySessionStore.setState({
            selectedNoteIds: [],
            mode: null,
            order: 'sequential',
            currentIndex: 0,
            isActive: false,
            noteResults: [],
            startedAt: null,
            completedAt: null,
            dbSessionId: null,
        })
    })

    // 세션 시작 테스트
    describe('startSession', () => {
        it('세션을 시작하고 상태를 업데이트해야 함', async () => {
            const { startSession } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1', 'note-2', 'note-3', 'note-4', 'note-5'],
                mode: 'word',
                order: 'sequential',
            })

            const state = useStudySessionStore.getState()
            expect(state.isActive).toBe(true)
            expect(state.selectedNoteIds).toEqual(['note-1', 'note-2', 'note-3', 'note-4', 'note-5'])
            expect(state.mode).toBe('word')
            expect(state.order).toBe('sequential')
            expect(state.currentIndex).toBe(0)
            expect(state.startedAt).not.toBeNull()
            expect(state.dbSessionId).toBeNull()
        })

        it('random 순서로 세션을 시작할 수 있어야 함', async () => {
            const { startSession } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1'],
                mode: 'sentence',
                order: 'random',
            })

            const state = useStudySessionStore.getState()
            expect(state.order).toBe('random')
            expect(state.mode).toBe('sentence')
        })
    })

    // 현재 노트 ID 반환 테스트
    describe('getCurrentNoteId', () => {
        it('현재 노트 ID를 반환해야 함', async () => {
            const { startSession, getCurrentNoteId } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1', 'note-2', 'note-3'],
                mode: 'word',
                order: 'sequential',
            })

            expect(getCurrentNoteId()).toBe('note-1')
        })

        it('세션이 비활성화면 null을 반환해야 함', () => {
            const { getCurrentNoteId } = useStudySessionStore.getState()
            expect(getCurrentNoteId()).toBeNull()
        })
    })

    // 다음 노트로 이동 테스트
    describe('goToNextNote', () => {
        it('다음 노트로 이동하고 true를 반환해야 함', async () => {
            const { startSession, goToNextNote, getCurrentNoteId } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1', 'note-2', 'note-3'],
                mode: 'word',
                order: 'sequential',
            })

            const result = goToNextNote()

            expect(result).toBe(true)
            expect(getCurrentNoteId()).toBe('note-2')
        })

        it('마지막 노트에서 false를 반환해야 함', async () => {
            const { startSession, goToNextNote } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1', 'note-2'],
                mode: 'word',
                order: 'sequential',
            })

            goToNextNote() // note-2로 이동
            const result = goToNextNote() // 더 이상 없음

            expect(result).toBe(false)
        })

        it('다음 노트로 이동하고 true를 반환 마지막 노트에서 false를 반환해야 함', async () => {
            const { startSession, goToNextNote, getCurrentNoteId } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1', 'note-2', 'note-3', 'note-4', 'note-5'],
                mode: 'word',
                order: 'sequential',
            })

            const result = goToNextNote()

            expect(result).toBe(true)
            expect(getCurrentNoteId()).toBe('note-2')

            const result2 = goToNextNote()

            expect(result2).toBe(true)
            expect(getCurrentNoteId()).toBe('note-3')

            const result3 = goToNextNote()

            expect(result3).toBe(true)
            expect(getCurrentNoteId()).toBe('note-4')

            const result4 = goToNextNote()

            expect(result4).toBe(true)
            expect(getCurrentNoteId()).toBe('note-5')

            const result5 = goToNextNote()

            expect(result5).toBe(false)
        })
    })

    // 노트 결과 기록 테스트
    describe('recordNoteResult', () => {
        it('노트 결과를 기록해야 함', async () => {
            const { startSession, recordNoteResult } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            recordNoteResult({
                noteId: 'note-1',
                noteTitle: 'Test Note',
                totalQuestions: 10,
                correctCount: 8,
                wrongCount: 2,
                score: 80,
                duration: 120,
            })

            const state = useStudySessionStore.getState()
            expect(state.noteResults).toHaveLength(1)
            expect(state.noteResults[0].score).toBe(80)
        })
    })

    // 전체 통계 계산 테스트
    describe('getTotalStats', () => {
        it('전체 통계를 계산해야 함', async () => {
            const { startSession, recordNoteResult, getTotalStats } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1', 'note-2', 'note-3'],
                mode: 'word',
                order: 'sequential',
            })

            recordNoteResult({
                noteId: 'note-1',
                noteTitle: 'Note 1',
                totalQuestions: 10,
                correctCount: 8,
                wrongCount: 2,
                score: 80,
                duration: 60,
            })

            recordNoteResult({
                noteId: 'note-2',
                noteTitle: 'Note 2',
                totalQuestions: 5,
                correctCount: 5,
                wrongCount: 0,
                score: 100,
                duration: 30,
            })

            recordNoteResult({
                noteId: 'note-3',
                noteTitle: 'Note 3',
                totalQuestions: 5,
                correctCount: 3,
                wrongCount: 2,
                score: 60,
                duration: 30,
            })

            const stats = getTotalStats()

            expect(stats.totalQuestions).toBe(10 + 5 + 5)
            expect(stats.totalCorrect).toBe(8 + 5 + 3)
            expect(stats.totalWrong).toBe(2 + 0 + 2)
            expect(stats.averageScore).toBe((80 + 100 + 60) / 3)
            expect(stats.totalDuration).toBe(60 + 30 + 30)
        })

        it('결과가 없으면 0을 반환해야 함', () => {
            const { getTotalStats } = useStudySessionStore.getState()
            const stats = getTotalStats()

            expect(stats.totalQuestions).toBe(0)
            expect(stats.totalCorrect).toBe(0)
            expect(stats.averageScore).toBe(0)
        })
    })

    // 세션 완료 테스트
    describe('completeSession', () => {
        it('세션을 완료하고 isActive를 false로 설정해야 함', async () => {
            const { startSession, completeSession } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1', 'note-2', 'note-3'],
                mode: 'word',
                order: 'sequential',
            })

            await completeSession()

            const state = useStudySessionStore.getState()
            expect(state.isActive).toBe(false)
            expect(state.completedAt).not.toBeNull()
        })
    })

    // 세션 초기화 테스트
    describe('resetSession', () => {
        it('세션을 초기 상태로 리셋해야 함', async () => {
            const { startSession, recordNoteResult, resetSession } = useStudySessionStore.getState()

            await startSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            recordNoteResult({
                noteId: 'note-1',
                noteTitle: 'Test',
                totalQuestions: 5,
                correctCount: 3,
                wrongCount: 2,
                score: 60,
                duration: 30,
            })

            resetSession()

            const state = useStudySessionStore.getState()
            expect(state.isActive).toBe(false)
            expect(state.selectedNoteIds).toEqual([])
            expect(state.noteResults).toEqual([])
        })
    })
})
