/**
 * 단어 모드 퀴즈 컨테이너
 * - 빈칸 채우기 퀴즈 UI
 * - 키보드 네비게이션 (Tab/Shift+Tab)
 */
import { useEffect } from 'react'
import type { Note } from '../../../../db/schema/note'
import { useWordQuiz } from './hooks/useWordQuiz'
import { useQuizNavigation } from '../../hooks/useQuizNavigation'
import { recordStudy, type RecordStudyInput } from '../../../../db/study/studyService'
import { useStudySessionStore } from '../../../../stores/studySessionStore'
import { NoteHeader } from '../../../../components/common/NoteHeader'
import { BlindedMarkdownContent } from './components/BlindedMarkdownContent'
import { AnswerInput } from './components/AnswerInput'
import { WordQuizResult } from './components/WordQuizResult'
import { GenerateingQuizLoading } from '../../components/GenerateingQuizLoading'

interface WordQuizContainerProps {
    note: Note
    onNext: () => void
}

export function WordQuizContainer({ note, onNext }: WordQuizContainerProps) {
    const noteType = note.id.startsWith('system-') ? 'system' : 'user' // 노트 타입

    // DEBUG: 컴포넌트 마운트/언마운트 추적
    useEffect(() => {
        console.log('[WordQuizContainer] MOUNTED', { noteId: note.id, noteTitle: note.title })
        return () => {
            console.log('[WordQuizContainer] UNMOUNTED', { noteId: note.id })
        }
    }, [note.id, note.title])

    // ================================ Hooks ================================
    const {
        phase, // 퀴즈 단계
        blanks, // 빈칸 목록

        currentBlank, // 현재 빈칸
        currentBlankStringId, // 현재 빈칸 String ID (BLANK_1, BLANK_2, ...)
        currentBlankIndex, // 현재 빈칸 인덱스

        blindedContent, // 블라인드 콘텐츠

        answers, // 답변 목록
        results, // 결과 목록
        isEvaluating, // 평가 중

        error, // 에러
        correctCount, // 정답 개수
        wrongCount, // 오답 개수
        answeredCount, // 답변 개수
        totalBlanks, // 총 빈칸 개수

        startQuiz, // 퀴즈 시작
        submitAnswer, // 답변 제출

        goToBlank, // 빈칸 이동
        setCurrentBlankIndex, // 빈칸 인덱스 설정

        showResult, // 결과 화면 진입
        getDuration, // 학습 시간 계산
    } = useWordQuiz({
        // 단어 퀴즈 훅 모든 단어 퀴즈 상태, 액션 담당
        noteId: note.id,
        noteContent: note.content || '',
        noteTitle: note.title,
        noteType,
    })

    // 키보드 네비게이션
    // 퀴즈 유형에 따라서 키보드 네비게이션 제공
    useQuizNavigation({
        mode: 'word',
        totalItems: blanks.length,
        currentIndex: currentBlankIndex,
        onNavigate: setCurrentBlankIndex,
        enabled: phase === 'quiz' && blanks.length > 0,
    })

    // ================================ useEffect ================================
    // 컴포넌트 마운트 시 퀴즈 시작
    useEffect(() => {
        console.log('[WordQuizContainer] startQuiz useEffect triggered', { noteId: note.id })
        startQuiz()
    }, [startQuiz, note.id])

    // Store에서 결과 기록 함수와 DB 세션 ID 가져오기
    const recordNoteResult = useStudySessionStore((state) => state.recordNoteResult)
    const getDbSessionId = useStudySessionStore((state) => state.getDbSessionId)

    // 결과 화면 진입 시 학습 기록 저장
    useEffect(() => {
        console.log('[WordQuizContainer] phase changed', { phase, noteId: note.id, totalBlanks, correctCount, wrongCount })
        if (phase === 'result') {
            console.log('[WordQuizContainer] Recording result...', { noteId: note.id })
            const duration = getDuration()
            const score = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0

            // DB에 기록
            const dbSessionId = getDbSessionId()
            const input: RecordStudyInput = {
                noteId: note.id,
                noteType,
                sessionId: dbSessionId || `session-${Date.now()}`,
                totalQuestions: totalBlanks,
                correctCount,
                wrongCount,
                duration,
            }
            recordStudy(input).catch((e) => console.error('Failed to record study:', e))

            recordNoteResult({
                noteId: note.id,
                noteTitle: note.title,
                totalQuestions: totalBlanks,
                correctCount,
                wrongCount,
                score,
                duration,
            })
            console.log('[WordQuizContainer] Result recorded', { noteId: note.id })
        }
    }, [phase, note.id, note.title, noteType, totalBlanks, correctCount, wrongCount, getDuration, recordNoteResult, getDbSessionId])

    // 로딩 화면
    if (phase === 'loading') {
        return <GenerateingQuizLoading error={error} />
    }

    // 결과 화면
    if (phase === 'result') {
        return (
            <WordQuizResult
                totalBlanks={totalBlanks}
                correctCount={correctCount}
                wrongCount={wrongCount}
                blanks={blanks}
                answers={answers}
                results={results}
                onNext={onNext}
            />
        )
    }

    // 퀴즈 화면
    return (
        <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <NoteHeader category={note.category} title={note.title} tag={note.tag} />

                {/* 퀴즈 콘텐츠 */}
                <div className="max-w-[1000px] mx-auto px-6">
                    <BlindedMarkdownContent
                        content={blindedContent}
                        blanks={blanks}
                        answers={answers}
                        results={results}
                        currentBlankStringId={currentBlankStringId}
                        onBlankClick={goToBlank}
                    />
                </div>
            </div>

            {/* Answer Input */}
            {currentBlank && (
                <AnswerInput
                    blankId={`BLANK_${currentBlank.id}`}
                    blankIndex={parseInt(currentBlank.id)}
                    hint={currentBlank.hint}
                    value={answers[`BLANK_${currentBlank.id}`] || ''}
                    result={results[`BLANK_${currentBlank.id}`] ?? null}
                    correctAnswer={currentBlank.answer}
                    isLoading={isEvaluating}
                    onSubmit={submitAnswer}
                    totalBlanks={totalBlanks}
                    answeredCount={answeredCount}
                    onShowResult={showResult}
                />
            )}
        </>
    )
}
