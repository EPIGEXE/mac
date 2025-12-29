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
import { SectionTitle } from '../components/common/SectionTitle'
import { analytics } from '../lib/analytics'

export function StudySetupPage() {
    const navigate = useNavigate()

    // ================================ 전역 상태 ================================
    const notes = useNoteStore((state) => state.notes) // 노트 목록
    const loadNotes = useNoteStore((state) => state.loadNotes) // 노트 로드
    const startSession = useStudySessionStore((state) => state.startSession)

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
        const orderedIds = order === 'random' ? shuffleArray(selectedNoteIds) : selectedNoteIds

        // 세션 시작
        startSession({
            noteIds: orderedIds,
            mode,
            order,
        })

        // GA 추적
        analytics.studyStart(selectedNoteIds.length)

        // 학습 페이지로 이동
        navigate(`/study?mode=${mode}`)
    }

    const canStart = selectedNoteIds.length > 0

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[800px] mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    {/* Left: Back */}
                    <button
                        onClick={handleBack}
                        className="bg-transparent border-none px-2 md:px-4 py-2 md:py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-1.5 md:gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    {/* Right: Start Button */}
                    <button
                        onClick={handleStart}
                        disabled={!canStart}
                        className={`
                            flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 font-mono text-sm transition-all
                            ${
                                canStart
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
                <div className="max-w-[800px] mx-auto px-4 md:px-6 py-6 md:py-8">
                    {/* 페이지 제목 */}
                    <div className="mb-6 md:mb-8">
                        <h1 className="font-display text-xl md:text-2xl text-[var(--text-primary)] mb-2">학습 준비</h1>
                        <p className="font-mono text-sm text-[var(--text-secondary)]">
                            // 학습할 노트와 모드를 선택하세요
                        </p>
                    </div>

                    {/* 학습 모드 선택 */}
                    <section className="mb-6 md:mb-8">
                        <SectionTitle className="mb-4 md:mb-6">학습 모드</SectionTitle>
                        <StudyModeInlineSelector value={mode} onChange={setMode} />
                    </section>

                    {/* 학습 순서 선택 */}
                    <section className="mb-6 md:mb-8">
                        <SectionTitle className="mb-4 md:mb-6">학습 순서</SectionTitle>
                        <StudyOrderSelector value={order} onChange={setOrder} />
                    </section>

                    {/* 노트 선택 */}
                    <section className="mb-6 md:mb-8">
                        <SectionTitle className="mb-4 md:mb-6">
                            <span className="flex items-center gap-2 flex-wrap">
                                <span>노트 선택</span>
                                {selectedNoteIds.length > 0 && (
                                    <span className="font-mono text-sm text-[var(--text-secondary)]">
                                        ({selectedNoteIds.length}개 선택됨)
                                    </span>
                                )}
                            </span>
                        </SectionTitle>

                        <NoteSelector
                            notes={notes}
                            selectedIds={selectedNoteIds}
                            onSelectionChange={setSelectedNoteIds}
                        />
                    </section>

                    {/* 선택 요약 */}
                    {selectedNoteIds.length > 0 && (
                        <section className="p-3 md:p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)]">
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
