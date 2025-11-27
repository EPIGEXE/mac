// Note Services
export {
    initializeNoteService,
    getAllNotes,
    getNoteById,
    findNoteById,
    createNote,
    updateNote,
    deleteNote,
    resetToOriginal,
    unhideSystemNote,
    getCategories,
} from './noteService';

export {
    initializeSystemNotes,
    applySystemNotesPatch,
    getAllSystemNotes,
    getSystemNoteById,
    getSystemNotesByCategory,
    resetSystemNotes,
} from './systemNoteService';

// Types
export type {
    CreateNoteInput,
    UpdateNoteInput,
    GetAllNotesOptions,
    NoteListResult,
    Note,
} from './types';
