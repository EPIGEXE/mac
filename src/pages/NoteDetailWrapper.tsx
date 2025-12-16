import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'
import { NoteDetailPage } from './NoteDetailPage'
import { useTheme } from '../contexts/useTheme'

export function NoteDetailWrapper() {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션
    const { noteId } = useParams<{ noteId: string }>() // 노트 ID
    const { theme, toggleTheme } = useTheme() // 테마

    // ==================================== 전역 상태 =====================================
    const notes = useNoteStore((state) => state.notes) // 노트 목록
    const loadNotes = useNoteStore((state) => state.loadNotes) // 노트 로드
    const updateNote = useNoteStore((state) => state.updateNote) // 노트 업데이트
    const deleteNote = useNoteStore((state) => state.deleteNote) // 노트 삭제

    // ==================================== useEffect =====================================
    // 노트 로드
    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    // ==================================== 상수 =====================================
    const note = notes.find((n) => n.id === noteId) // 보여줄 노트 찾기

    // ==================================== 핸들러 =====================================
    // 닫기
    const handleClose = () => {
        navigate('/')
    }

    // 노트 업데이트
    const handleUpdateNote = async (updates: Partial<Omit<typeof note, 'id'>>) => {
        if (noteId && note) {
            await updateNote(noteId, note.type, updates)
        }
    }

    // 노트 삭제
    const handleDeleteNote = async () => {
        if (noteId && note) {
            await deleteNote(noteId, note.type)
            navigate('/')
        }
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center flex-col gap-4">
                <div className="text-[var(--text-secondary)]">노트를 찾을 수 없습니다.</div>
                <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-[var(--accent)] text-white border-none rounded-lg cursor-pointer"
                >
                    메인으로 돌아가기
                </button>
            </div>
        )
    }

    return (
        <NoteDetailPage
            note={note}
            theme={theme}
            onThemeToggle={toggleTheme}
            onClose={handleClose}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
        />
    )
}
