import { describe, it, expect, vi } from 'vitest'
import { validateAndCreateBlindedContent, evaluateBlankAnswer } from './studyApi'

// Mock Firebase to prevent initialization
vi.mock('../../../lib/firebase', () => ({
    functions: {},
}))

vi.mock('firebase/functions', () => ({
    httpsCallable: vi.fn(),
}))

describe('studyApi', () => {
    describe('validateAndCreateBlindedContent', () => {
        it('콘텐츠에 존재하는 단어만 유효한 blank로 처리해야 함', () => {
            const content = 'HTTP는 웹의 기본 프로토콜입니다. TCP 위에서 동작합니다.'
            const blanks = [
                { id: '1', answer: 'HTTP', hint: 'Protocol' },
                { id: '2', answer: 'TCP', hint: 'Transport' },
                { id: '3', answer: 'UDP', hint: 'Not in content' }, // 콘텐츠에 없음
            ]

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.validBlanks).toHaveLength(2)
            expect(result.invalidBlanks).toHaveLength(1)
            expect(result.invalidBlanks[0].answer).toBe('UDP')
            expect(result.invalidBlanks[0].reason).toContain('not found')
        })

        it('유효한 blank에 새 ID를 순차적으로 부여해야 함', () => {
            const content = 'React와 Vue는 인기있는 프레임워크입니다.'
            const blanks = [
                { id: 'old-1', answer: 'React' },
                { id: 'old-2', answer: 'Vue' },
            ]

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.validBlanks[0].id).toBe('1')
            expect(result.validBlanks[1].id).toBe('2')
        })

        it('blindedContent에 [BLANK_N] 형식으로 치환해야 함', () => {
            const content = 'JavaScript는 동적 타입 언어입니다.'
            const blanks = [{ id: '1', answer: 'JavaScript' }]

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.blindedContent).toBe('[BLANK_1]는 동적 타입 언어입니다.')
        })

        it('대소문자 구분 없이 매칭해야 함', () => {
            const content = 'HTML과 html은 같습니다.'
            const blanks = [{ id: '1', answer: 'html' }]

            const result = validateAndCreateBlindedContent(content, blanks)

            // 모든 매칭이 치환됨
            expect(result.blindedContent).toBe('[BLANK_1]과 [BLANK_1]은 같습니다.')
            expect(result.validBlanks).toHaveLength(1)
        })

        it('빈 blanks 배열도 처리해야 함', () => {
            const content = 'Test content'
            const blanks: Array<{ id: string; answer: string }> = []

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.validBlanks).toHaveLength(0)
            expect(result.invalidBlanks).toHaveLength(0)
            expect(result.blindedContent).toBe('Test content')
        })

        it('특수문자가 포함된 단어도 이스케이프하여 처리해야 함', () => {
            const content = 'C++은 시스템 프로그래밍 언어입니다.'
            const blanks = [{ id: '1', answer: 'C++' }]

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.validBlanks).toHaveLength(1)
            expect(result.blindedContent).toBe('[BLANK_1]은 시스템 프로그래밍 언어입니다.')
        })

        it('괄호가 포함된 단어도 처리해야 함', () => {
            const content = 'useState()는 React Hook입니다.'
            const blanks = [{ id: '1', answer: 'useState()' }]

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.validBlanks).toHaveLength(1)
            expect(result.blindedContent).toContain('[BLANK_1]')
        })

        it('hint가 있는 경우 유지해야 함', () => {
            const content = 'DOM은 Document Object Model입니다.'
            const blanks = [{ id: '1', answer: 'DOM', hint: '문서 객체 모델' }]

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.validBlanks[0].hint).toBe('문서 객체 모델')
        })

        it('여러 개의 blank를 순서대로 처리해야 함', () => {
            const content = 'HTML, CSS, JavaScript는 웹 개발의 기초입니다.'
            const blanks = [
                { id: '1', answer: 'HTML' },
                { id: '2', answer: 'CSS' },
                { id: '3', answer: 'JavaScript' },
            ]

            const result = validateAndCreateBlindedContent(content, blanks)

            expect(result.validBlanks).toHaveLength(3)
            expect(result.blindedContent).toBe('[BLANK_1], [BLANK_2], [BLANK_3]는 웹 개발의 기초입니다.')
        })
    })

    describe('evaluateBlankAnswer', () => {
        it('정확히 일치하면 정답으로 처리해야 함', () => {
            const result = evaluateBlankAnswer('HTTP', 'HTTP')

            expect(result.isCorrect).toBe(true)
        })

        it('대소문자 구분 없이 일치하면 정답으로 처리해야 함', () => {
            const result = evaluateBlankAnswer('http', 'HTTP')

            expect(result.isCorrect).toBe(true)
        })

        it('앞뒤 공백을 제거하고 비교해야 함', () => {
            const result = evaluateBlankAnswer('  HTTP  ', 'HTTP')

            expect(result.isCorrect).toBe(true)
        })

        it('중간 공백을 정규화해야 함', () => {
            const result = evaluateBlankAnswer('Virtual   DOM', 'Virtual DOM')

            expect(result.isCorrect).toBe(true)
        })

        it('구두점을 제거하고 비교해야 함', () => {
            const result = evaluateBlankAnswer('HTTP.', 'HTTP')

            expect(result.isCorrect).toBe(true)
        })

        it('1-2글자 오차까지 허용해야 함 (Levenshtein)', () => {
            // 'JavaScrip' vs 'JavaScript' - 1글자 차이
            const result = evaluateBlankAnswer('JavaScrip', 'JavaScript')

            expect(result.isCorrect).toBe(true)
        })

        it('3글자 이상 차이나면 오답으로 처리해야 함', () => {
            const result = evaluateBlankAnswer('Java', 'JavaScript')

            expect(result.isCorrect).toBe(false)
        })

        it('오답일 때 feedback에 정답을 포함해야 함', () => {
            const result = evaluateBlankAnswer('wrong', 'correct')

            expect(result.isCorrect).toBe(false)
            expect(result.feedback).toContain('correct')
        })

        it('짧은 단어(3글자 이하)는 정확히 일치해야 정답', () => {
            // 'DOM' (3글자) - 1글자 차이 'DON'은 오답
            const result = evaluateBlankAnswer('DON', 'DOM')

            expect(result.isCorrect).toBe(false)
        })

        it('빈 문자열은 오답으로 처리해야 함', () => {
            const result = evaluateBlankAnswer('', 'answer')

            expect(result.isCorrect).toBe(false)
        })

        it('완전히 다른 답은 오답으로 처리해야 함', () => {
            const result = evaluateBlankAnswer('React', 'Vue')

            expect(result.isCorrect).toBe(false)
        })
    })
})
