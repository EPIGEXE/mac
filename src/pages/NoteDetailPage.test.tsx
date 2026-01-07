import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NoteDetailPage } from './NoteDetailPage'

/**
 * NoteDetailPage 테스트
 *
 * 모킹 전략:
 * - useNavigate: 라우팅 검증
 * - noteStore: 노트 CRUD 동작 검증
 * - studySessionStore: 학습 세션 시작 검증
 * - 하위 컴포넌트: 단위 테스트 격리를 위해 모킹
 */

// Navigation mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

// noteStore mock
const mockNote = {
    id: 'note-1',
    title: 'Test Note',
    content: '# Test Content\n\nThis is test content.',
    category: 'React',
    tag: 'hooks',
    type: 'user' as const,
}

const mockLoadNotes = vi.fn()
const mockUpdateNote = vi.fn().mockResolvedValue(undefined)
const mockDeleteNote = vi.fn().mockResolvedValue(undefined)
let mockNotes = [mockNote]

vi.mock('../stores/noteStore', () => ({
    useNoteStore: vi.fn((selector) => {
        const state = {
            notes: mockNotes,
            loadNotes: mockLoadNotes,
            updateNote: mockUpdateNote,
            deleteNote: mockDeleteNote,
        }
        return selector(state)
    }),
}))

// studySessionStore mock
const mockStartSession = vi.fn()
vi.mock('../stores/studySessionStore', () => ({
    useStudySessionStore: vi.fn((selector) => {
        const state = {
            startSession: mockStartSession,
        }
        return selector(state)
    }),
}))

// Toast mock
vi.mock('../features/Toast/toast', () => ({
    terminalToast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
    },
}))

// Analytics mock
vi.mock('../lib/analytics', () => ({
    analytics: {
        noteView: vi.fn(),
    },
}))

// Child component mocks
vi.mock('../features/NoteDetail/NoteDetailHeader', () => ({
    NoteDetailHeader: ({
        handleBack,
        handleStudyStart,
        handleSave,
        handleDeleteClick,
        canSave,
        disabledSave,
    }: {
        handleBack: () => void
        handleStudyStart: () => void
        handleSave: () => void
        handleDeleteClick: () => void
        canSave: boolean
        disabledSave: boolean
    }) => (
        <div data-testid="note-detail-header">
            <button data-testid="back-btn" onClick={handleBack}>Back</button>
            <button data-testid="study-btn" onClick={handleStudyStart}>Study</button>
            <button data-testid="save-btn" onClick={handleSave} disabled={!canSave || disabledSave}>Save</button>
            <button data-testid="delete-btn" onClick={handleDeleteClick}>Delete</button>
        </div>
    ),
}))

vi.mock('../components/common/NoteHeader', () => ({
    NoteHeader: ({
        title,
        category,
        onTitleChange,
    }: {
        title: string
        category: string
        tag?: string
        editable?: boolean
        onTitleChange?: (title: string) => void
    }) => (
        <div data-testid="note-header">
            <input
                data-testid="title-input"
                value={title}
                onChange={(e) => onTitleChange?.(e.target.value)}
            />
            <span>Category: {category}</span>
        </div>
    ),
}))

vi.mock('../features/NoteDetail/MarkdownEditor/MarkdownEditor', () => ({
    MarkdownEditor: ({
        initialContent,
        onChange,
        onLengthChange,
    }: {
        initialContent: string
        onChange: (content: string) => void
        editable?: boolean
        maxLength?: number
        onLengthChange?: (length: number) => void
    }) => (
        <div data-testid="markdown-editor">
            <textarea
                data-testid="content-textarea"
                defaultValue={initialContent}
                onChange={(e) => {
                    onChange(e.target.value)
                    onLengthChange?.(e.target.value.length)
                }}
            />
        </div>
    ),
}))

vi.mock('../features/NoteDetail/TableOfContents', () => ({
    TableOfContents: () => <div data-testid="table-of-contents" />,
}))

