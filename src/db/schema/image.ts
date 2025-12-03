/**
 * 이미지 Blob 저장
 */
export interface ImageBlob {
    id: string;              // UUID
    blob: Blob;              // 실제 이미지 데이터
    mimeType: string;        // 'image/png', 'image/jpeg' 등
    size: number;            // 파일 크기 (바이트)
    noteId?: string;         // 연결된 노트 ID (orphan cleanup용)
    createdAt: number;
}
