/**
 * 면접 모드 퀴즈 컨테이너
 * - 한국 테크기업 면접 스타일
 * - LLM 평가 제출
 */
import { useEffect } from 'react'
import { useEssayQuiz } from './hooks/useEssayQuiz'
import { useStudySessionStore } from '../../../../stores/studySessionStore'
import { EssayQuizResult } from './components/EssayQuizResult'
import { EssayQuizQuestion } from './components/EssayQuizQuestion'
import { GeneratingQuizLoading } from '../../components/GeneratingQuizLoading'
import { QuizGenerationError } from '../../components/QuizGenerationError'
import type { Note } from '../../../../db/core/schema'

interface EssayQuizContainerProps {
    note: Note
    onNext: () => void
}

export function EssayQuizContainer({
    note,
    onNext,
}: EssayQuizContainerProps) {
    // ================================ 상수 ================================
    const noteType = note.id.startsWith('system-') ? 'system' : 'user' // 노트 타입

    const {
        phase, // 퀴즈 단계
        question, // 질문
        answer, // 답변
        result, // 결과

        isEvaluating, // 평가 중인지
        error, // 에러 객체
        isCorrect, // 정답 여부

        startQuiz, // 퀴즈 시작
        setAnswer, // 답변 변경
        submitAnswer, // 답변 제출
        retryGeneration, // 퀴즈 생성 재시도
        getDuration, // 학습 시간 계산
    } = useEssayQuiz({
        noteId: note.id,
        noteContent: note.content || '',
        noteTitle: note.title,
        noteType,
    })

    // ================================ useEffect ================================
    // 컴포넌트 마운트 시 퀴즈 시작
    useEffect(() => {
        startQuiz()
    }, [])

    // Store에서 결과 기록 함수 가져오기
    const recordNoteResult = useStudySessionStore((state) => state.recordNoteResult)

    // 결과 화면 진입 시 메모리에 학습 결과 저장 (DB 저장은 세션 완료 시)
    useEffect(() => {
        if (phase === 'result' && result && question) {
            const duration = getDuration()
            const correctCount = isCorrect ? 1 : 0
            const wrongCount = isCorrect ? 0 : 1
            const score = result.score

            // 메모리에 결과 저장 (DB 저장은 completeSession에서 일괄 처리)
            recordNoteResult({
                noteId: note.id,
                noteTitle: note.title,
                noteType,
                mode: 'essay',
                totalQuestions: 1,
                correctCount,
                wrongCount,
                score,
                duration,
                essayDetails: {
                    company: question.company,
                    question: question.question,
                    questionType: question.questionType,
                    userAnswer: answer,
                    score: result.score,
                    grade: result.grade,
                    analysis: result.analysis,
                    matchedPoints: result.matchedPoints,
                    missedPoints: result.missedPoints,
                    strengths: result.strengths,
                    improvements: result.improvements,
                    feedback: result.feedback,
                    betterAnswer: result.betterAnswer,
                },
            })
        }
    }, [phase, result, question, answer, note.id, note.title, noteType, isCorrect, getDuration, recordNoteResult])

    // 에러 화면
    if (error) {
        return (
            <QuizGenerationError
                error={error}
                onRetry={retryGeneration}
                onSkip={onNext}
            />
        )
    }

    // 로딩 화면
    if (phase === 'loading') {
        return <GeneratingQuizLoading />
    }

    // 결과 화면
    if (phase === 'result' && result && question) {
        return (
            <EssayQuizResult
                question={question}
                userAnswer={answer}
                result={result}
                onNext={onNext}
            />
        )
    }

    // 퀴즈 화면
    if (question) {
        return (
            <EssayQuizQuestion
                question={question}
                noteTitle={note.title}
                noteCategory={note.category}
                answer={answer}
                onAnswerChange={setAnswer}
                onSubmit={submitAnswer}
                isEvaluating={isEvaluating}
            />
        )
    }

    return null
}
