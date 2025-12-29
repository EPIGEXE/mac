import { useNavigate } from 'react-router-dom'
import { IconSun, IconMoon, IconPlayerPlay } from '@tabler/icons-react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useState, useRef } from 'react'
import { useTheme } from '../../contexts/useTheme'
import { mainCategories } from '../../data/categories'
import { Badge } from '../../components/common/Badge'

export type ViewMode = 'list' | 'roadmap'
export type TopicFilter = 'all' | (typeof mainCategories)[number]['id']

interface HeaderProps {
    viewMode: ViewMode // 뷰 모드 (리스트 / 맵)
    onViewModeChange: (mode: ViewMode) => void // 뷰 모드 변경 핸들러
    topicFilter: TopicFilter // 대주제 필터
    onTopicFilterChange: (topic: TopicFilter) => void // 대주제 필터 변경 핸들러
}

// 대주제 필터 버튼
const topicButtons: { value: TopicFilter; label: string; mono: string }[] = [
    { value: 'all', label: '전체', mono: '*' },
    ...mainCategories.map(m => ({
        value: m.id as TopicFilter,
        label: m.label,
        mono: m.id.slice(0, 2),
    })),
]

// 스크롤 임계값
const SCROLL_THRESHOLD = 50

export function MainHeader({ viewMode, onViewModeChange, topicFilter, onTopicFilterChange }: HeaderProps) {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션
    const { theme, toggleTheme } = useTheme() // 테마 Hook
    const { scrollY } = useScroll() // 스크롤 위치 Hook

    // ==================================== 상태 관리 =====================================
    const [isCompact, setIsCompact] = useState(false) // 컴팩트 모드 (스크롤 시 인라인으로 표시)

    // ==================================== useRef =====================================
    const lastScrollY = useRef(0) // 스크롤 위치

    // ==================================== 핸들러 =====================================
    // Topic 필터 변경 시 스크롤 최상위로 이동
    const handleTopicChange = (topic: TopicFilter) => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        setIsCompact(false)
        onTopicFilterChange(topic)
    }

    // framer-motion의 MotionValueEvent를 사용하여 스크롤 위치 변경 시 컴팩트 모드 변경
    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = lastScrollY.current

        // 아래로 스크롤하면 축소
        if (latest > previous && latest > SCROLL_THRESHOLD) {
            setIsCompact(true)
        }
        // 맨 위로 올라가면 확대
        else if (latest < 10) {
            setIsCompact(false)
        }

        lastScrollY.current = latest
    })

    // 학습 버튼 클릭 시 학습 페이지로 이동
    const handleStudyClick = () => {
        navigate('/study/setup')
    }

    return (
        <motion.header
            className="sticky top-0 z-50 bg-[var(--bg-paper)] border-b border-[var(--border-light)]"
            initial={false}
            animate={{
                boxShadow: isCompact
                    ? '0 4px 12px -2px rgba(0,0,0,0.08)'
                    : '0 1px 0 0 var(--border-light)',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <motion.div
                className="main-container px-4"
                initial={false}
                animate={{
                    paddingTop: isCompact ? 12 : 32,
                    paddingBottom: isCompact ? 12 : 24,
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                {/* 메인 row: 로고 + Topic 필터(스크롤 시) + 유틸리티 */}
                <div className="flex items-center justify-between">
                    {/* 좌측: 로고 + Topic 필터(스크롤 시) */}
                    <div className="flex items-center gap-6">
                        {/* 로고 + 서브타이틀 */}
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <h1 className="font-display text-[32px] text-[var(--text-primary)] tracking-[0.05em] leading-none">
                                    맥
                                </h1>
                                <Badge variant="accent" size="xs">
                                    BETA
                                </Badge>
                            </div>
                            <motion.p
                                className="comment-text"
                                initial={false}
                                animate={{
                                    height: isCompact ? 0 : 'auto',
                                    opacity: isCompact ? 0 : 1,
                                    marginTop: isCompact ? 0 : 4,
                                }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                // 개발자 면접 노트
                            </motion.p>
                        </div>

                        {/* Topic 필터 (스크롤 시 인라인으로 표시 - md 이상에서만) */}
                        <motion.div
                            className="hidden md:flex items-center gap-1 overflow-hidden"
                            initial={false}
                            animate={{
                                width: isCompact ? 'auto' : 0,
                                opacity: isCompact ? 1 : 0,
                            }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            {topicButtons.map((topic) => {
                                const isActive = topicFilter === topic.value
                                return (
                                    <button
                                        key={topic.value}
                                        onClick={() => handleTopicChange(topic.value)}
                                        className={`px-2 py-1 bg-transparent border-none cursor-pointer transition-colors duration-150 whitespace-nowrap ${
                                            isActive
                                                ? 'font-semibold text-[var(--text-primary)]'
                                                : 'font-normal text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        {topic.label}
                                    </button>
                                )
                            })}
                        </motion.div>
                    </div>

                    {/* 우측: View Mode + 테마 + 학습 */}
                    <div className="flex items-center gap-1.5 md:gap-3">
                        {/* View Mode - 모바일: 아이콘 토글, 데스크톱: 터미널 스타일 */}
                        {/* 모바일 뷰 모드 토글 */}
                        <button
                            onClick={() => onViewModeChange(viewMode === 'list' ? 'roadmap' : 'list')}
                            className="md:hidden border-highlight-button w-8 h-8 font-mono text-xs"
                            aria-label={viewMode === 'list' ? '맵 뷰로 전환' : '리스트 뷰로 전환'}
                        >
                            {viewMode === 'list' ? '≡' : '◈'}
                        </button>

                        {/* 데스크톱 뷰 모드 */}
                        <div className="hidden md:flex font-mono text-[var(--text-tertiary)]">
                            <span className="mr-2">view:</span>
                            <button
                                onClick={() => onViewModeChange('list')}
                                className={`bg-transparent border-none px-2 font-mono cursor-pointer relative ${
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
                                className={`bg-transparent border-none px-2 font-mono cursor-pointer relative ${
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
                            className="border-highlight-button w-8 h-8"
                            aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
                        >
                            {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                        </button>

                        {/* Study 버튼 (스크롤 시에만 표시, 모바일에서는 아이콘만) */}
                        <motion.button
                            onClick={handleStudyClick}
                            className="flex items-center justify-center gap-1.5 font-mono text-sm font-medium bg-[var(--accent)] text-white border-none cursor-pointer transition-colors duration-150 hover:bg-[var(--accent-hover)] overflow-hidden whitespace-nowrap"
                            initial={false}
                            animate={{
                                width: isCompact ? 'auto' : 0,
                                opacity: isCompact ? 1 : 0,
                                paddingLeft: isCompact ? 8 : 0,
                                paddingRight: isCompact ? 8 : 0,
                                paddingTop: isCompact ? 6 : 0,
                                paddingBottom: isCompact ? 6 : 0,
                            }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <IconPlayerPlay size={14} />
                            <span className="hidden md:inline">학습</span>
                        </motion.button>
                    </div>
                </div>

                {/* Topic 필터 탭 (기본 상태) */}
                <motion.div
                    className="overflow-hidden"
                    initial={false}
                    animate={{
                        height: isCompact ? 0 : 'auto',
                        marginTop: isCompact ? 0 : 16,
                        opacity: isCompact ? 0 : 1,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="flex items-center border-b border-[var(--border-light)] overflow-x-auto scrollbar-none">
                        <div className="flex">
                            {topicButtons.map((topic) => {
                                const isActive = topicFilter === topic.value
                                return (
                                    <button
                                        key={topic.value}
                                        onClick={() => handleTopicChange(topic.value)}
                                        className={`py-2 px-2.5 md:py-3 md:px-5 bg-transparent border-none -mb-px cursor-pointer transition-colors duration-150 whitespace-nowrap shrink-0 ${
                                            isActive ? 'border-b-2 border-b-[var(--accent)]' : 'border-b-2 border-b-transparent'
                                        }`}
                                    >
                                        <span className="font-mono text-sm text-[var(--text-tertiary)] mr-1.5 hidden sm:inline">
                                            {topic.mono}
                                        </span>
                                        <span
                                            className={`${
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
                </motion.div>
            </motion.div>
        </motion.header>
    )
}
