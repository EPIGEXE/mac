/**
 * 퀴즈 생성 Cloud Function
 * - 2단계 파이프라인: Stage 1 (개념 추출) → Stage 2 (퀴즈 생성)
 * - LLM API로 퀴즈 생성 (Groq 또는 Gemini)
 * - 정답은 클라이언트에 직접 반환 (IndexedDB에서 관리)
 * - Stage 1 개념 추출은 하이브리드 캐싱 (Memory + Firestore)
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { callLLMJson, getModelPresets, getRequiredSecrets } from '../llm'
import { validateGenerateQuizRequest } from '../validation/requestValidation'
import { EssayQuizLLMResponse, ExtractedConcepts, SentenceQuizLLMResponse, WordQuizLLMResponse } from '../types/llmResponse'
import { GenerateQuizResponse } from '../types/apiResponse'
import { buildConceptExtractionPrompt } from '../llm/prompts/conceptExtraction'
import { buildWordQuizPrompt } from '../llm/prompts/wordQuiz'
import { buildSentenceQuizPrompt } from '../llm/prompts/sentenceQuiz'
import { buildEssayQuizPrompt } from '../llm/prompts/essayQuiz'
import { SYSTEM_PROMPTS } from '../llm/prompts/systemPrompt'
import { validateAndProcessBlanks } from '../validation/wordQuizValidation'
import { getCachedConcepts, cacheConcepts } from '../cache'


/**
 * Stage 1: 개념 추출 (캐싱 적용)
 * - Memory 캐시 → Firestore 캐시 → LLM 호출 순서로 조회
 */
async function extractConcepts(
    title: string,
    content: string
): Promise<ExtractedConcepts> {
    // 1. 캐시 확인
    const cached = await getCachedConcepts(title, content)
    if (cached) {
        console.log('[Stage 1] Cache hit from:', cached.source)
        return cached.concepts
    }

    // 2. 캐시 미스 - LLM 호출
    console.log('[Stage 1] Cache miss, calling LLM')
    const prompt = buildConceptExtractionPrompt({ title, content })
    const MODELS = getModelPresets()

    const result = await callLLMJson<ExtractedConcepts>(
        prompt,
        SYSTEM_PROMPTS.CONCEPT_EXTRACTOR,
        { model: MODELS.ACCURATE }
    )

    console.log('[Stage 1] Extracted concepts:', JSON.stringify(result, null, 2))

    // 3. 결과 캐싱 (비동기)
    cacheConcepts(title, content, result)

    return result
}

/**
 * 퀴즈 생성 함수 (2단계 파이프라인)
 */
export const generateQuiz = onCall(
    {
        region: 'asia-northeast3',
        secrets: getRequiredSecrets(),
        timeoutSeconds: 120, // 2단계이므로 시간 늘림
        memory: '256MiB',
        enforceAppCheck: false, // TODO: App Check throttle 풀리면 true로 변경
    },
    async (request) => {
        // 입력 검증
        const data = validateGenerateQuizRequest(request.data)
        const { noteContent, noteTitle, mode } = data
        const MODELS = getModelPresets()

        try {
            let response: GenerateQuizResponse

            if (mode === 'word') {
                // ========== 단어 모드: 2단계 파이프라인 ==========

                // Stage 1: 개념 추출
                console.log('[Word Mode] Starting Stage 1: Concept Extraction')
                const extractedConcepts = await extractConcepts(noteTitle, noteContent)

                // Stage 2: 퀴즈 생성 (개념 기반)
                console.log('[Word Mode] Starting Stage 2: Quiz Generation')
                const prompt = buildWordQuizPrompt({
                    title: noteTitle,
                    content: noteContent,
                    extractedConcepts,
                })

                const llmResponse = await callLLMJson<WordQuizLLMResponse>(
                    prompt,
                    SYSTEM_PROMPTS.WORD_QUIZ_GENERATOR,
                    { model: MODELS.ACCURATE }
                )

                // ========== DEBUG: LLM 응답 로깅 ==========
                console.log('[Word Mode] LLM returned', llmResponse.blanks.length, 'blanks')
                console.log('[Word Mode] Answers:', llmResponse.blanks.map(b => b.answer))

                // Stage 3: 품질 검증 및 후처리 (중복 제거, 금지 답변 처리)
                console.log('[Word Mode] Starting Stage 3: Quality Validation & Processing')
                const processedBlanks = validateAndProcessBlanks(llmResponse)

                // 클라이언트에 키워드만 반환 (blindedContent는 클라이언트에서 생성)
                response = {
                    quizId: `quiz-${Date.now()}`,
                    mode: 'word',
                    blanks: processedBlanks.map((b) => ({
                        id: b.id,
                        answer: b.answer,
                        hint: b.hint,
                    })),
                }
            } else if (mode === 'sentence') {
                // ========== 문장 모드: Q&A 형식 ==========
                console.log('[Sentence Mode] Generating Q&A quiz')

                const prompt = buildSentenceQuizPrompt({
                    title: noteTitle,
                    content: noteContent,
                })

                const llmResponse = await callLLMJson<SentenceQuizLLMResponse>(
                    prompt,
                    SYSTEM_PROMPTS.SENTENCE_QUIZ_GENERATOR,
                    { model: MODELS.ACCURATE }
                )

                console.log('[Sentence Mode] Generated quiz with', llmResponse.questions.length, 'questions')

                // 문장 모드는 Q&A 형식으로 반환 (서버에서 LLM 평가 필요)
                response = {
                    quizId: `quiz-${Date.now()}`,
                    mode: 'sentence',
                    questions: llmResponse.questions.map((q) => ({
                        id: q.id,
                        question: q.question,
                        answer: q.answer,
                        hint: q.hint,
                        keyPoints: q.keyPoints,
                    })),
                }
            } else {
                // ========== 서술형 모드: 한국 테크기업 면접 스타일 ==========
                console.log('[Essay Mode] Generating interview-style question')

                const prompt = buildEssayQuizPrompt({
                    title: noteTitle,
                    content: noteContent,
                })

                const llmResponse = await callLLMJson<EssayQuizLLMResponse>(
                    prompt,
                    SYSTEM_PROMPTS.ESSAY_GENERATOR,
                    { model: MODELS.ACCURATE }
                )

                console.log('[Essay Mode] Generated question for company:', llmResponse.company)

                response = {
                    quizId: `quiz-${Date.now()}`,
                    mode: 'essay',
                    essay: {
                        company: llmResponse.company,
                        question: llmResponse.question,
                        questionType: llmResponse.questionType,
                        followUpQuestions: llmResponse.followUpQuestions,
                        expectedPoints: llmResponse.expectedPoints,
                        answerGuide: llmResponse.answerGuide,
                    },
                }
            }

            return response
        } catch (error) {
            console.error('Failed to generate quiz:', error)

            if (error instanceof HttpsError) {
                throw error
            }

            // Rate Limit 에러 처리
            if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
                throw new HttpsError(
                    'resource-exhausted',
                    'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
                )
            }

            throw new HttpsError('internal', 'Failed to generate quiz. Please try again.')
        }
    }
)
