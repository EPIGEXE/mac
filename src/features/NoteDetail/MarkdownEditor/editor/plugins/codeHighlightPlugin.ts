/**
 * 코드 블록 Syntax Highlighting 플러그인
 * - lowlight (highlight.js 기반) 사용
 * - ProseMirror Decoration 기반으로 구현
 */
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { createLowlight, common } from 'lowlight';
import type { RootContent } from 'hast';

// lowlight 인스턴스 생성 (common: 주요 언어들 포함)
const lowlight = createLowlight(common);

// 지원하는 언어 목록 (필요시 추가 가능)
// common에 포함된 언어: javascript, typescript, python, java, c, cpp, csharp, go, ruby, rust, php, sql, json, xml, html, css, bash, shell 등

// 언어 별칭 → 정식 언어명 매핑
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'javascript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  cs: 'csharp',
  'c++': 'cpp',
  'c#': 'csharp',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  txt: 'plaintext',
  text: 'plaintext',
  plain: 'plaintext',
};

// 별칭을 정식 언어명으로 변환
function normalizeLanguage(lang: string | null): string | null {
  if (!lang) return null;
  const lower = lang.toLowerCase();
  return LANGUAGE_ALIASES[lower] || lower;
}

export const codeHighlightPluginKey = new PluginKey('codeHighlight');

// 최대 재귀 깊이 제한 (스택 오버플로우 방지)
const MAX_DEPTH = 50;

/**
 * lowlight의 AST 노드를 ProseMirror Decoration으로 변환
 */
function parseHighlightNodes(
  nodes: RootContent[],
  startPos: number,
  depth: number = 0
): { decorations: Decoration[]; endPos: number } {
  const decorations: Decoration[] = [];
  let currentPos = startPos;

  // 깊이 제한 체크
  if (depth > MAX_DEPTH) {
    // 남은 텍스트 길이만 계산해서 반환
    for (const node of nodes) {
      if (node.type === 'text') {
        currentPos += node.value.length;
      } else if (node.type === 'element' && node.children) {
        const childResult = parseHighlightNodes(node.children, currentPos, depth + 1);
        currentPos = childResult.endPos;
      }
    }
    return { decorations: [], endPos: currentPos };
  }

  for (const node of nodes) {
    if (node.type === 'text') {
      // 텍스트 노드: 위치만 이동
      currentPos += node.value.length;
    } else if (node.type === 'element') {
      // 요소 노드: 클래스명으로 decoration 생성
      const classNames = node.properties?.className;
      const className = Array.isArray(classNames) ? classNames.join(' ') : '';

      // 자식 노드 재귀 처리
      const childResult = parseHighlightNodes(node.children || [], currentPos, depth + 1);

      if (className) {
        // 전체 범위에 decoration 적용
        decorations.push(
          Decoration.inline(currentPos, childResult.endPos, {
            class: className,
          })
        );
      }

      decorations.push(...childResult.decorations);
      currentPos = childResult.endPos;
    }
  }

  return { decorations, endPos: currentPos };
}

/**
 * 코드 블록 노드를 찾아서 하이라이트 decoration 생성
 */
function getDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name === 'code_block') {
      // 별칭을 정식 언어명으로 변환
      const language = normalizeLanguage(node.attrs.language);
      const code = node.textContent;

      if (!code) return;

      // 코드 시작 위치 (code_block 노드 내부 텍스트 시작)
      const codeStartPos = pos + 1;

      try {
        // 언어가 지정되지 않았거나 지원하지 않는 언어면 하이라이트 스킵
        // highlightAuto는 무거운 연산이므로 비활성화
        if (!language || !lowlight.registered(language)) {
          return;
        }

        // 지정된 언어로 하이라이트
        const result = lowlight.highlight(language, code);

        // AST를 decoration으로 변환
        const { decorations: nodeDecorations } = parseHighlightNodes(
          result.children,
          codeStartPos
        );

        decorations.push(...nodeDecorations);
      } catch (e) {
        // 하이라이트 실패 시 무시
        console.warn('Code highlight failed:', e);
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * 코드 하이라이트 플러그인 생성
 */
export function createCodeHighlightPlugin(): Plugin {
  return new Plugin({
    key: codeHighlightPluginKey,
    state: {
      init(_, { doc }) {
        return getDecorations(doc);
      },
      apply(tr, decorationSet) {
        // 문서가 변경되었으면 decoration 재생성
        if (tr.docChanged) {
          return getDecorations(tr.doc);
        }
        // 문서가 변경되지 않았으면 기존 decoration 유지 (위치 매핑)
        return decorationSet.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}

/**
 * 지원하는 언어 목록 반환 (슬래시 커맨드 등에서 사용)
 */
export function getSupportedLanguages(): string[] {
  return lowlight.listLanguages();
}
