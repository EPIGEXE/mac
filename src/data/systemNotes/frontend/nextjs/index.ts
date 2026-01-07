import type { SystemNote } from "../../../../db/core/schema";
import { CATEGORY, TAG } from "../../../categories";

import basicContent from './basic.md?raw'

export const nextNotes: SystemNote[] = [
    {
        id: 'sys-next-basic',
        version: 1,
        title: 'Next.js 기본',
        content: basicContent,
        category: CATEGORY.NextJS,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    }
]