/**
 * 문장 모드 퀴즈 Hook
 * - Q&A 형식 퀴즈 상태 관리
 * - LLM 평가
 * - 약점 기록
 */
import { useState, useCallback, useMemo, useRef } from 'react'
import type { SentenceQuestionInfo, GenerateQuizResponse, SentenceEvaluationResult } from '../../../types'
import { generateQuiz, evaluateSentenceAnswers, handleStudyApiError } from '../../../services/studyApi'
import { useSentenceWeakPointRecorder } from '../../../hooks/useWeakPointRecorder'
import { getQuizCache, saveQuizCache, clearQuizCache } from '../../../utils/quizCache'

type SentenceQuizPhase = 'loading' | 'quiz' | 'result'

interface UseSentenceQuizProps {
    noteId: string
    noteContent: string
    noteTitle: string
    noteType: 'system' | 'user'
}

export function useSentenceQuiz({ noteId, noteContent, noteTitle, noteType }: UseSentenceQuizProps) {
    // ================================ 상태 ================================
    const [phase, setPhase] = useState<SentenceQuizPhase>('loading') // 퀴즈 단계
    const [quizData, setQuizData] = useState<GenerateQuizResponse | null>(null) // 퀴즈 데이터
    const [answers, setAnswers] = useState<Record<string, string>>({}) // 답변 목록
    const [results, setResults] = useState<Record<string, boolean | null>>({}) // 결과 목록
    const [isEvaluating, setIsEvaluating] = useState(false) // 평가 중인지
    const [error, setError] = useState<string | null>(null) // 에러

    // 문장 모드 전용 상태
    const [evaluationResults, setEvaluationResults] = useState<SentenceEvaluationResult[]>([]) // 평가 결과 목록
    const [totalScore, setTotalScore] = useState(0) // 총 점수
    const [overallFeedback, setOverallFeedback] = useState('') // 전체 피드백
    const [focusedQuestionId, setFocusedQuestionId] = useState<string | null>(null) // 포커스된 질문 ID

    // ================================ Ref ================================
    const startTimeRef = useRef<number>(Date.now()) // 퀴즈 시작 시간, 학습 시간 계산용

    // ================================ Hooks ================================
    const { recordSentenceIfWrong } = useSentenceWeakPointRecorder({ noteId, noteType })

    // ================================ 상수 ================================
    const questions = useMemo(() => (quizData?.questions || []) as SentenceQuestionInfo[], [quizData?.questions])

    // 결과 계산 (정답 개수, 오답 개수, 답변 개수)
    const correctCount = useMemo(() =>
        Object.values(results).filter((r) => r === true).length,
        [results]
    )
    const wrongCount = useMemo(() =>
        Object.values(results).filter((r) => r === false).length,
        [results]
    )
    const answeredCount = useMemo(() =>
        Object.keys(answers).filter(k => answers[k]?.trim()).length,
        [answers]
    )

    // ================================ 액션 ================================
    // 퀴즈 시작
    const startQuiz = useCallback(async () => {
        setPhase('loading')
        setError(null)
        startTimeRef.current = Date.now()

        try {
            // 캐시 확인
            const cached = getQuizCache('sentence', noteId)

            if (cached) {
                console.log('[useSentenceQuiz] Using cached quiz data')
                setQuizData(cached.response)
                setAnswers({})
                setResults({})
                setEvaluationResults([])
                setTotalScore(0)
                setOverallFeedback('')
                setPhase('quiz')
                return
            }

            // 캐시 없으면 LLM 호출
            console.log('[useSentenceQuiz] Generating quiz...')
            const response = await generateQuiz({
                noteId,
                noteContent,
                noteTitle,
                mode: 'sentence',
                blankCount: 5,
            })

            // 캐시에 저장
            saveQuizCache('sentence', noteId, { response })

            setQuizData(response)
            setAnswers({})
            setResults({})
            setEvaluationResults([])
            setTotalScore(0)
            setOverallFeedback('')
            setPhase('quiz')
        } catch (err) {
            setError(handleStudyApiError(err))
            throw err
        }
    }, [noteId, noteContent, noteTitle])

    // 답변 변경
    const updateAnswer = useCallback((questionId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
    }, [])

    // 전체 답변 제출 및 LLM 평가
    const submitAllAnswers = useCallback(async () => {
        if (questions.length === 0) return

        setIsEvaluating(true)
        setError(null)

        try {
            const questionsToEvaluate = questions.map((q) => ({
                id: q.id,
                correctAnswer: q.answer,
                keyPoints: q.keyPoints,
                userAnswer: answers[q.id] || '',
            }))

            const response = await evaluateSentenceAnswers({ blanks: questionsToEvaluate })

            // 결과 저장
            setEvaluationResults(response.results)
            setTotalScore(response.totalScore)
            setOverallFeedback(response.overallFeedback)

            // results 맵도 업데이트 (학습 기록용)
            const newResults: Record<string, boolean | null> = {}
            response.results.forEach((r) => {
                newResults[r.blankId] = r.isCorrect
            })
            setResults(newResults)

            // 오답 약점 기록
            for (const result of response.results) {
                const question = questions.find((q) => q.id === result.blankId)
                if (question) {
                    await recordSentenceIfWrong(result.isCorrect, {
                        questionId: question.id,
                        question: question.question,
                        correctAnswer: question.answer,
                        keyPoints: question.keyPoints || [],
                        missedPoints: result.missedPoints || [],
                    })
                }
            }

            setPhase('result')
        } catch (err) {
            console.error('[Sentence Mode] Evaluation error:', err)
            setError(handleStudyApiError(err))
        } finally {
            setIsEvaluating(false)
        }
    }, [questions, answers, recordSentenceIfWrong])

    // 학습 시간 계산
    const getDuration = useCallback(() => {
        return Math.floor((Date.now() - startTimeRef.current) / 1000)
    }, [])

    // 캐시 삭제 (퀴즈 완료 시 호출)
    const clearCache = useCallback(() => {
        clearQuizCache('sentence', noteId)
    }, [noteId])

    return {
        // 상태
        phase,
        questions,
        answers,
        results,
        isEvaluating,
        error,

        // 문장 모드 전용
        evaluationResults,
        totalScore,
        overallFeedback,
        focusedQuestionId,

        // 계산된 값
        correctCount,
        wrongCount,
        answeredCount,
        totalQuestions: questions.length,

        // 액션
        startQuiz,
        updateAnswer,
        submitAllAnswers,
        setFocusedQuestionId,
        getDuration,
        setPhase,
        clearCache,
    }
}
