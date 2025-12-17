import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import basicsContent from './basics.md?raw'

export const typescriptNotes: SystemNote[] = [
    {
        id: 'sys-ts-basics',
        version: 2,
        title: 'TypeScript 기본',
        content: basicsContent,
        category: CATEGORY.TypeScript,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
        },
        order: 1,
        createdAt: Date.now(),
    },
]
