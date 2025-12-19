// ============================================================================
// System Notes Re-export
// - 실제 데이터는 systemNotes/ 폴더에서 관리
// - 기존 import 경로 호환성을 위해 유지
// ============================================================================

import type { SystemNote } from "../db/schema/note";
import { securityNotes } from "./systemNotes/backend/security";
import { algorithmsNotes } from "./systemNotes/cs/algorithms";
import { systemsAndArchitectureNotes } from "./systemNotes/cs/systemsAndArchitecture";
import { browserNotes } from "./systemNotes/frontend/browser";
import { cssNotes } from "./systemNotes/frontend/css";
import { htmlNotes } from "./systemNotes/frontend/html";
import { javascriptNotes } from "./systemNotes/frontend/javascript";
import { reactNotes } from "./systemNotes/frontend/react";
import { typescriptNotes } from "./systemNotes/frontend/typescript";

/**
 * 빈줄 제거 (코드 블럭 내부는 유지)
 */
function removeEmptyLines(text: string): string {
    const lines = text.split('\n')
    const result: string[] = []
    let inCodeBlock = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // 코드 블럭 시작/끝 감지
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock
            result.push(line)
            continue
        }

        // 코드 블럭 내부는 그대로 유지
        if (inCodeBlock) {
            result.push(line)
            continue
        }

        // 코드 블럭 외부: 빈줄 제거
        if (trimmed === '') {
            continue
        }

        result.push(line)
    }

    return result.join('\n')
}

/**
 * SystemNote 전처리: 빈줄 제거
 */
function processSystemNotes(notes: SystemNote[]): SystemNote[] {
    return notes.map(note => ({
        ...note,
        content: removeEmptyLines(note.content),
    }))
}

export const systemNotesData: SystemNote[] = processSystemNotes([
    ...browserNotes,
    ...htmlNotes,
    ...cssNotes,
    ...javascriptNotes,
    ...reactNotes,
    ...typescriptNotes,
    ...securityNotes,
    ...systemsAndArchitectureNotes,
    ...algorithmsNotes,
])