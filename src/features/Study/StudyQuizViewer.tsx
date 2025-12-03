/**
 * 퀴즈 모드 뷰어
 * - 학습 모드 선택 (모달) → 퀴즈 생성 → 문제 풀이 → 결과
 * - 단어/문장 모드: 클라이언트 채점
 * - 학습 기록: IndexedDB 저장
 * - pm-editor 스타일 적용으로 MarkdownEditor와 동일한 Look & Feel
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { IconArrowLeft, IconSun, IconMoon } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Note } from '../../db/schema/note'
import type { StudyModeType, BlankInfo, GenerateQuizResponse } from './types'
import { generateQuiz, evaluateBlankAnswer, getHint, handleStudyApiError } from './services/studyApi'
import { recordStudy, type RecordStudyInput } from '../../db/study/studyService'
import { addWeakPoint } from '../../db/study/weakPointService'
import { StudyModeSelector, BlindedMarkdownContent, AnswerInput, QuizResult } from './components'
import '../NoteDetail/MarkdownEditor/styles/editor.css'

type QuizPhase = 'select' | 'loading' | 'quiz' | 'result'

interface StudyQuizViewerProps {
    note: Note
    onExit: () => void
    onNext: () => void
    hasNextNote: boolean
    sessionId?: string
    initialMode?: StudyModeType | null // URL에서 전달받은 초기 모드
    theme?: 'light' | 'dark'
    onThemeToggle?: () => void
}

export function StudyQuizViewer({
    note,
    onExit,
    onNext,
    hasNextNote,
    sessionId,
    initialMode,
    theme = 'light',
    onThemeToggle
}: StudyQuizViewerProps) {
    // 상태
    const [phase, setPhase] = useState<QuizPhase>(initialMode ? 'loading' : 'select')
    const [studyMode, setStudyMode] = useState<StudyModeType>(initialMode || 'word')
    const [error, setError] = useState<string | null>(null)
    const [modalOpen, setModalOpen] = useState(!initialMode)

    // 퀴즈 데이터
    const [quizData, setQuizData] = useState<GenerateQuizResponse | null>(null)
    const [currentBlankIndex, setCurrentBlankIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [results, setResults] = useState<Record<string, boolean | null>>({})
    const [hintsUsed, setHintsUsed] = useState<Record<string, string[]>>({}) // 힌트 내용 저장
    const [isEvaluating, setIsEvaluating] = useState(false)

    // 시간 추적
    const startTimeRef = useRef<number>(Date.now())

    // 현재 빈칸
    const blanks = useMemo(() => (quizData?.blanks || []) as BlankInfo[], [quizData?.blanks])
    const currentBlank = blanks[currentBlankIndex]
    const currentBlankId = currentBlank?.id || null

    // 초기 모드가 있으면 자동 시작
    useEffect(() => {
        if (initialMode && phase === 'loading') {
            startQuiz(initialMode)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialMode])

    // 퀴즈 시작 함수
    const startQuiz = useCallback(async (mode: StudyModeType) => {
        setPhase('loading')
        setError(null)
        startTimeRef.current = Date.now()

        try {
            const response = await generateQuiz({
                noteId: note.id,
                noteContent: note.content || '',
                noteTitle: note.title,
                mode: mode,
                blankCount: 5,
            })

            // DEBUG: 퀴즈 응답 로그 (3단계 파이프라인)
            console.log('=== Quiz Response (3-Stage Pipeline) ===')
            console.log('blindedContent:', response.blindedContent)
            console.log('blanks:', response.blanks)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const debug = (response as any)._debug
            if (debug?.extractedConcepts) {
                console.log('=== Stage 1: Extracted Concepts ===')
                console.log('sections:', debug.extractedConcepts.sections)
                console.log('concepts:', debug.extractedConcepts.concepts)
                console.log('processes:', debug.extractedConcepts.processes)
            }
            if (debug?.validationResult) {
                console.log('=== Stage 3: Quality Validation ===')
                console.log('isValid:', debug.validationResult.isValid)
                console.log('issues:', debug.validationResult.issues)
                console.log('coveredSections:', debug.validationResult.coveredSections)
                console.log('missingSections:', debug.validationResult.missingSections)
            }
            console.log('=====================================')

            setQuizData(response)
            setCurrentBlankIndex(0)
            setAnswers({})
            setResults({})
            setHintsUsed({})
            setPhase('quiz')
        } catch (err) {
            setError(handleStudyApiError(err))
            setPhase('select')
            setModalOpen(true)
        }
    }, [note])

    // 퀴즈 시작 (모달에서)
    const handleStart = useCallback(async () => {
        setModalOpen(false)
        await startQuiz(studyMode)
    }, [studyMode, startQuiz])

    // 답변 제출 (로컬 채점)
    const handleSubmitAnswer = useCallback(
        async (answer: string) => {
            if (!currentBlank) return

            setIsEvaluating(true)
            setAnswers((prev) => ({ ...prev, [currentBlank.id]: answer }))

            // 로컬 채점
            const evalResult = evaluateBlankAnswer(answer, currentBlank.answer)
            setResults((prev) => ({ ...prev, [currentBlank.id]: evalResult.isCorrect }))

            // 오답이면 약점 기록
            if (!evalResult.isCorrect) {
                try {
                    await addWeakPoint({
                        noteId: note.id,
                        noteType: 'id' in note && note.id.startsWith('system-') ? 'system' : 'user',
                        content: currentBlank.answer,
                        userAnswer: answer,
                        correctAnswer: currentBlank.answer,
                    })
                } catch (e) {
                    console.error('Failed to record weak point:', e)
                }
            }

            setIsEvaluating(false)
        },
        [currentBlank, note]
    )

    // 힌트 요청
    const handleHint = useCallback(async () => {
        if (!currentBlank) return

        const currentHints = hintsUsed[currentBlank.id] || []
        const hintLevel = currentHints.length + 1

        if (hintLevel > 3) return

        try {
            const response = await getHint({
                answer: currentBlank.answer,
                hintLevel,
                previousHints: currentHints,
            })

            setHintsUsed((prev) => ({
                ...prev,
                [currentBlank.id]: [...currentHints, response.hint],
            }))
            alert(`힌트: ${response.hint}`)
        } catch (err) {
            setError(handleStudyApiError(err))
        }
    }, [currentBlank, hintsUsed])

    // 다음 빈칸으로
    const handleNextBlank = useCallback(() => {
        if (currentBlankIndex < blanks.length - 1) {
            setCurrentBlankIndex((prev) => prev + 1)
        } else {
            // 모든 빈칸 완료 → 결과 화면
            setPhase('result')
        }
    }, [currentBlankIndex, blanks.length])

    // 빈칸 클릭
    const handleBlankClick = useCallback(
        (blankId: string) => {
            const index = blanks.findIndex((b) => b.id === blankId)
            if (index !== -1) {
                setCurrentBlankIndex(index)
            }
        },
        [blanks]
    )

    // 다시 풀기
    const handleRetry = useCallback(() => {
        setPhase('select')
        setModalOpen(true)
        setQuizData(null)
    }, [])

    // 모달 닫힘 처리
    const handleModalClose = useCallback(
        (open: boolean) => {
            if (!open) {
                // 모달이 닫히면 나가기
                onExit()
            }
        },
        [onExit]
    )

    // 결과 계산
    const correctCount = Object.values(results).filter((r) => r === true).length
    const wrongCount = Object.values(results).filter((r) => r === false).length

    // 결과 화면 진입 시 학습 기록 저장
    useEffect(() => {
        if (phase === 'result' && quizData) {
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)

            const input: RecordStudyInput = {
                noteId: note.id,
                noteType: note.id.startsWith('system-') ? 'system' : 'user',
                sessionId: sessionId || `session-${Date.now()}`,
                totalQuestions: blanks.length,
                correctCount,
                wrongCount,
                duration,
            }

            recordStudy(input).catch((e) => console.error('Failed to record study:', e))
        }
    }, [phase, quizData, note, blanks.length, correctCount, wrongCount, sessionId])

    // ESC 키로 나가기 (퀴즈 진행 중일 때만)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && phase !== 'select') {
                onExit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onExit, phase])

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header - NoteDetailPage와 동일한 스타일 */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
                    {/* 좌측: 뒤로가기 */}
                    <button
                        onClick={onExit}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    {/* 우측: 컨트롤 */}
                    <div className="flex items-center gap-4">
                        {/* Progress (quiz phase only) */}
                        {phase === 'quiz' && blanks.length > 0 && (
                            <>
                                <span className="font-mono text-sm text-[var(--accent)]">
                                    [{currentBlankIndex + 1}/{blanks.length}]
                                </span>
                                <div className="w-px h-5 bg-[var(--border-light)]" />
                            </>
                        )}

                        {/* 테마 토글 */}
                        {onThemeToggle && (
                            <button
                                onClick={onThemeToggle}
                                className="w-8 h-8 border border-[var(--border-light)] bg-transparent text-[var(--text-tertiary)] flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                                {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        className="bg-red-500/10 border-b border-red-500/30 px-6 py-3"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <p className="font-mono text-sm text-red-500 text-center">
                            <span className="opacity-70">// error:</span> {error}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content - 모드 선택 모달 */}
            {phase === 'select' && (
                <StudyModeSelector
                    open={modalOpen}
                    onOpenChange={handleModalClose}
                    selectedMode={studyMode}
                    onModeChange={setStudyMode}
                    onStart={handleStart}
                    isLoading={false}
                />
            )}

            {/* Loading */}
            {phase === 'loading' && (
                <div className="flex-1 flex items-center justify-center">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="font-mono text-[var(--text-tertiary)] mb-2">
                            <span className="text-[var(--accent)]">$</span> generating quiz...
                        </div>
                        <motion.div
                            className="font-mono text-xs text-[var(--text-tertiary)]"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            // AI가 문제를 만들고 있습니다
                        </motion.div>
                    </motion.div>
                </div>
            )}

            {/* Quiz Content */}
            {phase === 'quiz' && quizData?.blindedContent && (
                <>
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-[1000px] mx-auto px-6 py-12">
                            {/* 카테고리 */}
                            <div className="flex items-center gap-2 mb-5">
                                <span className="font-mono text-[13px] text-[var(--accent)]">#</span>
                                <span className="font-mono text-[13px] text-[var(--text-tertiary)]">
                                    {note.category}
                                </span>
                            </div>

                            {/* 제목 */}
                            <h1 className="font-display text-[32px] font-normal text-[var(--text-primary)] mb-6 leading-[1.3] tracking-wide">
                                {note.title}
                            </h1>

                            {/* 태그 */}
                            {note.tags && note.tags.length > 0 && (
                                <div className="flex gap-3 mb-8 flex-wrap">
                                    {note.tags.map((tag) => (
                                        <span key={tag} className="font-mono text-xs text-[var(--text-tertiary)]">
                                            @{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* 구분선 */}
                            <div className="border-t border-dashed border-[var(--border-light)] mb-8" />

                            {/* 퀴즈 콘텐츠 */}
                            <BlindedMarkdownContent
                                content={quizData.blindedContent}
                                blanks={blanks}
                                answers={answers}
                                results={results}
                                currentBlankId={currentBlankId}
                                onBlankClick={handleBlankClick}
                            />
                        </div>
                    </div>

                    {/* Answer Input */}
                    {currentBlank && (
                        <AnswerInput
                            blankId={currentBlank.id}
                            hint={currentBlank.hint}
                            value={answers[currentBlank.id] || ''}
                            result={results[currentBlank.id] ?? null}
                            isLoading={isEvaluating}
                            onSubmit={handleSubmitAnswer}
                            onHint={handleHint}
                            onSkip={handleNextBlank}
                            hintsRemaining={3 - (hintsUsed[currentBlank.id]?.length || 0)}
                        />
                    )}
                </>
            )}

            {/* Result */}
            {phase === 'result' && (
                <QuizResult
                    totalBlanks={blanks.length}
                    correctCount={correctCount}
                    wrongCount={wrongCount}
                    blanks={blanks}
                    answers={answers}
                    results={results}
                    onRetry={handleRetry}
                    onNext={onNext}
                    hasNextNote={hasNextNote}
                />
            )}
        </div>
    )
}
