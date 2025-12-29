/**
 * 학습 모드 CTA 배너
 * - 메인 페이지 상단에 표시
 * - 학습 모드 진입점 + 설명
 */
import { useNavigate } from 'react-router-dom'
import { IconPlayerPlay, IconCards, IconChartBar } from '@tabler/icons-react'
import { Badge } from '../../components/common/Badge'

export function StudyCTABanner() {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션

    // ==================================== 핸들러 =====================================

    const handleStatistics = () => {
        navigate('/statistics')
    }

    // 학습 설정 페이지로 이동
    const handleStartStudy = () => {
        navigate('/study/setup')
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-[var(--bg-paper)] to-[var(--bg-secondary)] border-2 border-[var(--accent)]/30">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 right-20 w-16 h-16 bg-[var(--accent)]/5 rounded-full translate-y-1/2" />

            <div className="relative flex items-center justify-between gap-4 px-4 py-4 md:px-6 md:py-6">
                {/* 좌측: 설명 */}
                <div className="flex items-center gap-3 md:gap-5 min-w-0">
                    {/* 아이콘 */}
                    <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
                        <IconCards className="w-5 h-5 md:w-7 md:h-7" />
                    </div>

                    {/* 텍스트 */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                            <h2 className="text-sm md:text-lg font-semibold text-[var(--text-primary)] truncate">학습 모드</h2>
                            <Badge>QUIZ</Badge>
                        </div>
                        <p className="comment-text truncate">// 노트 선택 → 퀴즈 복습</p>
                    </div>

                    {/* 모드 미리보기 - lg 이상에서만 표시 */}
                    <div className="hidden lg:flex items-center gap-3 ml-4 pl-6 border-l border-[var(--border-light)] shrink-0">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <span className="font-mono text-xs px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-light)]">
                                word
                            </span>
                            <span className="text-xs">빈칸</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <span className="font-mono text-xs px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-light)]">
                                sent
                            </span>
                            <span className="text-xs">문장</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <span className="font-mono text-xs px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-light)]">
                                essay
                            </span>
                            <span className="text-xs">서술</span>
                        </div>
                    </div>
                </div>

                {/* 우측: 버튼 그룹 */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {/* 통계 버튼 */}
                    <button
                        onClick={handleStatistics}
                        className="flex items-center justify-center gap-2 px-2.5 py-2 md:px-5 md:py-3 font-mono text-sm font-medium border border-[var(--accent)] text-[var(--accent)] bg-transparent cursor-pointer transition-all duration-200 hover:bg-[var(--accent)] hover:text-white whitespace-nowrap"
                    >
                        <IconChartBar className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                        <span className="hidden sm:inline">통계</span>
                    </button>

                    {/* 시작 버튼 - 강조 스타일 */}
                    <button
                        onClick={handleStartStudy}
                        className="group relative flex items-center gap-1.5 md:gap-2.5 px-3 py-2 md:px-7 md:py-3 font-mono text-sm font-medium bg-[var(--accent)] text-white border-none cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[var(--accent)]/25 active:scale-100 whitespace-nowrap"
                    >
                        {/* 버튼 내부 글로우 효과 */}
                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        <IconPlayerPlay className="w-4 h-4 md:w-[18px] md:h-[18px] relative" />
                        <span className="relative">시작</span>

                        {/* 화살표 애니메이션 */}
                        <span className="relative transition-transform duration-200 group-hover:translate-x-1">
                            →
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}
