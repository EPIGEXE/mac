import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import processThreadContent from './process-thread.md?raw'
import deadlockContent from './deadlock.md?raw'
import virtualMemoryContent from './virtual-memory.md?raw'
import hashTableContent from './hash-table.md?raw'
import stackQueueContent from './stack-queue.md?raw'

export const csNotes: SystemNote[] = [

    {
        id: 'sys-cs-process-thread',
        version: 1,
        title: '프로세스와 스레드',
        content: processThreadContent,
        category: CATEGORY.CS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-deadlock',
        version: 1,
        title: '데드락 (Deadlock)',
        content: deadlockContent,
        category: CATEGORY.CS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-virtual-memory',
        version: 1,
        title: '가상 메모리',
        content: virtualMemoryContent,
        category: CATEGORY.CS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 5,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-hash-table',
        version: 1,
        title: '해시 테이블',
        content: hashTableContent,
        category: CATEGORY.CS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 6,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-stack-queue',
        version: 1,
        title: '스택과 큐',
        content: stackQueueContent,
        category: CATEGORY.CS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 7,
        createdAt: Date.now(),
    }
]
