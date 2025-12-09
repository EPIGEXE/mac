/**
 * 퀴즈 생성 Cloud Function
 * - 2단계 파이프라인: Stage 1 (개념 추출) → Stage 2 (퀴즈 생성)
 * - LLM API로 퀴즈 생성 (Groq 또는 Gemini)
 * - 정답은 클라이언트에 직접 반환 (IndexedDB에서 관리)
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { callLLMJson, getModelPresets, getRequiredSecrets } from '../llm'
import {
    SYSTEM_PROMPTS,
    buildConceptExtractionPrompt,
    buildBlindQuizPrompt,
    buildEssayQuizPrompt,
    buildSentenceQuizPrompt,
    type ExtractedConcepts,
    type SentenceQuestion,
} from '../llm/prompts'
import { validateGenerateQuizRequest } from '../utils/validation'

// LLM 응답 타입 (키워드만 반환, blindedContent는 클라이언트에서 생성)
interface BlindQuizLLMResponse {
    blanks: {
        id: string
        answer: string
        hint: string
        section?: string
        type?: string
    }[]
}

// 서술형 모드 LLM 응답 타입 (한국 테크기업 면접 스타일)
interface EssayQuizLLMResponse {
    company: string
    question: string
    questionType: 'concept' | 'comparison' | 'application' | 'optimization' | 'troubleshooting' | 'architecture'
    followUpQuestions: string[]
    expectedPoints: string[]
    answerGuide: string
}

// 문장 모드 LLM 응답 타입 (Q&A 형식)
interface SentenceQuizLLMResponse {
    questions: SentenceQuestion[]
}

// 클라이언트 응답 타입 (정답 포함)
// 단어 모드: blanks만 반환, blindedContent는 클라이언트에서 생성
interface GenerateQuizResponse {
    quizId: string
    mode: 'word' | 'sentence' | 'essay'
    // 단어 모드용 blanks (키워드만, blindedContent는 클라이언트에서 생성)
    blanks?: {
        id: string
        answer: string
        hint: string
    }[]
    // 문장 모드용 questions (Q&A 형식)
    questions?: {
        id: string
        question: string
        answer: string
        hint: string
        keyPoints: string[]
    }[]
    // 서술형 모드 (한국 테크기업 면접 스타일)
    essay?: {
        company: string
        question: string
        questionType: string
        followUpQuestions: string[]
        expectedPoints: string[]
        answerGuide: string
    }
    // 디버그용: 추출된 개념 정보 및 검증 결과
    _debug?: {
        extractedConcepts?: ExtractedConcepts
        validationResult?: ValidationResult
    }
}

/**
 * Stage 1: 개념 추출
 */
async function extractConcepts(
    title: string,
    content: string
): Promise<ExtractedConcepts> {
    const prompt = buildConceptExtractionPrompt({ title, content })
    const MODELS = getModelPresets()

    const result = await callLLMJson<ExtractedConcepts>(
        prompt,
        SYSTEM_PROMPTS.CONCEPT_EXTRACTOR,
        { model: MODELS.ACCURATE }
    )

    console.log('[Stage 1] Extracted concepts:', JSON.stringify(result, null, 2))

    return result
}

/**
 * Stage 3: 품질 검증 (코드 기반)
 */
interface ValidationResult {
    isValid: boolean
    issues: string[]
    warnings: string[]
}

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

