import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../core/db'
import {
    addWordWeakPoint,
    addSentenceWeakPoint,
    addEssayWeakPoint,
    resolveWeakPoint,
    deleteWeakPoint,
    getWeakPoint,
    getWeakPointsByNote,
    getWeakPointsByMode,
    getWeakPoints,
    getUnresolvedWeakPoints,
    getTopWeakPoints,
    getWeakPointSummary,
    getWeakPointCountByNote,
    getWeakPointCountByMode,
} from './weakPointService'

describe('weakPointService', () => {
    beforeEach(async () => {
        await db.weakPoints.clear()
    })

    // ========================================
    // 단어 모드 취약점 추가 테스트
    // ========================================
    describe('addWordWeakPoint', () => {
        it('새 단어 취약점을 추가해야 함', async () => {
            const wp = await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'HTTP',
                hint: 'Protocol',
                userAnswer: 'HTPP',
            })

            expect(wp.id).toBeDefined()
            expect(wp.mode).toBe('word')
            expect(wp.keyword).toBe('HTTP')
            expect(wp.wrongCount).toBe(1)
            expect(wp.wrongAnswers).toContain('HTPP')
            expect(wp.isResolved).toBe(false)
        })

        it('같은 키워드 오답 시 wrongCount 증가', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'HTTP',
                hint: 'Protocol',
                userAnswer: 'HTPP',
            })

            const updated = await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'HTTP',
                hint: 'Protocol',
                userAnswer: 'HTT',
            })

            expect(updated.wrongCount).toBe(2)
            expect(updated.wrongAnswers).toContain('HTPP')
            expect(updated.wrongAnswers).toContain('HTT')
        })

        it('noteId 없으면 에러 발생', async () => {
            await expect(
                addWordWeakPoint({
                    noteId: '',
                    noteType: 'user',
                    keyword: 'HTTP',
                    hint: 'Protocol',
                    userAnswer: 'HTPP',
                })
            ).rejects.toThrow('noteId is required')
        })

        it('keyword 없으면 에러 발생', async () => {
            await expect(
                addWordWeakPoint({
                    noteId: 'note-1',
                    noteType: 'user',
                    keyword: '',
                    hint: 'Protocol',
                    userAnswer: 'HTPP',
                })
            ).rejects.toThrow('keyword is required')
        })
    })

    // ========================================
    // 문장 모드 취약점 추가 테스트
    // ========================================
    describe('addSentenceWeakPoint', () => {
        it('새 문장 취약점을 추가해야 함', async () => {
            const wp = await addSentenceWeakPoint({
                noteId: 'note-1',
                noteType: 'system',
                questionId: 'q1',
                question: 'What is HTTP?',
                correctAnswer: 'Protocol',
                keyPoints: ['protocol', 'web'],
                missedPoints: ['web'],
            })

            expect(wp.mode).toBe('sentence')
            expect(wp.questionId).toBe('q1')
            expect(wp.question).toBe('What is HTTP?')
            expect(wp.wrongCount).toBe(1)
            expect(wp.lastMissedPoints).toContain('web')
        })

        it('같은 문제 오답 시 wrongCount 증가', async () => {
            await addSentenceWeakPoint({
                noteId: 'note-1',
                noteType: 'system',
                questionId: 'q1',
                question: 'What is HTTP?',
                correctAnswer: 'Protocol',
                keyPoints: ['protocol'],
                missedPoints: ['protocol'],
            })

            const updated = await addSentenceWeakPoint({
                noteId: 'note-1',
                noteType: 'system',
                questionId: 'q1',
                question: 'What is HTTP?',
                correctAnswer: 'Protocol',
                keyPoints: ['protocol'],
                missedPoints: ['web'],
            })

            expect(updated.wrongCount).toBe(2)
            expect(updated.lastMissedPoints).toContain('web')
        })
    })

    // ========================================
    // 서술형 모드 취약점 추가 테스트
    // ========================================
    describe('addEssayWeakPoint', () => {
        it('새 서술형 취약점을 추가해야 함', async () => {
            const wp = await addEssayWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                company: 'Toss',
                question: 'Explain CRP',
                questionType: 'knowledge',
                expectedPoints: ['DOM', 'CSSOM'],
                missedPoints: ['CSSOM'],
            })

            expect(wp.mode).toBe('essay')
            expect(wp.company).toBe('Toss')
            expect(wp.question).toBe('Explain CRP')
            expect(wp.wrongCount).toBe(1)
        })
    })

    // ========================================
    // 취약점 상태 관리 테스트
    // ========================================
    describe('resolveWeakPoint', () => {
        it('취약점을 해결 처리해야 함', async () => {
            const wp = await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'HTTP',
                hint: 'Protocol',
                userAnswer: 'HTPP',
            })

            const result = await resolveWeakPoint(wp.id)
            expect(result).toBe(true)

            const resolved = await getWeakPoint(wp.id)
            expect(resolved?.isResolved).toBe(true)
        })

        it('존재하지 않는 취약점 해결 시 에러', async () => {
            await expect(resolveWeakPoint('non-existent')).rejects.toThrow()
        })
    })

    describe('deleteWeakPoint', () => {
        it('취약점을 삭제해야 함', async () => {
            const wp = await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'HTTP',
                hint: 'Protocol',
                userAnswer: 'HTPP',
            })

            const result = await deleteWeakPoint(wp.id)
            expect(result).toBe(true)

            const deleted = await getWeakPoint(wp.id)
            expect(deleted).toBeUndefined()
        })
    })

    // ========================================
    // 취약점 조회 테스트
    // ========================================
    describe('getWeakPointsByNote', () => {
        it('노트별 취약점을 조회해야 함', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })
            await addWordWeakPoint({
                noteId: 'note-2',
                noteType: 'user',
                keyword: 'C',
                hint: 'TEST',
                userAnswer: 'WRONG C',
            })

            const wps = await getWeakPointsByNote('note-1')

            expect(wps).toHaveLength(2)
            expect(wps.every((wp) => wp.noteId === 'note-1')).toBe(true)
        })

        it('해결된 취약점은 기본 제외', async () => {
            const wp = await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await resolveWeakPoint(wp.id)

            const wps = await getWeakPointsByNote('note-1')
            expect(wps).toHaveLength(0)

            const wpsIncludeResolved = await getWeakPointsByNote('note-1', true)
            expect(wpsIncludeResolved).toHaveLength(1)
        })
    })

    describe('getWeakPointsByMode', () => {
        it('모드별 취약점을 조회해야 함', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addSentenceWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                questionId: 'q1',
                question: 'Q',
                correctAnswer: 'A',
                keyPoints: [],
                missedPoints: [],
            })
            await addEssayWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                company: 'Toss',
                question: 'Explain CRP',
                questionType: 'knowledge',
                expectedPoints: ['DOM', 'CSSOM'],
                missedPoints: ['CSSOM'],
            })

            const wordWps = await getWeakPointsByMode('word')
            const sentenceWps = await getWeakPointsByMode('sentence')
            const essayWps = await getWeakPointsByMode('essay')

            expect(wordWps).toHaveLength(1)
            expect(sentenceWps).toHaveLength(1)
            expect(essayWps).toHaveLength(1)
        })
    })

    describe('getWeakPoints', () => {
        it('필터 기반 취약점 조회', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })
            await addWordWeakPoint({
                noteId: 'note-2',
                noteType: 'user',
                keyword: 'C',
                hint: 'TEST',
                userAnswer: 'WRONG C',
            })

            const filtered = await getWeakPoints({
                noteId: 'note-1',
                isResolved: false,
            })

            expect(filtered).toHaveLength(2)
        })

        it('limit 적용', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'C',
                hint: 'TEST',
                userAnswer: 'WRONG C',
            })

            const limited = await getWeakPoints({ limit: 2 })

            expect(limited).toHaveLength(2)
        })
    })

    describe('getUnresolvedWeakPoints', () => {
        it('미해결 취약점만 조회해야 함', async () => {
            const wp1 = await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })
            await resolveWeakPoint(wp1.id)

            const unresolved = await getUnresolvedWeakPoints()

            expect(unresolved).toHaveLength(1)
            expect(unresolved[0].isResolved).toBe(false)
        })
    })

    describe('getTopWeakPoints', () => {
        it('자주 틀린 순으로 정렬해야 함', async () => {
            // A: 3회 오답
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })

            // B: 1회 오답
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })

            const top = await getTopWeakPoints(2)

            expect(top).toHaveLength(2)
            expect(top[0].wrongCount).toBeGreaterThanOrEqual(top[1].wrongCount)
        })
    })

    // ========================================
    // 취약점 통계 테스트
    // ========================================
    describe('getWeakPointSummary', () => {
        it('취약점 요약을 반환해야 함', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })
            await addSentenceWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                questionId: 'q1',
                question: 'Q',
                correctAnswer: 'A',
                keyPoints: [],
                missedPoints: [],
            })

            const summary = await getWeakPointSummary()

            expect(summary.totalCount).toBe(3)
            expect(summary.unresolvedCount).toBe(3)
            expect(summary.resolvedCount).toBe(0)
            expect(summary.byMode.word).toBe(2)
            expect(summary.byMode.sentence).toBe(1)
        })
    })

    describe('getWeakPointCountByNote', () => {
        it('노트별 취약점 개수를 반환해야 함', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })
            await addWordWeakPoint({
                noteId: 'note-2',
                noteType: 'user',
                keyword: 'C',
                hint: 'TEST',
                userAnswer: 'WRONG C',
            })

            const count = await getWeakPointCountByNote('note-1')

            expect(count).toBe(2)
        })
    })

    describe('getWeakPointCountByMode', () => {
        it('모드별 취약점 개수를 반환해야 함', async () => {
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'A',
                hint: 'TEST',
                userAnswer: 'WRONG A',
            })
            await addWordWeakPoint({
                noteId: 'note-1',
                noteType: 'user',
                keyword: 'B',
                hint: 'TEST',
                userAnswer: 'WRONG B',
            })

            const count = await getWeakPointCountByMode('word')

            expect(count).toBe(2)
        })
    })
})
