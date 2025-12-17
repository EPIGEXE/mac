import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'
import browserRenderingContent from './browserRendering.md?raw'
import crpOptimizationContent from './criticalRenderingPath.md?raw'
import reflowAndRepaintContent from './reflowAndRepaint.md?raw'
import browserCacheContent from './browserCache.md?raw'
import corsContent from './cors.md?raw'
import browserStorageContent from './browserStorage.md?raw'
import urlInputContent from './urlInput.md?raw'
import csrAndSsrContent from './csrAndSsr.md?raw'
import eventPropagationContent from './eventPropagation.md?raw'

export const browserNotes: SystemNote[] = [
    {
        id: 'sys-browser-browser-rendering',
        version: 1,
        title: '브라우저 랜더링 과정',
        content: browserRenderingContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.must,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-critical-rendering-path',
        version: 1,
        title: 'CRP(Critical Rendering Path) 최적화',
        content: crpOptimizationContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.advanced,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-reflow-and-repaint',
        version: 1,
        title: 'Reflow와 Repaint',
        content: reflowAndRepaintContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-browser-cache',
        version: 1,
        title: '브라우저 캐시',
        content: browserCacheContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-cors',
        version: 1,
        title: 'CORS',
        content: corsContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 5,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-browser-storage',
        version: 1,
        title: '브라우저 스토리지',
        content: browserStorageContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 6,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-url-input',
        version: 2,
        title: 'URL 입력 후 일어나는 일',
        content: urlInputContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 7,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-csr-and-ssr',
        version: 1,
        title: 'CSR과 SSR',
        content: csrAndSsrContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 8,
        createdAt: Date.now(),
    },
    {
        id: 'sys-browser-event-propagation',
        version: 1,
        title: '이벤트 전파',
        content: eventPropagationContent,
        category: CATEGORY.Browser,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.useful,
            interview: TAG.INTERVIEW.common,
        },
        order: 9,
        createdAt: Date.now(),
    }
]
