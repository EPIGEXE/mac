/**
 * 퀴즈 모드 뷰어 (라우터 역할)
 * - 학습 모드 선택 → 모드별 컨테이너로 위임
 * - 단어/문장/면접 모드 지원
 * - 진행률 표시 (Store 모드)
 */
import { IconArrowLeft } from '@tabler/icons-react'
import type { Note } from '../../db/schema/note'
import type { StudyModeType } from './types'
import '../NoteDetail/MarkdownEditor/styles/editor.css'
import { WordQuizContainer } from './modes/word/WordQuizContainer'
import { SentenceQuizContainer } from './modes/sentence/SentenceQuizContainer'
import { EssayQuizContainer } from './modes/essay/EssayQuizContainer'
import { useStudySessionStore } from '../../stores/studySessionStore'

interface StudyQuizViewerProps {
    note: Note
    onExit: () => void
    onNext: () => void
    hasNextNote: boolean
    showProgress?: boolean
    progress?: number          // 0-100
    progressText?: string      // "3/10"
}

export function StudyQuizViewer({
    note,
    onExit,
    onNext,
    hasNextNote,
    showProgress = false,
    progress = 0,
    progressText = '',
}: StudyQuizViewerProps) {
    // ================================ Store ================================
    const mode = useStudySessionStore((state) => state.mode)

    // ================================ 상수 ================================
    const studyMode: StudyModeType | null = mode

    // 모드 라벨
    const modeLabel = studyMode === 'word' ? '단어'
        : studyMode === 'sentence' ? '문장'
        : studyMode === 'essay' ? '서술형'
        : ''

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Left: Exit */}
                    <button
                        onClick={onExit}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} exit
                    </button>

                    {/* Center: Progress (Store 모드) */}
                    {showProgress && (
                        <div className="flex items-center gap-4">
                            {/* 모드 표시 */}
                            <span className="font-mono text-xs text-[var(--text-tertiary)] px-2 py-1 border border-[var(--border-light)]">
                                {studyMode}
                            </span>

                            {/* 진행률 텍스트 */}
                            <span className="font-mono text-sm text-[var(--accent)]">
                                [{progressText}]
                            </span>

                            {/* 진행률 바 */}
                            <div className="w-32 h-1.5 bg-[var(--bg-secondary)] overflow-hidden">
                                <div
                                    className="h-full bg-[var(--accent)] transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Right: 모드 표시 (Legacy 모드) */}
                    {!showProgress && studyMode && (
                        <span className="font-mono text-xs text-[var(--text-tertiary)] px-2 py-1 border border-[var(--border-light)]">
                            {studyMode} · {modeLabel}
                        </span>
                    )}
                </div>
            </header>

            {/* 단어 모드 */}
            {studyMode === 'word' && (
                <WordQuizContainer
                    note={note}
                    onNext={onNext}
                />
            )}

            {/* 문장 모드 */}
            {studyMode === 'sentence' && (
                <SentenceQuizContainer
                    note={note}
                    onNext={onNext}
                />
            )}

            {/* 면접 모드 */}
            {studyMode === 'essay' && (
                <EssayQuizContainer
                    note={note}
                    onNext={onNext}
                />
            )}

            {/* 모드 미선택 */}
            {!studyMode && (
                <div className="flex-1 flex items-center justify-center">
                    <span className="font-mono text-[var(--text-tertiary)]">
                        // 학습 모드가 선택되지 않았습니다
                    </span>
                </div>
            )}
        </div>
    )
}
