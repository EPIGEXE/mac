import { IconSun, IconMoon } from '@tabler/icons-react'
import { useTheme } from '../../../../contexts'

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
        <header
            style={{
                backgroundColor: 'var(--bg-paper)',
                borderBottom: '1px solid var(--border-light)',
            }}
        >
            <div
                style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: '32px 0 24px',
                }}
            >
                {/* 로고 영역 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        marginBottom: '32px',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '32px',
                                fontWeight: 400,
                                color: 'var(--text-primary)',
                                letterSpacing: '0.05em',
                            }}
                        >
                            맥
                        </h1>
                        <p
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '12px',
                                color: 'var(--text-tertiary)',
                                marginTop: '4px',
                                letterSpacing: '0.02em',
                            }}
                        >
                            // 개발자 면접 노트
                        </p>
                    </div>

                    {/* 우측 컨트롤 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* View Mode - 터미널 스타일 */}
                        <div
                            style={{
                                display: 'flex',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            <span style={{ marginRight: '8px' }}>view:</span>
                            <button
                                onClick={() => onViewModeChange('list')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0 8px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '13px',
                                    color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-tertiary)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                            >
                                list
                                {viewMode === 'list' && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            bottom: '-2px',
                                            left: '8px',
                                            right: '8px',
                                            height: '1px',
                                            backgroundColor: 'var(--accent)',
                                        }}
                                    />
                                )}
                            </button>
                            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
                            <button
                                onClick={() => onViewModeChange('roadmap')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0 8px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '13px',
                                    color: viewMode === 'roadmap' ? 'var(--accent)' : 'var(--text-tertiary)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                            >
                                map
                                {viewMode === 'roadmap' && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            bottom: '-2px',
                                            left: '8px',
                                            right: '8px',
                                            height: '1px',
                                            backgroundColor: 'var(--accent)',
                                        }}
                                    />
                                )}
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                width: '32px',
                                height: '32px',
                                border: '1px solid var(--border-light)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent)'
                                e.currentTarget.style.color = 'var(--accent)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-light)'
                                e.currentTarget.style.color = 'var(--text-tertiary)'
                            }}
                        >
                            {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                        </button>
                    </div>
                </div>

                {/* Topic 필터 - 탭 스타일 */}
                <div
                    style={{
                        display: 'flex',
                        gap: '0',
                        borderBottom: '1px solid var(--border-light)',
                    }}
                >
                    {topicButtons.map((topic) => {
                        const isActive = topicFilter === topic.value
                        return (
                            <button
                                key={topic.value}
                                onClick={() => onTopicFilterChange(topic.value)}
                                style={{
                                    padding: '12px 20px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                    marginBottom: '-1px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '11px',
                                        color: 'var(--text-tertiary)',
                                        marginRight: '6px',
                                    }}
                                >
                                    {topic.mono}
                                </span>
                                <span
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: isActive
                                            ? 'var(--font-weight-semibold)'
                                            : 'var(--font-weight-regular)',
                                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    }}
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
