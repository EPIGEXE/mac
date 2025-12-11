/**
 * 답변 평가 Cloud Functions
 * - 서술형 모드: LLM 평가
 * - 문장 모드: LLM 일괄 평가 (keyPoints 기반)
 * - 단어 모드: 클라이언트에서 직접 채점
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { callLLMJson, getModelPresets, getRequiredSecrets } from '../llm'
import { SYSTEM_PROMPTS, buildEvaluateEssayPrompt, buildEvaluateSentenceAnswersPrompt } from '../llm/prompts'

// 서술형 답변 평가 요청 타입 (한국 테크기업 면접 스타일)
interface EvaluateEssayRequest {
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    answerGuide: string
    userAnswer: string
}

// 서술형 평가 LLM 응답 타입
interface EssayEvaluationResponse {
    score: number
    grade: 'PASS' | 'BORDERLINE' | 'NEEDS_WORK'
    matchedPoints: string[]
    missedPoints: string[]
    strengths: string[]
    improvements: string[]
    feedback: string
    tip: string
}

/**
 * 서술형 답변 평가 함수 (한국 테크기업 면접 스타일)
 */
export const evaluateAnswer = onCall(
    {
        region: 'asia-northeast3',
        secrets: getRequiredSecrets(),
        timeoutSeconds: 60, // 면접 평가는 시간이 더 필요
        memory: '256MiB',
        enforceAppCheck: false, // TODO: App Check throttle 풀리면 true로 변경
    },
    async (request) => {
        const data = request.data as EvaluateEssayRequest
        const MODELS = getModelPresets()

        // 입력 검증
        if (!data.company || !data.question || !data.expectedPoints || !data.userAnswer) {
            throw new HttpsError('invalid-argument', 'company, question, expectedPoints, userAnswer are required')
        }

        if (data.userAnswer.length > 10000) {
            throw new HttpsError('invalid-argument', 'userAnswer must be less than 10000 characters')
        }

        try {
            console.log('[Essay Evaluation] Evaluating answer for', data.company)

            const prompt = buildEvaluateEssayPrompt({
                company: data.company,
                question: data.question,
                questionType: data.questionType || 'concept',
                expectedPoints: data.expectedPoints,
                answerGuide: data.answerGuide || '',
                userAnswer: data.userAnswer,
            })

            const llmResponse = await callLLMJson<EssayEvaluationResponse>(
                prompt,
                SYSTEM_PROMPTS.ANSWER_EVALUATOR,
                { model: MODELS.ACCURATE }
            )

            console.log('[Essay Evaluation] Score:', llmResponse.score, 'Grade:', llmResponse.grade)

            return {
                score: llmResponse.score,
                grade: llmResponse.grade,
                matchedPoints: llmResponse.matchedPoints,
                missedPoints: llmResponse.missedPoints,
                strengths: llmResponse.strengths,
                improvements: llmResponse.improvements,
                feedback: llmResponse.feedback,
                tip: llmResponse.tip,
            }
        } catch (error) {
            console.error('Failed to evaluate answer:', error)

            if (error instanceof HttpsError) {
                throw error
            }

            throw new HttpsError('internal', 'Failed to evaluate answer. Please try again.')
        }
    }
)

// ================================ 문장 모드 일괄 평가 ================================

// 문장 모드 요청 타입
interface EvaluateSentenceAnswersRequest {
    blanks: Array<{
        id: string
        correctAnswer: string
        keyPoints: string[]
        userAnswer: string
    }>
}

// 문장 모드 LLM 응답 타입
interface SentenceEvaluationResponse {
    results: Array<{
        blankId: string
        isCorrect: boolean
        score: number
        matchedPoints: string[]
        missedPoints: string[]
        feedback: string
    }>
    totalScore: number
    overallFeedback: string
}

/**
 * 문장 모드 답변 일괄 평가 함수
 * - 모든 빈칸 답변을 한 번에 평가
 * - keyPoints 기반으로 의미적 평가 수행
 */
export const evaluateSentenceAnswers = onCall(
    {
        region: 'asia-northeast3',
        secrets: getRequiredSecrets(),
        timeoutSeconds: 60, // 여러 답변 평가하므로 시간 늘림
        memory: '256MiB',
        enforceAppCheck: false, // TODO: App Check throttle 풀리면 true로 변경
    },
    async (request) => {
        const data = request.data as EvaluateSentenceAnswersRequest
        const MODELS = getModelPresets()

        // 입력 검증
        if (!data.blanks || !Array.isArray(data.blanks) || data.blanks.length === 0) {
            throw new HttpsError('invalid-argument', 'blanks array is required')
        }

        for (const blank of data.blanks) {
            if (!blank.id || !blank.correctAnswer || !blank.keyPoints) {
                throw new HttpsError('invalid-argument', 'Each blank must have id, correctAnswer, and keyPoints')
            }
            // userAnswer는 빈 문자열일 수 있음 (답변 안 한 경우)
            if (typeof blank.userAnswer !== 'string') {
                throw new HttpsError('invalid-argument', 'Each blank must have userAnswer (can be empty string)')
            }
        }

        try {
            console.log('[Sentence Evaluation] Evaluating', data.blanks.length, 'answers')

            const prompt = buildEvaluateSentenceAnswersPrompt({
                blanks: data.blanks,
            })

            const llmResponse = await callLLMJson<SentenceEvaluationResponse>(
                prompt,
                SYSTEM_PROMPTS.ANSWER_EVALUATOR,
                { model: MODELS.ACCURATE }
            )

            console.log('[Sentence Evaluation] Total score:', llmResponse.totalScore)

            return {
                results: llmResponse.results,
                totalScore: llmResponse.totalScore,
                overallFeedback: llmResponse.overallFeedback,
            }
        } catch (error) {
            console.error('Failed to evaluate sentence answers:', error)

            if (error instanceof HttpsError) {
                throw error
            }

            throw new HttpsError('internal', 'Failed to evaluate answers. Please try again.')
        }
    }
)
