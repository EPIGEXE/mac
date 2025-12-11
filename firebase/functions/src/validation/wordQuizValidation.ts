/**
 * Stage 3: 품질 검증 및 후처리
 * - 중복 답변: 무조건 제거 (첫 번째만 유지)
 * - 금지된 답변: 남은 개수가 5개 초과일 때만 제거
 */

import { WordQuizLLMResponse } from "../types/llmResponse"

// 금지된 추상적 답변 패턴
const FORBIDDEN_PATTERNS = [
    // 일반 동사
    '조작', '수정', '변경', '생성', '삭제', '추가', '처리', '실행',
    // 일반 형용사
    '중요한', '필수적인', '다양한',
    // 일반 단어
    '화면', '요소', '과정', '단계', '결과',
]

// 추상적 접미사 패턴
const ABSTRACT_SUFFIXES = ['최적화', '전략', '방법', '방식', '하기']

// 금지된 답변인지 체크
function isForbiddenAnswer(answer: string): boolean {
    const lowerAnswer = answer.toLowerCase()
    if (FORBIDDEN_PATTERNS.some(p => lowerAnswer.includes(p))) return true
    if (ABSTRACT_SUFFIXES.some(s => lowerAnswer.endsWith(s))) return true
    return false
}

export function validateAndProcessBlanks(
    quizResponse: WordQuizLLMResponse
): WordQuizLLMResponse['blanks'] {
    // 로깅용 변수
    const removedDuplicates: string[] = []
    const removedForbidden: string[] = []
    const warnings: string[] = []

    // Step 1: 중복 제거 (무조건, 첫 번째만 유지)
    const seenAnswers = new Set<string>()
    const deduplicatedBlanks = quizResponse.blanks.filter(blank => {
        const normalizedAnswer = blank.answer.toLowerCase().trim()
        if (seenAnswers.has(normalizedAnswer)) {
            removedDuplicates.push(blank.answer)
            return false
        }
        seenAnswers.add(normalizedAnswer)
        return true
    })

    // Step 2: 금지된 답변 분류
    const forbiddenBlanks: typeof deduplicatedBlanks = []
    const validBlanks: typeof deduplicatedBlanks = []

    deduplicatedBlanks.forEach(blank => {
        if (isForbiddenAnswer(blank.answer)) {
            forbiddenBlanks.push(blank)
        } else {
            validBlanks.push(blank)
        }
    })

    // Step 3: 금지된 답변 처리 (5개 초과 시에만 제거)
    let finalBlanks: typeof deduplicatedBlanks

    if (validBlanks.length > 5) {
        // 유효한 답변이 5개 초과 → 금지된 답변 모두 제거
        finalBlanks = validBlanks
        removedForbidden.push(...forbiddenBlanks.map(b => b.answer))
    } else {
        // 유효한 답변이 5개 이하 → 금지된 답변 유지 (경고만)
        finalBlanks = [...validBlanks, ...forbiddenBlanks]
        if (forbiddenBlanks.length > 0) {
            warnings.push(`Abstract/forbidden answers kept (insufficient valid blanks): ${forbiddenBlanks.map(b => b.answer).join(', ')}`)
        }
    }

    // 로깅
    console.log('[Stage 3] Quality validation & processing:', {
        originalCount: quizResponse.blanks.length,
        afterDedup: deduplicatedBlanks.length,
        validCount: validBlanks.length,
        forbiddenCount: forbiddenBlanks.length,
        finalCount: finalBlanks.length,
        removedDuplicates,
        removedForbidden,
        warnings,
    })

    return finalBlanks
}