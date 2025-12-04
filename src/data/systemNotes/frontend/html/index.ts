import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import semanticContent from './semantic.md?raw'
import doctypeContent from './doctype.md?raw'
import metaTagContent from './metatags.md?raw'
import resourceHintContent from './resourceHint.md?raw'
import scriptAsyncDeferContent from './scriptAsyncDefer.md?raw'

export const htmlNotes: SystemNote[] = [
    {
        id: 'sys-html-semantic',
        version: 1,
        title: 'Semantic HTML',
        content: semanticContent,
        category: CATEGORY.HTML,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-html-doctype',
        version: 1,
        title: 'DOCTYPE',
        content: doctypeContent,
        category: CATEGORY.HTML,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
    {
        id: 'sys-html-metatags',
        version: 1,
        title: 'Meta 태그',
        content: metaTagContent,
        category: CATEGORY.HTML,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-html-resource-hint',
        version: 1,
        title: '리소스 힌트',
        content: resourceHintContent,
        category: CATEGORY.HTML,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-html-script-async-defer',
        version: 1,
        title: 'Script async와 defer',
        content: scriptAsyncDeferContent,
        category: CATEGORY.HTML,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 5,
        createdAt: Date.now(),
    }
]
