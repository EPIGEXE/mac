import type { Category, NoteTag } from '../../data/categories'

/**
 * 제공 문서 (System Notes) - 앱에서 기본 제공하는 문서
 */
export interface SystemNote {
    id: string // 고정 ID (예: "js-closure-001")
    version: number // 패치 버전
    title: string
    content: string // 마크다운
    firstLine?: string // 콘텐츠 첫 줄 (리스트 미리보기용, 로드 시 자동 생성)
    category: Category // 타입 안전한 카테고리
    tag: NoteTag // 태그 (난이도/중요도/면접빈출도)
    order: number // 정렬 순서
    createdAt: number
}

/**
 * 사용자 문서 (User Notes) - 사용자가 직접 생성한 문서
 */
export interface UserNote {
    id: string // UUID
    title: string
    content: string // 마크다운
    firstLine: string // 콘텐츠 첫 줄 (리스트 미리보기용)
    category: string
    tags: string[]
    createdAt: number
    updatedAt: number
}

/**
 * 제공 문서 커스터마이징 (User Overrides)
 * - 제공 문서를 사용자가 수정하면 여기에 저장
 * - 원본은 보존되고, 이 레이어가 덮어씀
 */
export interface UserOverride {
    systemNoteId: string // PK, SystemNote.id 참조
    customTitle: string | null
    customContent: string | null
    updatedAt: number
}

// ============================================================================
// StudyRecord - 모드별 학습 기록
// ============================================================================

export type StudyModeType = 'word' | 'sentence' | 'essay';
export type NoteType = 'system' | 'user';

/** 공통 필드 */
interface StudyRecordBase {
    id: string
    noteId: string
    noteType: NoteType
    sessionId: string
    mode: StudyModeType
    totalQuestions: number
    correctCount: number
    wrongCount: number
    score: number // 0-100
    duration: number // 초
    createdAt: number
    completedAt: number | null
}

/** 단어 모드 - 빈칸 채우기 상세 */
export interface WordBlankDetail {
    blankId: string
    answer: string // 정답
    userAnswer: string // 사용자 입력
    isCorrect: boolean
    hint: string
}

export interface WordStudyRecord extends StudyRecordBase {
    mode: 'word'
    details: {
        blanks: WordBlankDetail[]
    }
}

/** 문장 모드 - Q&A 상세 */
export interface SentenceQuestionDetail {
    questionId: string
    question: string
    answer: string // 모범 답안
    userAnswer: string
    isCorrect: boolean
    score: number // 개별 점수
    keyPoints: string[]
    matchedPoints: string[]
    missedPoints: string[]
    feedback: string
}

export interface SentenceStudyRecord extends StudyRecordBase {
    mode: 'sentence'
    details: {
        questions: SentenceQuestionDetail[]
        totalScore: number
        overallFeedback: string
    }
}

/** 서술형 모드 - 면접 상세 (실무 시나리오 기반) */
export interface EssayStudyRecord extends StudyRecordBase {
    mode: 'essay'
    details: {
        company: string
        question: string
        questionType: string
        userAnswer: string
        score: number
        grade: 'PASS' | 'BORDERLINE' | 'NEEDS_WORK'
        analysis: {
            situationUnderstanding: string
            solutionQuality: string
            technicalAccuracy: string
            depthOfThinking: string
        }
        matchedPoints: string[]
        missedPoints: string[]
        strengths: string[]
        improvements: string[]
        feedback: string
        betterAnswer: string
    }
}

/** Union 타입 */
export type StudyRecord = WordStudyRecord | SentenceStudyRecord | EssayStudyRecord

// ============================================================================
// WeakPoint - 모드별 취약점
// ============================================================================

/** 공통 필드 */
interface WeakPointBase {
    id: string
    noteId: string
    noteType: NoteType
    mode: StudyModeType
    wrongCount: number // 틀린 횟수
    lastWrongAt: number
    isResolved: boolean // 사용자가 수동으로 해제
    createdAt: number
}

/** 단어 모드 취약점 */
export interface WordWeakPoint extends WeakPointBase {
    mode: 'word'
    keyword: string // 틀린 키워드
    hint: string
    wrongAnswers: string[] // 틀린 답변 이력 (최근 5개)
}

/** 문장 모드 취약점 */
export interface SentenceWeakPoint extends WeakPointBase {
    mode: 'sentence'
    questionId: string
    question: string
    correctAnswer: string
    keyPoints: string[]
    lastMissedPoints: string[] // 마지막 놓친 포인트
}

/** 서술형 모드 취약점 */
export interface EssayWeakPoint extends WeakPointBase {
    mode: 'essay'
    company: string
    question: string
    questionType: string
    expectedPoints: string[]
    lastMissedPoints: string[] // 마지막 놓친 포인트
}

/** Union 타입 */
export type WeakPoint = WordWeakPoint | SentenceWeakPoint | EssayWeakPoint

// ============================================================================
// StudySession - 학습 세션
// ============================================================================

/** 세션 요약 */
export interface SessionSummary {
    totalNotes: number
    completedNotes: number
    totalQuestions: number
    correctCount: number
    wrongCount: number
    averageScore: number
}

/** 학습 세션 */
export interface StudySession {
    id: string
    mode: StudyModeType
    order: 'sequential' | 'random'
    noteIds: string[]

    // 시간
    startedAt: number
    endedAt: number | null
    totalDuration: number // 초

    // 결과 요약
    summary: SessionSummary | null
}

/**
 * 이미지 Blob 저장
 */
export interface ImageBlob {
    id: string // UUID
    blob: Blob // 실제 이미지 데이터
    mimeType: string // 'image/png', 'image/jpeg' 등
    size: number // 파일 크기 (바이트)
    noteId?: string // 연결된 노트 ID (orphan cleanup용)
    createdAt: number
}


/**
 * 통합 Note 타입 (UI에서 사용)
 */
export interface Note {
    id: string;
    type: 'system' | 'user';
    title: string;
    content: string;
    firstLine: string;       // 콘텐츠 첫 줄 (리스트 미리보기용)
    category: string;
    tag?: NoteTag;           // system note의 태그
    isCustomized: boolean;   // system이고 override 있으면 true
    originalTitle?: string;  // 커스터마이징된 경우 원본
    originalContent?: string;
    createdAt: number;
    updatedAt?: number;
    order?: number;          // system note의 정렬 순서
}