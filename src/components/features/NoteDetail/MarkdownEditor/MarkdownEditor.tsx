import { useState, useRef, useCallback, useEffect, useLayoutEffect, type KeyboardEvent } from 'react';

interface MarkdownEditorProps {
    initialContent: string;
    onChange: (content: string) => void;
    editable?: boolean;
}

interface Block {
    id: string;
    type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'numbered' | 'checkbox' | 'quote';
    content: string;
    checked?: boolean;
    number?: number;
}

// 마크다운 텍스트를 블록으로 파싱
function parseMarkdownToBlocks(markdown: string): Block[] {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let numberedCounter = 0;

    lines.forEach((line, idx) => {
        const id = `block-${idx}-${Date.now()}`;
        const trimmed = line.trimStart();

        if (trimmed.startsWith('### ')) {
            blocks.push({ id, type: 'h3', content: trimmed.slice(4) });
            numberedCounter = 0;
        } else if (trimmed.startsWith('## ')) {
            blocks.push({ id, type: 'h2', content: trimmed.slice(3) });
            numberedCounter = 0;
        } else if (trimmed.startsWith('# ')) {
            blocks.push({ id, type: 'h1', content: trimmed.slice(2) });
            numberedCounter = 0;
        } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
            blocks.push({ id, type: 'checkbox', content: trimmed.slice(6), checked: true });
            numberedCounter = 0;
        } else if (trimmed.startsWith('- [ ] ')) {
            blocks.push({ id, type: 'checkbox', content: trimmed.slice(6), checked: false });
            numberedCounter = 0;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            blocks.push({ id, type: 'bullet', content: trimmed.slice(2) });
            numberedCounter = 0;
        } else if (/^\d+\.\s/.test(trimmed)) {
            const match = trimmed.match(/^(\d+)\.\s(.*)$/);
            if (match) {
                numberedCounter++;
                blocks.push({ id, type: 'numbered', content: match[2], number: numberedCounter });
            }
        } else if (trimmed.startsWith('> ')) {
            blocks.push({ id, type: 'quote', content: trimmed.slice(2) });
            numberedCounter = 0;
        } else {
            blocks.push({ id, type: 'paragraph', content: line });
            if (trimmed === '') numberedCounter = 0;
        }
    });

    return blocks.length > 0 ? blocks : [{ id: 'block-0', type: 'paragraph', content: '' }];
}

// 블록들을 마크다운 텍스트로 변환
function blocksToMarkdown(blocks: Block[]): string {
    return blocks.map((block) => {
        switch (block.type) {
            case 'h1': return `# ${block.content}`;
            case 'h2': return `## ${block.content}`;
            case 'h3': return `### ${block.content}`;
            case 'bullet': return `- ${block.content}`;
            case 'numbered': return `${block.number}. ${block.content}`;
            case 'checkbox': return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
            case 'quote': return `> ${block.content}`;
            default: return block.content;
        }
    }).join('\n');
}

// 현재 커서 위치 가져오기
function getCursorPosition(element: HTMLElement): number {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;

    const range = sel.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
}

