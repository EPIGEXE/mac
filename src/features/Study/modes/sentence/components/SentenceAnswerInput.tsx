/**
 * 문장 모드 답변 입력 컴포넌트
 * - 모던한 Q&A 베이스 + 터미널/코드 에디터 포인트
 */
import { useRef, useEffect } from 'react'
import type { SentenceQuestionInfo } from '../../../types'

interface SentenceAnswerInputProps {
    question: SentenceQuestionInfo // 질문 정보
    index: number // 질문 인덱스
    value: string // 답변 값
    onChange: (value: string) => void // 답변 변경 함수
    isFocused: boolean // 포커스 상태
    onFocus: () => void // 포커스 함수
}

export function SentenceAnswerInput({
    question,
    index,
    value,
    onChange,
    isFocused,
    onFocus,
}: SentenceAnswerInputProps) {
    // ================================ Ref ================================
    const inputRef = useRef<HTMLTextAreaElement>(null) // 입력창 참조, 포커스 관리용

    // ================================ 상수 ================================
    // 글자 수 제한
    const MIN_LENGTH = 20
    const MAX_LENGTH = 200

    // 글자 수 상태
    const charCount = value.length
    const isUnderMin = charCount > 0 && charCount < MIN_LENGTH
    const isNearMax = charCount >= MAX_LENGTH - 20
    const isAtMax = charCount >= MAX_LENGTH

    // ================================ useEffect ================================
    // 포커스 상태 변경 시 입력창 포커스
    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isFocused])

    // ================================ 유틸 함수 ================================
    // 자동 높이 조절
    const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
        // 최대 글자 수 제한
        if (e.target.value.length <= MAX_LENGTH) {
            onChange(e.target.value)
        }
    }

    return (
        <div
            className={`
            relative border transition-all duration-200
            ${
                isFocused
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'border-[var(--border-light)] bg-[var(--bg-paper)] hover:border-[var(--text-tertiary)]'
            }
        `}
        >
            {/* 질문 영역 */}
            <div className="p-4 border-b border-dashed border-[var(--border-light)]">
                {/* 질문 헤더 */}
                <div className="flex items-center gap-3 mb-2">
                    <span
                        className={`
                        font-mono text-xs px-2 py-0.5
                        ${
                            isFocused
                                ? 'bg-[var(--accent)] text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                        }
                    `}
                    >
                        Q{String(index + 1).padStart(2, '0')}
                    </span>
                    {question.hint && (
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)]">// {question.hint}</span>
                    )}
                </div>
                {/* 질문 텍스트 */}
                <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">{question.question}</p>
            </div>

            {/* 답변 영역 */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* 프롬프트 */}
                    <span
                        className={`
                        font-mono text-sm mt-2 select-none transition-colors
                        ${isFocused ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}
                    `}
                    >
                        {'>'}
                    </span>
                    {/* 입력 필드 */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={value}
                            onChange={adjustHeight}
                            onFocus={onFocus}
                            placeholder="답변을 입력하세요..."
                            rows={2}
                            className="
                                w-full px-0 py-2
                                text-[15px] leading-relaxed
                                bg-transparent border-none
                                text-[var(--text-primary)]
                                placeholder:text-[var(--text-tertiary)]/50
                                focus:outline-none
                                resize-none overflow-hidden
                            "
                            style={{ minHeight: '52px' }}
                        />
                        {/* 커서 (빈 입력 + 포커스) */}
                        {isFocused && value.length === 0 && (
                            <span className="absolute left-0 top-2 w-0.5 h-6 bg-[var(--accent)] animate-pulse" />
                        )}
                    </div>
                </div>

                {/* 상태 바 */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-light)]">
                    {/* 가이드 */}
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                        {MIN_LENGTH}~{MAX_LENGTH}자 권장
                    </span>
                    {/* 글자 수 */}
                    <span
                        className={`
                        font-mono text-[10px] transition-colors
                        ${
                            isAtMax
                                ? 'text-[var(--error)]'
                                : isNearMax
                                  ? 'text-[var(--warning)]'
                                  : isUnderMin
                                    ? 'text-[var(--text-tertiary)]'
                                    : charCount >= MIN_LENGTH
                                      ? 'text-[var(--success)]'
                                      : 'text-[var(--text-tertiary)]'
                        }
                    `}
                    >
                        {charCount > 0 ? `${charCount}/${MAX_LENGTH}` : 'empty'}
                    </span>
                </div>
            </div>
        </div>
    )
}
