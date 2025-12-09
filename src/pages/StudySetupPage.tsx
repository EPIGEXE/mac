/**
 * 학습 준비 페이지
 * - 노트 선택
 * - 학습 모드 선택
 * - 순서 선택
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNoteStore } from '../stores/noteStore'
import { useStudySessionStore, type StudyOrder } from '../stores/studySessionStore'
import { NoteSelector } from '../features/Study/components/NoteSelector'
import { StudyModeInlineSelector } from '../features/Study/components/StudyModeInlineSelector'
import { StudyOrderSelector } from '../features/Study/components/StudyOrderSelector'
import type { StudyModeType } from '../features/Study/types'
import { shuffleArray } from '../utils/funtion'

export function StudySetupPage() {
    const navigate = useNavigate()

    // ================================ 전역 상태 ================================
    const { notes, isLoading, loadNotes } = useNoteStore()
    const { startSession } = useStudySessionStore()

    // ================================ 로컬 상태 ================================
    const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
    const [mode, setMode] = useState<StudyModeType>('word')
    const [order, setOrder] = useState<StudyOrder>('sequential')

    // ================================ useEffect ================================
    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    // ================================ 핸들러 ================================
    const handleBack = () => {
        navigate(-1)
    }

    const handleStart = () => {
        if (selectedNoteIds.length === 0) return

        // 순서에 따라 노트 ID 정렬
        const orderedIds = order === 'random'
            ? shuffleArray(selectedNoteIds)
            : selectedNoteIds

        // 세션 시작
        startSession({
            noteIds: orderedIds,
            mode,
            order,
        })

        // 학습 페이지로 이동
        navigate(`/study?mode=${mode}`)
    }

    // ================================ 렌더링 ================================
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <span className="font-mono text-[var(--text-tertiary)]">loading...</span>
            </div>
        )
    }

    const canStart = selectedNoteIds.length > 0

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Left: Back */}
                    <button
                        onClick={handleBack}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    {/* Right: Start Button */}
                    <button
                        onClick={handleStart}
                        disabled={!canStart}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 font-mono text-sm transition-all
                            ${canStart
                                ? 'bg-[var(--accent)] text-white cursor-pointer hover:opacity-90'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] cursor-not-allowed'
                            }
                        `}
                    >
                        <span className="text-xs opacity-80">▶</span>
                        start study
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[800px] mx-auto px-6 py-8">
                    {/* 페이지 제목 */}
                    <div className="mb-8">
                        <h1 className="font-display text-2xl text-[var(--text-primary)] mb-2">
                            학습 준비
                        </h1>
                        <p className="font-mono text-sm text-[var(--text-tertiary)]">
                            // 학습할 노트와 모드를 선택하세요
                        </p>
                    </div>

                    {/* 학습 모드 선택 */}
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-mono text-[var(--accent)]">#</span>
                            <h2 className="font-mono text-sm text-[var(--text-primary)]">학습 모드</h2>
                        </div>
                        <StudyModeInlineSelector value={mode} onChange={setMode} />
                    </section>

                    {/* 학습 순서 선택 */}
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-mono text-[var(--accent)]">#</span>
                            <h2 className="font-mono text-sm text-[var(--text-primary)]">학습 순서</h2>
                        </div>
                        <StudyOrderSelector value={order} onChange={setOrder} />
                    </section>

                    {/* 노트 선택 */}
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-mono text-[var(--accent)]">#</span>
                            <h2 className="font-mono text-sm text-[var(--text-primary)]">노트 선택</h2>
                            {selectedNoteIds.length > 0 && (
                                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                                    ({selectedNoteIds.length}개 선택됨)
                                </span>
                            )}
                        </div>
                        <NoteSelector
                            notes={notes}
                            selectedIds={selectedNoteIds}
                            onSelectionChange={setSelectedNoteIds}
                        />
                    </section>

                    {/* 선택 요약 */}
                    {selectedNoteIds.length > 0 && (
                        <section className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                            <div className="font-mono text-sm text-[var(--text-secondary)]">
                                <span className="text-[var(--accent)]">{selectedNoteIds.length}</span>개 노트를{' '}
                                <span className="text-[var(--accent)]">
                                    {mode === 'word' ? '단어' : mode === 'sentence' ? '문장' : '서술형'}
                                </span>{' '}
                                모드로{' '}
                                <span className="text-[var(--accent)]">
                                    {order === 'sequential' ? '순차적' : '랜덤'}
                                </span>
                                으로 학습합니다.
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}
