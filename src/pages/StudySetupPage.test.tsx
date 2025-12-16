import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StudySetupPage } from './StudySetupPage'

// ================================= Mock =================================
// useNavigate 모킹
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

// useNoteStore 모킹
const mockLoadNotes = vi.fn()
const mockNotes = [
    { id: 'note-1', title: 'React Basics', category: 'React', type: 'user' as const },
    { id: 'note-2', title: 'CSS Grid', category: 'CSS', type: 'user' as const },
    { id: 'note-3', title: 'TypeScript', category: 'TypeScript', type: 'user' as const },
]

vi.mock('../stores/noteStore', () => ({
    useNoteStore: vi.fn((selector) => {
        const state = {
            notes: mockNotes,
            loadNotes: mockLoadNotes,
        }
        return selector(state)
    }),
}))

// useStudySessionStore 모킹
const mockStartSession = vi.fn()
vi.mock('../stores/studySessionStore', () => ({
    useStudySessionStore: vi.fn((selector) => {
        const state = {
            startSession: mockStartSession,
        }
        return selector(state)
    }),
}))

// NoteSelector 모킹
vi.mock('../features/Study/components/NoteSelector', () => ({
    NoteSelector: ({ notes, selectedIds, onSelectionChange }: {
        notes: typeof mockNotes
        selectedIds: string[]
        onSelectionChange: (ids: string[]) => void
    }) => (
        <div data-testid="note-selector">
            {notes.map((note) => (
                <label key={note.id}>
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(note.id)}
                        onChange={(e) => {
                            if (e.target.checked) {
                                onSelectionChange([...selectedIds, note.id])
                            } else {
                                onSelectionChange(selectedIds.filter((id) => id !== note.id))
                            }
                        }}
                    />
                    {note.title}
                </label>
            ))}
        </div>
    ),
}))

// StudyModeInlineSelector 모킹
vi.mock('../features/Study/components/StudyModeInlineSelector', () => ({
    StudyModeInlineSelector: ({ value, onChange }: {
        value: string
        onChange: (mode: string) => void
    }) => (
        <div data-testid="mode-selector">
            <button
                data-active={value === 'word'}
                onClick={() => onChange('word')}
            >
                Word
            </button>
            <button
                data-active={value === 'sentence'}
                onClick={() => onChange('sentence')}
            >
                Sentence
            </button>
        </div>
    ),
}))

// StudyOrderSelector 모킹
vi.mock('../features/Study/components/StudyOrderSelector', () => ({
    StudyOrderSelector: ({ value, onChange }: {
        value: string
        onChange: (order: string) => void
    }) => (
        <div data-testid="order-selector">
            <button
                data-active={value === 'sequential'}
                onClick={() => onChange('sequential')}
            >
                Sequential
            </button>
            <button
                data-active={value === 'random'}
                onClick={() => onChange('random')}
            >
                Random
            </button>
        </div>
    ),
}))

// SectionTitle 모킹
vi.mock('../components/common/SectionTitle', () => ({
    SectionTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <h2 className={className}>{children}</h2>
    ),
}))

