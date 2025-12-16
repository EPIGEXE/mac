/**
 * Study Feature Query Keys
 * - TanStack Query의 캐시 키를 일관되게 관리
 */
import type { StudyModeType } from '../../types'

export const studyKeys = {
    // 최상위 키
    all: ['study'] as const,

    // Quiz 생성 관련
    quizzes: () => [...studyKeys.all, 'quiz'] as const,
    quiz: (noteId: string, mode: StudyModeType) =>
        [...studyKeys.quizzes(), noteId, mode] as const,

    // 평가 결과 관련 (캐시 무효화용)
    evaluations: () => [...studyKeys.all, 'evaluation'] as const,
    evaluation: (noteId: string) =>
        [...studyKeys.evaluations(), noteId] as const,
}
