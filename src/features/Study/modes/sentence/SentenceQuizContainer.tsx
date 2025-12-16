/**
 * 문장 모드 퀴즈 컨테이너
 * - Q&A 형식 퀴즈 UI
 * - LLM 평가 제출
 */
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Note } from '../../../../db/schema/note'
import { useSentenceQuiz } from './hooks/useSentenceQuiz'
import { recordSentenceStudy } from '../../../../db/study/studyService'
import type { RecordSentenceStudyInput } from '../../../../db/study/types'
import type { SentenceQuestionDetail } from '../../../../db/schema/study'
import { useStudySessionStore } from '../../../../stores/studySessionStore'
import { SentenceQuizResult } from './components/SentenceQuizResult'
import { SentenceAnswerInput } from './components/SentenceAnswerInput'
import { GenerateingQuizLoading } from '../../components/GenerateingQuizLoading'
import { TerminalButton } from '../../../../components/common/TerminalButton'

interface SentenceQuizContainerProps {
    note: Note
    onNext: () => void
}

export function SentenceQuizContainer({
    note,
    onNext,
}: SentenceQuizContainerProps) {
    // ================================ 상수 ================================
    const noteType = note.id.startsWith('system-') ? 'system' : 'user' // 노트 타입

    // ================================ Hooks ================================
    const {
        phase, // 퀴즈 단계
        questions, // 생성한 문제 목록
        focusedQuestionId, // 포커스된 질문 ID
        answers, // 답변 목록

        isEvaluating, // 평가 중인지
        error, // 에러

        evaluationResults, // 평가 결과 목록
        totalScore, // 총 점수
        overallFeedback, // 전체 피드백
        correctCount, // 정답 개수
        wrongCount, // 오답 개수
        answeredCount, // 답변 개수
        totalQuestions, // 총 문제 개수

        startQuiz, // 퀴즈 시작
        updateAnswer, // 답변 변경
        submitAllAnswers, // 전체 답변 제출
        setFocusedQuestionId, // 포커스된 질문 ID 설정
        getDuration, // 학습 시간 계산
    } = useSentenceQuiz({
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
    const completeSession = useStudySessionStore((state) => state.completeSession)

    // 결과 화면 진입 시 학습 기록 저장
    useEffect(() => {
        if (phase === 'result') {
            const duration = getDuration()
            const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

            // DB에 기록 (새로운 모드별 함수 사용)
            const dbSessionId = getDbSessionId()

            // questions와 evaluationResults를 SentenceQuestionDetail[]로 변환
            const questionDetails: SentenceQuestionDetail[] = questions.map((q) => {
                const evalResult = evaluationResults.find((r) => r.blankId === q.id)
                return {
                    questionId: q.id,
                    question: q.question,
                    answer: q.answer,
                    userAnswer: answers[q.id] || '',
                    isCorrect: evalResult?.isCorrect ?? false,
                    score: evalResult?.score ?? 0,
                    keyPoints: q.keyPoints || [],
                    matchedPoints: evalResult?.matchedPoints || [],
                    missedPoints: evalResult?.missedPoints || [],
                    feedback: evalResult?.feedback || '',
                }
            })

            const input: RecordSentenceStudyInput = {
                noteId: note.id,
                noteType,
                sessionId: dbSessionId || `session-${Date.now()}`,
                duration,
                questions: questionDetails,
                totalScore,
                overallFeedback,
            }
            recordSentenceStudy(input).catch((e) => console.error('Failed to record study:', e))

            // Store 모드면 세션 결과에도 기록
            recordNoteResult({
                noteId: note.id,
                noteTitle: note.title,
                totalQuestions,
                correctCount,
                wrongCount,
                score,
                duration,
            })

            // 세션 완료 (DB에 저장)
            completeSession()
        }
    }, [phase, note.id, note.title, noteType, totalQuestions, correctCount, wrongCount, questions, answers, evaluationResults, totalScore, overallFeedback, getDuration, recordNoteResult, getDbSessionId, completeSession])

    // 로딩 화면
    if (phase === 'loading') {
        return <GenerateingQuizLoading error={error} />
    }

    // 결과 화면
    if (phase === 'result') {
        return (
            <SentenceQuizResult
                questions={questions}
                answers={answers}
                evaluationResults={evaluationResults}
                totalScore={totalScore}
                overallFeedback={overallFeedback}
                onNext={onNext}
            />
        )
    }

    // 퀴즈 화면
    return (
        <>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[800px] mx-auto px-6 py-8">
                    {/* 헤더 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-[var(--accent)]">#</span>
                            <span className="font-mono text-sm text-[var(--text-secondary)]">{note.category}</span>
                        </div>
                        <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-1">
                            {note.title}
                        </h2>
                        <p className="font-mono text-sm text-[var(--text-secondary)]">
                            // {questions.length} questions
                        </p>
                    </div>

                    {/* Q&A 카드들 */}
                    <div className="flex flex-col gap-4">
                        {questions.map((question, idx) => (
                            <motion.div
                                key={question.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                            >
                                <SentenceAnswerInput
                                    question={question}
                                    index={idx}
                                    value={answers[question.id] || ''}
                                    onChange={(value) => updateAnswer(question.id, value)}
                                    isFocused={focusedQuestionId === question.id}
                                    onFocus={() => setFocusedQuestionId(question.id)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 하단 제출 바 */}
            <footer className="border-t border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="font-mono text-sm text-[var(--text-secondary)]">
                        <span className={answeredCount === totalQuestions ? 'text-green-500' : 'text-[var(--accent)]'}>
                            {answeredCount}
                        </span>
                        <span> / {totalQuestions} answered</span>
                    </div>

                    <TerminalButton
                        type="submit"
                        variant="filled"
                        onClick={submitAllAnswers}
                        disabled={isEvaluating || answeredCount === 0}
                        className="flex items-center gap-2 px-5 py-2"
                    >
                        {isEvaluating ? (
                            <>
                                <span className="animate-spin">⟳</span>
                                <span>평가중...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xs opacity-80">▶</span>
                                <span>제출</span>
                            </>
                        )}
                    </TerminalButton>
                </div>
            </footer>
        </>
    )
}
