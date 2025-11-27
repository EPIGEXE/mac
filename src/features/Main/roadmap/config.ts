import type { TopicFilter, SectionDef, CategoryNodeDef, EdgeDef } from './types';

// 카테고리 매핑 (노드 id → 실제 카테고리명)
export const categoryMapping: Record<string, string> = {
    'cs': 'CS',
    'html': 'HTML',
    'css': 'CSS',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'react': 'React',
    'performance': 'Performance',
    'security': 'Security',
};

// TopicFilter → 섹션 ID 매핑
export const filterToSections: Record<TopicFilter, string[]> = {
    all: ['cs', 'fe', 'be'],
    cs: ['cs'],
    frontend: ['fe'],
    backend: ['be'],
};

// 섹션 정의
export const sections: SectionDef[] = [
    { id: 'cs', label: 'CS 기초' },
    { id: 'fe', label: '프론트엔드' },
    { id: 'be', label: '백엔드 / 공통' },
];

// 카테고리 노드 정의
export const categoryNodes: CategoryNodeDef[] = [
    // CS 기초
    { id: 'cs', label: 'CS 기초', section: 'cs' },
    { id: 'network', label: '네트워크', section: 'cs' },
    { id: 'os', label: '운영체제', section: 'cs' },
    { id: 'database', label: '데이터베이스', section: 'cs' },
    // 프론트엔드
    { id: 'internet', label: '인터넷', section: 'fe' },
    { id: 'html', label: 'HTML', section: 'fe' },
    { id: 'css', label: 'CSS', section: 'fe' },
    { id: 'sass', label: 'Sass', section: 'fe' },
    { id: 'tailwind', label: 'Tailwind', section: 'fe' },
    { id: 'javascript', label: 'JavaScript', section: 'fe' },
    { id: 'typescript', label: 'TypeScript', section: 'fe' },
    { id: 'npm', label: 'npm/yarn', section: 'fe' },
    { id: 'bundler', label: '번들러', section: 'fe' },
    { id: 'vite', label: 'Vite', section: 'fe' },
    { id: 'react', label: 'React', section: 'fe' },
    { id: 'nextjs', label: 'Next.js', section: 'fe' },
    { id: 'state', label: '상태관리', section: 'fe' },
    { id: 'testing', label: '테스팅', section: 'fe' },
    // 백엔드 / 공통
    { id: 'performance', label: 'Performance', section: 'be' },
    { id: 'security', label: 'Security', section: 'be' },
    { id: 'deploy', label: '배포', section: 'be' },
];

// 엣지 정의
export const edgeDefinitions: EdgeDef[] = [
    // CS
    { from: 'cs', to: 'network', dashed: true },
    { from: 'cs', to: 'os', dashed: true },
    { from: 'cs', to: 'database', dashed: true },
    // 프론트엔드
    { from: 'internet', to: 'html' },
    { from: 'html', to: 'css' },
    { from: 'css', to: 'sass', dashed: true },
    { from: 'css', to: 'tailwind', dashed: true },
    { from: 'css', to: 'javascript' },
    { from: 'javascript', to: 'typescript', dashed: true },
    { from: 'javascript', to: 'npm', dashed: true },
    { from: 'javascript', to: 'bundler' },
    { from: 'bundler', to: 'vite', dashed: true },
    { from: 'bundler', to: 'react' },
    { from: 'react', to: 'nextjs', dashed: true },
    { from: 'react', to: 'state', dashed: true },
    { from: 'react', to: 'testing', dashed: true },
    // 백엔드
    { from: 'performance', to: 'security', dashed: true },
    { from: 'security', to: 'deploy', dashed: true },
];

// 레이아웃 상수
export const LAYOUT = {
    nodeWidth: 180,
    sectionHeaderWidth: 180,
    sectionSpacing: 120,
    dagre: {
        rankdir: 'TB' as const,
        ranksep: 40,
        nodesep: 20,
        marginx: 16,
        marginy: 16,
    },
};
