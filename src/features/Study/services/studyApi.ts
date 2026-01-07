/**
 * Study Mode API 서비스
 * - Cloud Functions: 퀴즈 생성, 서술형 평가, 힌트 생성
 * - 로컬: 단어/문장 채점 (클라이언트에서 직접)
 * - Mock: MSW가 개발 환경에서 네트워크 레벨 인터셉트
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../lib/firebase'
import type {
    GenerateQuizRequest,
    GenerateQuizResponse,
    EvaluateEssayRequest,
    EvaluateEssayResponse,
    EvaluateSentenceAnswersRequest,
    EvaluateSentenceAnswersResponse,
    StudyModeType,
} from '../types'

// Cloud Functions 래퍼
const generateQuizFn = httpsCallable<GenerateQuizRequest, GenerateQuizResponse>(
    functions,
    'generateQuiz'
)

const evaluateEssayFn = httpsCallable<EvaluateEssayRequest, EvaluateEssayResponse>(
    functions,
    'evaluateAnswer'
)

const evaluateSentenceAnswersFn = httpsCallable<
    EvaluateSentenceAnswersRequest,
    EvaluateSentenceAnswersResponse
>(functions, 'evaluateSentenceAnswers')

// ================================ 클라이언트 Blind 처리 ================================

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Blank 검증 결과 타입
 */
export interface ValidatedBlanksResult {
    validBlanks: Array<{ id: string; answer: string; hint?: string }> // 검증 통과한 blanks
    invalidBlanks: Array<{ id: string; answer: string; hint?: string; reason: string }> // 검증 실패한 blanks
    blindedContent: string // blank 치환된 콘텐츠
}

/**
 * Blanks를 검증하고 유효한 것만 필터링
 * - 실제 콘텐츠에 존재하는 단어만 유효한 blank로 인정
 * - 유효한 blank만으로 blindedContent 생성
 */
export function validateAndCreateBlindedContent(
    originalContent: string,
    blanks: Array<{ id: string; answer: string; hint?: string }>
): ValidatedBlanksResult {
    const validBlanks: Array<{ id: string; answer: string; hint?: string }> = []
    const invalidBlanks: Array<{ id: string; answer: string; hint?: string; reason: string }> = []
    let result = originalContent
    let newId = 1 // 유효한 blank에 새 ID 부여 (순차적으로)

    blanks.forEach((blank) => {
        const pattern = escapeRegex(blank.answer)
        const regex = new RegExp(pattern, 'gi')

        // 콘텐츠에 해당 단어가 존재하는지 확인
        if (regex.test(result)) {
            // 유효한 blank - 새 ID 부여하고 치환
            const newBlank = { ...blank, id: String(newId) }
            validBlanks.push(newBlank)
            result = result.replace(new RegExp(pattern, 'gi'), `[BLANK_${newId}]`)
            newId++
        } else {
            // 무효한 blank
            invalidBlanks.push({
                ...blank,
                reason: `"${blank.answer}" not found in content`,
            })
        }
    })

    // 무효한 blank가 있으면 로그 출력
    if (invalidBlanks.length > 0) {
        console.warn('[validateAndCreateBlindedContent] Invalid blanks filtered out:', invalidBlanks)
    }

    return {
        validBlanks,
        invalidBlanks,
        blindedContent: result,
    }
}

// ================================ API 함수들 ================================

/**
 * 퀴즈 생성 (Cloud Function)
 * - TanStack Query가 중복 호출 방지 및 캐싱 담당
 * - MSW가 개발 환경에서 네트워크 인터셉트
 */
export async function generateQuiz(params: {
    noteId: string
    noteContent: string
    noteTitle: string
    mode: StudyModeType
    blankCount?: number
}): Promise<GenerateQuizResponse> {
    const result = await generateQuizFn(params)
    return result.data
}

/**
 * 단어/문장 답변 채점 (로컬)
 * 클라이언트에서 직접 채점
 */
export function evaluateBlankAnswer(
    userAnswer: string,
    correctAnswer: string
): { isCorrect: boolean; feedback?: string } {
    // 정규화
    const normalize = (s: string) =>
        s
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[.,;:!?]/g, '')

    const normalizedUser = normalize(userAnswer)
    const normalizedCorrect = normalize(correctAnswer)

    // 정확히 일치
    if (normalizedUser === normalizedCorrect) {
        return { isCorrect: true }
    }

    // 허용 오차 체크 (1-2글자 차이)
    const distance = levenshteinDistance(normalizedUser, normalizedCorrect)
    if (distance <= 2 && normalizedCorrect.length > 3) {
        return { isCorrect: true }
    }

    return {
        isCorrect: false,
        feedback: `정답: ${correctAnswer}`,
    }
}

/**
 * Levenshtein 거리 계산 (편집 거리)
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // 치환
                    matrix[i][j - 1] + 1, // 삽입
                    matrix[i - 1][j] + 1 // 삭제
                )
            }
        }
    }

    return matrix[b.length][a.length]
}

/**
 * 서술형 답변 평가 (Cloud Function) - 한국 테크기업 면접 스타일
 * - TanStack Query Mutation이 요청 관리
 * - MSW가 개발 환경에서 네트워크 인터셉트
 */
export async function evaluateEssay(params: {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    answerGuide: string
    userAnswer: string
}): Promise<EvaluateEssayResponse> {
    const result = await evaluateEssayFn(params)
    return result.data
}

/**
 * 문장 모드 답변 일괄 평가 (Cloud Function)
 * - 모든 문장 빈칸 답변을 한 번에 LLM으로 평가
 * - keyPoints 기반 의미적 평가 수행
 * - TanStack Query Mutation이 요청 관리
 * - MSW가 개발 환경에서 네트워크 인터셉트
 */
export async function evaluateSentenceAnswers(params: {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}): Promise<EvaluateSentenceAnswersResponse> {
    const result = await evaluateSentenceAnswersFn(params)
    return result.data
}

