import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import usestateContent from './usestate.md?raw'
import virtualdomContent from './virtualdom.md?raw'

export const reactNotes: SystemNote[] = [
    {
        id: 'sys-react-usestate',
        version: 1,
        title: 'React Hooks - useState',
        content: usestateContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-virtualdom',
        version: 1,
        title: 'Virtual DOM',
        content: virtualdomContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
]
