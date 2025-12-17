import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MainPage } from './MainPage'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

// Mock noteStore
const mockLoadNotes = vi.fn()
const mockCreateNote = vi.fn().mockResolvedValue('new-note-id')
vi.mock('../stores/noteStore', () => ({
    useNoteStore: vi.fn((selector) => {
        const state = {
            notes: [
                { id: 'note-1', title: 'React Basics', category: 'React', type: 'user' },
                { id: 'note-2', title: 'CSS Grid', category: 'CSS', type: 'user' },
                { id: 'note-3', title: 'TypeScript Types', category: 'TypeScript', type: 'user' },
            ],
            isLoaded: true,
            loadNotes: mockLoadNotes,
            createNote: mockCreateNote,
        }
        return selector(state)
    }),
}))

// Mock studySessionStore
const mockResetSession = vi.fn()
let mockIsActive = false
vi.mock('../stores/studySessionStore', () => ({
    useStudySessionStore: vi.fn((selector) => {
        const state = {
            resetSession: mockResetSession,
            isActive: mockIsActive,
        }
        return selector(state)
    }),
}))

// Mock child components
vi.mock('../features/Main/MainHeader', () => ({
    MainHeader: ({ viewMode, onViewModeChange, onTopicFilterChange }: {
        viewMode: string
        onViewModeChange: (mode: string) => void
        topicFilter: string
        onTopicFilterChange: (filter: string) => void
    }) => (
        <div data-testid="main-header">
            <span>ViewMode: {viewMode}</span>
            <button onClick={() => onViewModeChange('roadmap')}>Switch to Roadmap</button>
            <button onClick={() => onTopicFilterChange('frontend')}>Filter Frontend</button>
        </div>
    ),
}))

vi.mock('../features/Main/StudyCTABanner', () => ({
    StudyCTABanner: () => <div data-testid="study-cta-banner">Study CTA Banner</div>,
}))

vi.mock('../features/Main/ListView/ListView', () => ({
    ListView: ({ notes, onNoteClick, onCreateNote }: {
        notes: Array<{ id: string; title: string }>
        onNoteClick: (id: string) => void
        onCreateNote: (category: string) => void
    }) => (
        <div data-testid="list-view">
            <span>Notes count: {notes.length}</span>
            {notes.map((note) => (
                <button key={note.id} onClick={() => onNoteClick(note.id)}>
                    {note.title}
                </button>
            ))}
            <button onClick={() => onCreateNote('React')}>Create Note</button>
        </div>
    ),
}))

vi.mock('../features/Main/roadmap/RoadmapView', () => ({
    RoadmapView: ({ notes, onNoteClick }: {
        notes: Array<{ id: string; title: string }>
        onNoteClick: (id: string) => void
    }) => (
        <div data-testid="roadmap-view">
            <span>Roadmap Notes: {notes.length}</span>
            {notes.map((note) => (
                <button key={note.id} onClick={() => onNoteClick(note.id)}>
                    {note.title}
                </button>
            ))}
        </div>
    ),
}))

describe('MainPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsActive = false
    })

    const renderMainPage = () => {
        return render(
            <MemoryRouter>
                <MainPage />
            </MemoryRouter>
        )
    }

    describe('초기 렌더링', () => {
        it('MainHeader가 렌더링되어야 함', () => {
            renderMainPage()

            expect(screen.getByTestId('main-header')).toBeInTheDocument()
        })

        it('StudyCTABanner가 렌더링되어야 함', () => {
            renderMainPage()

            expect(screen.getByTestId('study-cta-banner')).toBeInTheDocument()
        })

        it('기본 뷰가 ListView여야 함', () => {
            renderMainPage()

            expect(screen.getByTestId('list-view')).toBeInTheDocument()
            expect(screen.queryByTestId('roadmap-view')).not.toBeInTheDocument()
        })

        it('노트 목록을 표시해야 함', () => {
            renderMainPage()

            expect(screen.getByText('Notes count: 3')).toBeInTheDocument()
        })
    })

    describe('노트 로드', () => {
        it('컴포넌트 마운트 시 loadNotes가 호출되어야 함', () => {
            renderMainPage()

            expect(mockLoadNotes).toHaveBeenCalled()
        })
    })

    describe('세션 이탈 처리', () => {
        it('활성 세션이 없으면 resetSession이 호출되지 않아야 함', () => {
            mockIsActive = false
            renderMainPage()

            expect(mockResetSession).not.toHaveBeenCalled()
        })

        it('활성 세션이 있으면 resetSession이 호출되어야 함', () => {
            mockIsActive = true
            renderMainPage()

            expect(mockResetSession).toHaveBeenCalled()
        })
    })

    describe('노트 클릭', () => {
        it('노트 클릭 시 상세 페이지로 이동해야 함', async () => {
            renderMainPage()

            const noteButton = screen.getByText('React Basics')
            noteButton.click()

            expect(mockNavigate).toHaveBeenCalledWith('/note/note-1')
        })
    })

    describe('노트 생성', () => {
        it('노트 생성 시 createNote가 호출되어야 함', async () => {
            renderMainPage()

            const createButton = screen.getByText('Create Note')
            createButton.click()

            await waitFor(() => {
                expect(mockCreateNote).toHaveBeenCalledWith('React')
            })
        })

        it('노트 생성 후 상세 페이지로 이동해야 함', async () => {
            renderMainPage()

            const createButton = screen.getByText('Create Note')
            createButton.click()

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/note/new-note-id')
            })
        })
    })

    describe('뷰 모드 전환', () => {
        it('Roadmap 뷰로 전환할 수 있어야 함', async () => {
            renderMainPage()

            const switchButton = screen.getByText('Switch to Roadmap')
            switchButton.click()

            await waitFor(() => {
                expect(screen.getByTestId('roadmap-view')).toBeInTheDocument()
            })
        })

        it('Roadmap 뷰에서는 StudyCTABanner가 표시되지 않아야 함', async () => {
            renderMainPage()

            const switchButton = screen.getByText('Switch to Roadmap')
            switchButton.click()

            await waitFor(() => {
                expect(screen.queryByTestId('study-cta-banner')).not.toBeInTheDocument()
            })
        })
    })
})
