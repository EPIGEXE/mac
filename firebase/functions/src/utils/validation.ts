/**
 * 입력 검증 유틸리티
 */
import { HttpsError } from 'firebase-functions/v2/https'
import type { StudyModeType, DifficultyLevel, GenerateQuizRequest, EvaluateAnswerRequest, GetHintRequest } from '../types/study'

// ================================ 유효성 검사 ================================

const VALID_MODES: StudyModeType[] = ['word', 'sentence', 'essay']
const VALID_DIFFICULTIES: DifficultyLevel[] = ['easy', 'medium', 'hard']

/**
 * 퀴즈 생성 요청 검증
 */
export function validateGenerateQuizRequest(data: unknown): GenerateQuizRequest {
    if (!data || typeof data !== 'object') {
        throw new HttpsError('invalid-argument', 'Request data is required')
    }

    const req = data as Record<string, unknown>

    // noteId 검증
    if (!req.noteId || typeof req.noteId !== 'string') {
        throw new HttpsError('invalid-argument', 'noteId is required and must be a string')
    }

    // noteContent 검증
    if (!req.noteContent || typeof req.noteContent !== 'string') {
        throw new HttpsError('invalid-argument', 'noteContent is required and must be a string')
    }

    if (req.noteContent.length < 50) {
        throw new HttpsError('invalid-argument', 'noteContent must be at least 50 characters')
    }

    if (req.noteContent.length > 10000) {
        throw new HttpsError('invalid-argument', 'noteContent must be less than 10000 characters')
    }

    // noteTitle 검증
    if (!req.noteTitle || typeof req.noteTitle !== 'string') {
        throw new HttpsError('invalid-argument', 'noteTitle is required and must be a string')
    }

    // mode 검증
    if (!req.mode || !VALID_MODES.includes(req.mode as StudyModeType)) {
        throw new HttpsError('invalid-argument', `mode must be one of: ${VALID_MODES.join(', ')}`)
    }

    // difficulty 검증 (선택)
    const difficulty = req.difficulty as DifficultyLevel | undefined
    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
        throw new HttpsError('invalid-argument', `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`)
    }

    // blankCount 검증 (선택)
    const blankCount = req.blankCount as number | undefined
    if (blankCount !== undefined) {
        if (typeof blankCount !== 'number' || blankCount < 1 || blankCount > 10) {
            throw new HttpsError('invalid-argument', 'blankCount must be a number between 1 and 10')
        }
    }

    return {
        noteId: req.noteId,
        noteContent: req.noteContent,
        noteTitle: req.noteTitle,
        mode: req.mode as StudyModeType,
        difficulty: difficulty || 'medium',
        blankCount: blankCount || 5,
    }
}

/**
 * 답변 평가 요청 검증
 */
export function validateEvaluateAnswerRequest(data: unknown): EvaluateAnswerRequest {
    if (!data || typeof data !== 'object') {
        throw new HttpsError('invalid-argument', 'Request data is required')
    }

    const req = data as Record<string, unknown>

    // quizId 검증
    if (!req.quizId || typeof req.quizId !== 'string') {
        throw new HttpsError('invalid-argument', 'quizId is required and must be a string')
    }

    // userAnswer 검증
    if (req.userAnswer === undefined || typeof req.userAnswer !== 'string') {
        throw new HttpsError('invalid-argument', 'userAnswer is required and must be a string')
    }

    if (req.userAnswer.length > 5000) {
        throw new HttpsError('invalid-argument', 'userAnswer must be less than 5000 characters')
    }

    // blankId 검증 (word/sentence 모드용)
    if (req.blankId !== undefined && typeof req.blankId !== 'string') {
        throw new HttpsError('invalid-argument', 'blankId must be a string')
    }

    return {
        quizId: req.quizId,
        blankId: req.blankId as string | undefined,
        userAnswer: req.userAnswer,
    }
}

/**
 * 힌트 요청 검증
 */
export function validateGetHintRequest(data: unknown): GetHintRequest {
    if (!data || typeof data !== 'object') {
        throw new HttpsError('invalid-argument', 'Request data is required')
    }

    const req = data as Record<string, unknown>

    // quizId 검증
    if (!req.quizId || typeof req.quizId !== 'string') {
        throw new HttpsError('invalid-argument', 'quizId is required and must be a string')
    }

    // blankId 검증
    if (!req.blankId || typeof req.blankId !== 'string') {
        throw new HttpsError('invalid-argument', 'blankId is required and must be a string')
    }

    // hintLevel 검증
    if (typeof req.hintLevel !== 'number' || req.hintLevel < 1 || req.hintLevel > 3) {
        throw new HttpsError('invalid-argument', 'hintLevel must be a number between 1 and 3')
    }

    return {
        quizId: req.quizId,
        blankId: req.blankId,
        hintLevel: req.hintLevel,
    }
}

/**
 * 문자열 정리 (XSS 방지)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim()
}
