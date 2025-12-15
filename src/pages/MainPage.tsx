import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { categories, mainCategories, type Category } from '../data/categories'
import { MainHeader } from '../features/Main/MainHeader'
import { StudyCTABanner } from '../features/Main/StudyCTABanner'
import { ListView } from '../features/Main/ListView/ListView'
import { RoadmapView } from '../features/Main/roadmap/RoadmapView'
import type { ViewMode } from '../features/Main/MainHeader'

// 대주제 필터 타입
export type TopicFilter = 'all' | (typeof mainCategories)[number]['id']

export function MainPage() {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션

    // ==================================== 전역 상태 =====================================
    const notes = useNoteStore((state) => state.notes) //노트 목록
    const loadNotes = useNoteStore((state) => state.loadNotes) // 노트 로드
    const createNote = useNoteStore((state) => state.createNote) // 노트 생성
    const resetSession = useStudySessionStore((state) => state.resetSession) // 세션 초기화

    // ==================================== 상태 관리 =====================================
    const [viewMode, setViewMode] = useState<ViewMode>('list') // 뷰 모드 (리스트 / 맵)
    const [topicFilter, setTopicFilter] = useState<TopicFilter>('all') // 대주제 필터 (전체 / CS / 프론트엔드 / 백엔드)

    // ==================================== useEffect =====================================
    // 메인 페이지 진입 시 이전 세션 정리
    useEffect(() => {
        resetSession()
    }, [resetSession])

    // 노트 로드
    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    // ==================================== 상수 =====================================
    const topicCategories: Record<TopicFilter, readonly Category[]> = {
        all: categories,
        cs: mainCategories[0].categories,
        frontend: mainCategories[1].categories,
        backend: mainCategories[2].categories,
    }

    const filteredCategories = [...topicCategories[topicFilter]] // 필터링된 카테고리
    const filteredNotes = notes.filter((n) =>
        filteredCategories.includes(n.category as (typeof filteredCategories)[number])
    ) // 필터링된 노트

    // ==================================== 핸들러 =====================================
    // 노트 생성
    const handleCreateNote = async (category: string) => {
        const noteId = await createNote(category)
        navigate(`/note/${noteId}`)
    }

    // 노트 클릭
    const handleNoteClick = (noteId: string) => {
        navigate(`/note/${noteId}`)
    }

    // roadmap 뷰
    const isRoadmapView = viewMode === 'roadmap'

    // Roadmap 뷰
    if (isRoadmapView) {
        return (
            <div className="h-screen bg-[var(--bg-primary)] flex flex-col overflow-hidden">
                <MainHeader
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    topicFilter={topicFilter}
                    onTopicFilterChange={setTopicFilter}
                />
                <div className="flex-1 min-h-0">
                    <RoadmapView notes={filteredNotes} onNoteClick={handleNoteClick} topicFilter={topicFilter} />
                </div>
            </div>
        )
    }

    // List 뷰
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <MainHeader
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                topicFilter={topicFilter}
                onTopicFilterChange={setTopicFilter}
            />

            <div className="py-8 px-6">
                <div className="main-container mb-8">
                    <StudyCTABanner />
                </div>

                <ListView
                    notes={filteredNotes}
                    categories={filteredCategories}
                    onNoteClick={handleNoteClick}
                    onCreateNote={handleCreateNote}
                    showMainCategories={topicFilter === 'all'}
                />
            </div>
        </div>
    )
}