vi.mock('../features/NoteDetail/StudyModeSelectModal', () => ({
    StudyModeSelectModal: ({
        open,
        onOpenChange,
        selectedMode,
        onModeChange,
        onStart,
    }: {
        open: boolean
        onOpenChange: (open: boolean) => void
        selectedMode: string
        onModeChange: (mode: string) => void
        onStart: () => void
    }) => open ? (
        <div data-testid="study-modal">
            <span>Selected: {selectedMode}</span>
            <button data-testid="mode-sentence" onClick={() => onModeChange('sentence')}>Sentence</button>
            <button data-testid="start-study" onClick={onStart}>Start</button>
            <button data-testid="close-modal" onClick={() => onOpenChange(false)}>Close</button>
        </div>
    ) : null,
}))

vi.mock('../features/NoteDetail/UnsavedChangesModal', () => ({
    UnsavedChangesModal: ({
        unsavedModalOpen,
        handleDiscardAndClose,
        handleSaveAndClose,
    }: {
        unsavedModalOpen: boolean
        setUnsavedModalOpen: (open: boolean) => void
        handleDiscardAndClose: () => void
        handleSaveAndClose: () => void
    }) => unsavedModalOpen ? (
        <div data-testid="unsaved-modal">
            <button data-testid="discard-btn" onClick={handleDiscardAndClose}>Discard</button>
            <button data-testid="save-close-btn" onClick={handleSaveAndClose}>Save & Close</button>
        </div>
    ) : null,
}))

vi.mock('../features/NoteDetail/DeleteConfirmModal', () => ({
    DeleteConfirmModal: ({
        deleteModalOpen,
        handleConfirmDelete,
    }: {
        deleteModalOpen: boolean
        setDeleteModalOpen: (open: boolean) => void
        handleConfirmDelete: () => void
    }) => deleteModalOpen ? (
        <div data-testid="delete-modal">
            <button data-testid="confirm-delete" onClick={handleConfirmDelete}>Confirm Delete</button>
        </div>
    ) : null,
}))

vi.mock('../components/ErrorBoundary/ErrorBoundary', () => ({
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../components/ErrorBoundary/ErrorFallback', () => ({
    ErrorFallback: () => <div>Error</div>,
}))

