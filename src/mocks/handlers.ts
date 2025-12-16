/**
 * MSW Handlers for Firebase Cloud Functions
 * - Firebase httpsCallable은 POST 요청을 특정 엔드포인트로 보냄
 * - 형식: https://{region}-{project}.cloudfunctions.net/{functionName}
 */
import { http, HttpResponse, delay } from 'msw'
import type {
    GenerateQuizResponse,
    EvaluateEssayResponse,
    EvaluateSentenceAnswersResponse,
} from '../features/Study/types'

// ================================ Mock 설정 ================================
const MOCK_DELAY = 800

// ================================ Mock 데이터 ================================

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
    score: 30,
    grade: 'NEEDS_WORK',
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

// ================================ Handlers ================================

export const handlers = [
    // generateQuiz - Firebase Cloud Function
    http.post('*/generateQuiz', async ({ request }) => {
        await delay(MOCK_DELAY)

        const body = await request.json() as { data: { mode: string } }
        const mode = body.data?.mode

        console.log('[MSW] generateQuiz intercepted:', mode)

        let result: GenerateQuizResponse
        switch (mode) {
            case 'word':
                result = MOCK_WORD_QUIZ
                break
            case 'sentence':
                result = MOCK_SENTENCE_QUIZ
                break
            case 'essay':
                result = MOCK_ESSAY_QUIZ
                break
            default:
                result = MOCK_WORD_QUIZ
        }

        // Firebase httpsCallable 응답 형식
        return HttpResponse.json({ result: { data: result } })
    }),

    // evaluateAnswer (Essay) - Firebase Cloud Function
    http.post('*/evaluateAnswer', async ({ request }) => {
        await delay(MOCK_DELAY * 1.5)

        const body = await request.json() as { data: { userAnswer: string } }
        console.log('[MSW] evaluateAnswer intercepted:', body.data?.userAnswer?.slice(0, 50) + '...')

        return HttpResponse.json({ result: { data: MOCK_ESSAY_RESULT } })
    }),

    // evaluateSentenceAnswers - Firebase Cloud Function
    http.post('*/evaluateSentenceAnswers', async ({ request }) => {
        await delay(MOCK_DELAY * 1.5)

        const body = await request.json() as { data: { blanks: unknown[] } }
        console.log('[MSW] evaluateSentenceAnswers intercepted:', body.data?.blanks?.length, 'answers')

        return HttpResponse.json({ result: { data: MOCK_SENTENCE_RESULT } })
    }),
]
