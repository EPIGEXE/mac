/**
 * 단어 모드 퀴즈 Hook
 * - 빈칸 채우기 퀴즈 상태 관리
 * - 로컬 채점 (LLM 불필요)
 * - 약점 기록
 * - TanStack Query 기반 캐싱
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { BlankInfo } from '../../../types'
import { evaluateBlankAnswer, validateAndCreateBlindedContent } from '../../../services/studyApi'
import { useWordWeakPointRecorder } from '../../../hooks/useWeakPointRecorder'
import { useGenerateQuiz } from '../../../hooks/queries/useGenerateQuiz'
import { studyKeys } from '../../../hooks/queries/keys'

type WordQuizPhase = 'loading' | 'quiz' | 'result'

interface UseWordQuizProps {
    noteId: string // 노트 ID
    noteContent: string // 노트 내용
    noteTitle: string // 노트 제목
    noteType: 'system' | 'user' // 노트 타입
}

export function useWordQuiz({ noteId, noteContent, noteTitle, noteType }: UseWordQuizProps) {
    const queryClient = useQueryClient()

    // ================================ 상태 ================================
    const [enabled, setEnabled] = useState(false)
    const [phase, setPhase] = useState<WordQuizPhase>('loading') // 퀴즈 단계
    const [validatedBlanks, setValidatedBlanks] = useState<BlankInfo[]>([]) // 검증된 빈칸 목록
    const [blindedContent, setBlindedContent] = useState<string>('') // blank 치환된 콘텐츠
    const [currentBlankIndex, setCurrentBlankIndex] = useState(0) // 현재 빈칸 인덱스
    const [answers, setAnswers] = useState<Record<string, string>>({}) // 답변 목록
    const [results, setResults] = useState<Record<string, boolean | null>>({}) // 결과 목록
    const [isEvaluating, setIsEvaluating] = useState(false) // 평가 중인지

    // ================================ Ref ================================
    const startTimeRef = useRef<number>(Date.now()) // 퀴즈 시작 시간, 학습 시간 계산용

    // ================================ TanStack Query ================================
    const {
        data: quizResponse,
        isLoading,
        error: queryError,
    } = useGenerateQuiz(
        { noteId, noteContent, noteTitle, mode: 'word', blankCount: 5 },
        { enabled }
    )

    // 에러 메시지 변환
    const error = queryError?.message ?? null

    // ================================ Hooks ================================
    const { recordWordIfWrong } = useWordWeakPointRecorder({ noteId, noteType }) // 약점 기록 훅

    // ================================ 퀴즈 데이터 처리 ================================
    // Query 응답이 오면 검증 및 blindedContent 생성 (캐시 히트 포함)
    useEffect(() => {
        if (!quizResponse?.blanks) return
        // 이미 처리된 경우 스킵 (quiz 또는 result 상태에서는 재처리하지 않음)
        if (validatedBlanks.length > 0 && (phase === 'quiz' || phase === 'result')) return

        console.log('[useWordQuiz] Quiz generated (raw)', { blanks: quizResponse.blanks.length })

        // 검증: 실제 콘텐츠에 존재하는 blank만 필터링
        const { validBlanks, invalidBlanks, blindedContent: validated } = validateAndCreateBlindedContent(
            noteContent,
            quizResponse.blanks
        )

        console.log('[useWordQuiz] Blanks validated', {
            total: quizResponse.blanks.length,
            valid: validBlanks.length,
            invalid: invalidBlanks.length,
            invalidList: invalidBlanks.map(b => b.answer),
        })

        if (validBlanks.length === 0) {
            console.error('[useWordQuiz] No valid blanks found')
            return
        }

        // 검증된 데이터 저장
        setValidatedBlanks(validBlanks as BlankInfo[])
        setBlindedContent(validated)
        setPhase('quiz')
        console.log('[useWordQuiz] Phase set to quiz with validated blanks')
    }, [quizResponse, noteContent, validatedBlanks.length, phase])

    // ================================ 상수 ================================
    // 검증된 blanks만 사용 (LLM 응답 중 실제 콘텐츠에 존재하는 것만)
    const blanks = validatedBlanks
    const currentBlank = blanks[currentBlankIndex] // 현재 빈칸
    const currentBlankStringId = currentBlank ? `BLANK_${currentBlank.id}` : null // 현재 빈칸 String ID

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
        Object.values(results).filter(r => r !== null && r !== undefined).length,
        [results]
    )

    // ================================ 액션 ================================
    // 퀴즈 시작
    const startQuiz = useCallback(() => {
        console.log('[useWordQuiz] startQuiz called', { noteId, noteTitle })
        startTimeRef.current = Date.now()

        // 캐시 확인 - 캐시가 있으면 바로 퀴즈 데이터 처리
        const cachedData = queryClient.getQueryData(studyKeys.quiz(noteId, 'word')) as { blanks?: BlankInfo[] } | undefined

        if (cachedData?.blanks) {
            console.log('[useWordQuiz] Cache hit! Using cached quiz data')

            // 검증: 실제 콘텐츠에 존재하는 blank만 필터링
            const { validBlanks, invalidBlanks, blindedContent: validated } = validateAndCreateBlindedContent(
                noteContent,
                cachedData.blanks
            )

            console.log('[useWordQuiz] Blanks validated from cache', {
                total: cachedData.blanks.length,
                valid: validBlanks.length,
                invalid: invalidBlanks.length,
            })

            if (validBlanks.length > 0) {
                setValidatedBlanks(validBlanks as BlankInfo[])
                setBlindedContent(validated)
                setCurrentBlankIndex(0)
                setAnswers({})
                setResults({})
                setPhase('quiz')
                return // 캐시 사용 완료, API 호출 불필요
            }
        }

        // 캐시 없음 - API 호출
        console.log('[useWordQuiz] No cache, fetching from API')
        setPhase('loading')
        setValidatedBlanks([])
        setBlindedContent('')
        setCurrentBlankIndex(0)
        setAnswers({})
        setResults({})
        setEnabled(true)
    }, [noteId, noteTitle, noteContent, queryClient])

    // 답변 제출 (로컬 채점)
    const submitAnswer = useCallback(async (answer: string) => {
        if (!currentBlank) return

        const blankKey = `BLANK_${currentBlank.id}`
        setIsEvaluating(true)
        setAnswers((prev) => ({ ...prev, [blankKey]: answer }))

        // 로컬 채점
        const evalResult = evaluateBlankAnswer(answer, currentBlank.answer)
        setResults((prev) => ({ ...prev, [blankKey]: evalResult.isCorrect }))

        // 오답이면 약점 기록
        await recordWordIfWrong(evalResult.isCorrect, {
            keyword: currentBlank.answer,
            hint: currentBlank.hint || '',
            userAnswer: answer,
        })

        setIsEvaluating(false)
    }, [currentBlank, recordWordIfWrong])

    // 빈칸 클릭으로 이동
    const goToBlank = useCallback((blankId: string) => {
        const numericId = blankId.replace('BLANK_', '')
        const index = blanks.findIndex(b => b.id === numericId)
        if (index !== -1) {
            setCurrentBlankIndex(index)
        }
    }, [blanks])

    // 결과 화면으로 이동
    const showResult = useCallback(() => {
        console.log('[useWordQuiz] showResult called - setting phase to result')
        setPhase('result')
    }, [])

    // 학습 시간 계산
    const getDuration = useCallback(() => {
        return Math.floor((Date.now() - startTimeRef.current) / 1000)
    }, [])

    // 캐시 삭제 (퀴즈 완료 시 호출)
    const clearCache = useCallback(() => {
        queryClient.removeQueries({ queryKey: studyKeys.quiz(noteId, 'word') })
    }, [noteId, queryClient])

    return {
        // 상태
        phase: isLoading ? 'loading' : phase,
        blanks,
        currentBlank,
        currentBlankStringId,
        currentBlankIndex,
        blindedContent,
        answers,
        results,
        isEvaluating,
        error,

        // 계산된 값
        correctCount,
        wrongCount,
        answeredCount,
        totalBlanks: blanks.length,

        // 액션
        startQuiz,
        submitAnswer,
        goToBlank,
        setCurrentBlankIndex,
        showResult,
        getDuration,
        setPhase,
        clearCache,
    }
}
