import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useNoteStore } from './noteStore'

// 의존성 모킹
vi.mock('../db/service/noteService', () => ({
    initializeNoteService: vi.fn().mockResolvedValue(undefined),
    getAllNotes: vi.fn().mockResolvedValue([]),
    createNote: vi.fn().mockResolvedValue({
        id: 'note-20251216-1',
        title: '새 노트',
        content: '',
        firstLine: '',
        category: 'React',
        type: 'user',
        isCustomized: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }),
    updateNote: vi.fn().mockResolvedValue({
        id: 'note-1',
        title: '수정된 제목',
        content: '수정된 내용',
        firstLine: '수정된 내용',
        category: 'React',
        type: 'user',
        isCustomized: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    resetToOriginal: vi.fn().mockResolvedValue({
        id: 'system-note-1',
        title: '원본 제목',
        content: '원본 내용',
        firstLine: '원본 내용',
        category: 'React',
        type: 'system',
        isCustomized: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }),
}))

vi.mock('../features/Toast/toast', () => ({
    terminalToast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}))

// 모킹된 모듈 임포트
import {
    initializeNoteService,
    getAllNotes,
    createNote as createNoteService,
    updateNote as updateNoteService,
    deleteNote as deleteNoteService,
    resetToOriginal as resetToOriginalService,
} from '../db/service/noteService'
import { terminalToast } from '../features/Toast/toast'

const mockInitializeNoteService = vi.mocked(initializeNoteService)
const mockGetAllNotes = vi.mocked(getAllNotes)
const mockCreateNoteService = vi.mocked(createNoteService)
const mockUpdateNoteService = vi.mocked(updateNoteService)
const mockDeleteNoteService = vi.mocked(deleteNoteService)
const mockResetToOriginalService = vi.mocked(resetToOriginalService)
const mockTerminalToast = vi.mocked(terminalToast)

describe('noteStore', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // 스토어 상태 초기화
        useNoteStore.setState({
            notes: [],
            selectedNoteId: null,
            selectedNoteType: null,
        })
    })

    // 초기 상태 테스트
    describe('초기 상태', () => {
        it('초기 상태가 올바르게 설정되어야 함', () => {
            const state = useNoteStore.getState()

            expect(state.notes).toEqual([])
            expect(state.selectedNoteId).toBeNull()
            expect(state.selectedNoteType).toBeNull()
        })
    })

    // 노트 불러오기 테스트
    describe('loadNotes', () => {
        it('노트를 로드하고 상태를 업데이트해야 함', async () => {
            const mockNotes = [
                {
                    id: 'note-1',
                    type: 'user' as const,
                    title: 'Note 1',
                    content: '리액트에 관하여',
                    firstLine: '리액트에 관하여',
                    category: 'React',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    isCustomized: false,
                },
                {
                    id: 'note-2',
                    title: 'Note 2',
                    content: '타입스크립트에 관하여',
                    firstLine: '타입스크립트에 관하여',
                    category: 'TypeScript',
                    type: 'system' as const,
                    isCustomized: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
                {
                    id: 'note-3',
                    title: 'Note 3',
                    content: 'CSS에 관하여',
                    firstLine: 'CSS에 관하여',
                    category: 'CSS',
                    type: 'system' as const,
                    isCustomized: true,
                    originalTitle: 'CSS',
                    originalContent: 'CSS에 관하여...',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
            ]
            mockGetAllNotes.mockResolvedValueOnce(mockNotes)

            await act(async () => {
                await useNoteStore.getState().loadNotes()
            })

            expect(mockInitializeNoteService).toHaveBeenCalled()
            expect(mockGetAllNotes).toHaveBeenCalled()
            expect(useNoteStore.getState().notes).toEqual(mockNotes)
        })

        it('로드 실패 시 에러를 설정해야 함', async () => {
            mockGetAllNotes.mockRejectedValueOnce(new Error('Load failed'))

            await act(async () => {
                await useNoteStore.getState().loadNotes()
            })

            // AppError.from()이 unknown 에러를 UNKNOWN 코드로 래핑하므로 userMessage 사용
            expect(mockTerminalToast.error).toHaveBeenCalledWith('알 수 없는 오류가 발생했습니다.')
        })
    })

    // 노트 생성 테스트
    describe('createNote', () => {
        it('노트를 생성하고 상태를 업데이트해야 함', async () => {
            let noteId: string | null = null

            await act(async () => {
                noteId = await useNoteStore.getState().createNote('React')
            })

            expect(noteId).toBe('note-20251216-1')
            expect(mockCreateNoteService).toHaveBeenCalledWith({ category: 'React' })
            expect(useNoteStore.getState().notes).toHaveLength(1)
            expect(useNoteStore.getState().selectedNoteId).toBe('note-20251216-1')
            expect(useNoteStore.getState().selectedNoteType).toBe('user')
        })

        it('생성 실패 시 null을 반환하고 토스트를 표시해야 함', async () => {
            mockCreateNoteService.mockRejectedValueOnce(new Error('Create failed'))

            let noteId: string | null = 'not-null'
            await act(async () => {
                noteId = await useNoteStore.getState().createNote('React')
            })

            expect(noteId).toBeNull()
            expect(mockTerminalToast.error).toHaveBeenCalledWith('노트 생성에 실패했습니다.')
        })
    })

    describe('updateNote', () => {
        beforeEach(() => {
            useNoteStore.setState({
                notes: [
                    {
                        id: 'note-1',
                        type: 'user',
                        title: 'Original',
                        content: 'Original Content',
                        firstLine: 'Original Content',
                        category: 'React',
                        isCustomized: false,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                ],
            })
        })

        it('노트를 업데이트하고 상태를 반영해야 함', async () => {
            let result = false

            await act(async () => {
                result = await useNoteStore
                    .getState()
                    .updateNote('note-1', 'user', { title: '수정된 제목', content: '수정된 내용' })
            })

            expect(result).toBe(true)
            expect(mockUpdateNoteService).toHaveBeenCalledWith('note-1', 'user', {
                title: '수정된 제목',
                content: '수정된 내용',
            })
            expect(useNoteStore.getState().notes[0].title).toBe('수정된 제목')
            expect(useNoteStore.getState().notes[0].content).toBe('수정된 내용')
        })

        it('업데이트 실패 시 false를 반환하고 토스트를 표시해야 함', async () => {
            mockUpdateNoteService.mockRejectedValueOnce(new Error('Update failed'))

            let result = true
            await act(async () => {
                result = await useNoteStore.getState().updateNote('note-1', 'user', { title: 'New', content: 'New Content' })
            })

            expect(result).toBe(false)
            expect(mockTerminalToast.error).toHaveBeenCalledWith('노트 저장에 실패했습니다.')
        })
    })

    // 노트 삭제 테스트
    describe('deleteNote', () => {
        beforeEach(() => {
            useNoteStore.setState({
                notes: [
                    {
                        id: 'note-1',
                        title: 'Note 1',
                        content: 'react에 관하여',
                        firstLine: 'react에 관하여',
                        category: 'React',
                        isCustomized: false,
                        type: 'user',
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                    {
                        id: 'note-2',
                        title: 'Note 2',
                        content: 'typescript에 관하여',
                        firstLine: 'typescript에 관하여',
                        category: 'TypeScript',
                        isCustomized: false,
                        type: 'user',
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                ],
                selectedNoteId: 'note-1',
                selectedNoteType: 'user',
            })
        })

        it('노트를 삭제하고 목록에서 제거해야 함', async () => {
            let result = false

            await act(async () => {
                result = await useNoteStore.getState().deleteNote('note-1', 'user')
            })

            expect(result).toBe(true)
            expect(mockDeleteNoteService).toHaveBeenCalledWith('note-1', 'user')
            expect(useNoteStore.getState().notes).toHaveLength(1)
            expect(useNoteStore.getState().notes[0].id).toBe('note-2')
            expect(mockTerminalToast.success).toHaveBeenCalledWith('노트가 삭제되었습니다.')
        })

        it('선택된 노트가 삭제되면 선택을 해제해야 함', async () => {
            await act(async () => {
                await useNoteStore.getState().deleteNote('note-1', 'user')
            })

            expect(useNoteStore.getState().selectedNoteId).toBeNull()
            expect(useNoteStore.getState().selectedNoteType).toBeNull()
        })

        it('삭제 실패 시 false를 반환하고 토스트를 표시해야 함', async () => {
            mockDeleteNoteService.mockRejectedValueOnce(new Error('Delete failed'))

            let result = true
            await act(async () => {
                result = await useNoteStore.getState().deleteNote('note-1', 'user')
            })

            expect(result).toBe(false)
            expect(mockTerminalToast.error).toHaveBeenCalledWith('노트 삭제에 실패했습니다.')
        })
    })

    describe('selectNote', () => {
        beforeEach(() => {
            useNoteStore.setState({
                notes: [
                    {
                        id: 'note-1',
                        title: 'Note 1',
                        content: '',
                        firstLine: '',
                        isCustomized: false,
                        category: 'React',
                        type: 'user',
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                    {
                        id: 'system-1',
                        title: 'System Note',
                        content: '',
                        firstLine: '',
                        isCustomized: false,
                        category: 'TypeScript',
                        type: 'system',
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                ],
            })
        })

        it('노트를 선택해야 함', () => {
            act(() => {
                useNoteStore.getState().selectNote('note-1', 'user')
            })

            expect(useNoteStore.getState().selectedNoteId).toBe('note-1')
            expect(useNoteStore.getState().selectedNoteType).toBe('user')
        })

        it('type이 주어지지 않으면 notes에서 찾아야 함', () => {
            act(() => {
                useNoteStore.getState().selectNote('system-1')
            })

            expect(useNoteStore.getState().selectedNoteId).toBe('system-1')
            expect(useNoteStore.getState().selectedNoteType).toBe('system')
        })

        it('null을 전달하면 선택을 해제해야 함', () => {
            useNoteStore.setState({ selectedNoteId: 'note-1', selectedNoteType: 'user' })

            act(() => {
                useNoteStore.getState().selectNote(null)
            })

            expect(useNoteStore.getState().selectedNoteId).toBeNull()
            expect(useNoteStore.getState().selectedNoteType).toBeNull()
        })
    })

    describe('resetToOriginal', () => {
        beforeEach(() => {
            useNoteStore.setState({
                notes: [
                    {
                        id: 'system-note-1',
                        title: '수정된 제목',
                        content: '수정된 내용',
                        firstLine: '수정된 내용',
                        category: 'React',
                        type: 'system',
                        isCustomized: false,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                ],
            })
        })

        it('시스템 노트를 원본으로 복원해야 함', async () => {
            let result = false

            await act(async () => {
                result = await useNoteStore.getState().resetToOriginal('system-note-1')
            })

            expect(result).toBe(true)
            expect(mockResetToOriginalService).toHaveBeenCalledWith('system-note-1')
            expect(useNoteStore.getState().notes[0].title).toBe('원본 제목')
        })

        it('복원 실패 시 false를 반환하고 토스트를 표시해야 함', async () => {
            mockResetToOriginalService.mockRejectedValueOnce(new Error('Reset failed'))

            let result = true
            await act(async () => {
                result = await useNoteStore.getState().resetToOriginal('system-note-1')
            })

            expect(result).toBe(false)
            expect(mockTerminalToast.error).toHaveBeenCalledWith('원본 복원에 실패했습니다.')
        })
    })

    describe('getSelectedNote', () => {
        it('선택된 노트를 반환해야 함', () => {
            const mockNote = {
                id: 'note-1',
                title: 'Note 1',
                content: 'react에 관하여',
                firstLine: 'react에 관하여',
                category: 'React',
                type: 'user' as const,
                isCustomized: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
            useNoteStore.setState({
                notes: [mockNote],
                selectedNoteId: 'note-1',
            })

            const selectedNote = useNoteStore.getState().getSelectedNote()

            expect(selectedNote).toEqual(mockNote)
        })

        it('선택된 노트가 없으면 null을 반환해야 함', () => {
            useNoteStore.setState({
                notes: [
                    {
                        id: 'note-1',
                        title: 'Note 1',
                        content: 'react에 관하여',
                        firstLine: 'react에 관하여',
                        category: 'React',
                        type: 'user',
                        isCustomized: false,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                ],
                selectedNoteId: null,
            })

            const selectedNote = useNoteStore.getState().getSelectedNote()

            expect(selectedNote).toBeNull()
        })
    })

})
