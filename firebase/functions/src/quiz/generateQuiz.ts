/**
 * 퀴즈 생성 Cloud Function
 * - 2단계 파이프라인: Stage 1 (개념 추출) → Stage 2 (퀴즈 생성)
 * - Groq API로 퀴즈 생성
 * - 정답은 클라이언트에 직접 반환 (IndexedDB에서 관리)
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { callGroqJson, MODELS, groqApiKey } from '../llm/groqClient'
import {
    SYSTEM_PROMPTS,
    buildConceptExtractionPrompt,
    buildBlindQuizPrompt,
    buildEssayQuizPrompt,
    type ExtractedConcepts,
} from '../llm/prompts'
import { validateGenerateQuizRequest } from '../utils/validation'

// LLM 응답 타입
interface BlindQuizLLMResponse {
    blindedContent: string
    blanks: {
        id: string
        answer: string
        hint: string
        position: number
        section?: string
        type?: string
    }[]
}

interface EssayQuizLLMResponse {
    question: string
    expectedPoints: string[]
}

// 클라이언트 응답 타입 (정답 포함)
interface GenerateQuizResponse {
    quizId: string
    mode: 'word' | 'sentence' | 'essay'
    blindedContent?: string
    blanks?: {
        id: string
        answer: string
        hint: string
    }[]
    question?: string
    expectedPoints?: string[]
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

    const result = await callGroqJson<ExtractedConcepts>(
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

    // 3. critical 개념 커버리지 검증
    const criticalConcepts = extractedConcepts.concepts
        .filter(c => c.importance === 'critical')
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

    // 5. 금지된 추상적 답변 검증 (NEW)
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

    // 6. 섹션 제목이 그대로 답변으로 사용된 경우 (NEW)
    const sectionTitles = extractedConcepts.sections.map(s => s.name.toLowerCase())
    const sectionAsAnswer = blanks.filter(b =>
        sectionTitles.some(title => b.answer.toLowerCase() === title)
    )
    if (sectionAsAnswer.length > 0) {
        warnings.push(`Section titles used as answers: ${sectionAsAnswer.map(b => b.answer).join(', ')}`)
    }

    console.log('[Stage 3] Validation result:', {
        isValid: issues.length === 0,
        issues,
        warnings,
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
        secrets: [groqApiKey],
        timeoutSeconds: 120, // 2단계이므로 시간 늘림
        memory: '256MiB',
    },
    async (request) => {
        // 입력 검증
        const data = validateGenerateQuizRequest(request.data)
        const { noteContent, noteTitle, mode, difficulty, blankCount } = data

        try {
            let response: GenerateQuizResponse

            if (mode === 'word' || mode === 'sentence') {
                // ========== 2단계 파이프라인 ==========

                // Stage 1: 개념 추출
                console.log('[Quiz Generation] Starting Stage 1: Concept Extraction')
                const extractedConcepts = await extractConcepts(noteTitle, noteContent)

                // 빈칸 수 계산: 섹션 수 기반으로 최소 보장
                const minBlanks = Math.max(
                    blankCount || 5,
                    extractedConcepts.sections.length // 각 섹션당 최소 1개
                )

                // Stage 2: 퀴즈 생성 (개념 기반)
                console.log('[Quiz Generation] Starting Stage 2: Quiz Generation')
                const prompt = buildBlindQuizPrompt({
                    mode,
                    title: noteTitle,
                    content: noteContent,
                    blankCount: minBlanks,
                    difficulty: difficulty || 'medium',
                    extractedConcepts, // Stage 1 결과 전달
                })

                const llmResponse = await callGroqJson<BlindQuizLLMResponse>(
                    prompt,
                    SYSTEM_PROMPTS.QUIZ_GENERATOR,
                    { model: MODELS.ACCURATE }
                )

                console.log('[Stage 2] Generated quiz with', llmResponse.blanks.length, 'blanks')

                // Stage 3: 품질 검증
                console.log('[Quiz Generation] Starting Stage 3: Quality Validation')
                const validationResult = validateQuizQuality(llmResponse, extractedConcepts)

                // 검증 결과 로깅 (경고만, 실패해도 진행)
                if (!validationResult.isValid) {
                    console.warn('[Stage 3] Quality issues detected:', validationResult.issues)
                } else {
                    console.log('[Stage 3] Quiz passed quality validation')
                }

                // 클라이언트에 정답 포함하여 반환 (클라이언트에서 채점)
                response = {
                    quizId: `quiz-${Date.now()}`,
                    mode,
                    blindedContent: llmResponse.blindedContent,
                    blanks: llmResponse.blanks.map((b) => ({
                        id: b.id,
                        answer: b.answer,
                        hint: b.hint,
                    })),
                    // 디버그용 (개발 중에만 사용)
                    _debug: {
                        extractedConcepts,
                        validationResult, // 검증 결과도 포함
                    },
                }
            } else {
                // 서술형 퀴즈 생성 (기존 로직 유지)
                const prompt = buildEssayQuizPrompt({
                    title: noteTitle,
                    content: noteContent,
                    difficulty: difficulty || 'medium',
                })

                const llmResponse = await callGroqJson<EssayQuizLLMResponse>(
                    prompt,
                    SYSTEM_PROMPTS.ESSAY_GENERATOR,
                    { model: MODELS.ACCURATE }
                )

                response = {
                    quizId: `quiz-${Date.now()}`,
                    mode,
                    question: llmResponse.question,
                    expectedPoints: llmResponse.expectedPoints,
                }
            }

            return response
        } catch (error) {
            console.error('Failed to generate quiz:', error)

            if (error instanceof HttpsError) {
                throw error
            }

            throw new HttpsError('internal', 'Failed to generate quiz. Please try again.')
        }
    }
)
