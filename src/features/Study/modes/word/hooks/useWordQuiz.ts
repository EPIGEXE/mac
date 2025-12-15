/**
 * 단어 모드 퀴즈 Hook
 * - 빈칸 채우기 퀴즈 상태 관리
 * - 로컬 채점 (LLM 불필요)
 * - 약점 기록
 */
import { useState, useCallback, useMemo, useRef } from 'react'
import type { BlankInfo, GenerateQuizResponse } from '../../../types'
import { generateQuiz, evaluateBlankAnswer, handleStudyApiError, validateAndCreateBlindedContent } from '../../../services/studyApi'
import { useWordWeakPointRecorder } from '../../../hooks/useWeakPointRecorder'

type WordQuizPhase = 'loading' | 'quiz' | 'result'

interface UseWordQuizProps {
    noteId: string // 노트 ID
    noteContent: string // 노트 내용
    noteTitle: string // 노트 제목
    noteType: 'system' | 'user' // 노트 타입
}

export function useWordQuiz({ noteId, noteContent, noteTitle, noteType }: UseWordQuizProps) {
    // ================================ 상태 ================================
    const [phase, setPhase] = useState<WordQuizPhase>('loading') // 퀴즈 단계
    const [quizData, setQuizData] = useState<GenerateQuizResponse | null>(null) // 퀴즈 데이터
    const [validatedBlanks, setValidatedBlanks] = useState<BlankInfo[]>([]) // 검증된 빈칸 목록
    const [blindedContent, setBlindedContent] = useState<string>('') // blank 치환된 콘텐츠
    const [currentBlankIndex, setCurrentBlankIndex] = useState(0) // 현재 빈칸 인덱스
    const [answers, setAnswers] = useState<Record<string, string>>({}) // 답변 목록
    const [results, setResults] = useState<Record<string, boolean | null>>({}) // 결과 목록
    const [isEvaluating, setIsEvaluating] = useState(false) // 평가 중인지
    const [error, setError] = useState<string | null>(null) // 에러

    // ================================ Ref ================================
    const startTimeRef = useRef<number>(Date.now()) // 퀴즈 시작 시간, 학습 시간 계산용

    // ================================ Hooks ================================
    const { recordWordIfWrong } = useWordWeakPointRecorder({ noteId, noteType }) // 약점 기록 훅

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
    const startQuiz = useCallback(async () => {
        console.log('[useWordQuiz] startQuiz called', { noteId, noteTitle })
        setPhase('loading')
        setError(null)
        startTimeRef.current = Date.now()

        try {
            console.log('[useWordQuiz] Generating quiz...')
            const response = await generateQuiz({
                noteId,
                noteContent,
                noteTitle,
                mode: 'word',
                blankCount: 5,
            })
            console.log('[useWordQuiz] Quiz generated (raw)', { blanks: response.blanks?.length })

            // 검증: 실제 콘텐츠에 존재하는 blank만 필터링
            const { validBlanks, invalidBlanks, blindedContent: validated } = validateAndCreateBlindedContent(
                noteContent,
                response.blanks || []
            )

            console.log('[useWordQuiz] Blanks validated', {
                total: response.blanks?.length,
                valid: validBlanks.length,
                invalid: invalidBlanks.length,
                invalidList: invalidBlanks.map(b => b.answer),
            })

            // 유효한 blank가 없으면 에러
            if (validBlanks.length === 0) {
                throw new Error('퀴즈를 생성할 수 없습니다. 유효한 빈칸이 없습니다.')
            }

            // 검증된 데이터만 저장
            setQuizData(response) // 원본 응답도 보관 (디버깅용)
            setValidatedBlanks(validBlanks as BlankInfo[])
            setBlindedContent(validated)
            setCurrentBlankIndex(0)
            setAnswers({})
            setResults({})
            setPhase('quiz')
            console.log('[useWordQuiz] Phase set to quiz with validated blanks')
        } catch (err) {
            console.error('[useWordQuiz] Quiz generation failed', err)
            setError(handleStudyApiError(err))
            throw err
        }
    }, [noteId, noteContent, noteTitle])

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
        await recordWordIfWrong(!evalResult.isCorrect, {
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

    return {
        // 상태
        phase,
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
    }
}
