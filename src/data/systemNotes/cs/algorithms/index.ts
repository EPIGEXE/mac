import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import hashTableContent from './hash-table.md?raw'
import stackQueueContent from './stack-queue.md?raw'
import treeGraphContent from './tree-graph.md?raw'
import sortingContent from './sorting.md?raw'

export const algorithmsNotes: SystemNote[] = [
    {
        id: 'sys-algorithms-hash-table',
        version: 1,
        title: '해시 테이블',
        content: hashTableContent,
        category: CATEGORY.Algorithms,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-algorithms-stack-queue',
        version: 1,
        title: '스택과 큐',
        content: stackQueueContent,
        category: CATEGORY.Algorithms,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
    {
        id: 'sys-algorithms-tree-graph',
        version: 1,
        title: '트리와 그래프',
        content: treeGraphContent,
        category: CATEGORY.Algorithms,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-algorithms-sorting',
        version: 1,
        title: '정렬 알고리즘',
        content: sortingContent,
        category: CATEGORY.Algorithms,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
]
