/**
 * Study Mode API 서비스
 * - Cloud Functions: 퀴즈 생성, 서술형 평가, 힌트 생성
 * - 로컬: 단어/문장 채점 (클라이언트에서 직접)
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../lib/firebase'
import type {
    GenerateQuizRequest,
    GenerateQuizResponse,
    EvaluateEssayRequest,
    EvaluateEssayResponse,
    GetHintRequest,
    GetHintResponse,
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

const getHintFn = httpsCallable<GetHintRequest, GetHintResponse>(functions, 'getHint')

// ================================ API 함수들 ================================

/**
 * 퀴즈 생성 (Cloud Function)
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
 * 서술형 답변 평가 (Cloud Function)
 */
export async function evaluateEssay(params: {
    question: string
    expectedPoints: string[]
    userAnswer: string
}): Promise<EvaluateEssayResponse> {
    const result = await evaluateEssayFn(params)
    return result.data
}

/**
 * 힌트 요청 (Cloud Function)
 */
export async function getHint(params: {
    answer: string
    hintLevel: number
    previousHints: string[]
}): Promise<GetHintResponse> {
    const result = await getHintFn(params)
    return result.data
}

// ================================ 에러 처리 ================================

/**
 * Firebase Functions 에러 처리
 */
export function handleStudyApiError(error: unknown): string {
    if (error instanceof Error) {
        // Firebase Functions 에러
        if ('code' in error) {
            const code = (error as { code: string }).code

            switch (code) {
                case 'functions/resource-exhausted':
                    return '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
                case 'functions/invalid-argument':
                    return '잘못된 요청입니다.'
                case 'functions/internal':
                    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                default:
                    return error.message
            }
        }

        return error.message
    }

    return '알 수 없는 오류가 발생했습니다.'
}
