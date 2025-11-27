// 상위 카테고리 구조
export const mainCategories = [
    { id: 'cs', label: 'CS', categories: ['CS'] },
    { id: 'frontend', label: '프론트엔드', categories: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React'] },
    { id: 'backend', label: '백엔드', categories: ['Performance', 'Security'] },
];

// 카테고리가 속한 상위 카테고리 찾기
export function getMainCategory(category: string): string | null {
    for (const main of mainCategories) {
        if (main.categories.includes(category)) {
            return main.id;
        }
    }
    return null;
}
