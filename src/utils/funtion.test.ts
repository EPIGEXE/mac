import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shuffleArray, formatDuration, formatDate } from './funtion'

describe('funtion', () => {

    // shuffleArray 테스트
    describe('shuffleArray', () => {
        it('배열을 섞어야 함', () => {
            const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            const shuffled = shuffleArray(original)

            // 원본 배열은 변경되지 않아야 함
            expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

            // 결과 배열은 같은 요소를 포함해야 함
            expect(shuffled).toHaveLength(original.length)
            expect(shuffled.sort()).toEqual(original.sort())
        })

        it('빈 배열은 빈 배열을 반환해야 함', () => {
            expect(shuffleArray([])).toEqual([])
        })

        it('단일 요소 배열은 그대로 반환해야 함', () => {
            expect(shuffleArray([1])).toEqual([1])
        })

        it('새 배열을 반환해야 함 (불변성)', () => {
            const original = [1, 2, 3]
            const shuffled = shuffleArray(original)

            expect(shuffled).not.toBe(original)
        })
    })

    // formatDuration 테스트
    describe('formatDuration', () => {
        it('0초는 0m를 반환해야 함', () => {
            expect(formatDuration(0)).toBe('0m')
        })

        it('59초는 0m를 반환해야 함', () => {
            expect(formatDuration(59)).toBe('0m')
        })

        it('60초는 1m를 반환해야 함', () => {
            expect(formatDuration(60)).toBe('1m')
        })

        it('90초는 1m를 반환해야 함', () => {
            expect(formatDuration(90)).toBe('1m')
        })

        it('3599초는 59m를 반환해야 함', () => {
            expect(formatDuration(3599)).toBe('59m')
        })

        it('3600초는 1h 0m를 반환해야 함', () => {
            expect(formatDuration(3600)).toBe('1h 0m')
        })

        it('3660초는 1h 1m를 반환해야 함', () => {
            expect(formatDuration(3660)).toBe('1h 1m')
        })

        it('7200초는 2h 0m를 반환해야 함', () => {
            expect(formatDuration(7200)).toBe('2h 0m')
        })

        it('7350초는 2h 2m를 반환해야 함', () => {
            expect(formatDuration(7350)).toBe('2h 2m')
        })
    })

    // formatDate 테스트
    describe('formatDate', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('오늘 날짜는 "오늘"을 반환해야 함', () => {
            const now = new Date('2024-01-15T12:00:00')
            vi.setSystemTime(now)

            // 오늘 오전 시간
            const todayMorning = new Date('2024-01-15T08:00:00').getTime()
            expect(formatDate(todayMorning)).toBe('오늘')
        })

        it('어제 날짜는 "어제"를 반환해야 함', () => {
            const now = new Date('2024-01-15T12:00:00')
            vi.setSystemTime(now)

            const yesterday = new Date('2024-01-14T12:00:00').getTime()
            expect(formatDate(yesterday)).toBe('어제')
        })

        it('2일 전은 "2일 전"을 반환해야 함', () => {
            const now = new Date('2024-01-15T12:00:00')
            vi.setSystemTime(now)

            const twoDaysAgo = new Date('2024-01-13T12:00:00').getTime()
            expect(formatDate(twoDaysAgo)).toBe('2일 전')
        })

        it('6일 전은 "6일 전"을 반환해야 함', () => {
            const now = new Date('2024-01-15T12:00:00')
            vi.setSystemTime(now)

            const sixDaysAgo = new Date('2024-01-09T12:00:00').getTime()
            expect(formatDate(sixDaysAgo)).toBe('6일 전')
        })

        it('7일 이상 전은 날짜 형식으로 반환해야 함', () => {
            const now = new Date('2024-01-15T12:00:00')
            vi.setSystemTime(now)

            const sevenDaysAgo = new Date('2024-01-08T12:00:00').getTime()
            const result = formatDate(sevenDaysAgo)

            // 월과 일이 포함되어야 함
            expect(result).toMatch(/1월\s*8일/)
        })
    })
})
