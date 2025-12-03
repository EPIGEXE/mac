/**
 * Rate Limiting 유틸리티
 */
import * as admin from 'firebase-admin'
import { HttpsError } from 'firebase-functions/v2/https'

const db = admin.firestore()

// Rate Limit 설정
export const RATE_LIMITS = {
    generateQuiz: { maxPerMinute: 5, maxPerDay: 50 },
    evaluateAnswer: { maxPerMinute: 10, maxPerDay: 200 },
    getHint: { maxPerMinute: 10, maxPerDay: 100 },
} as const

export type RateLimitAction = keyof typeof RATE_LIMITS

interface RateLimitDoc {
    minuteCount: number
    minuteResetAt: admin.firestore.Timestamp
    dayCount: number
    dayResetAt: admin.firestore.Timestamp
}

/**
 * Rate Limit 체크 및 업데이트
 */
export async function checkRateLimit(userId: string, action: RateLimitAction): Promise<void> {
    const limits = RATE_LIMITS[action]
    const now = admin.firestore.Timestamp.now()
    const docRef = db.collection('rateLimits').doc(userId).collection('actions').doc(action)

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef)
        const data = doc.data() as RateLimitDoc | undefined

        // 현재 시간 기준
        const nowMs = now.toMillis()
        const oneMinuteAgo = nowMs - 60 * 1000
        const oneDayAgo = nowMs - 24 * 60 * 60 * 1000

        let minuteCount = 0
        let dayCount = 0

        if (data) {
            // 분당 카운트 리셋 확인
            if (data.minuteResetAt.toMillis() > oneMinuteAgo) {
                minuteCount = data.minuteCount
            }

            // 일일 카운트 리셋 확인
            if (data.dayResetAt.toMillis() > oneDayAgo) {
                dayCount = data.dayCount
            }
        }

        // Rate Limit 초과 확인
        if (minuteCount >= limits.maxPerMinute) {
            throw new HttpsError(
                'resource-exhausted',
                `Rate limit exceeded: ${action}. Max ${limits.maxPerMinute} per minute.`
            )
        }

        if (dayCount >= limits.maxPerDay) {
            throw new HttpsError(
                'resource-exhausted',
                `Daily limit exceeded: ${action}. Max ${limits.maxPerDay} per day.`
            )
        }

        // 카운트 증가
        const updateData: RateLimitDoc = {
            minuteCount: minuteCount + 1,
            minuteResetAt: minuteCount === 0 ? now : data?.minuteResetAt || now,
            dayCount: dayCount + 1,
            dayResetAt: dayCount === 0 ? now : data?.dayResetAt || now,
        }

        transaction.set(docRef, updateData)
    })
}

/**
 * 남은 Rate Limit 조회
 */
export async function getRemainingLimit(
    userId: string,
    action: RateLimitAction
): Promise<{ minuteRemaining: number; dayRemaining: number }> {
    const limits = RATE_LIMITS[action]
    const now = admin.firestore.Timestamp.now()
    const docRef = db.collection('rateLimits').doc(userId).collection('actions').doc(action)

    const doc = await docRef.get()
    const data = doc.data() as RateLimitDoc | undefined

    if (!data) {
        return {
            minuteRemaining: limits.maxPerMinute,
            dayRemaining: limits.maxPerDay,
        }
    }

    const nowMs = now.toMillis()
    const oneMinuteAgo = nowMs - 60 * 1000
    const oneDayAgo = nowMs - 24 * 60 * 60 * 1000

    const minuteCount = data.minuteResetAt.toMillis() > oneMinuteAgo ? data.minuteCount : 0
    const dayCount = data.dayResetAt.toMillis() > oneDayAgo ? data.dayCount : 0

    return {
        minuteRemaining: Math.max(0, limits.maxPerMinute - minuteCount),
        dayRemaining: Math.max(0, limits.maxPerDay - dayCount),
    }
}
