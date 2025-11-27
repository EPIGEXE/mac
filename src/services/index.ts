// =============================================================================
// Services Barrel Export
// =============================================================================

// Note Services
export {
    // Initialization
    initializeNoteService,
    initializeSystemNotes,
    applySystemNotesPatch,

    // Note CRUD
    getAllNotes,
    getNoteById,
    findNoteById,
    createNote,
    updateNote,
    deleteNote,
    resetToOriginal,
    unhideSystemNote,

    // System Notes
    getAllSystemNotes,
    getSystemNoteById,
    getSystemNotesByCategory,
    resetSystemNotes,

    // Categories
    getCategories,

    // Types
    type CreateNoteInput,
    type UpdateNoteInput,
    type GetAllNotesOptions,
    type NoteListResult,
    type Note,
} from './note';

// Study Services
export {
    // Session Management
    startSession,
    endSession,
    addNoteToSession,
    getSession,
    getRecentSessions,

    // Study Records
    recordStudy,
    getStudyHistory,
    getAllStudyRecords,
    type RecordStudyInput,

    // Weak Points
    addWeakPoint,
    resolveWeakPoint,
    unresolveWeakPoint,
    deleteWeakPoint,
    getWeakPointsByNote,
    getUnresolvedWeakPoints,
    getTopWeakPoints,
    getAllWeakPoints,
    type AddWeakPointInput,

    // Statistics
    getOverallStats,
    getNoteStats,
    getAllNoteStats,
    getPeriodStats,
    getTodayStats,
    getRecommendedNotes,
    type OverallStats,
    type NoteStats,
    type PeriodStats,
    type RecommendedNote,
} from './study';
