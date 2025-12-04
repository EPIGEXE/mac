// ============================================================================
// 카테고리 단일 소스 (Single Source of Truth)
// - mainCategories에서 상위-하위 구조 정의
// - 나머지는 모두 파생
// ============================================================================

// 상위 카테고리 구조 (단일 소스)
export const mainCategories = [
    { id: 'cs', label: 'CS', categories: ['CS'] as const },
    { id: 'frontend', label: '프론트엔드', categories: ['Browser', 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React'] as const },
    { id: 'backend', label: '백엔드', categories: ['Performance', 'Security'] as const },
] as const

// 카테고리 타입
// (CS | HTML | CSS | JavaScript | TypeScript | React | Performance | Security ...)
export type Category = (typeof mainCategories)[number]['categories'][number]

// 전체 카테고리 flat 배열
// ('CS', 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Performance', 'Security' ...)
export const categories: Category[] = mainCategories.flatMap((m) => [...m.categories])

// 카테고리 상수 객체 (CATEGORY.HTML 형태로 사용)
// (CS: 'CS', HTML: 'HTML', CSS: 'CSS', JavaScript: 'JavaScript' ...)
export const CATEGORY = Object.fromEntries(categories.map((c) => [c, c])) as { [K in Category]: K }

// ============================================================================
// 태그 체계 (3차원)
// ============================================================================

// 태그 값 타입
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Importance = 'good' | 'useful' | 'core'
export type Interview = 'common' | 'must'

// 태그 상수 객체 (TAG.LEVEL.beginner 형태로 사용)
export const TAG = {
    LEVEL: {
        beginner: 'beginner',     // 입문: 처음 접하는 개념
        intermediate: 'intermediate', // 중급: 기본기를 알아야 이해 가능
        advanced: 'advanced',     // 심화: 깊은 이해 필요
    } as const satisfies Record<Level, Level>,

    IMPORTANCE: {
        good: 'good',      // 교양: 알면 좋은 배경지식
        useful: 'useful',  // 실용: 도메인에 따라 필요
        core: 'core',      // 핵심: 무조건 알아야 함
    } as const satisfies Record<Importance, Importance>,

    INTERVIEW: {
        common: 'common',  // 자주출제
        must: 'must',      // 면접필수
    } as const satisfies Record<Interview, Interview>,
} as const

// 라벨 (UI 표시용)
export const TAG_LABELS = {
    LEVEL: {
        beginner: '입문',
        intermediate: '중급',
        advanced: '심화',
    } as const satisfies Record<Level, string>,
    IMPORTANCE: {
        good: '교양',
        useful: '실용',
        core: '핵심',
    } as const satisfies Record<Importance, string>,
    INTERVIEW: {
        common: '자주출제',
        must: '면접필수',
    } as const satisfies Record<Interview, string>,
} as const

// SystemNote용 태그 타입
export interface NoteTag {
    level: Level;
    importance: Importance;
    interview?: Interview;
}