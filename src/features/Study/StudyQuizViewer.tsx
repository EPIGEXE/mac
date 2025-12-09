/**
 * 퀴즈 모드 뷰어 (라우터 역할)
 * - 학습 모드 선택 → 모드별 컨테이너로 위임
 * - 단어/문장/면접 모드 지원
 */
import { IconArrowLeft } from '@tabler/icons-react'
import type { Note } from '../../db/schema/note'
import type { StudyModeType } from './types'
import '../NoteDetail/MarkdownEditor/styles/editor.css'
import { useSearchParams } from 'react-router-dom'
import { WordQuizContainer } from './modes/word/WordQuizContainer'
import { SentenceQuizContainer } from './modes/sentence/SentenceQuizContainer'
import { EssayQuizContainer } from './modes/essay/EssayQuizContainer'

interface StudyQuizViewerProps {
    note: Note // 현재 보여줄 노트
    onExit: () => void // 나가기
    onNext: () => void // 다음 노트로 이동
    hasNextNote: boolean // 다음 노트가 있는지
}

export function StudyQuizViewer({
    note,
    onExit,
    onNext,
    hasNextNote,
}: StudyQuizViewerProps) {
    // ================================ Hooks ================================
    const [searchParams] = useSearchParams() // 쿼리 파라미터

    // ================================ 상수 ================================
    const studyMode = (searchParams.get('mode') as StudyModeType) || null // 학습 모드

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onExit}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>
                </div>
            </header>

            {/* 단어 모드 */}
            {studyMode === 'word' && (
                <WordQuizContainer
                    note={note}
                    onNext={onNext}
                    hasNextNote={hasNextNote}
                />
            )}

            {/* 문장 모드 */}
            {studyMode === 'sentence' && (
                <SentenceQuizContainer
                    note={note}
                    onNext={onNext}
                    hasNextNote={hasNextNote}
                />
            )}

            {/* 면접 모드 */}
            {studyMode === 'essay' && (
                <EssayQuizContainer
                    note={note}
                    onNext={onNext}
                    hasNextNote={hasNextNote}
                />
            )}
        </div>
    )
}
