import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'
import { categories } from '../data/defaultNotes'
import { Header } from '../features/Main/Header'
import { ListView } from '../features/Main/ListView/ListView'
import { RoadmapView } from '../features/Main/roadmap/RoadmapView'
import type { ViewMode, TopicFilter } from '../features/Main/Header'

// 대주제별 카테고리 매핑
const topicCategories: Record<TopicFilter, string[]> = {
    all: [...categories],
    cs: ['CS'],
    frontend: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React'],
    backend: ['Performance', 'Security'],
}

export function MainPage() {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션

    // ==================================== 전역 상태 =====================================
    const {
        notes, //노트 목록
        isLoading, // 로딩 상태
        loadNotes, // 노트 로드
        createNote, // 노트 생성
    } = useNoteStore()

    // ==================================== 상태 관리 =====================================
    const [viewMode, setViewMode] = useState<ViewMode>('list') // 뷰 모드 (리스트 / 맵)
    const [topicFilter, setTopicFilter] = useState<TopicFilter>('all') // 대주제 필터 (전체 / CS / 프론트엔드 / 백엔드)

    // ==================================== useEffect =====================================
    // 노트 로드
    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    // ==================================== 상수 =====================================
    const filteredCategories = topicCategories[topicFilter] // 필터링된 카테고리
    const filteredNotes = notes.filter((n) => filteredCategories.includes(n.category)) // 필터링된 노트

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-[var(--text-secondary)]">로딩 중...</div>
            </div>
        )
    }

    // roadmap 뷰일 때는 flex로 남은 높이 채우기
    const isRoadmapView = viewMode === 'roadmap'

    return (
        <div className={`h-screen bg-[var(--bg-primary)] flex flex-col ${isRoadmapView ? 'overflow-hidden' : 'overflow-auto'}`}>
            <Header
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                topicFilter={topicFilter}
                onTopicFilterChange={setTopicFilter}
            />

            {isRoadmapView ? (
                <div className="flex-1 min-h-0">
                    <RoadmapView
                        notes={filteredNotes}
                        onNoteClick={handleNoteClick}
                        topicFilter={topicFilter}
                    />
                </div>
            ) : (
                <div className="py-8 px-6">
                    <ListView
                        notes={filteredNotes}
                        categories={filteredCategories}
                        onNoteClick={handleNoteClick}
                        onCreateNote={handleCreateNote}
                        showMainCategories={topicFilter === 'all'}
                    />
                </div>
            )}
        </div>
    )
}
