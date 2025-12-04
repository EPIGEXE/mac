import { create } from 'zustand';
import type { Note } from '../db/schema/note';
import {
    initializeNoteService,
    getAllNotes,
    createNote as createNoteService,
    updateNote as updateNoteService,
    deleteNote as deleteNoteService,
    resetToOriginal as resetToOriginalService,
} from '../db/note/noteService';

interface NoteStore {
    notes: Note[];
    selectedNoteId: string | null;
    selectedNoteType: 'system' | 'user' | null;
    isEditing: boolean;
    isLoading: boolean;

    // Actions
    loadNotes: () => Promise<void>;
    createNote: (category: string) => Promise<string>;
    updateNote: (id: string, type: 'system' | 'user', updates: Partial<Pick<Note, 'title' | 'content' | 'category'>>) => Promise<void>;
    deleteNote: (id: string, type: 'system' | 'user') => Promise<void>;
    selectNote: (id: string | null, type?: 'system' | 'user' | null) => void;
    setEditing: (editing: boolean) => void;
    resetToOriginal: (systemNoteId: string) => Promise<void>;
    getSelectedNote: () => Note | null;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
    notes: [],
    selectedNoteId: null,
    selectedNoteType: null,
    isEditing: false,
    isLoading: true,

    loadNotes: async () => {
        set({ isLoading: true });

        // 노트 서비스 초기화 (systemNotes 로드)
        await initializeNoteService();

        // 모든 노트 조회 (system + user 통합)
        const notes = await getAllNotes();
        set({ notes, isLoading: false });
    },

    createNote: async (category: string) => {
        const newNote = await createNoteService({ category });

        set((state) => ({
            notes: [...state.notes, newNote],
            selectedNoteId: newNote.id,
            selectedNoteType: 'user',
            isEditing: true,
        }));

        return newNote.id;
    },

    updateNote: async (id: string, type: 'system' | 'user', updates: Partial<Pick<Note, 'title' | 'content' | 'category'>>) => {
        const updatedNote = await updateNoteService(id, type, updates);

        if (updatedNote) {
            set((state) => ({
                notes: state.notes.map((note) =>
                    note.id === id ? updatedNote : note
                ),
            }));
        }
    },

    deleteNote: async (id: string, type: 'system' | 'user') => {
        await deleteNoteService(id, type);

        set((state) => {
            // System note는 숨김 처리되므로 목록에서 제거
            // User note는 실제 삭제
            const newNotes = type === 'system'
                ? state.notes.filter(note => note.id !== id)
                : state.notes.filter(note => note.id !== id);

            return {
                notes: newNotes,
                selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
                selectedNoteType: state.selectedNoteId === id ? null : state.selectedNoteType,
            };
        });
    },

    selectNote: (id: string | null, type?: 'system' | 'user' | null) => {
        if (id === null) {
            set({ selectedNoteId: null, selectedNoteType: null, isEditing: false });
            return;
        }

        // type이 주어지지 않으면 notes에서 찾기
        if (!type) {
            const note = get().notes.find(n => n.id === id);
            type = note?.type ?? null;
        }

        set({ selectedNoteId: id, selectedNoteType: type ?? null, isEditing: false });
    },

    setEditing: (editing: boolean) => {
        set({ isEditing: editing });
    },

    resetToOriginal: async (systemNoteId: string) => {
        const resetNote = await resetToOriginalService(systemNoteId);

        if (resetNote) {
            set((state) => ({
                notes: state.notes.map((note) =>
                    note.id === systemNoteId ? resetNote : note
                ),
            }));
        }
    },

    getSelectedNote: () => {
        const { notes, selectedNoteId } = get();
        if (!selectedNoteId) return null;
        return notes.find(n => n.id === selectedNoteId) ?? null;
    },
}));
