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
import { terminalToast } from '../features/Toast/toast';
import { getErrorMessage } from '../utils/errorHandler';

interface NoteStore {
    notes: Note[];
    selectedNoteId: string | null;
    selectedNoteType: 'system' | 'user' | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadNotes: () => Promise<void>;
    createNote: (category: string) => Promise<string | null>;
    updateNote: (id: string, type: 'system' | 'user', updates: Partial<Pick<Note, 'title' | 'content' | 'category'>>) => Promise<boolean>;
    deleteNote: (id: string, type: 'system' | 'user') => Promise<boolean>;
    selectNote: (id: string | null, type?: 'system' | 'user' | null) => void;
    resetToOriginal: (systemNoteId: string) => Promise<boolean>;
    getSelectedNote: () => Note | null;
    clearError: () => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
    notes: [],
    selectedNoteId: null,
    selectedNoteType: null,
    isEditing: false,
    isLoading: true,
    error: null,

    loadNotes: async () => {
        set({ isLoading: true, error: null });

        try {
            // 노트 서비스 초기화 (systemNotes 로드)
            await initializeNoteService();

            // 모든 노트 조회 (system + user 통합)
            const notes = await getAllNotes();
            set({ notes, isLoading: false });
        } catch (error) {
            const message = getErrorMessage(error);
            set({ error: message, isLoading: false });
            terminalToast.error('노트를 불러오는데 실패했습니다.');
            console.error('[noteStore.loadNotes]', error);
        }
    },

    createNote: async (category: string) => {
        try {
            const newNote = await createNoteService({ category });

            set((state) => ({
                notes: [...state.notes, newNote],
                selectedNoteId: newNote.id,
                selectedNoteType: 'user',
                isEditing: true,
            }));

            return newNote.id;
        } catch (error) {
            terminalToast.error('노트 생성에 실패했습니다.');
            console.error('[noteStore.createNote]', error);
            return null;
        }
    },

    updateNote: async (id: string, type: 'system' | 'user', updates: Partial<Pick<Note, 'title' | 'content' | 'category'>>) => {
        try {
            const updatedNote = await updateNoteService(id, type, updates);

            if (updatedNote) {
                set((state) => ({
                    notes: state.notes.map((note) =>
                        note.id === id ? updatedNote : note
                    ),
                }));
            }
            return true;
        } catch (error) {
            terminalToast.error('노트 저장에 실패했습니다.');
            console.error('[noteStore.updateNote]', error);
            return false;
        }
    },

    deleteNote: async (id: string, type: 'system' | 'user') => {
        try {
            await deleteNoteService(id, type);

            set((state) => {
                const newNotes = state.notes.filter(note => note.id !== id);

                return {
                    notes: newNotes,
                    selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
                    selectedNoteType: state.selectedNoteId === id ? null : state.selectedNoteType,
                };
            });

            terminalToast.success('노트가 삭제되었습니다.');
            return true;
        } catch (error) {
            terminalToast.error('노트 삭제에 실패했습니다.');
            console.error('[noteStore.deleteNote]', error);
            return false;
        }
    },

    selectNote: (id: string | null, type?: 'system' | 'user' | null) => {
        if (id === null) {
            set({ selectedNoteId: null, selectedNoteType: null });
            return;
        }

        // type이 주어지지 않으면 notes에서 찾기
        if (!type) {
            const note = get().notes.find(n => n.id === id);
            type = note?.type ?? null;
        }

        set({ selectedNoteId: id, selectedNoteType: type ?? null });
    },

    resetToOriginal: async (systemNoteId: string) => {
        try {
            const resetNote = await resetToOriginalService(systemNoteId);

            if (resetNote) {
                set((state) => ({
                    notes: state.notes.map((note) =>
                        note.id === systemNoteId ? resetNote : note
                    ),
                }));
            }
            return true;
        } catch (error) {
            terminalToast.error('원본 복원에 실패했습니다.');
            console.error('[noteStore.resetToOriginal]', error);
            return false;
        }
    },

    getSelectedNote: () => {
        const { notes, selectedNoteId } = get();
        if (!selectedNoteId) return null;
        return notes.find(n => n.id === selectedNoteId) ?? null;
    },

    clearError: () => set({ error: null }),
}));
