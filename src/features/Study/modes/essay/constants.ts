/**
 * 면접 모드 상수
 */

// 회사별 브랜드 색상
export const COMPANY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    '초록창': { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' },
    '노랑방': { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    '로켓배송': { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
    '파란통장': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
    '동네장터': { bg: 'bg-orange-400/10', text: 'text-orange-400', border: 'border-orange-400/30' },
}

// 질문 유형 한글 매핑
export const QUESTION_TYPE_LABELS: Record<string, string> = {
    concept: '개념',
    comparison: '비교',
    application: '적용',
    optimization: '최적화',
    troubleshooting: '문제해결',
    architecture: '설계',
}