// ================================= 테스트 =================================
describe('StudySetupPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const renderStudySetupPage = () => {
        return render(
            <MemoryRouter>
                <StudySetupPage />
            </MemoryRouter>
        )
    }

    describe('초기 렌더링', () => {
        it('페이지 제목이 표시되어야 함', () => {
            renderStudySetupPage()

            expect(screen.getByText('학습 준비')).toBeInTheDocument()
        })

        it('뒤로가기 버튼이 있어야 함', () => {
            renderStudySetupPage()

            expect(screen.getByText(/back/)).toBeInTheDocument()
        })

        it('학습 시작 버튼이 있어야 함', () => {
            renderStudySetupPage()

            expect(screen.getByText(/start study/)).toBeInTheDocument()
        })

        it('노트 선택 전에는 시작 버튼이 비활성화되어야 함', () => {
            renderStudySetupPage()

            const startButton = screen.getByText(/start study/)
            expect(startButton).toBeDisabled()
        })

        it('NoteSelector가 렌더링되어야 함', () => {
            renderStudySetupPage()

            expect(screen.getByTestId('note-selector')).toBeInTheDocument()
        })

        it('StudyModeInlineSelector가 렌더링되어야 함', () => {
            renderStudySetupPage()

            expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
        })

        it('StudyOrderSelector가 렌더링되어야 함', () => {
            renderStudySetupPage()

            expect(screen.getByTestId('order-selector')).toBeInTheDocument()
        })
    })

    describe('노트 로드', () => {
        it('컴포넌트 마운트 시 loadNotes가 호출되어야 함', () => {
            renderStudySetupPage()

            expect(mockLoadNotes).toHaveBeenCalled()
        })
    })

    describe('뒤로가기', () => {
        it('뒤로가기 버튼 클릭 시 navigate(-1)이 호출되어야 함', () => {
            renderStudySetupPage()

            const backButton = screen.getByText(/back/)
            fireEvent.click(backButton)

            expect(mockNavigate).toHaveBeenCalledWith(-1)
        })
    })

    describe('노트 선택', () => {
        it('노트 선택 시 선택 개수가 표시되어야 함', async () => {
            renderStudySetupPage()

            const checkbox = screen.getByLabelText('React Basics')
            fireEvent.click(checkbox)

            await waitFor(() => {
                expect(screen.getByText(/1개 선택됨/)).toBeInTheDocument()
            })
        })

        it('노트 선택 시 시작 버튼이 활성화되어야 함', async () => {
            renderStudySetupPage()

            const checkbox = screen.getByLabelText('React Basics')
            fireEvent.click(checkbox)

            await waitFor(() => {
                const startButton = screen.getByText(/start study/)
                expect(startButton).not.toBeDisabled()
            })
        })

        it('여러 노트 선택 시 선택 요약이 표시되어야 함', async () => {
            renderStudySetupPage()

            const checkbox1 = screen.getByLabelText('React Basics')
            const checkbox2 = screen.getByLabelText('CSS Grid')
            fireEvent.click(checkbox1)
            fireEvent.click(checkbox2)

            await waitFor(() => {
                expect(screen.getByText(/2개 선택됨/)).toBeInTheDocument()
            })
        })
    })

    describe('학습 시작', () => {
        it('노트 선택 후 시작 버튼 클릭 시 startSession이 호출되어야 함', async () => {
            renderStudySetupPage()

            // 노트 선택
            const checkbox = screen.getByLabelText('React Basics')
            fireEvent.click(checkbox)

            // 시작 버튼 클릭
            const startButton = screen.getByText(/start study/)
            fireEvent.click(startButton)

            await waitFor(() => {
                expect(mockStartSession).toHaveBeenCalledWith({
                    noteIds: ['note-1'],
                    mode: 'word',
                    order: 'sequential',
                })
            })
        })

        it('학습 시작 후 학습 페이지로 이동해야 함', async () => {
            renderStudySetupPage()

            // 노트 선택
            const checkbox = screen.getByLabelText('React Basics')
            fireEvent.click(checkbox)

            // 시작 버튼 클릭
            const startButton = screen.getByText(/start study/)
            fireEvent.click(startButton)

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/study?mode=word')
            })
        })

        it('sentence 모드로 학습 시작 시 올바른 URL로 이동해야 함', async () => {
            renderStudySetupPage()

            // 모드 변경
            const sentenceButton = screen.getByText('Sentence')
            fireEvent.click(sentenceButton)

            // 노트 선택
            const checkbox = screen.getByLabelText('React Basics')
            fireEvent.click(checkbox)

            // 시작 버튼 클릭
            const startButton = screen.getByText(/start study/)
            fireEvent.click(startButton)

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/study?mode=sentence')
            })
        })
    })

    describe('학습 모드 변경', () => {
        it('학습 모드를 변경할 수 있어야 함', () => {
            renderStudySetupPage()

            const sentenceButton = screen.getByText('Sentence')
            fireEvent.click(sentenceButton)

            // 선택 요약에서 모드 확인
            const checkbox = screen.getByLabelText('React Basics')
            fireEvent.click(checkbox)

            expect(screen.getByText(/문장/)).toBeInTheDocument()
        })
    })

    describe('학습 순서 변경', () => {
        it('학습 순서를 랜덤으로 변경할 수 있어야 함', async () => {
            renderStudySetupPage()

            const randomButton = screen.getByText('Random')
            fireEvent.click(randomButton)

            // 노트 선택
            const checkbox = screen.getByLabelText('React Basics')
            fireEvent.click(checkbox)

            expect(screen.getByText(/랜덤/)).toBeInTheDocument()
        })
    })
})
