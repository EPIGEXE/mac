import { useState, useCallback, useRef, useEffect } from 'react';
import { IconSun, IconMoon, IconArrowLeft } from '@tabler/icons-react';
import type { Note } from '../lib/db';
import { MarkdownEditor, MarkdownViewer } from '../components/features/NoteDetail/MarkdownEditor';

interface NoteDetailPageProps {
    note: Note;
    theme: 'light' | 'dark';
    onThemeToggle: () => void;
    onClose: () => void;
    onUpdate: (updates: Partial<Omit<Note, 'id'>>) => void;
    onDelete: () => void;
    isEditing: boolean;
    onEditingChange: (editing: boolean) => void;
}

type Difficulty = 'word' | 'sentence' | 'paragraph';

// 터미널 스타일 버튼 컴포넌트
function TerminalButton({
    children,
    onClick,
    active = false,
    variant = 'default',
}: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    variant?: 'default' | 'accent' | 'danger';
}) {
    const getColors = () => {
        if (active) {
            return { color: 'var(--accent)', borderColor: 'var(--accent)' };
        }
        if (variant === 'danger') {
            return { color: 'var(--warning)', borderColor: 'var(--border-light)' };
        }
        return { color: 'var(--text-tertiary)', borderColor: 'var(--border-light)' };
    };

    const colors = getColors();

    return (
        <button
            onClick={onClick}
            style={{
                background: 'none',
                border: `1px solid ${colors.borderColor}`,
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: colors.color,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = variant === 'danger' ? 'var(--warning)' : 'var(--accent)';
                e.currentTarget.style.color = variant === 'danger' ? 'var(--warning)' : 'var(--accent)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.borderColor;
                e.currentTarget.style.color = colors.color;
            }}
        >
            {children}
        </button>
    );
}

