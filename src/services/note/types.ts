import type { Note } from '../../lib/db';

// ============================================================================
// Note Service Input Types
// ============================================================================

export interface CreateNoteInput {
    title?: string;
    content?: string;
    category: string;
    tags?: string[];
}

export interface UpdateNoteInput {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
}

// ============================================================================
// Note Service Result Types
// ============================================================================

export interface GetAllNotesOptions {
    includeHidden?: boolean;
    category?: string;
}

export interface NoteListResult {
    notes: Note[];
    systemCount: number;
    userCount: number;
}

// ============================================================================
// Re-export Note type for convenience
// ============================================================================

export type { Note } from '../../lib/db';
