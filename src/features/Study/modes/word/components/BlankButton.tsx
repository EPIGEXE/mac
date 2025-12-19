export interface BlankButtonProps {
    blankNum: string // Blank의 번호 (BLANK_1, BLANK_2, ...)
    correctAnswer: string // 정답
    userAnswer: string | undefined // 사용자 답변
    result: boolean | null // Blank의 채점 결과
    currentBlankStringId: string | null // 현재 선택된 Blank의 String ID (BLANK_1, BLANK_2, ...)
    onBlankClick: (blankId: string) => void // Blank 클릭 핸들러
}

export function BlankButton({
    blankNum,
    correctAnswer,
    userAnswer,
    result,
    currentBlankStringId,
    onBlankClick,
}: BlankButtonProps) {
    // ================================ 상수 ================================
    const isCurrent = currentBlankStringId === blankNum // Blank가 선택됬는지
    const isAnswered = userAnswer !== undefined && userAnswer.length > 0 // Blank가 답변됬는지
    const isCorrect = result === true // Blank가 정답인지
    const isWrong = result === false // Blank가 오답인지

    // blankNum에서 번호 추출 (BLANK_1 -> B01)
    const blankIndex = blankNum.replace('BLANK_', '')
    const displayNum = `B${blankIndex.padStart(2, '0')}`

    let bgClass = 'bg-[var(--bg-secondary)]'
    let borderClass = 'border-[var(--border-medium)]'
    let textClass = 'text-[var(--text-tertiary)]'

    if (isCurrent) {
        borderClass = 'border-[var(--accent)]'
        bgClass = 'bg-[var(--accent)]/10'
    }

    if (isCorrect) {
        bgClass = 'bg-green-500/15'
        borderClass = 'border-green-500'
        textClass = 'text-green-600'
    } else if (isWrong) {
        bgClass = 'bg-red-500/15'
        borderClass = 'border-red-500'
        textClass = 'text-red-500'
    } else if (isAnswered) {
        textClass = 'text-[var(--text-primary)]'
        bgClass = 'bg-[var(--bg-hover)]'
    }

    // 표시할 텍스트 결정
    // 채점 완료: 정답 표시
    // 미채점 + 답변: 사용자 답변 표시
    // 미답변: 번호 표시
    const displayText = isAnswered ? correctAnswer : displayNum ;

    return (
        <button
            onClick={() => onBlankClick(blankNum)}
            className={`
                inline-flex items-center justify-center
                min-w-[80px] px-3 py-1 mx-0.5
                border-2 border-dashed rounded
                font-mono text-sm
                cursor-pointer transition-all duration-150
                ${bgClass} ${borderClass} ${textClass}
                hover:border-[var(--accent)] hover:bg-[var(--accent)]/5
                focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30
            `}
        >
            <span className={result !== null || isAnswered ? 'font-medium' : 'opacity-80 text-xs'}>
                {displayText}
            </span>
        </button>
    )
}
