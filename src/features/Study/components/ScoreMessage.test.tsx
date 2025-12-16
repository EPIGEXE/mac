import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreMessage } from './ScoreMessage'

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div className={className} {...props}>{children}</div>
        ),
    },
}))

describe('ScoreMessage', () => {
    describe('Perfect (100%)', () => {
        it('isPerfect일 때 "Perfect!" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={100} isPerfect={true} />)

            expect(screen.getByText('Perfect!')).toBeInTheDocument()
            expect(screen.getByText(/완벽합니다/)).toBeInTheDocument()
        })

        it('100점이지만 isPerfect가 false면 "Excellent!" 표시', () => {
            render(<ScoreMessage score={100} isPerfect={false} />)

            expect(screen.getByText('Excellent!')).toBeInTheDocument()
        })
    })

    describe('Excellent (80-99)', () => {
        it('80점 이상일 때 "Excellent!" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={80} />)

            expect(screen.getByText('Excellent!')).toBeInTheDocument()
            expect(screen.getByText(/훌륭해요/)).toBeInTheDocument()
        })

        it('99점일 때 "Excellent!" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={99} />)

            expect(screen.getByText('Excellent!')).toBeInTheDocument()
        })
    })

    describe('Good Job (60-79)', () => {
        it('60점 이상일 때 "Good Job!" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={60} />)

            expect(screen.getByText('Good Job!')).toBeInTheDocument()
            expect(screen.getByText(/잘했어요/)).toBeInTheDocument()
        })

        it('79점일 때 "Good Job!" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={79} />)

            expect(screen.getByText('Good Job!')).toBeInTheDocument()
        })
    })

    describe('Not Bad (40-59)', () => {
        it('40점 이상일 때 "Not Bad" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={40} />)

            expect(screen.getByText('Not Bad')).toBeInTheDocument()
            expect(screen.getByText(/조금 더 노력해봐요/)).toBeInTheDocument()
        })

        it('59점일 때 "Not Bad" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={59} />)

            expect(screen.getByText('Not Bad')).toBeInTheDocument()
        })
    })

    describe('Try Again (0-39)', () => {
        it('40점 미만일 때 "Try Again" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={39} />)

            expect(screen.getByText('Try Again')).toBeInTheDocument()
            expect(screen.getByText(/다시 도전해보세요/)).toBeInTheDocument()
        })

        it('0점일 때 "Try Again" 메시지를 표시해야 함', () => {
            render(<ScoreMessage score={0} />)

            expect(screen.getByText('Try Again')).toBeInTheDocument()
        })
    })

    describe('경계값 테스트', () => {
        it('점수 경계값에서 올바른 메시지를 표시해야 함', () => {
            // 80 경계
            const { rerender } = render(<ScoreMessage score={79} />)
            expect(screen.getByText('Good Job!')).toBeInTheDocument()

            rerender(<ScoreMessage score={80} />)
            expect(screen.getByText('Excellent!')).toBeInTheDocument()

            // 60 경계
            rerender(<ScoreMessage score={59} />)
            expect(screen.getByText('Not Bad')).toBeInTheDocument()

            rerender(<ScoreMessage score={60} />)
            expect(screen.getByText('Good Job!')).toBeInTheDocument()

            // 40 경계
            rerender(<ScoreMessage score={39} />)
            expect(screen.getByText('Try Again')).toBeInTheDocument()

            rerender(<ScoreMessage score={40} />)
            expect(screen.getByText('Not Bad')).toBeInTheDocument()
        })
    })

    describe('스타일 테스트', () => {
        it('Perfect일 때 success 색상이 적용되어야 함', () => {
            render(<ScoreMessage score={100} isPerfect={true} />)

            const message = screen.getByText('Perfect!')
            expect(message.className).toContain('text-[var(--success)]')
        })

        it('Try Again일 때 error 색상이 적용되어야 함', () => {
            render(<ScoreMessage score={30} />)

            const message = screen.getByText('Try Again')
            expect(message.className).toContain('text-[var(--error)]')
        })
    })
})
