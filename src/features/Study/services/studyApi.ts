/**
 * Study Mode API 서비스
 * - Cloud Functions: 퀴즈 생성, 서술형 평가, 힌트 생성
 * - 로컬: 단어/문장 채점 (클라이언트에서 직접)
 * - Mock 모드: UI 개발용 (USE_MOCK_API=true)
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

// ================================ Mock 모드 설정 ================================
// UI 개발 시 true로 설정하면 백엔드 호출 없이 목 데이터 사용
const USE_MOCK_API = false

// Mock 응답 지연 시간 (ms) - 실제 API 느낌을 위해
const MOCK_DELAY = 800

// ================================ StrictMode 중복 호출 방지 ================================
// 진행 중인 요청을 추적하여 동일 요청의 중복 호출 방지
const pendingRequests = new Map<string, Promise<unknown>>()

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

// ================================ Mock 데이터 ================================

// 단어 모드: LLM은 키워드만 반환, blindedContent는 클라이언트에서 생성
const MOCK_WORD_QUIZ: GenerateQuizResponse = {
    quizId: 'mock-word-quiz-1',
    mode: 'word',
    blanks: [
        { id: '1', answer: 'DOM', hint: 'Document Object Model' },
        { id: '2', answer: 'CSSOM', hint: 'CSS Object Model' },
        { id: '3', answer: '렌더 트리', hint: 'DOM과 CSSOM의 결합' },
        { id: '4', answer: '레이아웃', hint: '요소의 위치와 크기 계산' },
        { id: '5', answer: '페인트', hint: '픽셀을 화면에 그리기' },
    ],
}

const MOCK_SENTENCE_QUIZ: GenerateQuizResponse = {
    quizId: 'mock-sentence-quiz-1',
    mode: 'sentence',
    questions: [
        {
            id: 'q1',
            question: 'Critical Rendering Path에서 DOM과 CSSOM이 결합되어 만들어지는 것은 무엇인가요?',
            answer: '렌더링 트리 (Render Tree)',
            hint: '두 트리가 합쳐져서 새로운 트리가 됩니다',
            keyPoints: ['렌더링 트리', 'Render Tree', '렌더 트리'],
        },
        {
            id: 'q2',
            question: 'CSS가 로드되기 전에 스타일 없는 HTML이 잠깐 보이는 현상을 무엇이라 하나요?',
            answer: 'FOUC (Flash of Unstyled Content)',
            hint: '영어 약자로 4글자입니다',
            keyPoints: ['FOUC', 'Flash of Unstyled Content'],
        },
        {
            id: 'q3',
            question: 'JavaScript에서 HTML 파싱이 끝난 후 순서대로 실행되게 하는 script 속성은?',
            answer: 'defer',
            hint: '지연시킨다는 의미의 영어 단어',
            keyPoints: ['defer'],
        },
        {
            id: 'q4',
            question: '브라우저에게 현재 페이지에서 곧 필요할 리소스를 미리 가져오도록 지시하는 리소스 힌트는?',
            answer: 'preload',
            hint: '미리 로드한다는 의미',
            keyPoints: ['preload', 'rel="preload"'],
        },
        {
            id: 'q5',
            question: '웹 폰트 로딩 전 시스템 폰트로 먼저 표시하고, 로드 후 교체하는 CSS 속성값은?',
            answer: 'font-display: swap',
            hint: 'font-display 속성의 값 중 하나',
            keyPoints: ['swap', 'font-display: swap'],
        },
    ],
}

const MOCK_ESSAY_QUIZ: GenerateQuizResponse = {
    quizId: 'mock-essay-quiz-1',
    mode: 'essay',
    essay: {
        company: '토스',
        question: 'Critical Rendering Path 최적화를 통해 웹 성능을 개선한 경험이 있다면 설명해주세요. 어떤 문제가 있었고, 어떻게 해결했나요?',
        questionType: 'application',
        followUpQuestions: [
            '렌더링 차단 리소스를 어떻게 식별했나요?',
            'defer와 async의 차이점과 각각 언제 사용하는지 설명해주세요.',
            '성능 개선 결과를 어떻게 측정했나요?',
        ],
        expectedPoints: [
            'CRP의 각 단계(DOM, CSSOM, 렌더링 트리, 레이아웃, 페인트)에 대한 이해',
            '렌더링 차단 리소스(CSS, JS) 최적화 방법',
            'defer/async 속성의 적절한 사용',
            'preload, prefetch 등 리소스 힌트 활용',
            '실제 측정 지표(FCP, LCP 등) 언급',
        ],
        answerGuide: 'CRP 최적화 경험을 구체적인 수치와 함께 설명하고, 사용한 기법들의 원리를 설명할 수 있어야 합니다.',
    },
}

const MOCK_ESSAY_RESULT: EvaluateEssayResponse = {
    score: 75,
    grade: 'PASS',
    matchedPoints: [
        'CRP 단계에 대한 기본 이해',
        'defer/async 속성 활용',
        '리소스 힌트 언급',
    ],
    missedPoints: [
        '구체적인 성능 측정 지표 부재',
        '실제 개선 수치 미언급',
    ],
    strengths: [
        'CRP 개념을 정확히 이해하고 있음',
        '최적화 기법들을 적절히 나열함',
    ],
    improvements: [
        'Lighthouse나 WebPageTest 같은 도구로 측정한 구체적 수치를 언급하면 좋겠습니다',
        '실제 프로젝트에서 적용한 사례를 더 구체적으로 설명해보세요',
    ],
    feedback: '전반적으로 CRP에 대한 이해도가 좋습니다. 다만 실무에서는 "얼마나 개선됐는지"를 수치로 보여주는 것이 중요합니다. FCP가 3초에서 1.5초로 단축됐다는 식의 구체적인 결과를 말할 수 있으면 더 좋은 인상을 줄 수 있습니다.',
    tip: '면접에서 성능 최적화를 말할 때는 항상 Before/After 수치를 준비하세요. 측정 없는 최적화는 설득력이 떨어집니다.',
}

const MOCK_SENTENCE_RESULT: EvaluateSentenceAnswersResponse = {
    results: [
        { blankId: 'q1', isCorrect: true, score: 100, matchedPoints: ['렌더링 트리'], missedPoints: [], feedback: '정확합니다!' },
        { blankId: 'q2', isCorrect: true, score: 80, matchedPoints: ['FOUC'], missedPoints: ['전체 용어'], feedback: '약자만 맞췄습니다' },
        { blankId: 'q3', isCorrect: true, score: 100, matchedPoints: ['defer'], missedPoints: [], feedback: '정확합니다!' },
        { blankId: 'q4', isCorrect: false, score: 0, matchedPoints: [], missedPoints: ['preload'], feedback: '정답은 preload입니다' },
        { blankId: 'q5', isCorrect: true, score: 100, matchedPoints: ['swap'], missedPoints: [], feedback: '정확합니다!' },
    ],
    totalScore: 76,
    overallFeedback: '대부분 잘 이해하고 있습니다. 리소스 힌트 부분을 복습해보세요.',
}

// Mock 유틸리티
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ================================ 클라이언트 Blind 처리 ================================

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 원본 콘텐츠에서 키워드를 찾아 [BLANK_N]으로 치환
 * - 대소문자 구분 없이 모든 해당 단어를 blind 처리
 * - 마크다운 문법 내부(코드블록 등)도 처리
 */
