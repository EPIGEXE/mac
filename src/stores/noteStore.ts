import { create } from 'zustand'
import type { Note } from '../db/schema/note'
import {
    initializeNoteService,
    getAllNotes,
    createNote as createNoteService,
    updateNote as updateNoteService,
    deleteNote as deleteNoteService,
    resetToOriginal as resetToOriginalService,
} from '../db/note/noteService'
import { terminalToast } from '../features/Toast/toast'
import { AppError } from '../errors'

interface NoteStore {
    notes: Note[] // 노트 목록
    isLoaded: boolean // 노트 로드 완료 여부
    isInitialized: boolean // 노트 서비스 초기화 완료 여부 (1회만 수행)
    selectedNoteId: string | null // 선택된 노트 ID
    selectedNoteType: 'system' | 'user' | null // 선택된 노트 타입

    loadNotes: () => Promise<void> // 노트 목록 로드
    createNote: (category: string) => Promise<string | null> // 노트 생성
    updateNote: (
        id: string,
        type: 'system' | 'user',
        updates: Partial<Pick<Note, 'title' | 'content' | 'category'>>
    ) => Promise<boolean> // 노트 업데이트  
    deleteNote: (id: string, type: 'system' | 'user') => Promise<boolean> // 노트 삭제
    selectNote: (id: string | null, type?: 'system' | 'user' | null) => void // 노트 선택   
    resetToOriginal: (systemNoteId: string) => Promise<boolean> // 원본 복원
    getSelectedNote: () => Note | null // 선택된 노트 반환
}

export const useNoteStore = create<NoteStore>((set, get) => ({
    notes: [],
    isLoaded: false,
    isInitialized: false,
    selectedNoteId: null,
    selectedNoteType: null,

    loadNotes: async () => {
        try {
            // 노트 서비스 초기화 (1회만 수행)
            if (!get().isInitialized) {
                await initializeNoteService()
                set({ isInitialized: true })
            }

            // 모든 노트 조회 (system + user 통합)
            const notes = await getAllNotes()
            set({ notes, isLoaded: true })
        } catch (error) {
            const appError = AppError.from(error)
            terminalToast.error(appError.userMessage)
            console.error('[noteStore.loadNotes]', appError.code, error)
        }
    },

    createNote: async (category: string) => {
        try {
            const newNote = await createNoteService({ category })

            set((state) => ({
                notes: [...state.notes, newNote],
                selectedNoteId: newNote.id,
                selectedNoteType: 'user',
            }))

            return newNote.id
        } catch (error) {
            terminalToast.error('노트 생성에 실패했습니다.')
            console.error('[noteStore.createNote]', error)
            return null
        }
    },

    updateNote: async (
        id: string,
        type: 'system' | 'user',
        updates: Partial<Pick<Note, 'title' | 'content'>>
    ) => {
        try {
            const updatedNote = await updateNoteService(id, type, updates)

            if (updatedNote) {
                set((state) => ({
                    notes: state.notes.map((note) => (note.id === id ? updatedNote : note)),
                }))
            }
            return true
        } catch (error) {
            terminalToast.error('노트 저장에 실패했습니다.')
            console.error('[noteStore.updateNote]', error)
            return false
        }
    },

    deleteNote: async (id: string, type: 'system' | 'user') => {
        try {
            await deleteNoteService(id, type)

            set((state) => {
                const newNotes = state.notes.filter((note) => note.id !== id)

                return {
                    notes: newNotes,
                    selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
                    selectedNoteType: state.selectedNoteId === id ? null : state.selectedNoteType,
                }
            })

            terminalToast.success('노트가 삭제되었습니다.')
            return true
        } catch (error) {
            terminalToast.error('노트 삭제에 실패했습니다.')
            console.error('[noteStore.deleteNote]', error)
            return false
        }
    },

    selectNote: (id: string | null, type?: 'system' | 'user' | null) => {
        if (id === null) {
            set({ selectedNoteId: null, selectedNoteType: null })
            return
        }

        // type이 주어지지 않으면 notes에서 찾기
        if (!type) {
            const note = get().notes.find((n) => n.id === id)
            type = note?.type ?? null
        }

        set({ selectedNoteId: id, selectedNoteType: type ?? null })
    },

    resetToOriginal: async (systemNoteId: string) => {
        try {
            const resetNote = await resetToOriginalService(systemNoteId)

            if (resetNote) {
                set((state) => ({
                    notes: state.notes.map((note) => (note.id === systemNoteId ? resetNote : note)),
                }))
            }
            return true
        } catch (error) {
            terminalToast.error('원본 복원에 실패했습니다.')
            console.error('[noteStore.resetToOriginal]', error)
            return false
        }
    },

    getSelectedNote: () => {
        const { notes, selectedNoteId } = get()
        if (!selectedNoteId) return null
        return notes.find((n) => n.id === selectedNoteId) ?? null
    },
}))
