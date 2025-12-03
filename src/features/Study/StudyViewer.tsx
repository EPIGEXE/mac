/**
 * 공부 모드 뷰어
 * - 선택된 노트들을 순차/랜덤으로 표시
 * - readonly 마크다운 뷰어
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    IconChevronLeft,
    IconChevronRight,
    IconX,
    IconList,
    IconArrowsShuffle,
} from '@tabler/icons-react'
import type { Note } from '../../db/schema/note'
import { findNoteById } from '../../db/note/noteService'
import { MarkdownEditor } from '../NoteDetail/MarkdownEditor/MarkdownEditor'
import type { StudyMode } from '../../pages/StudyModePage'

interface StudyViewerProps {
    noteIds: string[]
    mode: StudyMode
    onExit: () => void
}

// 배열 셔플 (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export function StudyViewer({ noteIds, mode, onExit }: StudyViewerProps) {
    const [notes, setNotes] = useState<Note[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [orderedIds, setOrderedIds] = useState<string[]>([])

    // 노트 로드 및 순서 결정
    useEffect(() => {
        async function loadNotes() {
            const loadedNotes: Note[] = []
            for (const id of noteIds) {
                const note = await findNoteById(id)
                if (note) loadedNotes.push(note)
            }
            setNotes(loadedNotes)

            // 모드에 따라 순서 결정
            const ids = loadedNotes.map(n => n.id)
            setOrderedIds(mode === 'random' ? shuffleArray(ids) : ids)
            setIsLoading(false)
        }
        loadNotes()
    }, [noteIds, mode])

    // 현재 노트
    const currentNote = useMemo(() => {
        const id = orderedIds[currentIndex]
        return notes.find(n => n.id === id) || null
    }, [notes, orderedIds, currentIndex])

    // 네비게이션
    const goNext = useCallback(() => {
        if (currentIndex < orderedIds.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }, [currentIndex, orderedIds.length])

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }, [currentIndex])

    // 셔플 (랜덤 모드에서 다시 섞기)
    const reshuffle = useCallback(() => {
        setOrderedIds(shuffleArray(orderedIds))
        setCurrentIndex(0)
    }, [orderedIds])

    // 키보드 네비게이션
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'j') {
                goNext()
            } else if (e.key === 'ArrowLeft' || e.key === 'k') {
                goPrev()
            } else if (e.key === 'Escape') {
                onExit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goNext, goPrev, onExit])

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">loading notes...</span>
            </div>
        )
    }

    if (!currentNote) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">// no notes found</span>
            </div>
        )
    }

    const progress = ((currentIndex + 1) / orderedIds.length) * 100
    const isFirst = currentIndex === 0
    const isLast = currentIndex === orderedIds.length - 1

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[1000px] mx-auto px-6 py-3 flex items-center justify-between">
                    {/* Left: Exit */}
                    <button
                        onClick={onExit}
                        className="bg-transparent border-none p-2 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--error)]"
                    >
                        <IconX size={18} />
                        :q exit
                    </button>

                    {/* Center: Progress */}
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-[var(--text-tertiary)]">
                            {mode === 'sequential' ? (
                                <span className="flex items-center gap-1">
                                    <IconList size={14} />
                                    sequential
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <IconArrowsShuffle size={14} />
                                    random
                                </span>
                            )}
                        </span>
                        <span className="font-mono text-sm text-[var(--accent)]">
                            [{currentIndex + 1}/{orderedIds.length}]
                        </span>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-2">
                        {mode === 'random' && (
                            <button
                                onClick={reshuffle}
                                className="bg-transparent border border-[var(--border-light)] px-3 py-1.5 font-mono text-xs text-[var(--text-tertiary)] cursor-pointer flex items-center gap-1 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                                <IconArrowsShuffle size={14} />
                                shuffle
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-0.5 bg-[var(--bg-secondary)]">
                    <div
                        className="h-full bg-[var(--accent)] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1000px] mx-auto px-6 py-8">
                    {/* Category & Tags */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-mono text-xs text-[var(--accent)]">#</span>
                        <span className="font-mono text-xs text-[var(--text-tertiary)]">
                            {currentNote.category}
                        </span>
                        {currentNote.tags.map(tag => (
                            <span key={tag} className="font-mono text-xs text-[var(--text-tertiary)]">
                                @{tag}
                            </span>
                        ))}
                    </div>

                    {/* Title */}
                    <h1 className="font-display text-[28px] font-normal text-[var(--text-primary)] mb-6 leading-tight">
                        {currentNote.title}
                    </h1>

                    {/* Divider */}
                    <div className="border-t border-dashed border-[var(--border-light)] mb-6" />

                    {/* Content (readonly) */}
                    <MarkdownEditor
                        initialContent={currentNote.content || ''}
                        editable={false}
                        onChange={() => { return }}
                    />
                </div>
            </div>

            {/* Footer Navigation */}
            <footer className="border-t border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Previous */}
                    <button
                        onClick={goPrev}
                        disabled={isFirst}
                        className={`flex items-center gap-2 px-4 py-2 font-mono text-sm border transition-colors ${
                            isFirst
                                ? 'border-transparent text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
                                : 'border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)]'
                        }`}
                    >
                        <IconChevronLeft size={18} />
                        prev (k)
                    </button>

                    {/* Keyboard hint */}
                    <div className="font-mono text-xs text-[var(--text-tertiary)]">
                        use arrow keys or j/k to navigate
                    </div>

                    {/* Next */}
                    <button
                        onClick={goNext}
                        disabled={isLast}
                        className={`flex items-center gap-2 px-4 py-2 font-mono text-sm border transition-colors ${
                            isLast
                                ? 'border-transparent text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
                                : 'border-[var(--border-light)] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)]'
                        }`}
                    >
                        next (j)
                        <IconChevronRight size={18} />
                    </button>
                </div>
            </footer>
        </div>
    )
}
