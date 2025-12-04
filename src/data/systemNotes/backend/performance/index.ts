import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import webvitalsContent from './webvitals.md?raw'

export const performanceNotes: SystemNote[] = [
    {
        id: 'sys-perf-webvitals',
        version: 1,
        title: 'Web Vitals',
        content: webvitalsContent,
        category: CATEGORY.Performance,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    },
]