export function createBlindedContent(
    originalContent: string,
    blanks: Array<{ id: string; answer: string }>
): string {
    let result = originalContent

    blanks.forEach((blank) => {
        // 단어 경계를 고려한 정규식 (한글은 단어 경계 없이 매칭)
        const pattern = escapeRegex(blank.answer)
        const regex = new RegExp(pattern, 'gi')
        result = result.replace(regex, `[BLANK_${blank.id}]`)
    })

    return result
}

// ================================ API 함수들 ================================

/**
 * 퀴즈 생성 (Cloud Function 또는 Mock)
 * - StrictMode 중복 호출 방지: 동일 noteId+mode 요청은 진행 중인 Promise 재사용
 */
export async function generateQuiz(params: {
    noteId: string
    noteContent: string
    noteTitle: string
    mode: StudyModeType
    blankCount?: number
}): Promise<GenerateQuizResponse> {
    if (USE_MOCK_API) {
        await delay(MOCK_DELAY)
        console.log('[Mock] generateQuiz:', params.mode)

        switch (params.mode) {
            case 'word':
                return MOCK_WORD_QUIZ
            case 'sentence':
                return MOCK_SENTENCE_QUIZ
            case 'essay':
                return MOCK_ESSAY_QUIZ
            default:
                return MOCK_WORD_QUIZ
        }
    }

    // StrictMode 중복 호출 방지
    const requestKey = `quiz:${params.noteId}:${params.mode}`

    // 이미 진행 중인 동일 요청이 있으면 그 Promise 재사용
    const pending = pendingRequests.get(requestKey)
    if (pending) {
        console.log('[StudyApi] Reusing pending request:', requestKey)
        return pending as Promise<GenerateQuizResponse>
    }

    // 새 요청 시작
    const requestPromise = generateQuizFn(params)
        .then(result => {
            pendingRequests.delete(requestKey)
            return result.data
        })
        .catch(err => {
            pendingRequests.delete(requestKey)
            throw err
        })

    pendingRequests.set(requestKey, requestPromise)
    console.log('[StudyApi] New request started:', requestKey)

    return requestPromise
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
 * 서술형 답변 평가 (Cloud Function 또는 Mock) - 한국 테크기업 면접 스타일
 * - StrictMode 중복 호출 방지
 */
export async function evaluateEssay(params: {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    answerGuide: string
    userAnswer: string
}): Promise<EvaluateEssayResponse> {
    if (USE_MOCK_API) {
        await delay(MOCK_DELAY * 1.5) // 평가는 조금 더 오래 걸리는 느낌
        console.log('[Mock] evaluateEssay:', params.userAnswer.slice(0, 50) + '...')
        return MOCK_ESSAY_RESULT
    }

    // StrictMode 중복 호출 방지 (질문+답변 해시로 키 생성)
    const requestKey = `essay:${params.question.slice(0, 50)}:${params.userAnswer.slice(0, 50)}`

    const pending = pendingRequests.get(requestKey)
    if (pending) {
        console.log('[StudyApi] Reusing pending essay request')
        return pending as Promise<EvaluateEssayResponse>
    }

    const requestPromise = evaluateEssayFn(params)
        .then(result => {
            pendingRequests.delete(requestKey)
            return result.data
        })
        .catch(err => {
            pendingRequests.delete(requestKey)
            throw err
        })

    pendingRequests.set(requestKey, requestPromise)
    return requestPromise
}

/**
 * 문장 모드 답변 일괄 평가 (Cloud Function 또는 Mock)
 * - 모든 문장 빈칸 답변을 한 번에 LLM으로 평가
 * - keyPoints 기반 의미적 평가 수행
 * - StrictMode 중복 호출 방지
 */
export async function evaluateSentenceAnswers(params: {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}): Promise<EvaluateSentenceAnswersResponse> {
    if (USE_MOCK_API) {
        await delay(MOCK_DELAY * 1.5)
        console.log('[Mock] evaluateSentenceAnswers:', params.blanks.length, 'answers')
        return MOCK_SENTENCE_RESULT
    }

    // StrictMode 중복 호출 방지
    const blankIds = params.blanks.map(b => b.id).join(',')
    const requestKey = `sentence:${blankIds}`

    const pending = pendingRequests.get(requestKey)
    if (pending) {
        console.log('[StudyApi] Reusing pending sentence request')
        return pending as Promise<EvaluateSentenceAnswersResponse>
    }

    const requestPromise = evaluateSentenceAnswersFn(params)
        .then(result => {
            pendingRequests.delete(requestKey)
            return result.data
        })
        .catch(err => {
            pendingRequests.delete(requestKey)
            throw err
        })

    pendingRequests.set(requestKey, requestPromise)
    return requestPromise
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
