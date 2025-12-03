import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSun, IconMoon, IconArrowLeft } from '@tabler/icons-react'
import { TerminalButton } from '../components/common/TerminalButton'
import { MarkdownEditor } from '../features/NoteDetail/MarkdownEditor/MarkdownEditor'
import { StudyModeSelector } from '../features/Study/components'
import type { StudyModeType } from '../features/Study/types'
import type { Note } from '../db/schema/note'

interface NoteDetailPageProps {
    note: Note
    theme: 'light' | 'dark'
    onThemeToggle: () => void
    onClose: () => void
    onUpdate: (updates: Partial<Omit<Note, 'id'>>) => void
    onDelete: () => void
    isEditing: boolean
    onEditingChange: (editing: boolean) => void
}

type Difficulty = 'word' | 'sentence' | 'paragraph'

export function NoteDetailPage({
    note,
    theme,
    onThemeToggle,
    onClose,
    onUpdate,
    onDelete,
    isEditing,
    onEditingChange,
}: NoteDetailPageProps) {
    const navigate = useNavigate()

    // ==================================== 상태 관리 =====================================
    const [isBlindMode, setIsBlindMode] = useState(false) // 블라인드 모드
    const [difficulty, setDifficulty] = useState<Difficulty>('word') // 난이도
    const [title, setTitle] = useState(note.title) // 제목
    const [pendingContent, setPendingContent] = useState<string | null>(null) // 임시 콘텐츠
    const [studyModalOpen, setStudyModalOpen] = useState(false) // 학습 모달
    const [studyMode, setStudyMode] = useState<StudyModeType>('word') // 학습 모드

    // ==================================== useRef =====================================
    const titleInputRef = useRef<HTMLInputElement>(null) // 제목 입력 참조

    // ==================================== useEffect =====================================
    // 제목 설정
    useEffect(() => {
        setTitle(note.title)
    }, [note.title])

    // 수정 모드로 들어가면 제목 입력 포커스
    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus()
        }
    }, [isEditing])

    // ==================================== 핸들러 =====================================
    // 학습 시작
    const handleStudyStart = useCallback(() => {
        setStudyModalOpen(false)
        navigate(`/study?noteId=${note.id}&mode=${studyMode}`)
    }, [navigate, note.id, studyMode])

    // 콘텐츠 변경
    const handleContentChange = useCallback((content: string) => {
        setPendingContent(content)
    }, [])

    // 저장
    const handleSave = useCallback(() => {
        const updates: Partial<Omit<Note, 'id'>> = {
            title: title.trim() || '제목 없음',
        }
        if (pendingContent !== null) {
            updates.content = pendingContent
        }
        onUpdate(updates)
        onEditingChange(false)
        setPendingContent(null)
    }, [title, pendingContent, onUpdate, onEditingChange])

    // 삭제
    const handleDelete = useCallback(() => {
        if (window.confirm('정말로 이 노트를 삭제하시겠습니까?')) {
            onDelete()
        }
    }, [onDelete])

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* 학습 모드 선택 모달 */}
            <StudyModeSelector
                open={studyModalOpen}
                onOpenChange={setStudyModalOpen}
                selectedMode={studyMode}
                onModeChange={setStudyMode}
                onStart={handleStudyStart}
                isLoading={false}
            />

            {/* Top bar - 터미널 스타일 */}
            <header className="border-b border-[var(--border-light)] bg-[var(--bg-paper)]">
                <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
                    {/* 좌측: 뒤로가기 */}
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none px-4 py-2.5 font-mono text-sm text-[var(--text-tertiary)] cursor-pointer flex items-center gap-2 transition-colors duration-150 hover:text-[var(--accent)]"
                    >
                        <IconArrowLeft size={18} />
                        {'<'} back
                    </button>

                    {/* 우측: 컨트롤 */}
                    <div className="flex items-center gap-4">
                        {/* Blind 모드 컨트롤 - 뷰 모드에서만 */}
                        {!isEditing && (
                            <div className="flex items-center gap-2">
                                {/* 난이도 선택 - 터미널 스타일 */}
                                <span className="font-mono text-sm text-[var(--text-tertiary)] mr-1">
                                    level:
                                </span>
                                {(['word', 'sentence', 'paragraph'] as const).map((level, idx) => (
                                    <span key={level} className="flex items-center">
                                        {idx > 0 && (
                                            <span className="font-mono text-sm text-[var(--text-tertiary)] mx-0.5">
                                                |
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setDifficulty(level)}
                                            className={`bg-transparent border-none px-2.5 py-1.5 font-mono text-sm cursor-pointer relative ${
                                                difficulty === level ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                                            }`}
                                        >
                                            {level === 'word' ? 'w' : level === 'sentence' ? 's' : 'p'}
                                            {difficulty === level && (
                                                <span className="absolute bottom-0 left-2.5 right-2.5 h-px bg-[var(--accent)]" />
                                            )}
                                        </button>
                                    </span>
                                ))}

                                {/* Blind 토글 */}
                                <span className="font-mono text-sm text-[var(--text-tertiary)] mx-2 ml-4">
                                    blind:
                                </span>
                                <button
                                    onClick={() => setIsBlindMode(!isBlindMode)}
                                    className={`bg-transparent px-3.5 py-[5px] text-sm cursor-pointer transition-all duration-150 border ${
                                        isBlindMode
                                            ? 'border-[var(--accent)] text-[var(--accent)]'
                                            : 'border-[var(--border-light)] text-[var(--text-tertiary)]'
                                    }`}
                                    style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                    {isBlindMode ? 'ON' : 'OFF'}
                                </button>

                                {/* 구분선 */}
                                <div className="w-px h-5 bg-[var(--border-light)] mx-2" />
                            </div>
                        )}

                        {/* 편집/저장 버튼 */}
                        {isEditing ? (
                            <div className="flex gap-2">
                                <TerminalButton onClick={handleSave} active>
                                    :w save
                                </TerminalButton>
                                <TerminalButton
                                    onClick={() => {
                                        setTitle(note.title)
                                        setPendingContent(null)
                                        onEditingChange(false)
                                    }}
                                >
                                    :q cancel
                                </TerminalButton>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                {/* 학습 버튼 - 강조 스타일 */}
                                <button
                                    onClick={() => setStudyModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[13px] bg-[var(--accent)] text-white border-none cursor-pointer transition-all duration-150 hover:opacity-90"
                                >
                                    <span className="text-[11px] opacity-80">▶</span>
                                    study
                                </button>
                                <TerminalButton onClick={() => onEditingChange(true)}>:e edit</TerminalButton>
                                <TerminalButton onClick={handleDelete} variant="danger">
                                    :d delete
                                </TerminalButton>
                            </div>
                        )}

                        {/* 테마 토글 */}
                        <button
                            onClick={onThemeToggle}
                            className="w-8 h-8 border border-[var(--border-light)] bg-transparent text-[var(--text-tertiary)] flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                        </button>
                    </div>
                </div>
            </header>

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
                    {isEditing ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full font-display text-[32px] font-normal text-[var(--text-primary)] mb-6 leading-[1.3] tracking-wide border-none border-b border-b-[var(--border-light)] outline-none bg-transparent pb-3"
                        />
                    ) : (
                        <h1 className="font-display text-[32px] font-normal text-[var(--text-primary)] mb-6 leading-[1.3] tracking-wide">
                            {note.title}
                        </h1>
                    )}

                    {/* 태그 */}
                    {note.tags.length > 0 && (
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

                    {/* 콘텐츠 */}
                    <MarkdownEditor
                        initialContent={note.content || ''}
                        onChange={handleContentChange}
                        editable={true}
                    />
                </div>
            </div>
        </div>
    )
}