export function MarkdownEditor({ initialContent, onChange, editable = true }: MarkdownEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(() => parseMarkdownToBlocks(initialContent));
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const pendingFocusRef = useRef<{ blockId: string; position: 'start' | 'end' | number } | null>(null);
    const blockRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    // 초기 콘텐츠 변경시 블록 재파싱
    useEffect(() => {
        const newBlocks = parseMarkdownToBlocks(initialContent);
        setBlocks(newBlocks);
    }, [initialContent]);

    // 커서 위치 설정 헬퍼 함수
    const setCursorPosition = useCallback((el: HTMLElement, position: 'start' | 'end' | number) => {
        const range = document.createRange();
        const sel = window.getSelection();
        const textContent = el.textContent || '';

        if (typeof position === 'number') {
            const targetPos = Math.min(position, textContent.length);
            if (el.childNodes.length > 0 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                range.setStart(el.childNodes[0], targetPos);
            } else {
                range.setStart(el, 0);
            }
            range.collapse(true);
        } else if (position === 'end' && textContent.length > 0) {
            if (el.childNodes.length > 0) {
                const lastChild = el.childNodes[el.childNodes.length - 1];
                if (lastChild.nodeType === Node.TEXT_NODE) {
                    range.setStart(lastChild, lastChild.textContent?.length || 0);
                } else {
                    range.selectNodeContents(el);
                    range.collapse(false);
                }
            } else {
                range.setStart(el, 0);
            }
            range.collapse(true);
        } else {
            range.setStart(el, 0);
            range.collapse(true);
        }
        sel?.removeAllRanges();
        sel?.addRange(range);
    }, []);

    // blocks 변경 후 pendingFocus 처리
    useLayoutEffect(() => {
        if (pendingFocusRef.current) {
            const pending = pendingFocusRef.current;
            pendingFocusRef.current = null;

            const el = blockRefs.current.get(pending.blockId);
            if (el) {
                el.focus();
                setCursorPosition(el, pending.position);
            }
        }
    }, [blocks, setCursorPosition]);

    const handleBlockFocus = useCallback((blockId: string) => {
        setFocusedBlockId(blockId);
    }, []);

    const handleBlockInput = useCallback((blockId: string, e: React.FormEvent<HTMLDivElement>) => {
        const newContent = e.currentTarget.textContent || '';
        setBlocks(prev => {
            const newBlocks = prev.map(b =>
                b.id === blockId ? { ...b, content: newContent } : b
            );
            onChange(blocksToMarkdown(newBlocks));
            return newBlocks;
        });
    }, [onChange]);

    const handleKeyDown = useCallback((blockId: string, e: KeyboardEvent<HTMLDivElement>) => {
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        const block = blocks[blockIndex];
        const el = blockRefs.current.get(blockId);

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const content = el?.textContent || '';
            const cursorPos = el ? getCursorPosition(el) : content.length;

            // 마크다운 문법 감지 및 변환
            let newBlockType: Block['type'] = 'paragraph';
            let transformedContent = content;
            let shouldTransform = false;

            if (content.startsWith('### ')) {
                newBlockType = 'h3';
                transformedContent = content.slice(4);
                shouldTransform = true;
            } else if (content.startsWith('## ')) {
                newBlockType = 'h2';
                transformedContent = content.slice(3);
                shouldTransform = true;
            } else if (content.startsWith('# ')) {
                newBlockType = 'h1';
                transformedContent = content.slice(2);
                shouldTransform = true;
            } else if (content.startsWith('- [ ] ')) {
                newBlockType = 'checkbox';
                transformedContent = content.slice(6);
                shouldTransform = true;
            } else if (content.startsWith('- [x] ') || content.startsWith('- [X] ')) {
                newBlockType = 'checkbox';
                transformedContent = content.slice(6);
                shouldTransform = true;
            } else if (content.startsWith('- ') || content.startsWith('* ')) {
                newBlockType = 'bullet';
                transformedContent = content.slice(2);
                shouldTransform = true;
            } else if (/^\d+\.\s/.test(content)) {
                const match = content.match(/^\d+\.\s(.*)$/);
                if (match) {
                    newBlockType = 'numbered';
                    transformedContent = match[1];
                    shouldTransform = true;
                }
            } else if (content.startsWith('> ')) {
                newBlockType = 'quote';
                transformedContent = content.slice(2);
                shouldTransform = true;
            }

            if (shouldTransform) {
                const newBlocks = [...blocks];
                newBlocks[blockIndex] = {
                    ...block,
                    type: newBlockType,
                    content: transformedContent,
                    checked: newBlockType === 'checkbox' ? (content.includes('[x]') || content.includes('[X]')) : undefined,
                    number: newBlockType === 'numbered' ? (blockIndex + 1) : undefined,
                };

                const newBlock: Block = {
                    id: `block-${Date.now()}`,
                    type: newBlockType === 'bullet' ? 'bullet' :
                          newBlockType === 'numbered' ? 'numbered' :
                          newBlockType === 'checkbox' ? 'checkbox' : 'paragraph',
                    content: '',
                    checked: newBlockType === 'checkbox' ? false : undefined,
                    number: newBlockType === 'numbered' ? (blockIndex + 2) : undefined,
                };
                newBlocks.splice(blockIndex + 1, 0, newBlock);

                pendingFocusRef.current = { blockId: newBlock.id, position: 'start' };
                setBlocks(newBlocks);
                onChange(blocksToMarkdown(newBlocks));
            } else {
                const beforeCursor = content.slice(0, cursorPos);
                const afterCursor = content.slice(cursorPos);

                if (block.type === 'bullet' || block.type === 'numbered' || block.type === 'checkbox') {
                    if (content === '') {
                        const newBlocks = [...blocks];
                        newBlocks[blockIndex] = { ...block, type: 'paragraph' };
                        setBlocks(newBlocks);
                        onChange(blocksToMarkdown(newBlocks));
                    } else {
                        const newBlocks = [...blocks];
                        newBlocks[blockIndex] = { ...block, content: beforeCursor };

                        const newBlock: Block = {
                            id: `block-${Date.now()}`,
                            type: block.type,
                            content: afterCursor,
                            checked: block.type === 'checkbox' ? false : undefined,
                            number: block.type === 'numbered' ? (block.number || 0) + 1 : undefined,
                        };
                        newBlocks.splice(blockIndex + 1, 0, newBlock);

                        // 현재 블록 DOM 업데이트
                        if (el) el.textContent = beforeCursor;

                        pendingFocusRef.current = { blockId: newBlock.id, position: 'start' };
                        setBlocks(newBlocks);
                        onChange(blocksToMarkdown(newBlocks));
                    }
                } else {
                    const newBlocks = [...blocks];
                    newBlocks[blockIndex] = { ...block, content: beforeCursor };

                    const newBlock: Block = {
                        id: `block-${Date.now()}`,
                        type: 'paragraph',
                        content: afterCursor,
                    };
                    newBlocks.splice(blockIndex + 1, 0, newBlock);

                    // 현재 블록 DOM 업데이트
                    if (el) el.textContent = beforeCursor;

                    pendingFocusRef.current = { blockId: newBlock.id, position: 'start' };
                    setBlocks(newBlocks);
                    onChange(blocksToMarkdown(newBlocks));
                }
            }
        } else if (e.key === 'Backspace') {
            const cursorPos = el ? getCursorPosition(el) : 0;
            const currentContent = el?.textContent || '';

            if (currentContent === '' && blocks.length > 1) {
                e.preventDefault();
                if (block.type !== 'paragraph') {
                    const newBlocks = [...blocks];
                    newBlocks[blockIndex] = { ...block, type: 'paragraph' };
                    setBlocks(newBlocks);
                    onChange(blocksToMarkdown(newBlocks));
                } else {
                    const newBlocks = blocks.filter(b => b.id !== blockId);
                    if (blockIndex > 0) {
                        pendingFocusRef.current = { blockId: blocks[blockIndex - 1].id, position: 'end' };
                    }
                    setBlocks(newBlocks);
                    onChange(blocksToMarkdown(newBlocks));
                }
            } else if (cursorPos === 0 && blockIndex > 0) {
                e.preventDefault();
                const prevBlock = blocks[blockIndex - 1];
                const prevEl = blockRefs.current.get(prevBlock.id);
                const prevContent = prevEl?.textContent || '';
                const cursorTargetPos = prevContent.length;

                const newBlocks = [...blocks];
                newBlocks[blockIndex - 1] = {
                    ...prevBlock,
                    content: prevContent + currentContent,
                };
                newBlocks.splice(blockIndex, 1);

                // 이전 블록 DOM 직접 업데이트
                if (prevEl) {
                    prevEl.textContent = prevContent + currentContent;
                }

                pendingFocusRef.current = { blockId: prevBlock.id, position: cursorTargetPos };
                setBlocks(newBlocks);
                onChange(blocksToMarkdown(newBlocks));
            }
        } else if (e.key === 'ArrowUp') {
            if (blockIndex > 0) {
                const cursorPos = el ? getCursorPosition(el) : 0;
                if (cursorPos === 0) {
                    e.preventDefault();
                    const prevBlockId = blocks[blockIndex - 1].id;
                    const prevEl = blockRefs.current.get(prevBlockId);
                    if (prevEl) {
                        prevEl.focus();
                        setCursorPosition(prevEl, 'end');
                    }
                }
            }
        } else if (e.key === 'ArrowDown') {
            if (blockIndex < blocks.length - 1) {
                const cursorPos = el ? getCursorPosition(el) : 0;
                const textLength = el?.textContent?.length || 0;
                if (cursorPos >= textLength) {
                    e.preventDefault();
                    const nextBlockId = blocks[blockIndex + 1].id;
                    const nextEl = blockRefs.current.get(nextBlockId);
                    if (nextEl) {
                        nextEl.focus();
                        setCursorPosition(nextEl, 'start');
                    }
                }
            }
        }
    }, [blocks, onChange, setCursorPosition]);

    const handleCheckToggle = useCallback((blockId: string) => {
        setBlocks(prev => {
            const newBlocks = prev.map(b =>
                b.id === blockId ? { ...b, checked: !b.checked } : b
            );
            onChange(blocksToMarkdown(newBlocks));
            return newBlocks;
        });
    }, [onChange]);

    const getBlockStyle = (type: Block['type']): React.CSSProperties => {
        const base: React.CSSProperties = {
            outline: 'none',
            minHeight: '1.5em',
        };

        switch (type) {
            case 'h1':
                return { ...base, fontSize: '28px', fontWeight: 'var(--font-weight-bold)', marginTop: '24px', marginBottom: '12px' };
            case 'h2':
                return { ...base, fontSize: '22px', fontWeight: 'var(--font-weight-bold)', marginTop: '20px', marginBottom: '10px' };
            case 'h3':
                return { ...base, fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', marginTop: '16px', marginBottom: '8px' };
            case 'quote':
                return { ...base, borderLeft: '3px solid var(--accent)', paddingLeft: '16px', marginBottom: '8px', color: 'var(--text-secondary)', fontStyle: 'italic' };
            case 'paragraph':
                return { ...base, marginBottom: '8px' };
            default:
                return base;
        }
    };

    return (
        <div
            style={{
                width: '100%',
                minHeight: '200px',
                fontSize: '17px',
                lineHeight: '1.85',
                color: 'var(--text-primary)',
            }}
        >
            <style>{`
                [data-placeholder]:empty::before {
                    content: attr(data-placeholder);
                    color: var(--text-tertiary);
                    pointer-events: none;
                }
            `}</style>
            {blocks.map((block) => {
                const isFocused = focusedBlockId === block.id;
                // 커서가 있는 빈 블록에만 placeholder 표시
                const showPlaceholder = block.type === 'paragraph' && !block.content && isFocused;

                if (block.type === 'bullet' || block.type === 'numbered' || block.type === 'checkbox') {
                    return (
                        <div key={block.id} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                            {block.type === 'bullet' && (
                                <span style={{ color: 'var(--text-secondary)', userSelect: 'none' }}>•</span>
                            )}
                            {block.type === 'numbered' && (
                                <span style={{ color: 'var(--text-secondary)', minWidth: '20px', userSelect: 'none' }}>{block.number}.</span>
                            )}
                            {block.type === 'checkbox' && (
                                <span
                                    onClick={() => editable && handleCheckToggle(block.id)}
                                    style={{
                                        cursor: editable ? 'pointer' : 'default',
                                        userSelect: 'none',
                                        color: block.checked ? 'var(--accent)' : 'var(--text-tertiary)'
                                    }}
                                >
                                    {block.checked ? '☑' : '☐'}
                                </span>
                            )}
                            <div
                                ref={(el) => { blockRefs.current.set(block.id, el); }}
                                contentEditable={editable}
                                suppressContentEditableWarning
                                onFocus={() => handleBlockFocus(block.id)}
                                onInput={(e) => handleBlockInput(block.id, e)}
                                onKeyDown={(e) => handleKeyDown(block.id, e)}
                                style={{
                                    ...getBlockStyle(block.type),
                                    flex: 1,
                                    textDecoration: block.type === 'checkbox' && block.checked ? 'line-through' : 'none',
                                    color: block.type === 'checkbox' && block.checked ? 'var(--text-tertiary)' : 'inherit',
                                }}
                            >
                                {isFocused ? block.content : block.content}
                            </div>
                        </div>
                    );
                }

                return (
                    <div
                        key={block.id}
                        ref={(el) => { blockRefs.current.set(block.id, el); }}
                        contentEditable={editable}
                        suppressContentEditableWarning
                        onFocus={() => handleBlockFocus(block.id)}
                        onInput={(e) => handleBlockInput(block.id, e)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        style={getBlockStyle(block.type)}
                        data-placeholder={showPlaceholder ? "내용을 입력하세요..." : undefined}
                    >
                        {block.content}
                    </div>
                );
            })}
        </div>
    );
}
