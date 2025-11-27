import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNoteStore } from '../stores/noteStore';
import { useTheme } from '../contexts';
import { NoteDetailPage } from './NoteDetailPage';

export function NoteDetailWrapper() {
    const navigate = useNavigate();
    const { noteId } = useParams<{ noteId: string }>();
    const { theme, toggleTheme } = useTheme();
    const { notes, isLoading, loadNotes, updateNote, deleteNote, isEditing, setEditing } = useNoteStore();

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const note = notes.find((n) => n.id === noteId);

    const handleClose = () => {
        navigate('/');
    };

    const handleUpdateNote = async (updates: Parameters<typeof updateNote>[1]) => {
        if (noteId) {
            await updateNote(noteId, updates);
        }
    };

    const handleDeleteNote = async () => {
        if (noteId) {
            await deleteNote(noteId);
            navigate('/');
        }
    };

    if (isLoading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ color: 'var(--text-secondary)' }}>로딩 중...</div>
            </div>
        );
    }

    if (!note) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '16px',
                }}
            >
                <div style={{ color: 'var(--text-secondary)' }}>노트를 찾을 수 없습니다.</div>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                >
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <NoteDetailPage
            note={note}
            theme={theme}
            onThemeToggle={toggleTheme}
            onClose={handleClose}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            isEditing={isEditing}
            onEditingChange={setEditing}
        />
    );
}
