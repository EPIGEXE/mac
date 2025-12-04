import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import basicsContent from './basics.md?raw'
import genericsContent from './generics.md?raw'

export const typescriptNotes: SystemNote[] = [
    {
        id: 'sys-ts-basics',
        version: 1,
        title: 'TypeScript 기본 타입',
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
        id: 'sys-ts-generics',
        version: 1,
        title: 'TypeScript 제네릭',
        content: genericsContent,
        category: CATEGORY.TypeScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
]
