import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'
import { categories, mainCategories, type Category } from '../data/categories'
import { Header } from '../features/Main/Header'
import { StudyCTABanner } from '../features/Main/StudyCTABanner'
import { ListView } from '../features/Main/ListView/ListView'
import { RoadmapView } from '../features/Main/roadmap/RoadmapView'
import type { ViewMode } from '../features/Main/Header'

// 대주제 필터 타입 (all + 각 mainCategory id)
export type TopicFilter = 'all' | (typeof mainCategories)[number]['id']

export function MainPage() {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션

    // ==================================== 전역 상태 =====================================
    const notes = useNoteStore((state) => state.notes) //노트 목록
    const loadNotes = useNoteStore((state) => state.loadNotes) // 노트 로드
    const createNote = useNoteStore((state) => state.createNote) // 노트 생성

    // ==================================== 상태 관리 =====================================
    const [viewMode, setViewMode] = useState<ViewMode>('list') // 뷰 모드 (리스트 / 맵)
    const [topicFilter, setTopicFilter] = useState<TopicFilter>('all') // 대주제 필터 (전체 / CS / 프론트엔드 / 백엔드)

    // ==================================== useEffect =====================================
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

    const filteredCategories = [...topicCategories[topicFilter]] // 필터링된 카테고리 (mutable copy)
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

    // roadmap 뷰일 때는 flex로 남은 높이 채우기
    const isRoadmapView = viewMode === 'roadmap'

    // Roadmap 뷰: 고정 높이 + overflow-hidden
    // List 뷰: 일반 스크롤 (body 스크롤 사용)
    if (isRoadmapView) {
        return (
            <div className="h-screen bg-[var(--bg-primary)] flex flex-col overflow-hidden">
                <Header
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

    // List 뷰: body 스크롤 사용 (sticky 헤더를 위해)
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                topicFilter={topicFilter}
                onTopicFilterChange={setTopicFilter}
            />

            <div className="py-8 px-6">
                {/* Study CTA 배너 */}
                <div className="max-w-[1000px] mx-auto mb-8">
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
