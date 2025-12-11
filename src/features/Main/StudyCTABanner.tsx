/**
 * 학습 모드 CTA 배너
 * - 메인 페이지 상단에 표시
 * - 학습 모드 진입점 + 설명
 */
import { useNavigate } from 'react-router-dom'
import { IconPlayerPlay, IconCards, IconChartBar } from '@tabler/icons-react'

export function StudyCTABanner() {
    const navigate = useNavigate()

    const handleStartStudy = () => {
        navigate('/study/setup')
    }

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-[var(--bg-paper)] to-[var(--bg-secondary)] border-2 border-[var(--accent)]/30">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 right-20 w-16 h-16 bg-[var(--accent)]/5 rounded-full translate-y-1/2" />

            <div className="relative flex items-center justify-between px-6 py-6">
                {/* 좌측: 설명 */}
                <div className="flex items-center gap-5">
                    {/* 아이콘 */}
                    <div className="w-14 h-14 bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
                        <IconCards size={28} />
                    </div>

                    {/* 텍스트 */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                학습 모드
                            </h2>
                            <span className="font-mono text-xs px-1.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30">
                                QUIZ
                            </span>
                        </div>
                        <p className="comment-text">
                            // 노트 선택 → 모드 선택 → 퀴즈로 복습
                        </p>
                    </div>

                    {/* 모드 미리보기 */}
                    <div className="hidden md:flex items-center gap-3 ml-4 pl-6 border-l border-[var(--border-light)]">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <span className="font-mono text-xs px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-light)]">word</span>
                            <span className="text-xs">빈칸</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <span className="font-mono text-xs px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-light)]">sent</span>
                            <span className="text-xs">문장</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <span className="font-mono text-xs px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-light)]">essay</span>
                            <span className="text-xs">서술</span>
                        </div>
                    </div>
                </div>

                {/* 우측: 버튼 그룹 */}
                <div className="flex items-center gap-3">
                    {/* 통계 버튼 */}
                    <button
                        onClick={() => navigate('/statistics')}
                        className="flex items-center gap-2 px-5 py-3 font-mono text-sm font-medium border border-[var(--accent)] text-[var(--accent)] bg-transparent cursor-pointer transition-all duration-200 hover:bg-[var(--accent)] hover:text-white"
                    >
                        <IconChartBar size={18} />
                        <span>학습 통계</span>
                    </button>

                    {/* 시작 버튼 - 강조 스타일 */}
                    <button
                        onClick={handleStartStudy}
                        className="group relative flex items-center gap-2.5 px-7 py-3 font-mono text-sm font-medium bg-[var(--accent)] text-white border-none cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[var(--accent)]/25 active:scale-100"
                    >
                        {/* 버튼 내부 글로우 효과 */}
                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        <IconPlayerPlay size={18} className="relative" />
                        <span className="relative">학습 시작</span>

                        {/* 화살표 애니메이션 */}
                        <span className="relative ml-1 transition-transform duration-200 group-hover:translate-x-3">→</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
