/**
 * 코드 블록 NodeView
 * - 언어 선택 드롭다운 UI
 * - Tiptap/BlockNote 스타일
 * - 플레이스홀더 직접 처리
 */
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { schema } from '../schema';
import type { NodeView, ViewMutationRecord } from 'prosemirror-view';
import { getSupportedLanguages } from '../plugins/codeHighlightPlugin';

// 언어 표시 이름 매핑
const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  go: 'Go',
  ruby: 'Ruby',
  rust: 'Rust',
  php: 'PHP',
  sql: 'SQL',
  json: 'JSON',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  bash: 'Bash',
  shell: 'Shell',
  markdown: 'Markdown',
  yaml: 'YAML',
  plaintext: 'Plain Text',
};

// 언어 별칭 → 정식 언어명 매핑
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
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
};

// 별칭을 정식 언어명으로 변환
function normalizeLanguage(lang: string | null): string {
  if (!lang) return '';
  const lower = lang.toLowerCase();
  return LANGUAGE_ALIASES[lower] || lower;
}

/**
 * 코드 블록 NodeView
 */
export class CodeBlockView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private view: EditorView;
  private getPos: () => number | undefined;
  private select: HTMLSelectElement;
  private node: Node;
  private placeholder: HTMLElement;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // 외부 컨테이너 (pre)
    this.dom = document.createElement('pre');
    this.dom.className = 'pm-code-block';

    // 헤더 (언어 선택)
    const header = document.createElement('div');
    header.className = 'pm-code-block-header';

    // 언어 선택 드롭다운
    this.select = document.createElement('select');
    this.select.className = 'pm-code-block-select';
    this.select.addEventListener('change', this.handleLanguageChange.bind(this));
    this.select.addEventListener('mousedown', (e) => e.stopPropagation());

    // 옵션 추가
    this.populateLanguageOptions();

    // 초기 언어 설정 (별칭을 정식 언어명으로 변환)
    const initialLanguage = normalizeLanguage(node.attrs.language);
    this.select.value = initialLanguage;

    header.appendChild(this.select);
    this.dom.appendChild(header);

    // 코드 영역 컨테이너 (position relative for placeholder)
    const codeWrapper = document.createElement('div');
    codeWrapper.className = 'pm-code-block-content';
    codeWrapper.style.position = 'relative';

    // 코드 영역 (code)
    this.contentDOM = document.createElement('code');
    this.contentDOM.className = initialLanguage ? `language-${initialLanguage}` : '';
    codeWrapper.appendChild(this.contentDOM);

    // 플레이스홀더
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'pm-code-block-placeholder';
    this.placeholder.textContent = '코드를 입력하세요...';
    this.placeholder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      color: var(--text-muted, #94a3b8);
      pointer-events: none;
      user-select: none;
    `;
    codeWrapper.appendChild(this.placeholder);

    this.dom.appendChild(codeWrapper);

    // 초기 플레이스홀더 상태 설정
    this.updatePlaceholder();
  }

  private populateLanguageOptions() {
    // 빈 옵션 (자동 감지)
    const autoOption = document.createElement('option');
    autoOption.value = '';
    autoOption.textContent = '자동 감지';
    this.select.appendChild(autoOption);

    // 지원하는 언어들
    const languages = getSupportedLanguages().sort();

    for (const lang of languages) {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = LANGUAGE_LABELS[lang] || lang;
      this.select.appendChild(option);
    }
  }

  private handleLanguageChange() {
    const language = this.select.value || null;
    const pos = this.getPos();

    if (pos === undefined) return;

    // 언어 속성 업데이트
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        language,
      })
    );
  }

  private updatePlaceholder() {
    // 내용이 비어있으면 플레이스홀더 표시
    const isEmpty = this.node.content.size === 0;
    this.placeholder.style.display = isEmpty ? 'block' : 'none';
  }

  update(node: Node): boolean {
    if (node.type !== schema.nodes.code_block) return false;

    this.node = node;

    // 언어가 변경되었으면 업데이트 (별칭을 정식 언어명으로 변환)
    const language = normalizeLanguage(node.attrs.language);
    if (this.select.value !== language) {
      this.select.value = language;
    }

    // 코드 영역 클래스 업데이트
    this.contentDOM.className = language ? `language-${language}` : '';

    // 플레이스홀더 상태 업데이트
    this.updatePlaceholder();

    return true;
  }

  stopEvent(event: Event): boolean {
    // select 관련 이벤트는 에디터로 전파하지 않음
    if (event.target === this.select) {
      return true;
    }
    return false;
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    // select 변경은 무시
    if (mutation.target === this.select || this.select.contains(mutation.target)) {
      return true;
    }
    // 플레이스홀더 변경은 무시
    if (mutation.target === this.placeholder || this.placeholder.contains(mutation.target)) {
      return true;
    }
    return false;
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
  }
}
