import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../core/db'
import {
    saveSession,
    closeSession,
    getSession,
    getRecentSessions,
    recordWordStudy,
    recordSentenceStudy,
    recordEssayStudy,
    getStudyHistory,
    getStudyRecordsBySession,
    getSessionModeDetails,
} from './studyService'

describe('studyService', () => {
    beforeEach(async () => {
        // 테스트 전 DB 초기화
        await db.studySessions.clear()
        await db.studyRecords.clear()
    })

    // ========================================
    // 세션 관리 테스트
    // ========================================
    describe('Session Management', () => {
        describe('saveSession', () => {
            it('새 세션을 생성해야 함', async () => {
                const session = await saveSession({
                    noteIds: ['note-1', 'note-2'],
                    mode: 'word',
                    order: 'sequential',
                })

                expect(session.id).toBeDefined()
                expect(session.id).toMatch(/^session-/)
                expect(session.mode).toBe('word')
                expect(session.order).toBe('sequential')
                expect(session.noteIds).toEqual(['note-1', 'note-2'])
                expect(session.startedAt).toBeDefined()
                expect(session.endedAt).toBeNull()
                expect(session.totalDuration).toBe(0)
                expect(session.summary).toBeNull()
            })

            it('random 순서로 세션을 생성할 수 있어야 함', async () => {
                const session = await saveSession({
                    noteIds: ['note-1'],
                    mode: 'sentence',
                    order: 'random',
                })

                expect(session.mode).toBe('sentence')
                expect(session.order).toBe('random')
            })

            it('DB에 세션이 저장되어야 함', async () => {
                const session = await saveSession({
                    noteIds: ['note-1'],
                    mode: 'essay',
                    order: 'sequential',
                })

                const saved = await db.studySessions.get(session.id)
                expect(saved).toBeDefined()
                expect(saved?.mode).toBe('essay')
            })
        })

        describe('closeSession', () => {
            it('세션을 종료하고 duration을 계산해야 함', async () => {
                const session = await saveSession({
                    noteIds: ['note-1'],
                    mode: 'word',
                    order: 'sequential',
                })

                // 약간의 지연
                await new Promise((r) => setTimeout(r, 50))

                const ended = await closeSession(session.id)

                expect(ended.endedAt).not.toBeNull()
                expect(ended.totalDuration).toBeGreaterThanOrEqual(0)
            })

            it('학습 기록이 있으면 summary를 자동 계산해야 함', async () => {
                const session = await saveSession({
                    noteIds: ['note-1', 'note-2'],
                    mode: 'word',
                    order: 'sequential',
                })

                // 학습 기록 추가
                await recordWordStudy({
                    noteId: 'note-1',
                    noteType: 'user',
                    sessionId: session.id,
                    duration: 60,
                    blanks: [
                        { blankId: '1', answer: 'DOM', userAnswer: 'DOM', isCorrect: true, hint: 'DOM' },
                        { blankId: '2', answer: 'CSS', userAnswer: 'JS', isCorrect: false, hint: 'CSS' },
                    ],
                })

                const ended = await closeSession(session.id)

                expect(ended.summary).not.toBeNull()
                expect(ended.summary?.totalQuestions).toBe(2)
                expect(ended.summary?.correctCount).toBe(1)
                expect(ended.summary?.wrongCount).toBe(1)
            })

            it('존재하지 않는 세션 종료 시 에러를 발생해야 함', async () => {
                await expect(closeSession('non-existent-id')).rejects.toThrow()
            })
        })

        describe('getSession', () => {
            it('세션을 조회해야 함', async () => {
                const created = await saveSession({
                    noteIds: ['note-1'],
                    mode: 'word',
                    order: 'sequential',
                })

                const session = await getSession(created.id)

                expect(session).toBeDefined()
                expect(session?.id).toBe(created.id)
            })

            it('존재하지 않는 세션은 undefined 반환', async () => {
                const session = await getSession('non-existent-id')
                expect(session).toBeUndefined()
            })
        })

        describe('getRecentSessions', () => {
            it('최근 세션 목록을 조회해야 함', async () => {
                await saveSession({ noteIds: ['note-1'], mode: 'word', order: 'sequential' })
                await saveSession({ noteIds: ['note-2'], mode: 'sentence', order: 'random' })
                await saveSession({ noteIds: ['note-3'], mode: 'essay', order: 'sequential' })

                const sessions = await getRecentSessions(2)

                expect(sessions).toHaveLength(2)
                // limit이 적용되어야 함
            })

            it('limit 없이 모든 세션을 조회해야 함', async () => {
                await saveSession({ noteIds: ['note-1'], mode: 'word', order: 'sequential' })
                await saveSession({ noteIds: ['note-2'], mode: 'sentence', order: 'random' })

                const sessions = await getRecentSessions()

                expect(sessions).toHaveLength(2)
            })
        })
    })

    // ========================================
    // 단어 모드 학습 기록 테스트
    // ========================================
    describe('Word Study Records', () => {
        it('단어 학습 기록을 저장해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            const record = await recordWordStudy({
                noteId: 'note-1',
                noteType: 'system',
                sessionId: session.id,
                duration: 120,
                blanks: [
                    { blankId: '1', answer: 'HTTP', userAnswer: 'HTTP', isCorrect: true, hint: 'HTTP' },
                    { blankId: '2', answer: 'TCP', userAnswer: 'UDP', isCorrect: false, hint: 'TCP' },
                    { blankId: '3', answer: 'DNS', userAnswer: 'DNS', isCorrect: true, hint: 'DNS' },
                ],
            })

            expect(record.id).toBeDefined()
            expect(record.mode).toBe('word')
            expect(record.totalQuestions).toBe(3)
            expect(record.correctCount).toBe(2)
            expect(record.wrongCount).toBe(1)
            expect(record.score).toBe(67) // Math.round(2/3 * 100)
            expect(record.duration).toBe(120)
            expect(record.details.blanks).toHaveLength(3)
        })

        it('모든 정답일 때 100점이어야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })

            const record = await recordWordStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 60,
                blanks: [
                    { blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' },
                    { blankId: '2', answer: 'B', userAnswer: 'B', isCorrect: true, hint: 'B' },
                ],
            })

            expect(record.score).toBe(100)
        })

        it('noteId가 없으면 에러를 발생해야 함', async () => {
            await expect(
                recordWordStudy({
                    noteId: '',
                    noteType: 'user',
                    sessionId: 'session-1',
                    duration: 60,
                    blanks: [],
                })
            ).rejects.toThrow('noteId is required')
        })
    })

    // ========================================
    // 문장 모드 학습 기록 테스트
    // ========================================
    describe('Sentence Study Records', () => {
        it('문장 학습 기록을 저장해야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'sentence',
                order: 'sequential',
            })

            const record = await recordSentenceStudy({
                noteId: 'note-1',
                noteType: 'system',
                sessionId: session.id,
                duration: 180,
                questions: [
                    {
                        questionId: 'q1',
                        question: 'What is HTTP?',
                        answer: 'Protocol',
                        userAnswer: 'Protocol',
                        isCorrect: true,
                        score: 80,
                        keyPoints: ['HTTP'],
                        matchedPoints: ['HTTP'],
                        missedPoints: [],
                        feedback: 'Good',
                    },
                    {
                        questionId: 'q2',
                        question: 'What is TCP?',
                        answer: 'Transport',
                        keyPoints: ['TCP'],
                        matchedPoints: ['TCP'],
                        missedPoints: [],
                        userAnswer: 'Wrong',
                        isCorrect: false,
                        score: 30,
                        feedback: 'Try again',
                    },
                ],
                totalScore: 55,
                overallFeedback: 'Keep practicing',
            })

            expect(record.mode).toBe('sentence')
            expect(record.totalQuestions).toBe(2)
            expect(record.correctCount).toBe(1)
            expect(record.wrongCount).toBe(1)
            expect(record.score).toBe(55)
            expect(record.details.totalScore).toBe(55)
            expect(record.details.overallFeedback).toBe('Keep practicing')
        })
    })

    // ========================================
    // 서술형 모드 학습 기록 테스트
    // ========================================
    describe('Essay Study Records', () => {
        it('PASS 등급일 때 correctCount가 1이어야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'essay',
                order: 'sequential',
            })

            const record = await recordEssayStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 300,
                company: 'Toss',
                question: 'Explain CRP',
                questionType: 'knowledge',
                userAnswer: 'CRP is...',
                score: 85,
                grade: 'PASS',
                analysis: {
                    situationUnderstanding: '상황을 잘 파악함',
                    solutionQuality: '해결책이 적합함',
                    technicalAccuracy: '기술적으로 정확함',
                    depthOfThinking: '깊이 있는 사고',
                },
                matchedPoints: ['Point 1'],
                missedPoints: [],
                strengths: ['Good'],
                improvements: [],
                feedback: 'Well done',
                betterAnswer: 'Keep it up',
            })

            expect(record.mode).toBe('essay')
            expect(record.correctCount).toBe(1)
            expect(record.wrongCount).toBe(0)
            expect(record.score).toBe(85)
        })

        it('NEEDS_WORK 등급일 때 wrongCount가 1이어야 함', async () => {
            const session = await saveSession({
                noteIds: ['note-1'],
                mode: 'essay',
                order: 'sequential',
            })

            const record = await recordEssayStudy({
                noteId: 'note-1',
                noteType: 'user',
                sessionId: session.id,
                duration: 200,
                company: 'Kakao',
                question: 'Explain REST',
                questionType: 'application',
                userAnswer: 'REST is...',
                score: 40,
                grade: 'NEEDS_WORK',
                analysis: {
                    situationUnderstanding: '상황 파악 부족',
                    solutionQuality: '해결책이 불완전함',
                    technicalAccuracy: '일부 오개념 있음',
                    depthOfThinking: '깊이가 부족함',
                },
                matchedPoints: [],
                missedPoints: ['Point 1'],
                strengths: [],
                improvements: ['Need more detail'],
                feedback: 'Try again',
                betterAnswer: 'Study more',
            })

            expect(record.correctCount).toBe(0)
            expect(record.wrongCount).toBe(1)
        })
    })

    // ========================================
    // 학습 기록 조회 테스트
    // ========================================
    describe('Study Record Queries', () => {
        describe('getStudyHistory', () => {
            it('노트별 학습 기록을 조회해야 함', async () => {
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
                    noteType: 'user',
                    sessionId: session.id,
                    duration: 30,
                    blanks: [{ blankId: '1', answer: 'B', userAnswer: 'B', isCorrect: true, hint: 'B' }],
                })

                const history = await getStudyHistory('note-1')

                expect(history).toHaveLength(1)
                expect(history[0].noteId).toBe('note-1')
            })
        })

        describe('getStudyRecordsBySession', () => {
            it('세션별 학습 기록을 조회해야 함', async () => {
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
                    blanks: [{ blankId: '1', answer: 'A', userAnswer: 'A', isCorrect: true, hint: 'A' }],
                })

                const records = await getStudyRecordsBySession(session.id)

                expect(records).toHaveLength(1)
                expect(records[0].sessionId).toBe(session.id)
            })
        })

        describe('getSessionModeDetails', () => {
            it('세션 내 모드별 상세 정보를 조회해야 함', async () => {
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

                const details = await getSessionModeDetails(session.id)

                expect(details).toHaveLength(1)
                expect(details[0].mode).toBe('word')
                expect(details[0].totalQuestions).toBe(2)
                expect(details[0].correctCount).toBe(1)
                expect(details[0].wrongCount).toBe(1)
            })
        })
    })
})
