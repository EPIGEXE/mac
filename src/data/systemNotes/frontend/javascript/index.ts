import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import closureContent from './closure.md?raw'
import eventloopContent from './eventloop.md?raw'
import promiseContent from './promise.md?raw'
import es6Content from './es6.md?raw'
import hoistingContent from './hoisting.md?raw'

export const javascriptNotes: SystemNote[] = [
    {
        id: 'sys-js-closure',
        version: 1,
        title: '클로저 (Closure)',
        content: closureContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.must,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-eventloop',
        version: 1,
        title: '이벤트 루프',
        content: eventloopContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.must,
        },
        order: 2,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-promise',
        version: 1,
        title: 'Promise와 async/await',
        content: promiseContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-es6',
        version: 1,
        title: 'JavaScript ES6+',
        content: es6Content,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-hoisting',
        version: 1,
        title: '호이스팅',
        content: hoistingContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 5,
        createdAt: Date.now(),
    },
]
