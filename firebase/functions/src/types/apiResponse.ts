// 클라이언트에 반환하는 가공 타입

// 클라이언트 응답 타입 (정답 포함)
// 단어 모드: blanks만 반환, blindedContent는 클라이언트에서 생성
export interface GenerateQuizResponse {
    quizId: string
    mode: 'word' | 'sentence' | 'essay'
    // 단어 모드용 blanks (키워드만, blindedContent는 클라이언트에서 생성)
    blanks?: {
        id: string
        answer: string
        hint: string
    }[]
    // 문장 모드용 questions (Q&A 형식)
    questions?: {
        id: string
        question: string
        answer: string
        hint: string
        keyPoints: string[]
    }[]
    // 서술형 모드 (한국 테크기업 면접 스타일)
    essay?: {
        company: string
        question: string
        questionType: string
        followUpQuestions: string[]
        expectedPoints: string[]
        answerGuide: string
    }
}