/**
 * 학습 최종 결과 페이지
 * - 전체 통계 표시
 * - 노트별 결과 목록
 * - 다시 학습 / 나가기 버튼
 */
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconRefresh, IconCheck, IconX } from '@tabler/icons-react'
import { useStudySessionStore } from '../stores/studySessionStore'

export function StudyFinalResultPage() {
    const navigate = useNavigate()

    const {
        noteResults,
        selectedNoteIds,
        mode,
        order,
        isActive,
        getTotalStats,
        resetSession,
        startSession,
    } = useStudySessionStore()

    // 통계 계산
    const stats = useMemo(() => getTotalStats(), [getTotalStats, noteResults])

    // 점수에 따른 메시지
    const getMessage = (score: number): string => {
        if (score >= 90) return '완벽해요!'
        if (score >= 80) return '잘 했어요!'
        if (score >= 70) return '조금만 더!'
        if (score >= 60) return '복습이 필요해요'
        return '다시 도전해봐요'
    }

    // 세션이 없으면 메인으로 리다이렉트
    useEffect(() => {
        if (!isActive && noteResults.length === 0) {
            navigate('/')
        }
    }, [isActive, noteResults.length, navigate])

    // 나가기
    const handleExit = () => {
        resetSession()
        navigate('/')
    }

    // 다시 학습
    const handleRetry = () => {
        const noteIds = [...selectedNoteIds]
        const currentMode = mode
        const currentOrder = order
        resetSession()
        startSession({ noteIds, mode: currentMode, order: currentOrder })
        navigate(`/study?mode=${currentMode}`)
    }

    if (noteResults.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">loading...</span>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handleExit}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} exit
                    </button>

                    <span className="font-mono text-sm text-[var(--text-secondary)]">
                        // 학습 완료
                    </span>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[800px] mx-auto px-6 py-8">
                    {/* 전체 점수 요약 */}
                    <section className="text-center py-8 border-b border-[var(--border-light)]">
                        {/* 점수 */}
                        <div className="text-6xl font-mono font-bold text-[var(--accent)] mb-4">
                            {stats.averageScore}%
                        </div>

                        {/* 진행률 바 */}
                        <div className="w-48 h-2 mx-auto bg-[var(--bg-secondary)] overflow-hidden mb-4">
                            <div
                                className="h-full bg-[var(--accent)] transition-all duration-500"
                                style={{ width: `${stats.averageScore}%` }}
                            />
                        </div>

                        {/* 정답/오답 수 */}
                        <div className="flex items-center justify-center gap-6 font-mono text-lg mb-4">
                            <span className="flex items-center gap-2 text-green-500">
                                <IconCheck size={20} />
                                {stats.totalCorrect}
                            </span>
                            <span className="text-[var(--text-tertiary)]">·</span>
                            <span className="flex items-center gap-2 text-red-500">
                                <IconX size={20} />
                                {stats.totalWrong}
                            </span>
                        </div>

                        {/* 메시지 */}
                        <p className="text-lg text-[var(--text-secondary)]">
                            "{getMessage(stats.averageScore)}"
                        </p>
                    </section>

                    {/* 노트별 결과 */}
                    <section className="py-8">
                        <h2 className="font-mono text-sm text-[var(--text-tertiary)] mb-4">
                            // 노트별 결과
                        </h2>

                        <div className="border border-[var(--border-light)] bg-[var(--bg-paper)]">
                            {noteResults.map((result, index) => (
                                <div
                                    key={result.noteId}
                                    className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border-light)] last:border-b-0"
                                >
                                    {/* 순번 */}
                                    <span className="font-mono text-xs text-[var(--text-tertiary)] w-8">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>

                                    {/* 노트 제목 */}
                                    <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">
                                        {result.noteTitle}
                                    </span>

                                    {/* 점수 */}
                                    <span className={`
                                        font-mono text-sm font-medium w-12 text-right
                                        ${result.score >= 80 ? 'text-green-500' :
                                            result.score >= 60 ? 'text-yellow-500' : 'text-red-500'}
                                    `}>
                                        {result.score}%
                                    </span>

                                    {/* 정답/오답 */}
                                    <div className="flex items-center gap-3 font-mono text-xs w-24 justify-end">
                                        <span className="text-green-500 flex items-center gap-1">
                                            <IconCheck size={14} />
                                            {result.correctCount}
                                        </span>
                                        <span className="text-red-500 flex items-center gap-1">
                                            <IconX size={14} />
                                            {result.wrongCount}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 버튼 그룹 */}
                    <section className="flex gap-4 justify-center py-8">
                        <button
                            onClick={handleExit}
                            className="px-6 py-3 font-mono text-sm border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] transition-colors cursor-pointer flex items-center gap-2"
                        >
                            :q 나가기
                        </button>

                        <button
                            onClick={handleRetry}
                            className="px-6 py-3 font-mono text-sm border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors cursor-pointer flex items-center gap-2"
                        >
                            <IconRefresh size={18} />
                            다시 학습
                        </button>
                    </section>
                </div>
            </main>
        </div>
    )
}
