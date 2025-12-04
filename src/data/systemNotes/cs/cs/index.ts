import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import bigoContent from './bigo.md?raw'
import httpContent from './http.md?raw'

export const csNotes: SystemNote[] = [
    {
        id: 'sys-cs-bigo',
        version: 1,
        title: 'Big O 표기법',
        content: bigoContent,
        category: CATEGORY.CS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-http',
        version: 1,
        title: 'HTTP와 HTTPS',
        content: httpContent,
        category: CATEGORY.CS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
]
