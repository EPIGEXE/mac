// Study Services
export {
    startSession,
    endSession,
    addNoteToSession,
    recordStudy,
    getStudyHistory,
    getSession,
    getRecentSessions,
    getAllStudyRecords,
    type RecordStudyInput,
} from './studyService';

export {
    addWeakPoint,
    resolveWeakPoint,
    unresolveWeakPoint,
    deleteWeakPoint,
    getWeakPointsByNote,
    getUnresolvedWeakPoints,
    getTopWeakPoints,
    getAllWeakPoints,
    type AddWeakPointInput,
} from './weakPointService';

export {
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
} from './statisticsService';
