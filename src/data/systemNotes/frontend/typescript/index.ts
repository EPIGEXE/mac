import { CATEGORY, TAG } from '../../../categories'

import basicsContent from './basics.md?raw'
import advancedContent from './advanced.md?raw'
import type { SystemNote } from '../../../../db/core/schema'

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
    {
        id: 'sys-ts-advanced',
        version: 1,
        title: 'TypeScript 심화',
        content: advancedContent,
        category: CATEGORY.TypeScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
        },
        order: 2,
        createdAt: Date.now(),
    },  
]
