import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WordQuizResult } from './WordQuizResult'
import type { BlankInfo } from '../../../types'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div className={className} {...props}>{children}</div>
        ),
    },
}))

describe('WordQuizResult', () => {
    const defaultBlanks: BlankInfo[] = [
        { id: '1', answer: 'HTTP', hint: 'Protocol' },
        { id: '2', answer: 'TCP', hint: 'Transport' },
        { id: '3', answer: 'UDP' },
    ]

    const defaultProps = {
        totalBlanks: 3,
        correctCount: 2,
        wrongCount: 1,
        blanks: defaultBlanks,
        answers: {
            'BLANK_1': 'HTTP',
            'BLANK_2': 'TCP',
            'BLANK_3': 'UPD', // wrong
        },
        results: {
            'BLANK_1': true,
            'BLANK_2': true,
            'BLANK_3': false,
        },
        onNext: vi.fn(),
    }

    describe('점수 표시', () => {
        it('정답률을 퍼센트로 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            // 67% (2/3)
            expect(screen.getByText('67')).toBeInTheDocument()
            expect(screen.getByText('%')).toBeInTheDocument()
        })

        it('100% 정답일 때 퍼펙트 스타일이 적용되어야 함', () => {
            const perfectProps = {
                ...defaultProps,
                correctCount: 3,
                wrongCount: 0,
                results: {
                    'BLANK_1': true,
                    'BLANK_2': true,
                    'BLANK_3': true,
                },
            }

            render(<WordQuizResult {...perfectProps} />)

            expect(screen.getByText('100')).toBeInTheDocument()
        })

        it('정답/오답 카운트를 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            expect(screen.getByText(/✓ 2/)).toBeInTheDocument()
            expect(screen.getByText(/✗ 1/)).toBeInTheDocument()
        })
    })

    describe('문제 리뷰', () => {
        it('모든 빈칸을 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            expect(screen.getByText('HTTP')).toBeInTheDocument()
            expect(screen.getByText('TCP')).toBeInTheDocument()
            expect(screen.getByText('UDP')).toBeInTheDocument()
        })

        it('힌트가 있으면 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            expect(screen.getByText(/Protocol/)).toBeInTheDocument()
            expect(screen.getByText(/Transport/)).toBeInTheDocument()
        })

        it('정답에 ✓ 기호를 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            const checkmarks = screen.getAllByText('✓')
            // 2개: review 영역의 정답 표시
            expect(checkmarks).toHaveLength(2)
        })

        it('오답에 ✗ 기호를 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            const crosses = screen.getAllByText('✗')
            // 1개: review 영역의 오답 표시
            expect(crosses).toHaveLength(1)
        })

        it('오답일 때 사용자 입력을 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            expect(screen.getByText('UPD')).toBeInTheDocument()
        })

        it('총 문제 수를 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            expect(screen.getByText('[3]')).toBeInTheDocument()
        })

        it('문제 번호를 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            expect(screen.getByText('01')).toBeInTheDocument()
            expect(screen.getByText('02')).toBeInTheDocument()
            expect(screen.getByText('03')).toBeInTheDocument()
        })
    })

    describe('액션 버튼', () => {
        it('next 버튼을 표시해야 함', () => {
            render(<WordQuizResult {...defaultProps} />)

            // ByRole 쿼리 우선 사용 (접근성 기반)
            expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
        })

        it('next 버튼 클릭 시 onNext 핸들러가 호출되어야 함', () => {
            const onNext = vi.fn()
            render(<WordQuizResult {...defaultProps} onNext={onNext} />)

            // ByRole 쿼리로 버튼 찾기
            fireEvent.click(screen.getByRole('button', { name: /next/i }))

            expect(onNext).toHaveBeenCalledTimes(1)
        })
    })

    describe('엣지 케이스', () => {
        it('빈칸이 없을 때도 렌더링되어야 함', () => {
            const emptyProps = {
                ...defaultProps,
                totalBlanks: 0,
                correctCount: 0,
                wrongCount: 0,
                blanks: [],
                answers: {},
                results: {},
            }

            // NaN% 대신 0% 또는 에러 없이 렌더링
            expect(() => render(<WordQuizResult {...emptyProps} />)).not.toThrow()
        })

        it('답변이 비어있는 오답도 처리해야 함', () => {
            const propsWithEmptyAnswer = {
                ...defaultProps,
                answers: {
                    'BLANK_1': 'HTTP',
                    'BLANK_2': 'TCP',
                    'BLANK_3': '', // empty
                },
            }

            render(<WordQuizResult {...propsWithEmptyAnswer} />)

            // 빈 답변은 '—'로 표시
            expect(screen.getByText('—')).toBeInTheDocument()
        })
    })
})
