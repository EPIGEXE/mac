/**
 * 면접 모드 퀴즈 컨테이너
 * - 한국 테크기업 면접 스타일
 * - LLM 평가 제출
 */
import { useEffect } from 'react'
import type { Note } from '../../../../db/schema/note'
import { useEssayQuiz } from './hooks/useEssayQuiz'
import { recordStudy, type RecordStudyInput } from '../../../../db/study/studyService'
import { useStudySessionStore } from '../../../../stores/studySessionStore'
import { EssayQuizResult } from './components/EssayQuizResult'
import { EssayQuizQuestion } from './components/EssayQuizQuestion'
import { GenerateingQuizLoading } from '../../components/GenerateingQuizLoading'

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
    }, [])

    // Store에서 결과 기록 함수와 DB 세션 ID 가져오기
    const recordNoteResult = useStudySessionStore((state) => state.recordNoteResult)
    const getDbSessionId = useStudySessionStore((state) => state.getDbSessionId)

    // 결과 화면 진입 시 학습 기록 저장
    useEffect(() => {
        if (phase === 'result' && result) {
            const duration = getDuration()
            const correctCount = isCorrect ? 1 : 0
            const wrongCount = isCorrect ? 0 : 1
            const score = isCorrect ? 100 : 0

            // DB에 기록
            const dbSessionId = getDbSessionId()
            const input: RecordStudyInput = {
                noteId: note.id,
                noteType,
                sessionId: dbSessionId || `session-${Date.now()}`,
                totalQuestions: 1,
                correctCount,
                wrongCount,
                duration,
            }
            recordStudy(input).catch((e) => console.error('Failed to record study:', e))

            // Store 모드면 세션 결과에도 기록
                recordNoteResult({
                    noteId: note.id,
                    noteTitle: note.title,
                    totalQuestions: 1,
                    correctCount,
                    wrongCount,
                    score,
                    duration,
                })
        }
    }, [phase, result, note.id, note.title, noteType, isCorrect, getDuration, recordNoteResult, getDbSessionId])

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
