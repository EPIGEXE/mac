/**
 * Quiz 생성 Query Hook
 * - TanStack Query를 사용한 퀴즈 생성 API 호출
 * - 자동 캐싱 및 중복 요청 방지
 */
import { useQuery } from '@tanstack/react-query'
import { studyKeys } from './keys'
import { generateQuiz } from '../../services/studyApi'
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
    return useQuery<GenerateQuizResponse, Error>({
        queryKey: studyKeys.quiz(params.noteId, params.mode),
        queryFn: () =>
            generateQuiz({
                noteId: params.noteId,
                noteContent: params.noteContent,
                noteTitle: params.noteTitle,
                mode: params.mode,
                blankCount: params.blankCount ?? 5,
            }),
        enabled: options?.enabled ?? true,
        staleTime: 30 * 60 * 1000, // 30분 (기존 캐시 TTL과 동일)
        gcTime: 60 * 60 * 1000, // 1시간
        retry: 1,
    })
}
