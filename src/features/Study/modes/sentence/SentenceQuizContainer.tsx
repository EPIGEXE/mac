/**
 * 문장 모드 퀴즈 컨테이너
 * - Q&A 형식 퀴즈 UI
 * - LLM 평가 제출
 */
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Note } from '../../../../db/schema/note'
import { useSentenceQuiz } from './hooks/useSentenceQuiz'
import { recordStudy, type RecordStudyInput } from '../../../../db/study/studyService'
import { useStudySessionStore } from '../../../../stores/studySessionStore'
import { SentenceQuizResult } from './components/SentenceQuizResult'
import { SentenceAnswerInput } from './components/SentenceAnswerInput'
import { GenerateingQuizLoading } from '../../components/GenerateingQuizLoading'

interface SentenceQuizContainerProps {
    note: Note
    onNext: () => void
    hasNextNote: boolean
}

export function SentenceQuizContainer({
    note,
    onNext,
    hasNextNote,
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
    }, [startQuiz])

    // Store에서 결과 기록 함수 가져오기
    const { recordNoteResult, isActive: isSessionActive } = useStudySessionStore()

    // 결과 화면 진입 시 학습 기록 저장
    useEffect(() => {
        if (phase === 'result') {
            const duration = getDuration()
            const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

            // DB에 기록
            const input: RecordStudyInput = {
                noteId: note.id,
                noteType,
                sessionId: `session-${Date.now()}`,
                totalQuestions,
                correctCount,
                wrongCount,
                duration,
            }
            recordStudy(input).catch((e) => console.error('Failed to record study:', e))

            // Store 모드면 세션 결과에도 기록
            if (isSessionActive) {
                recordNoteResult({
                    noteId: note.id,
                    noteTitle: note.title,
                    totalQuestions,
                    correctCount,
                    wrongCount,
                    score,
                    duration,
                })
            }
        }
    }, [phase, note.id, note.title, noteType, totalQuestions, correctCount, wrongCount, getDuration, isSessionActive, recordNoteResult])

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
                hasNextNote={hasNextNote}
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
                            <span className="font-mono text-xs text-[var(--accent)]">#</span>
                            <span className="font-mono text-xs text-[var(--text-tertiary)]">{note.category}</span>
                        </div>
                        <h2 className="text-xl font-medium text-[var(--text-primary)] mb-1">
                            {note.title}
                        </h2>
                        <p className="font-mono text-xs text-[var(--text-tertiary)]">
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
                    <div className="font-mono text-xs text-[var(--text-tertiary)]">
                        <span className={answeredCount === totalQuestions ? 'text-green-500' : 'text-[var(--accent)]'}>
                            {answeredCount}
                        </span>
                        <span> / {totalQuestions} answered</span>
                    </div>

                    <button
                        onClick={submitAllAnswers}
                        disabled={isEvaluating || answeredCount === 0}
                        className="flex items-center gap-2 px-5 py-2 font-mono text-sm bg-[var(--accent)] text-white border-none cursor-pointer transition-all duration-150 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </button>
                </div>
            </footer>
        </>
    )
}