export function NoteDetailPage({
    note,
    theme,
    onThemeToggle,
    onClose,
    onUpdate,
    onDelete,
    isEditing,
    onEditingChange,
}: NoteDetailPageProps) {
    const [isBlindMode, setIsBlindMode] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('word');
    const [title, setTitle] = useState(note.title);
    const [pendingContent, setPendingContent] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(note.title);
    }, [note.title]);

    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

    const handleContentChange = useCallback((content: string) => {
        setPendingContent(content);
    }, []);

    const handleSave = useCallback(() => {
        const updates: Partial<Omit<Note, 'id'>> = {
            title: title.trim() || '제목 없음',
        };
        if (pendingContent !== null) {
            updates.content = pendingContent;
        }
        onUpdate(updates);
        onEditingChange(false);
        setPendingContent(null);
    }, [title, pendingContent, onUpdate, onEditingChange]);

    const handleDelete = useCallback(() => {
        if (window.confirm('정말로 이 노트를 삭제하시겠습니까?')) {
            onDelete();
        }
    }, [onDelete]);

    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-primary)',
            }}
        >
            {/* Top bar - 터미널 스타일 */}
            <header
                style={{
                    borderBottom: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-paper)',
                }}
            >
                <div
                    style={{
                        maxWidth: '1000px',
                        margin: '0 auto',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                {/* 좌측: 뒤로가기 */}
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '8px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                >
                    <IconArrowLeft size={16} />
                    {'<'} back
                </button>

                {/* 우측: 컨트롤 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Blind 모드 컨트롤 - 뷰 모드에서만 */}
                    {!isEditing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* 난이도 선택 - 터미널 스타일 */}
                            <span
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    marginRight: '4px',
                                }}
                            >
                                level:
                            </span>
                            {(['word', 'sentence', 'paragraph'] as const).map((level, idx) => (
                                <span key={level} style={{ display: 'flex', alignItems: 'center' }}>
                                    {idx > 0 && (
                                        <span
                                            style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '12px',
                                                color: 'var(--text-tertiary)',
                                                margin: '0 2px',
                                            }}
                                        >
                                            |
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setDifficulty(level)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: '4px 8px',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '12px',
                                            color: difficulty === level ? 'var(--accent)' : 'var(--text-tertiary)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                        }}
                                    >
                                        {level === 'word' ? 'w' : level === 'sentence' ? 's' : 'p'}
                                        {difficulty === level && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '0',
                                                    left: '8px',
                                                    right: '8px',
                                                    height: '1px',
                                                    backgroundColor: 'var(--accent)',
                                                }}
                                            />
                                        )}
                                    </button>
                                </span>
                            ))}

                            {/* Blind 토글 */}
                            <span
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    margin: '0 8px 0 16px',
                                }}
                            >
                                blind:
                            </span>
                            <button
                                onClick={() => setIsBlindMode(!isBlindMode)}
                                style={{
                                    background: 'none',
                                    border: `1px solid ${isBlindMode ? 'var(--accent)' : 'var(--border-light)'}`,
                                    padding: '4px 10px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                    color: isBlindMode ? 'var(--accent)' : 'var(--text-tertiary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {isBlindMode ? 'ON' : 'OFF'}
                            </button>

                            {/* 구분선 */}
                            <div
                                style={{
                                    width: '1px',
                                    height: '20px',
                                    backgroundColor: 'var(--border-light)',
                                    margin: '0 8px',
                                }}
                            />
                        </div>
                    )}

                    {/* 편집/저장 버튼 */}
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <TerminalButton onClick={handleSave} active>
                                :w save
                            </TerminalButton>
                            <TerminalButton
                                onClick={() => {
                                    setTitle(note.title);
                                    setPendingContent(null);
                                    onEditingChange(false);
                                }}
                            >
                                :q cancel
                            </TerminalButton>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <TerminalButton onClick={() => onEditingChange(true)}>
                                :e edit
                            </TerminalButton>
                            <TerminalButton onClick={handleDelete} variant="danger">
                                :d delete
                            </TerminalButton>
                        </div>
                    )}

                    {/* 테마 토글 */}
                    <button
                        onClick={onThemeToggle}
                        style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid var(--border-light)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.color = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-light)';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                    >
                        {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
                    </button>
                </div>
                </div>
            </header>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                }}
            >
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
                    {/* 카테고리 - 터미널 스타일 */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '20px',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px',
                                color: 'var(--accent)',
                            }}
                        >
                            #
                        </span>
                        <span
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            {note.category}
                        </span>
                    </div>

                    {/* 제목 */}
                    {isEditing ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            style={{
                                width: '100%',
                                fontFamily: 'var(--font-display)',
                                fontSize: '32px',
                                fontWeight: 'var(--font-weight-regular)',
                                color: 'var(--text-primary)',
                                marginBottom: '24px',
                                lineHeight: '1.3',
                                letterSpacing: '0.02em',
                                border: 'none',
                                borderBottom: '1px solid var(--border-light)',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                paddingBottom: '12px',
                            }}
                        />
                    ) : (
                        <h1
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '32px',
                                fontWeight: 'var(--font-weight-regular)',
                                color: 'var(--text-primary)',
                                marginBottom: '24px',
                                lineHeight: '1.3',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {note.title}
                        </h1>
                    )}

                    {/* 태그 - 터미널 스타일 */}
                    {note.tags.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                marginBottom: '32px',
                                flexWrap: 'wrap',
                            }}
                        >
                            {note.tags.map((tag) => (
                                <span
                                    key={tag}
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '12px',
                                        color: 'var(--text-tertiary)',
                                    }}
                                >
                                    @{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 구분선 */}
                    <div
                        style={{
                            borderTop: '1px dashed var(--border-light)',
                            marginBottom: '32px',
                        }}
                    />

                    {/* 콘텐츠 */}
                    {isEditing ? (
                        <MarkdownEditor
                            initialContent={note.content || ''}
                            onChange={handleContentChange}
                            editable={true}
                        />
                    ) : (
                        <article
                            style={{
                                fontFamily: 'var(--font-system)',
                                fontSize: '16px',
                                lineHeight: '1.8',
                                color: 'var(--text-primary)',
                                letterSpacing: '0.01em',
                            }}
                        >
                            {note.content ? (
                                <MarkdownViewer
                                    content={note.content}
                                    isBlindMode={isBlindMode}
                                    difficulty={difficulty}
                                />
                            ) : (
                                <p
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '14px',
                                        color: 'var(--text-tertiary)',
                                    }}
                                >
                                    // 내용이 없습니다
                                </p>
                            )}
                        </article>
                    )}
                </div>
            </div>
        </div>
    );
}
