/**
 * 제공 문서 (System Notes) - 앱에서 기본 제공하는 문서
 */
export interface SystemNote {
    id: string;              // 고정 ID (예: "js-closure-001")
    version: number;         // 패치 버전
    title: string;
    content: string;         // 마크다운
    category: string;
    tags: string[];
    order: number;           // 정렬 순서
    createdAt: number;
}

/**
 * 사용자 문서 (User Notes) - 사용자가 직접 생성한 문서
 */
export interface UserNote {
    id: string;              // UUID
    title: string;
    content: string;         // 마크다운
    category: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
}

/**
 * 제공 문서 커스터마이징 (User Overrides)
 * - 제공 문서를 사용자가 수정하면 여기에 저장
 * - 원본은 보존되고, 이 레이어가 덮어씀
 */
export interface UserOverride {
    systemNoteId: string;    // PK, SystemNote.id 참조
    customTitle: string | null;
    customContent: string | null;
    isHidden: boolean;       // 사용자가 숨긴 경우
    updatedAt: number;
}

/**
 * 통합 Note 타입 (UI에서 사용)
 */
export interface Note {
    id: string;
    type: 'system' | 'user';
    title: string;
    content: string;
    category: string;
    tags: string[];
    isCustomized: boolean;   // system이고 override 있으면 true
    originalTitle?: string;  // 커스터마이징된 경우 원본
    originalContent?: string;
    createdAt: number;
    updatedAt?: number;
    order?: number;          // system note의 정렬 순서
}
