import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoteStore } from '../stores/noteStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { categories, mainCategories, type Category } from '../data/categories'
import { MainHeader } from '../features/Main/MainHeader'
import { StudyCTABanner } from '../features/Main/StudyCTABanner'
import { NoteSearch, type TagFilter } from '../features/Main/NoteSearch'
import { ListView } from '../features/Main/ListView/ListView'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { analytics } from '../lib/analytics'
import type { ViewMode } from '../features/Main/MainHeader'

// RoadmapView lazy load (reactflow ~200KB)
const RoadmapView = lazy(() => import('../features/Main/roadmap/RoadmapView').then(m => ({ default: m.RoadmapView })))

// 대주제 필터 타입
export type TopicFilter = 'all' | (typeof mainCategories)[number]['id']

export function MainPage() {
    // ==================================== Hooks =====================================
    const navigate = useNavigate() // 네비게이션

    // ==================================== 전역 상태 =====================================
    const notes = useNoteStore((state) => state.notes) //노트 목록
    const isLoaded = useNoteStore((state) => state.isLoaded) // 노트 로드 완료 여부
    const loadNotes = useNoteStore((state) => state.loadNotes) // 노트 로드
    const createNote = useNoteStore((state) => state.createNote) // 노트 생성
    const resetSession = useStudySessionStore((state) => state.resetSession) // 세션 이탈
    const isActive = useStudySessionStore((state) => state.isActive) // 세션 활성화 여부

    // ==================================== 상태 관리 =====================================
    const [viewMode, setViewMode] = useState<ViewMode>('list') // 뷰 모드 (리스트 / 맵)
    const [topicFilter, setTopicFilter] = useState<TopicFilter>('all') // 대주제 필터 (전체 / CS / 프론트엔드 / 백엔드)
    const [searchQuery, setSearchQuery] = useState('') // 검색어
    const [tagFilter, setTagFilter] = useState<TagFilter>({}) // 태그 필터

    // 뷰 모드 변경 핸들러 (GA 추적 포함)
    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
        analytics.viewModeChange(mode)
    }

    // 토픽 필터 변경 핸들러 (GA 추적 포함)
    const handleTopicFilterChange = (filter: TopicFilter) => {
        setTopicFilter(filter)
        analytics.topicFilterChange(filter)
    }

    // ==================================== useEffect =====================================
    // 메인 페이지 진입 시 활성 세션이 있으면 이탈 처리 (통계에 저장 안 함)
    useEffect(() => {
        if (isActive) {
            resetSession()
        }
    }, [isActive, resetSession])

    // 노트 로드
    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    // ==================================== 상수 =====================================
    // 필터링된 카테고리 (메모이제이션)
    const filteredCategories = useMemo(() => {
        const topicCategories: Record<TopicFilter, readonly Category[]> = {
            all: categories,
            cs: mainCategories[0].categories,
            frontend: mainCategories[1].categories,
            backend: mainCategories[2].categories,
        }
        return [...topicCategories[topicFilter]]
    }, [topicFilter])

    // 검색어와 태그로 필터링된 노트
    const filteredNotes = useMemo(() => {
        let result = notes.filter((n) =>
            filteredCategories.includes(n.category as (typeof filteredCategories)[number])
        )

        // 태그 필터 적용 (system note의 tag만 해당)
        if (tagFilter.level) {
            result = result.filter((n) => n.tag?.level === tagFilter.level)
        }
        if (tagFilter.importance) {
            result = result.filter((n) => n.tag?.importance === tagFilter.importance)
        }
        if (tagFilter.interview) {
            result = result.filter((n) => n.tag?.interview === tagFilter.interview)
        }

        // 검색어가 있으면 제목으로 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter((n) => n.title.toLowerCase().includes(query))
        }

        return result
    }, [notes, filteredCategories, tagFilter, searchQuery])

    // 검색 핸들러
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query)
    }, [])

    // 태그 필터 핸들러
    const handleTagFilter = useCallback((filter: TagFilter) => {
        setTagFilter(filter)
    }, [])

    // ==================================== 핸들러 =====================================
    // 노트 생성
    const handleCreateNote = async (category: string) => {
        const noteId = await createNote(category)
        analytics.noteCreate(category)
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
                    onViewModeChange={handleViewModeChange}
                    topicFilter={topicFilter}
                    onTopicFilterChange={handleTopicFilterChange}
                />
                <div className="flex-1 min-h-0">
                    <Suspense fallback={<LoadingSpinner message="Loading roadmap..." size="lg" fullScreen />}>
                        <RoadmapView notes={filteredNotes} onNoteClick={handleNoteClick} topicFilter={topicFilter} />
                    </Suspense>
                </div>
            </div>
        )
    }

    // List 뷰
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <MainHeader
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                topicFilter={topicFilter}
                onTopicFilterChange={handleTopicFilterChange}
            />

            <div className="py-6 px-4 md:py-8 md:px-6">
                <div className="main-container mb-6">
                    <NoteSearch
                        onSearch={handleSearch}
                        onTagFilter={handleTagFilter}
                        tagFilter={tagFilter}
                        placeholder="노트 제목 검색..."
                    />
                </div>

                <div className="main-container mb-8">
                    <StudyCTABanner />
                </div>

                {isLoaded ? (
                    <ListView
                        notes={filteredNotes}
                        categories={filteredCategories}
                        onNoteClick={handleNoteClick}
                        onCreateNote={handleCreateNote}
                        showMainCategories={topicFilter === 'all'}
                    />
                ) : (
                    <div className="min-h-[80vh]" />
                )}
            </div>
        </div>
    )
}