describe('NoteDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockNotes = [mockNote]
    })

    const renderPage = (noteId = 'note-1') => {
        return render(
            <MemoryRouter initialEntries={[`/note/${noteId}`]}>
                <Routes>
                    <Route path="/note/:noteId" element={<NoteDetailPage />} />
                </Routes>
            </MemoryRouter>
        )
    }

    // ============================================================================
    // 초기 렌더링
    // ============================================================================

    describe('초기 렌더링', () => {
        it('노트가 존재하면 에디터가 렌더링되어야 함', () => {
            renderPage()

            expect(screen.getByTestId('note-detail-header')).toBeInTheDocument()
            expect(screen.getByTestId('note-header')).toBeInTheDocument()
            expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
        })

        it('노트가 없으면 "노트를 찾을 수 없습니다" 메시지를 표시해야 함', () => {
            mockNotes = []
            renderPage('non-existent')

            expect(screen.getByText('노트를 찾을 수 없습니다.')).toBeInTheDocument()
            expect(screen.getByText('메인으로 돌아가기')).toBeInTheDocument()
        })

        it('마운트 시 loadNotes가 호출되어야 함', () => {
            renderPage()

            expect(mockLoadNotes).toHaveBeenCalled()
        })
    })

    // ============================================================================
    // 저장 기능
    // ============================================================================

    describe('저장 기능', () => {
        it('제목 변경 후 저장 버튼이 활성화되어야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            const titleInput = screen.getByTestId('title-input')
            await user.clear(titleInput)
            await user.type(titleInput, 'New Title')

            const saveBtn = screen.getByTestId('save-btn')
            expect(saveBtn).not.toBeDisabled()
        })

        it('콘텐츠 변경 후 저장 버튼이 활성화되어야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            const textarea = screen.getByTestId('content-textarea')
            await user.type(textarea, ' added text')

            const saveBtn = screen.getByTestId('save-btn')
            expect(saveBtn).not.toBeDisabled()
        })

        it('저장 클릭 시 updateNote가 호출되어야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            // 변경사항 만들기
            const titleInput = screen.getByTestId('title-input')
            await user.clear(titleInput)
            await user.type(titleInput, 'Updated Title')

            // 저장
            const saveBtn = screen.getByTestId('save-btn')
            await user.click(saveBtn)

            await waitFor(() => {
                expect(mockUpdateNote).toHaveBeenCalledWith(
                    'note-1',
                    'user',
                    expect.objectContaining({ title: 'Updated Title' })
                )
            })
        })
    })

    // ============================================================================
    // 뒤로가기 및 Unsaved Changes
    // ============================================================================

    describe('뒤로가기', () => {
        it('변경사항 없이 뒤로가기 시 바로 이동해야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            const backBtn = screen.getByTestId('back-btn')
            await user.click(backBtn)

            expect(mockNavigate).toHaveBeenCalledWith('/')
        })

        it('변경사항 있을 때 뒤로가기 시 모달이 표시되어야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            // 변경사항 만들기
            const titleInput = screen.getByTestId('title-input')
            await user.clear(titleInput)
            await user.type(titleInput, 'Changed')

            // 뒤로가기
            const backBtn = screen.getByTestId('back-btn')
            await user.click(backBtn)

            expect(screen.getByTestId('unsaved-modal')).toBeInTheDocument()
        })

        it('Discard 클릭 시 저장 없이 이동해야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            // 변경사항 만들기
            const titleInput = screen.getByTestId('title-input')
            await user.clear(titleInput)
            await user.type(titleInput, 'Changed')

            // 뒤로가기 -> 모달 -> Discard
            await user.click(screen.getByTestId('back-btn'))
            await user.click(screen.getByTestId('discard-btn'))

            expect(mockUpdateNote).not.toHaveBeenCalled()
            expect(mockNavigate).toHaveBeenCalledWith('/')
        })

        it('Save & Close 클릭 시 저장 후 이동해야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            // 변경사항 만들기
            const titleInput = screen.getByTestId('title-input')
            await user.clear(titleInput)
            await user.type(titleInput, 'Changed')

            // 뒤로가기 -> 모달 -> Save & Close
            await user.click(screen.getByTestId('back-btn'))
            await user.click(screen.getByTestId('save-close-btn'))

            await waitFor(() => {
                expect(mockUpdateNote).toHaveBeenCalled()
            })
            expect(mockNavigate).toHaveBeenCalledWith('/')
        })
    })

    // ============================================================================
    // 학습 시작
    // ============================================================================

    describe('학습 시작', () => {
        it('Study 버튼 클릭 시 모달이 열려야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            await user.click(screen.getByTestId('study-btn'))

            expect(screen.getByTestId('study-modal')).toBeInTheDocument()
        })

        it('학습 시작 시 startSession과 navigate가 호출되어야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            // 모달 열기
            await user.click(screen.getByTestId('study-btn'))
            // 시작
            await user.click(screen.getByTestId('start-study'))

            expect(mockStartSession).toHaveBeenCalledWith({
                noteIds: ['note-1'],
                mode: 'word',
                order: 'sequential',
            })
            expect(mockNavigate).toHaveBeenCalledWith('/study')
        })

        it('모드 변경 후 시작하면 선택한 모드로 시작해야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            await user.click(screen.getByTestId('study-btn'))
            await user.click(screen.getByTestId('mode-sentence'))
            await user.click(screen.getByTestId('start-study'))

            expect(mockStartSession).toHaveBeenCalledWith(
                expect.objectContaining({ mode: 'sentence' })
            )
        })
    })

    // ============================================================================
    // 삭제
    // ============================================================================

    describe('삭제', () => {
        it('Delete 버튼 클릭 시 확인 모달이 열려야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            await user.click(screen.getByTestId('delete-btn'))

            expect(screen.getByTestId('delete-modal')).toBeInTheDocument()
        })

        it('삭제 확인 시 deleteNote가 호출되어야 함', async () => {
            const user = userEvent.setup()
            renderPage()

            await user.click(screen.getByTestId('delete-btn'))
            await user.click(screen.getByTestId('confirm-delete'))

            await waitFor(() => {
                expect(mockDeleteNote).toHaveBeenCalledWith('note-1', 'user')
            })
            expect(mockNavigate).toHaveBeenCalledWith('/')
        })
    })

    // ============================================================================
    // 노트 없음 상태
    // ============================================================================

    describe('노트 없음 상태', () => {
        it('"메인으로 돌아가기" 클릭 시 메인으로 이동해야 함', async () => {
            const user = userEvent.setup()
            mockNotes = []
            renderPage('non-existent')

            await user.click(screen.getByText('메인으로 돌아가기'))

            expect(mockNavigate).toHaveBeenCalledWith('/')
        })
    })
})
