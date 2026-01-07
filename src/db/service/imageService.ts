/**
 * 이미지 저장 서비스
 * - IndexedDB에 Blob으로 이미지 저장
 * - local:// URL 스킴으로 참조
 * - ObjectURL 캐싱으로 성능 최적화
 */
import { InvalidInputError, withErrorHandling } from '../../errors';
import { db } from '../core/db';
import type { ImageBlob } from '../core/schema';
import { generateId } from '../utils/idGenerator';

// ObjectURL 캐시 (메모리에서 관리)
const objectURLCache = new Map<string, string>();

/**
 * 이미지를 IndexedDB에 저장
 * @param blob 이미지 Blob
 * @param noteId 연결할 노트 ID (선택)
 * @returns local:// URL
 */
export async function saveImage(blob: Blob, noteId?: string): Promise<string> {
    if (!blob) {
        throw new InvalidInputError('blob is required', 'blob');
    }

    return withErrorHandling('saveImage', async () => {
        const id = generateId('img');
        const imageData: ImageBlob = {
            id,
            blob,
            mimeType: blob.type,
            size: blob.size,
            noteId,
            createdAt: Date.now(),
        };

        await db.images.add(imageData);

        // ObjectURL 생성 및 캐시
        const objectURL = URL.createObjectURL(blob);
        objectURLCache.set(id, objectURL);

        return `local://${id}`;
    });
}

/**
 * File을 이미지로 저장
 */
export async function saveImageFromFile(file: File, noteId?: string): Promise<string> {
    if (!file) {
        throw new InvalidInputError('file is required', 'file');
    }
    if (!file.type.startsWith('image/')) {
        throw new InvalidInputError('이미지 파일만 저장할 수 있습니다.', 'file');
    }
    return saveImage(file, noteId);
}

/**
 * DataURL(Base64)을 이미지로 저장
 */
export async function saveImageFromDataURL(dataURL: string, noteId?: string): Promise<string> {
    if (!dataURL) {
        throw new InvalidInputError('dataURL is required', 'dataURL');
    }

    return withErrorHandling('saveImageFromDataURL', async () => {
        const response = await fetch(dataURL);
        const blob = await response.blob();
        return saveImage(blob, noteId);
    });
}

/**
 * local:// URL에서 ID 추출
 */
export function parseLocalURL(url: string): string | null {
    const match = url.match(/^local:\/\/(.+)$/);
    return match ? match[1] : null;
}

/**
 * local:// URL인지 확인
 */
export function isLocalURL(url: string): boolean {
    return url.startsWith('local://');
}

/**
 * local:// URL을 표시용 ObjectURL로 변환
 * @param localURL local:// URL
 * @returns 브라우저에서 사용 가능한 ObjectURL 또는 null
 */
export async function resolveLocalURL(localURL: string): Promise<string | null> {
    return withErrorHandling('resolveLocalURL', async () => {
        const id = parseLocalURL(localURL);
        if (!id) return null;

        // 캐시 확인
        if (objectURLCache.has(id)) {
            return objectURLCache.get(id)!;
        }

        // DB에서 조회
        const imageData = await db.images.get(id);
        if (!imageData) return null;

        // ObjectURL 생성 및 캐시
        const objectURL = URL.createObjectURL(imageData.blob);
        objectURLCache.set(id, objectURL);

        return objectURL;
    });
}

/**
 * 이미지 삭제
 */
export async function deleteImage(localURL: string): Promise<void> {
    return withErrorHandling('deleteImage', async () => {
        const id = parseLocalURL(localURL);
        if (!id) return;

        // 캐시된 ObjectURL 해제
        const cachedURL = objectURLCache.get(id);
        if (cachedURL) {
            URL.revokeObjectURL(cachedURL);
            objectURLCache.delete(id);
        }

        // DB에서 삭제
        await db.images.delete(id);
    });
}

/**
 * 노트에 연결된 모든 이미지 삭제
 */
export async function deleteImagesByNoteId(noteId: string): Promise<void> {
    if (!noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }

    return withErrorHandling('deleteImagesByNoteId', async () => {
        const images = await db.images.where('noteId').equals(noteId).toArray();

        for (const image of images) {
            const cachedURL = objectURLCache.get(image.id);
            if (cachedURL) {
                URL.revokeObjectURL(cachedURL);
                objectURLCache.delete(image.id);
            }
        }

        await db.images.where('noteId').equals(noteId).delete();
    });
}

/**
 * 이미지의 노트 연결 업데이트
 */
export async function updateImageNoteId(localURL: string, noteId: string): Promise<void> {
    if (!noteId) {
        throw new InvalidInputError('noteId is required', 'noteId');
    }

    return withErrorHandling('updateImageNoteId', async () => {
        const id = parseLocalURL(localURL);
        if (!id) return;

        await db.images.update(id, { noteId });
    });
}

/**
 * 연결되지 않은 orphan 이미지 정리
 * @param maxAge 최대 보관 시간 (ms), 기본 24시간
 */
export async function cleanupOrphanImages(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    return withErrorHandling('cleanupOrphanImages', async () => {
        const cutoff = Date.now() - maxAge;

        // noteId가 없고 오래된 이미지 찾기
        const orphans = await db.images
            .filter(img => !img.noteId && img.createdAt < cutoff)
            .toArray();

        for (const image of orphans) {
            const cachedURL = objectURLCache.get(image.id);
            if (cachedURL) {
                URL.revokeObjectURL(cachedURL);
                objectURLCache.delete(image.id);
            }
        }

        const orphanIds = orphans.map(img => img.id);
        await db.images.bulkDelete(orphanIds);

        return orphans.length;
    });
}

/**
 * 모든 캐시된 ObjectURL 해제 (앱 종료 시)
 */
export function revokeAllObjectURLs(): void {
    for (const url of objectURLCache.values()) {
        URL.revokeObjectURL(url);
    }
    objectURLCache.clear();
}

/**
 * 이미지 정보 조회
 */
export async function getImageInfo(localURL: string): Promise<ImageBlob | null> {
    return withErrorHandling('getImageInfo', async () => {
        const id = parseLocalURL(localURL);
        if (!id) return null;

        const result = await db.images.get(id);
        return result ?? null;
    });
}
