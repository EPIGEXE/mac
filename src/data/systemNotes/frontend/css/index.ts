import type { SystemNote } from '../../../../db/schema/note'
import { CATEGORY, TAG } from '../../../categories'

import boxmodelContent from './boxmodel.md?raw'
import layoutSystemContent from './layoutSystem.md?raw'
import specificityContent from './specificity.md?raw'
import positionContent from './position.md?raw'
import responsiveDesignContent from './responsiveDesign.md?raw'

export const cssNotes: SystemNote[] = [
    {
        id: 'sys-css-boxmodel',
        version: 1,
        title: 'CSS Box Model',
        content: boxmodelContent,
        category: CATEGORY.CSS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    },
    {
        id: 'sys-css-layout-system',
        version: 1,
        title: '레이아웃 시스템',
        content: layoutSystemContent,
        category: CATEGORY.CSS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 2,
        createdAt: Date.now(),
    },
    {
        id: 'sys-css-specificity',
        version: 1,
        title: 'CSS 선택자 우선순위',
        content: specificityContent,
        category: CATEGORY.CSS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 3,
        createdAt: Date.now(),
    },
    {
        id: 'sys-css-position',
        version: 1,
        title: 'CSS Position',
        content: positionContent,
        category: CATEGORY.CSS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 4,
        createdAt: Date.now(),
    },
    {
        id: 'sys-css-responsive-design',
        version: 1,
        title: '반응형 디자인',
        content: responsiveDesignContent,
        category: CATEGORY.CSS,
        tag: {
            level: TAG.LEVEL.beginner,
            importance: TAG.IMPORTANCE.core,
            interview: TAG.INTERVIEW.common,
        },
        order: 5,
        createdAt: Date.now(),
    }
]
