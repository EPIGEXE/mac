import type { SystemNote } from "../../../../db/schema/note";
import { CATEGORY, TAG } from "../../../categories";

import electronContent from './electron.md?raw'

export const electronNotes: SystemNote[] = [
    {
        id: 'sys-electron-electron',
        version: 1,
        title: 'Electron',
        content: electronContent,
        category: CATEGORY.Electron,
        tag: {
            level: TAG.LEVEL.intermediate,
            importance: TAG.IMPORTANCE.good,
            interview: TAG.INTERVIEW.common,
        },
        order: 1,
        createdAt: Date.now(),
    },
];