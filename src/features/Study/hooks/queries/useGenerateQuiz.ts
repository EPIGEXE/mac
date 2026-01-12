/**
 * Quiz 생성 Query Hook
 * - TanStack Query를 사용한 퀴즈 생성 API 호출
 * - 자동 캐싱 및 중복 요청 방지
 * - AppError 기반 재시도 제어
 */
import { useQuery } from '@tanstack/react-query'
import { studyKeys } from './keys'
import { generateQuiz } from '../../services/studyApi'
import { AppError, FirebaseError } from '../../../../errors'
import type { StudyModeType, GenerateQuizResponse } from '../../types'

export interface UseGenerateQuizParams {
    noteId: string
    noteContent: string
    noteTitle: string
    mode: StudyModeType
    blankCount?: number
}

export interface UseGenerateQuizOptions {
    enabled?: boolean
}

/**
 * 퀴즈 생성 Query Hook
 *
 * @example
 * const { data, isLoading, error, refetch } = useGenerateQuiz(
 *   { noteId, noteContent, noteTitle, mode: 'word' },
 *   { enabled: isStarted }
 * )
 */
export function useGenerateQuiz(params: UseGenerateQuizParams, options?: UseGenerateQuizOptions) {
    return useQuery<GenerateQuizResponse, AppError>({
        queryKey: studyKeys.quiz(params.noteId, params.mode),
        queryFn: async () => {
            try {
                return await generateQuiz({
                    noteId: params.noteId,
                    noteContent: params.noteContent,
                    noteTitle: params.noteTitle,
                    mode: params.mode,
                    blankCount: params.blankCount ?? 5,
                })
            } catch (e) {
                throw FirebaseError.fromFunctionsError(e)
            }
        },
        enabled: options?.enabled ?? true,
        staleTime: 5 * 60 * 1000, // 5분
        gcTime: 10 * 60 * 1000, // 10분
        retry: (failureCount, error) => {
            // retryable한 에러만 재시도
            if (AppError.isAppError(error) && !error.retryable) {
                return false
            }
            return failureCount < 1
        },
    })
}
