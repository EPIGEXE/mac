import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import xssContent from './xss.md?raw'
import corsContent from './cors.md?raw'

export const securityNotes: SystemNote[] = [
    {
        id: 'sys-sec-xss',
        version: 1,
        title: 'XSS (Cross-Site Scripting)',
        content: xssContent,
        category: CATEGORY.Security,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.must,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-sec-cors',
        version: 1,
        title: 'CORS (Cross-Origin Resource Sharing)',
        content: corsContent,
        category: CATEGORY.Security,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
]
