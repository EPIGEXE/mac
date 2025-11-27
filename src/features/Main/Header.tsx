import { IconSun, IconMoon } from '@tabler/icons-react'
import { useTheme } from '../../contexts/useTheme'

export type ViewMode = 'list' | 'roadmap'
export type TopicFilter = 'all' | 'cs' | 'frontend' | 'backend'

interface HeaderProps {
    viewMode: ViewMode // 뷰 모드 (리스트 / 맵)
    onViewModeChange: (mode: ViewMode) => void // 뷰 모드 변경
    topicFilter: TopicFilter // 대주제 필터 (전체 / CS / 프론트엔드 / 백엔드)
    onTopicFilterChange: (topic: TopicFilter) => void // 대주제 필터 변경
}

// 대주제 필터 버튼
const topicButtons: { value: TopicFilter; label: string; mono: string }[] = [
    { value: 'all', label: '전체', mono: '*' },
    { value: 'cs', label: 'CS', mono: 'cs' },
    { value: 'frontend', label: '프론트엔드', mono: 'fe' },
    { value: 'backend', label: '백엔드', mono: 'be' },
]

// 메인 페이지 헤더
export function Header({ viewMode, onViewModeChange, topicFilter, onTopicFilterChange }: HeaderProps) {
    // ==================================== Hooks =====================================
    const { theme, toggleTheme } = useTheme() // 테마 컨텍스트

    return (
        <header className="bg-[var(--bg-paper)] border-b border-[var(--border-light)]">
            <div className="max-w-[1000px] mx-auto pt-8 pb-6">
                {/* 로고 영역 */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-[32px] text-[var(--text-primary)] tracking-[0.05em]">
                                맥
                            </h1>
                        </div>
                        <p className="font-mono text-xs text-[var(--text-tertiary)] mt-1 tracking-[0.02em]">
                            // 개발자 면접 노트
                        </p>
                    </div>

                    {/* 우측 컨트롤 */}
                    <div className="flex items-center gap-3">
                        {/* View Mode - 터미널 스타일 */}
                        <div className="flex font-mono text-[13px] text-[var(--text-tertiary)]">
                            <span className="mr-2">view:</span>
                            <button
                                onClick={() => onViewModeChange('list')}
                                className={`bg-transparent border-none px-2 font-mono text-[13px] cursor-pointer relative ${
                                    viewMode === 'list' ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                                }`}
                            >
                                list
                                {viewMode === 'list' && (
                                    <span className="absolute -bottom-0.5 left-2 right-2 h-px bg-[var(--accent)]" />
                                )}
                            </button>
                            <span className="text-[var(--text-tertiary)]">|</span>
                            <button
                                onClick={() => onViewModeChange('roadmap')}
                                className={`bg-transparent border-none px-2 font-mono text-[13px] cursor-pointer relative ${
                                    viewMode === 'roadmap' ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                                }`}
                            >
                                map
                                {viewMode === 'roadmap' && (
                                    <span className="absolute -bottom-0.5 left-2 right-2 h-px bg-[var(--accent)]" />
                                )}
                            </button>
                        </div>

                        {/* 테마 토글 */}
                        <button
                            onClick={toggleTheme}
                            className="w-8 h-8 border border-[var(--border-light)] bg-transparent text-[var(--text-tertiary)] flex items-center justify-center cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                        </button>
                    </div>
                </div>

                {/* Topic 필터 */}
                <div className="flex border-b border-[var(--border-light)]">
                    {topicButtons.map((topic) => {
                        const isActive = topicFilter === topic.value
                        return (
                            <button
                                key={topic.value}
                                onClick={() => onTopicFilterChange(topic.value)}
                                className={`py-3 px-5 bg-transparent border-none -mb-px cursor-pointer transition-all duration-150 ${
                                    isActive ? 'border-b-2 border-b-[var(--accent)]' : 'border-b-2 border-b-transparent'
                                }`}
                            >
                                <span className="font-mono text-[11px] text-[var(--text-tertiary)] mr-1.5">
                                    {topic.mono}
                                </span>
                                <span
                                    className={`text-sm ${
                                        isActive
                                            ? 'font-semibold text-[var(--text-primary)]'
                                            : 'font-normal text-[var(--text-secondary)]'
                                    }`}
                                >
                                    {topic.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </header>
    )
}