function validateQuizQuality(
    quizResponse: BlindQuizLLMResponse,
    extractedConcepts: ExtractedConcepts
): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []
    const blanks = quizResponse.blanks
    const answers = blanks.map(b => b.answer.toLowerCase().trim())

    // 1. 중복 답변 검증
    const duplicates = answers.filter((a, i) => answers.indexOf(a) !== i)
    if (duplicates.length > 0) {
        issues.push(`Duplicate answers: ${[...new Set(duplicates)].join(', ')}`)
    }

    // 2. 답변 길이 검증 (5단어 초과)
    const longAnswers = blanks.filter(b => b.answer.split(/\s+/).length > 5)
    if (longAnswers.length > 0) {
        issues.push(`Answers too long: ${longAnswers.map(b => b.answer).join(', ')}`)
    }

    // 3. critical 개념 커버리지 검증 (abstract 제외)
    const criticalConcepts = extractedConcepts.concepts
        .filter(c => c.importance === 'critical' && c.specificity !== 'abstract')
        .map(c => c.term.toLowerCase())
    const answersLower = answers.map(a => a.toLowerCase())
    const missingCritical = criticalConcepts.filter(c =>
        !answersLower.some(a => a.includes(c) || c.includes(a))
    )
    if (missingCritical.length > 0) {
        issues.push(`Missing critical concepts: ${missingCritical.join(', ')}`)
    }

    // 4. 빈칸 유형 다양성 검증
    const types = [...new Set(blanks.map(b => b.type).filter(Boolean))]
    if (types.length < 2) {
        warnings.push(`Low type diversity: only ${types.length} type(s) used`)
    }

    // 5. 금지된 추상적 답변 검증
    const forbiddenAnswers = blanks.filter(b => {
        const answer = b.answer.toLowerCase()
        // 금지 패턴 체크
        if (FORBIDDEN_PATTERNS.some(p => answer.includes(p))) return true
        // 추상적 접미사 체크
        if (ABSTRACT_SUFFIXES.some(s => answer.endsWith(s))) return true
        return false
    })
    if (forbiddenAnswers.length > 0) {
        warnings.push(`Abstract/forbidden answers: ${forbiddenAnswers.map(b => b.answer).join(', ')}`)
    }

    // 6. 섹션 제목이 그대로 답변으로 사용된 경우
    const sectionTitles = extractedConcepts.sections.map(s => s.name.toLowerCase())
    const sectionAsAnswer = blanks.filter(b =>
        sectionTitles.some(title => b.answer.toLowerCase() === title)
    )
    if (sectionAsAnswer.length > 0) {
        warnings.push(`Section titles used as answers: ${sectionAsAnswer.map(b => b.answer).join(', ')}`)
    }

    // 7. abstract 개념이 답변으로 사용된 경우 (방안 1 검증)
    const abstractConcepts = extractedConcepts.concepts
        .filter(c => c.specificity === 'abstract')
        .map(c => c.term.toLowerCase())
    const abstractAsAnswer = blanks.filter(b =>
        abstractConcepts.some(abs => b.answer.toLowerCase() === abs)
    )
    if (abstractAsAnswer.length > 0) {
        warnings.push(`Abstract concepts used as blanks: ${abstractAsAnswer.map(b => b.answer).join(', ')}`)
    }

    console.log('[Stage 3] Validation result:', {
        isValid: issues.length === 0,
        issues,
        warnings,
        stats: {
            types: types.length,
            abstractExcluded: abstractConcepts.length,
        }
    })

    return {
        isValid: issues.length === 0,
        issues,
        warnings,
    }
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
    },
    async (request) => {
        // 입력 검증
        const data = validateGenerateQuizRequest(request.data)
        const { noteContent, noteTitle, mode, difficulty, blankCount } = data
        const MODELS = getModelPresets()

        try {
            let response: GenerateQuizResponse

            if (mode === 'word') {
                // ========== 단어 모드: 2단계 파이프라인 ==========

                // Stage 1: 개념 추출
                console.log('[Word Mode] Starting Stage 1: Concept Extraction')
                const extractedConcepts = await extractConcepts(noteTitle, noteContent)

                // 빈칸 수 계산: 섹션 수 기반으로 최소 보장
                const minBlanks = Math.max(
                    blankCount || 5,
                    extractedConcepts.sections.length
                )

                // Stage 2: 퀴즈 생성 (개념 기반)
                console.log('[Word Mode] Starting Stage 2: Quiz Generation')
                const prompt = buildBlindQuizPrompt({
                    mode: 'word',
                    title: noteTitle,
                    content: noteContent,
                    blankCount: minBlanks,
                    difficulty: difficulty || 'medium',
                    extractedConcepts,
                })

                const llmResponse = await callLLMJson<BlindQuizLLMResponse>(
                    prompt,
                    SYSTEM_PROMPTS.QUIZ_GENERATOR,
                    { model: MODELS.ACCURATE }
                )

                console.log('[Word Mode] Generated quiz with', llmResponse.blanks.length, 'blanks')

                // Stage 3: 품질 검증
                console.log('[Word Mode] Starting Stage 3: Quality Validation')
                const validationResult = validateQuizQuality(llmResponse, extractedConcepts)

                if (!validationResult.isValid) {
                    console.warn('[Word Mode] Quality issues detected:', validationResult.issues)
                } else {
                    console.log('[Word Mode] Quiz passed quality validation')
                }

                // 클라이언트에 키워드만 반환 (blindedContent는 클라이언트에서 생성)
                response = {
                    quizId: `quiz-${Date.now()}`,
                    mode: 'word',
                    blanks: llmResponse.blanks.map((b) => ({
                        id: b.id,
                        answer: b.answer,
                        hint: b.hint,
                    })),
                    _debug: {
                        extractedConcepts,
                        validationResult,
                    },
                }
            } else if (mode === 'sentence') {
                // ========== 문장 모드: Q&A 형식 ==========
                console.log('[Sentence Mode] Generating Q&A quiz')

                const prompt = buildSentenceQuizPrompt({
                    title: noteTitle,
                    content: noteContent,
                    blankCount: blankCount || 5, // Q&A는 5개 정도
                    difficulty: difficulty || 'medium',
                })

                const llmResponse = await callLLMJson<SentenceQuizLLMResponse>(
                    prompt,
                    SYSTEM_PROMPTS.QUIZ_GENERATOR,
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
                    difficulty: difficulty || 'medium',
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
