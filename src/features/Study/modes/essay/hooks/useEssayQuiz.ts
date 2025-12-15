/**
 * 면접 모드 퀴즈 Hook
 * - 서술형 면접 질문 상태 관리
 * - LLM 평가
 */
import { useState, useCallback, useMemo, useRef } from 'react'
import type { EssayQuestionInfo, GenerateQuizResponse, EvaluateEssayResponse } from '../../../types'
import { generateQuiz, evaluateEssay, handleStudyApiError } from '../../../services/studyApi'
import { getQuizCache, saveQuizCache, clearQuizCache } from '../../../utils/quizCache'
import { useEssayWeakPointRecorder } from '../../../hooks/useWeakPointRecorder'

type EssayQuizPhase = 'loading' | 'quiz' | 'result'

interface UseEssayQuizProps {
    noteId: string
    noteContent: string
    noteTitle: string
    noteType: 'system' | 'user'
}

export function useEssayQuiz({ noteId, noteContent, noteTitle, noteType }: UseEssayQuizProps) {
    // 상태
    const [phase, setPhase] = useState<EssayQuizPhase>('loading')
    const [quizData, setQuizData] = useState<GenerateQuizResponse | null>(null)
    const [answer, setAnswer] = useState('')
    const [result, setResult] = useState<EvaluateEssayResponse | null>(null)
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 시간 추적
    const startTimeRef = useRef<number>(Date.now())

    // 약점 기록 훅
    const { recordEssayIfWrong } = useEssayWeakPointRecorder({ noteId, noteType })

    // 질문
    const question = useMemo(() => quizData?.essay as EssayQuestionInfo | undefined, [quizData?.essay])

    // 퀴즈 시작
    const startQuiz = useCallback(async () => {
        setPhase('loading')
        setError(null)
        startTimeRef.current = Date.now()

        try {
            // 캐시 확인
            const cached = getQuizCache('essay', noteId)

            if (cached) {
                console.log('[useEssayQuiz] Using cached quiz data')
                setQuizData(cached.response)
                setAnswer('')
                setResult(null)
                setPhase('quiz')
                return
            }

            // 캐시 없으면 LLM 호출
            console.log('[useEssayQuiz] Generating quiz...')
            const response = await generateQuiz({
                noteId,
                noteContent,
                noteTitle,
                mode: 'essay',
                blankCount: 5,
            })

            // 캐시에 저장
            saveQuizCache('essay', noteId, { response })

            setQuizData(response)
            setAnswer('')
            setResult(null)
            setPhase('quiz')
        } catch (err) {
            setError(handleStudyApiError(err))
            throw err
        }
    }, [noteId, noteContent, noteTitle])

    // 답변 제출 및 LLM 평가
    const submitAnswer = useCallback(async () => {
        if (!question || !answer.trim()) return

        setIsEvaluating(true)
        setError(null)

        try {
            const response = await evaluateEssay({
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
        } finally {
            setIsEvaluating(false)
        }
    }, [question, answer, recordEssayIfWrong])

    // 다시 풀기
    const retry = useCallback(() => {
        setQuizData(null)
        setAnswer('')
        setResult(null)
    }, [])

    // 학습 시간 계산
    const getDuration = useCallback(() => {
        return Math.floor((Date.now() - startTimeRef.current) / 1000)
    }, [])

    // 캐시 삭제 (퀴즈 완료 시 호출)
    const clearCache = useCallback(() => {
        clearQuizCache('essay', noteId)
    }, [noteId])

    // 정답/오답 계산 (70점 이상이면 정답)
    const isCorrect = result ? result.score >= 70 : false

    return {
        // 상태
        phase,
        question,
        answer,
        result,
        isEvaluating,
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
