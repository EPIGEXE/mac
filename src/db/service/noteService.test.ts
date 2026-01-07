import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '../core/db'

// Mock systemNotes to avoid md file import issues
vi.mock('../../data/systemNotes', () => ({
    systemNotes: [],
}))

import {
    createNote,
    getNoteById,
    findNoteById,
    updateNote,
    deleteNote,
    getAllNotes,
    getCategories,
} from '../service/noteService'

describe('noteService', () => {
    beforeEach(async () => {
        // 테스트 전 DB 초기화
        await db.userNotes.clear()
        await db.userOverrides.clear()
    })

    // ========================================
    // 노트 생성 테스트
    // ========================================
    describe('createNote', () => {
        it('새 User 노트를 생성해야 함', async () => {
            const note = await createNote({
                title: 'Test Note',
                content: 'Test Content',
                category: 'test-category',
            })

            expect(note.id).toBeDefined()
            expect(note.id).toMatch(/^note-/)
            expect(note.type).toBe('user')
            expect(note.title).toBe('Test Note')
            expect(note.content).toBe('Test Content')
            expect(note.category).toBe('test-category')
            expect(note.createdAt).toBeDefined()
            expect(note.updatedAt).toBeDefined()
        })

        it('title 없이 생성 시 기본값 사용', async () => {
            const note = await createNote({
                category: 'test-category',
            })

            expect(note.title).toBe('새 노트')
            expect(note.content).toBe('')
        })

        it('category 없으면 에러를 발생해야 함', async () => {
            await expect(createNote({
                title: 'Test',
                category: '',
            })).rejects.toThrow('category is required')
        })

        it('DB에 노트가 저장되어야 함', async () => {
            const note = await createNote({
                title: 'Saved Note',
                category: 'test',
            })

            const saved = await db.userNotes.get(note.id)
            expect(saved).toBeDefined()
            expect(saved?.title).toBe('Saved Note')
        })
    })

    // ========================================
    // 노트 조회 테스트
    // ========================================
    describe('getNoteById', () => {
        it('User 노트를 조회해야 함', async () => {
            const created = await createNote({
                title: 'Find Me',
                category: 'test',
            })

            const found = await getNoteById(created.id, 'user')

            expect(found).not.toBeNull()
            expect(found?.id).toBe(created.id)
            expect(found?.title).toBe('Find Me')
            expect(found?.type).toBe('user')
        })

        it('존재하지 않는 노트는 null 반환', async () => {
            const found = await getNoteById('non-existent-id', 'user')
            expect(found).toBeNull()
        })
    })

    describe('findNoteById', () => {
        it('타입 자동 감지하여 User 노트 조회', async () => {
            const created = await createNote({
                title: 'Auto Find',
                category: 'test',
            })

            const found = await findNoteById(created.id)

            expect(found).not.toBeNull()
            expect(found?.id).toBe(created.id)
            expect(found?.type).toBe('user')
        })

        it('존재하지 않는 노트는 null 반환', async () => {
            const found = await findNoteById('non-existent-id')
            expect(found).toBeNull()
        })
    })

    // ========================================
    // 노트 수정 테스트
    // ========================================
    describe('updateNote', () => {
        it('User 노트를 수정해야 함', async () => {
            const created = await createNote({
                title: 'Original Title',
                content: 'Original Content',
                category: 'test',
            })

            // 타임스탬프 차이를 위한 지연
            await new Promise(r => setTimeout(r, 10))

            const updated = await updateNote(created.id, 'user', {
                title: 'Updated Title',
                content: 'Updated Content',
            })

            expect(updated?.title).toBe('Updated Title')
            expect(updated?.content).toBe('Updated Content')
            expect(updated?.updatedAt).toBeGreaterThanOrEqual(created.updatedAt!)
        })

        it('부분 수정이 가능해야 함', async () => {
            const created = await createNote({
                title: 'Original',
                content: 'Content',
                category: 'test',
            })

            const updated = await updateNote(created.id, 'user', {
                title: 'New Title',
            })

            expect(updated?.title).toBe('New Title')
            expect(updated?.content).toBe('Content') // 변경 없음
        })

        it('존재하지 않는 노트 수정 시 에러를 발생해야 함', async () => {
            await expect(updateNote('non-existent', 'user', {
                title: 'Test',
            })).rejects.toThrow()
        })
    })

    // ========================================
    // 노트 삭제 테스트
    // ========================================
    describe('deleteNote', () => {
        it('User 노트를 삭제해야 함', async () => {
            const created = await createNote({
                title: 'To Delete',
                category: 'test',
            })

            const result = await deleteNote(created.id, 'user')

            expect(result).toBe(true)

            const found = await db.userNotes.get(created.id)
            expect(found).toBeUndefined()
        })
    })

    // ========================================
    // 전체 노트 조회 테스트
    // ========================================
    describe('getAllNotes', () => {
        it('모든 User 노트를 조회해야 함', async () => {
            await createNote({ title: 'Note 1', category: 'cat-a' })
            await createNote({ title: 'Note 2', category: 'cat-b' })

            const notes = await getAllNotes()

            // User 노트 2개 존재 확인
            const userNotes = notes.filter(n => n.type === 'user')
            expect(userNotes.length).toBeGreaterThanOrEqual(2)
        })

        it('카테고리로 필터링해야 함', async () => {
            await createNote({ title: 'Cat A Note', category: 'cat-a' })
            await createNote({ title: 'Cat B Note', category: 'cat-b' })

            const notes = await getAllNotes({ category: 'cat-a' })

            const userNotes = notes.filter(n => n.type === 'user')
            expect(userNotes.every(n => n.category === 'cat-a')).toBe(true)
        })
    })

    // ========================================
    // 카테고리 조회 테스트
    // ========================================
    describe('getCategories', () => {
        it('모든 카테고리를 반환해야 함', async () => {
            await createNote({ title: 'Note 1', category: 'category-x' })
            await createNote({ title: 'Note 2', category: 'category-y' })
            await createNote({ title: 'Note 3', category: 'category-x' }) // 중복

            const categories = await getCategories()

            expect(categories).toContain('category-x')
            expect(categories).toContain('category-y')
        })

        it('카테고리가 정렬되어야 함', async () => {
            await createNote({ title: 'Note', category: 'z-last' })
            await createNote({ title: 'Note', category: 'a-first' })

            const categories = await getCategories()

            const indexA = categories.indexOf('a-first')
            const indexZ = categories.indexOf('z-last')

            if (indexA !== -1 && indexZ !== -1) {
                expect(indexA).toBeLessThan(indexZ)
            }
        })
    })
})
