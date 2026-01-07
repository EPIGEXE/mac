import { CATEGORY, TAG } from '../../../categories'

import closureContent from './closure.md?raw'
import eventloopContent from './eventloop.md?raw'
import promiseContent from './promise.md?raw'
import es6Content from './es6.md?raw'
import hoistingContent from './hoisting.md?raw'
import scopeContent from './scope-execution-context.md?raw'
import thisContent from './this-binding.md?raw'
import prototypeContent from './prototype.md?raw'
import memoryManagementContent from './memory-management.md?raw'
import dataStructureContent from './data-structure.md?raw'
import JavascriptRuntimeContent from './javascript-runtime.md?raw'
import type { SystemNote } from '../../../../db/core/schema'

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
    {
        id: 'sys-js-scope',
        version: 1,
        title: '스코프와 실행 컨텍스트',
        content: scopeContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 6,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-this',
        version: 1,
        title: 'this',
        content: thisContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 7,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-prototype',
        version: 1,
        title: '프로토타입 체인과 상속',
        content: prototypeContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 8,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-memory-management',
        version: 1,
        title: '메모리 관리',
        content: memoryManagementContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 9,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-data-structure',
        version: 1,
        title: 'JavaScript 자료구조 선택',
        content: dataStructureContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 10,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-javascript-runtime',
        version: 1,
        title: 'JavaScript Runtime',
        content: JavascriptRuntimeContent,
        category: CATEGORY.JavaScript,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 11,
        createdAt: Date.now(),
    }
]
