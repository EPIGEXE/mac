// ============================================================================
// Image Storage Types
// ============================================================================

// Note: ImageBlob 스키마 타입은 ../schema/image.ts에 정의됨
// 여기서는 서비스 레이어에서 사용하는 Input/Output 타입만 정의

/**
 * 이미지 저장 옵션
 */
export interface SaveImageOptions {
    noteId?: string;
}

/**
 * 이미지 정보 (조회 결과)
 */
export interface ImageInfo {
    id: string;
    localURL: string;           // local:// URL
    mimeType: string;
    size: number;
    noteId?: string;
    createdAt: number;
}
