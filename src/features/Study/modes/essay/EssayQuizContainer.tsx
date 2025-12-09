/**
 * 면접 모드 퀴즈 컨테이너
 * - 한국 테크기업 면접 스타일
 * - LLM 평가 제출
 */
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Note } from '../../../../db/schema/note'
import { useEssayQuiz } from './hooks/useEssayQuiz'
import { recordStudy, type RecordStudyInput } from '../../../../db/study/studyService'
import { EssayQuizResult } from './components/EssayQuizResult'
import { EssayQuizQuestion } from './components/EssayQuizQuestion'
import { GenerateingQuizLoading } from '../../components/GenerateingQuizLoading'

interface EssayQuizContainerProps {
    note: Note
    onNext: () => void
    hasNextNote: boolean
}

export function EssayQuizContainer({
    note,
    onNext,
    hasNextNote,
}: EssayQuizContainerProps) {
    // ================================ 상수 ================================
    const noteType = note.id.startsWith('system-') ? 'system' : 'user' // 노트 타입

    const {
        phase, // 퀴즈 단계
        question, // 질문
        answer, // 답변
        result, // 결과

        isEvaluating, // 평가 중인지
        error, // 에러
        isCorrect, // 정답 여부

        startQuiz, // 퀴즈 시입
        setAnswer, // 답변 변경
        submitAnswer, // 답변 제출
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
    }, [startQuiz])

    // 결과 화면 진입 시 학습 기록 저장
    useEffect(() => {
        if (phase === 'result' && result) {
            const input: RecordStudyInput = {
                noteId: note.id,
                noteType,
                sessionId: `session-${Date.now()}`,
                totalQuestions: 1,
                correctCount: isCorrect ? 1 : 0,
                wrongCount: isCorrect ? 0 : 1,
                duration: getDuration(),
            }

            recordStudy(input).catch((e) => console.error('Failed to record study:', e))
        }
    }, [phase, result, note.id, noteType, isCorrect, getDuration])

    // 로딩 화면
    if (phase === 'loading') {
        return <GenerateingQuizLoading error={error} />
    }

    // 결과 화면
    if (phase === 'result' && result && question) {
        return (
            <EssayQuizResult
                question={question}
                userAnswer={answer}
                result={result}
                onNext={onNext}
                hasNextNote={hasNextNote}
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
