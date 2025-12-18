import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import virtualdomContent from './virtualdom.md?raw'
import lifecycleContent from './react-lifecycle.md?raw'
import useStateOptimizationContent from './useState-optimization.md?raw'
import propsDrillingContent from './props-drilling.md?raw'
import stateManagementContent from './react-state-management.md?raw'
import memoCallbackContent from './memo-callback.md?raw'
import lighthouseContent from './lighthouse.md?raw'
import viteContent from './vite.md?raw'
import customHooksContent from './customhooks.md?raw'
import componentDesignContent from './component-design.md?raw'
import portalContent from './portal.md?raw'

export const reactNotes: SystemNote[] = [
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
    {
        id: 'sys-react-lifecycle',
        version: 1,
        title: 'React 라이프사이클',
        content: lifecycleContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-useState-optimization',
        version: 1,
        title: 'useState 최적화',
        content: useStateOptimizationContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-props-drilling',
        version: 1,
        title: 'Props Drilling 문제',
        content: propsDrillingContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },  
        order: 5,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-state-management',
        version: 1,
        title: 'React 전역 상태 관리',
        content: stateManagementContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 6,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-memo-callback',
        version: 1,
        title: 'React memo, useMemo와 useCallback',
        content: memoCallbackContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 7,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-lighthouse',
        version: 1,
        title: 'Lighthouse 성능 측정',
        content: lighthouseContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 8,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-vite',
        version: 1,
        title: 'Vite',
        content: viteContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 9,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-customhooks',
        version: 1,
        title: 'Custom Hooks 작성',
        content: customHooksContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 10,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-component-design',
        version: 1,
        title: 'Component 설계 원칙',
        content: componentDesignContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 11,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-portal',
        version: 1,
        title: 'React Portal',
        content: portalContent,
        category: CATEGORY.React,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 12,
        createdAt: Date.now(),
    }
]
