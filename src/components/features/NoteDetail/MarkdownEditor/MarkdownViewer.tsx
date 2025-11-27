import React from 'react';

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

// 인라인 스타일 파싱
function parseInlineStyles(text: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/s);
        if (boldMatch) {
            if (boldMatch[1]) result.push(<span key={key++}>{boldMatch[1]}</span>);
            result.push(<strong key={key++} style={{ fontWeight: 'var(--font-weight-bold)' }}>{boldMatch[2]}</strong>);
            remaining = boldMatch[3];
            continue;
        }

        const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)$/s);
        if (italicMatch) {
            if (italicMatch[1]) result.push(<span key={key++}>{italicMatch[1]}</span>);
            result.push(<em key={key++}>{italicMatch[2]}</em>);
            remaining = italicMatch[3];
            continue;
        }

        const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)$/s);
        if (codeMatch) {
            if (codeMatch[1]) result.push(<span key={key++}>{codeMatch[1]}</span>);
            result.push(
                <code
                    key={key++}
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        fontFamily: 'monospace',
                    }}
                >
                    {codeMatch[2]}
                </code>
            );
            remaining = codeMatch[3];
            continue;
        }

        result.push(<span key={key++}>{remaining}</span>);
        break;
    }

    return result.length > 0 ? result : [<span key={0}>{text}</span>];
}

// 마크다운 뷰어 (Blind 모드 지원)
interface MarkdownViewerProps {
    content: string;
    isBlindMode?: boolean;
    difficulty?: 'word' | 'sentence' | 'paragraph';
}

export function MarkdownViewer({ content, isBlindMode = false }: MarkdownViewerProps) {
    const blocks = parseMarkdownToBlocks(content);

    const applyBlind = (node: React.ReactNode, key: string) => {
        if (!isBlindMode) return node;
        return (
            <span
                key={key}
                style={{
                    filter: 'blur(4px)',
                    userSelect: 'none',
                    cursor: 'pointer',
                    transition: 'filter 0.15s ease',
                }}
                onClick={(e) => {
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.userSelect = 'text';
                }}
            >
                {node}
            </span>
        );
    };

    const renderBlock = (block: Block, index: number) => {
        const blockContent = parseInlineStyles(block.content);
        const key = `view-${index}`;

        switch (block.type) {
            case 'h1':
                return (
                    <div key={key} style={{ fontSize: '28px', fontWeight: 'var(--font-weight-bold)', marginTop: '24px', marginBottom: '12px' }}>
                        {applyBlind(blockContent, key)}
                    </div>
                );
            case 'h2':
                return (
                    <div key={key} style={{ fontSize: '22px', fontWeight: 'var(--font-weight-bold)', marginTop: '20px', marginBottom: '10px' }}>
                        {applyBlind(blockContent, key)}
                    </div>
                );
            case 'h3':
                return (
                    <div key={key} style={{ fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', marginTop: '16px', marginBottom: '8px' }}>
                        {applyBlind(blockContent, key)}
                    </div>
                );
            case 'bullet':
                return (
                    <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>•</span>
                        <span>{applyBlind(blockContent, key)}</span>
                    </div>
                );
            case 'numbered':
                return (
                    <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)', minWidth: '20px' }}>{block.number}.</span>
                        <span>{applyBlind(blockContent, key)}</span>
                    </div>
                );
            case 'checkbox':
                return (
                    <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: block.checked ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                            {block.checked ? '☑' : '☐'}
                        </span>
                        <span style={{ textDecoration: block.checked ? 'line-through' : 'none', color: block.checked ? 'var(--text-tertiary)' : 'inherit' }}>
                            {applyBlind(blockContent, key)}
                        </span>
                    </div>
                );
            case 'quote':
                return (
                    <div key={key} style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '16px', marginBottom: '8px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {applyBlind(blockContent, key)}
                    </div>
                );
            default:
                if (!block.content.trim()) {
                    return <div key={key} style={{ minHeight: '1.5em', marginBottom: '8px' }} />;
                }
                return (
                    <p key={key} style={{ marginBottom: '8px' }}>
                        {applyBlind(blockContent, key)}
                    </p>
                );
        }
    };

    return (
        <div style={{ fontSize: '17px', lineHeight: '1.85', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
            {blocks.map((block, index) => renderBlock(block, index))}
        </div>
    );
}
