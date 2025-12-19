import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import processThreadContent from './process-thread.md?raw'
import deadlockContent from './deadlock.md?raw'
import virtualMemoryContent from './virtual-memory.md?raw'

export const systemsAndArchitectureNotes: SystemNote[] = [

    {
        id: 'sys-systems-and-architecture-process-thread',
        version: 1,
        title: '프로세스와 스레드',
        content: processThreadContent,
        category: CATEGORY.HardwareSystem,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-systems-and-architecture-deadlock',
        version: 1,
        title: '데드락 (Deadlock)',
        content: deadlockContent,
        category: CATEGORY.HardwareSystem,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-systems-and-architecture-virtual-memory',
        version: 1,
        title: '가상 메모리',
        content: virtualMemoryContent,
        category: CATEGORY.HardwareSystem,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 5,
        createdAt: Date.now(),
    }
]
