import { create } from 'zustand';
import { db, type Note } from '../lib/db';
import { defaultNotes } from '../data/defaultNotes';

interface NoteStore {
    notes: Note[];
    selectedNoteId: string | null;
    isEditing: boolean;
    isLoading: boolean;

    // Actions
    loadNotes: () => Promise<void>;
    createNote: (category: string) => Promise<string>;
    updateNote: (id: string, updates: Partial<Omit<Note, 'id'>>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    selectNote: (id: string | null) => void;
    setEditing: (editing: boolean) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
    notes: [],
    selectedNoteId: null,
    isEditing: false,
    isLoading: true,

    loadNotes: async () => {
        set({ isLoading: true });

        // DB에 노트가 없으면 기본 노트 초기화
        const count = await db.notes.count();
        if (count === 0) {
            await db.notes.bulkAdd(defaultNotes as Note[]);
        }

        const notes = await db.notes.orderBy('updatedAt').reverse().toArray();
        set({ notes, isLoading: false });
    },

    createNote: async (category: string) => {
        const now = Date.now();
        const id = `note-${now}`;
        const newNote: Note = {
            id,
            title: '새 노트',
            content: '',
            category,
            tags: [],
            createdAt: now,
            updatedAt: now,
        };

        await db.notes.add(newNote);
        set((state) => ({
            notes: [newNote, ...state.notes],
            selectedNoteId: id,
            isEditing: true,
        }));

        return id;
    },

    updateNote: async (id: string, updates: Partial<Omit<Note, 'id'>>) => {
        const updatedData = {
            ...updates,
            updatedAt: Date.now(),
        };

        await db.notes.update(id, updatedData);
        set((state) => ({
            notes: state.notes.map((note) =>
                note.id === id ? { ...note, ...updatedData } : note
            ),
        }));
    },

    deleteNote: async (id: string) => {
        await db.notes.delete(id);
        set((state) => ({
            notes: state.notes.filter((note) => note.id !== id),
            selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        }));
    },

    selectNote: (id: string | null) => {
        set({ selectedNoteId: id, isEditing: false });
    },

    setEditing: (editing: boolean) => {
        set({ isEditing: editing });
    },
}));
