/**
 * 면접 모드 퀴즈 Hook
 * - 서술형 면접 질문 상태 관리
 * - LLM 평가
 * - TanStack Query 기반 캐싱
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { EssayQuestionInfo, EvaluateEssayResponse } from '../../../types'
import { handleStudyApiError } from '../../../services/studyApi'
import { useEssayWeakPointRecorder } from '../../../hooks/useWeakPointRecorder'
import { useEvaluateEssay } from '../../../hooks/queries/useEvaluateEssay'
import { useGenerateQuiz } from '../../../hooks/queries/useGenerateQuiz'
import { studyKeys } from '../../../hooks/queries/keys'

type EssayQuizPhase = 'loading' | 'quiz' | 'result'

interface UseEssayQuizProps {
    noteId: string
    noteContent: string
    noteTitle: string
    noteType: 'system' | 'user'
}

export function useEssayQuiz({ noteId, noteContent, noteTitle, noteType }: UseEssayQuizProps) {
    const queryClient = useQueryClient()

    // ================================ 캐시 확인 ================================
    // 마운트 시 캐시가 있으면 바로 퀴즈 시작
    const cachedData = queryClient.getQueryData(studyKeys.quiz(noteId, 'essay'))
    const hasCache = !!cachedData

    // ================================ 상태 ================================
    const [enabled, setEnabled] = useState(hasCache) // 캐시 있으면 바로 활성화
    const [phase, setPhase] = useState<EssayQuizPhase>('loading')
    const [answer, setAnswer] = useState('')
    const [result, setResult] = useState<EvaluateEssayResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    // ================================ Ref ================================
    const startTimeRef = useRef<number>(Date.now())

    // ================================ TanStack Query ================================
    const {
        data: quizResponse,
        isLoading,
        error: queryError,
    } = useGenerateQuiz(
        { noteId, noteContent, noteTitle, mode: 'essay', blankCount: 5 },
        { enabled }
    )

    const evaluateMutation = useEvaluateEssay()

    // ================================ Hooks ================================
    const { recordEssayIfWrong } = useEssayWeakPointRecorder({ noteId, noteType })

    // ================================ 퀴즈 데이터 처리 ================================
    // Query 응답이 오면 phase를 quiz로 변경 (캐시 히트 포함)
    useEffect(() => {
        if (quizResponse?.essay && phase === 'loading') {
            console.log('[useEssayQuiz] Quiz data loaded, setting phase to quiz')
            setPhase('quiz')
        }
    }, [quizResponse, phase])

    // Query 에러 처리
    useEffect(() => {
        if (queryError) {
            setError(queryError.message)
        }
    }, [queryError])

    // ================================ 상수 ================================
    const question = useMemo(() => quizResponse?.essay as EssayQuestionInfo | undefined, [quizResponse?.essay])

    // ================================ 액션 ================================
    // 퀴즈 시작
    const startQuiz = useCallback(() => {
        console.log('[useEssayQuiz] startQuiz called')
        setPhase('loading')
        setError(null)
        startTimeRef.current = Date.now()

        // 상태 초기화
        setAnswer('')
        setResult(null)

        // Query 활성화 (이미 캐시에 있으면 즉시 반환)
        setEnabled(true)
    }, [])

    // 답변 제출 및 LLM 평가
    const submitAnswer = useCallback(async () => {
        if (!question || !answer.trim()) return

        setError(null)

        try {
            const response = await evaluateMutation.mutateAsync({
                company: question.company,
                question: question.question,
                questionType: question.questionType,
                expectedPoints: question.expectedPoints,
                answerGuide: question.answerGuide,
                userAnswer: answer,
            })

            setResult(response)

            // 70점 미만이면 약점 기록
            await recordEssayIfWrong(response.score, {
                company: question.company,
                question: question.question,
                questionType: question.questionType,
                expectedPoints: question.expectedPoints,
                missedPoints: response.missedPoints,
            })

            setPhase('result')
        } catch (err) {
            console.error('[Essay Mode] Evaluation error:', err)
            setError(handleStudyApiError(err))
        }
    }, [question, answer, evaluateMutation, recordEssayIfWrong])

    // 다시 풀기
    const retry = useCallback(() => {
        setAnswer('')
        setResult(null)
        setPhase('quiz')
    }, [])

    // 학습 시간 계산
    const getDuration = useCallback(() => {
        return Math.floor((Date.now() - startTimeRef.current) / 1000)
    }, [])

    // 캐시 삭제 (퀴즈 완료 시 호출)
    const clearCache = useCallback(() => {
        queryClient.removeQueries({ queryKey: studyKeys.quiz(noteId, 'essay') })
    }, [noteId, queryClient])

    // 정답/오답 계산 (70점 이상이면 정답)
    const isCorrect = result ? result.score >= 70 : false

    return {
        // 상태
        phase: isLoading ? 'loading' : phase,
        question,
        answer,
        result,
        isEvaluating: evaluateMutation.isPending,
        error,

        // 계산된 값
        isCorrect,
        noteType,

        // 액션
        startQuiz,
        setAnswer,
        submitAnswer,
        retry,
        getDuration,
        setPhase,
        clearCache,
    }
}
