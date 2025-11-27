import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  InputRule,
} from 'prosemirror-inputrules';
import { canJoin, findWrapping } from 'prosemirror-transform';
import { TextSelection } from 'prosemirror-state';
import type { NodeType, MarkType } from 'prosemirror-model';
import { schema } from '../schema';

/**
 * 마크다운 InputRules
 *
 * 블록 변환:
 * - # + Space → h1
 * - ## + Space → h2
 * - ### + Space → h3
 * - - + Space → bullet list
 * - * + Space → bullet list
 * - 1. + Space → ordered list
 * - - [ ] + Space → checkbox (unchecked)
 * - - [x] + Space → checkbox (checked)
 * - > + Space → blockquote
 * - ``` → code block
 * - --- → horizontal rule
 *
 * 인라인 변환:
 * - **text** → bold
 * - *text* → italic
 * - `code` → inline code
 * - ~~text~~ → strikethrough
 * - [text](url) → link
 */

// 제목 변환 규칙
function headingRule(level: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${level}})\\s$`),
    schema.nodes.heading,
    (match) => ({ level: match[1].length })
  );
}

/**
 * 글머리 기호 목록 변환 - Tiptap 방식 (findWrapping 사용)
 * findWrapping이 자동으로 bullet_list > list_item > paragraph 구조 생성
 */
function bulletListRule(nodeType: NodeType) {
  return new InputRule(/^\s*([-*])\s$/, (state, match, start, end) => {
    const tr = state.tr.delete(start, end);
    const $start = tr.doc.resolve(start);
    const blockRange = $start.blockRange();

    if (!blockRange) return null;

    const wrapping = findWrapping(blockRange, nodeType);
    if (!wrapping) return null;

    tr.wrap(blockRange, wrapping);

    // 이전 노드가 같은 타입이면 합치기
    const before = tr.doc.resolve(start - 1).nodeBefore;
    if (before && before.type === nodeType && canJoin(tr.doc, start - 1)) {
      tr.join(start - 1);
    }

    return tr;
  });
}

/**
 * 번호 목록 변환 - Tiptap 방식 (findWrapping 사용)
 */
function orderedListRule(nodeType: NodeType) {
  return new InputRule(/^\s*(\d+)\.\s$/, (state, match, start, end) => {
    const order = +match[1];
    const tr = state.tr.delete(start, end);
    const $start = tr.doc.resolve(start);
    const blockRange = $start.blockRange();

    if (!blockRange) return null;

    const wrapping = findWrapping(blockRange, nodeType, { order });
    if (!wrapping) return null;

    tr.wrap(blockRange, wrapping);

    // 이전 노드가 같은 타입이고, 번호가 연속이면 합치기
    const before = tr.doc.resolve(start - 1).nodeBefore;
    if (
      before &&
      before.type === nodeType &&
      canJoin(tr.doc, start - 1) &&
      before.childCount + before.attrs.order === order
    ) {
      tr.join(start - 1);
    }

    return tr;
  });
}

// 인용문 변환
function blockquoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

// 코드 블록 변환 (``` + 스페이스로 변환)
// 예: ```js + Space → JavaScript 코드 블록
// 예: ``` + Space → 자동 감지 코드 블록
function codeBlockRule(nodeType: NodeType) {
  // 스페이스로만 트리거 (엔터는 새 문단이 먼저 생성됨)
  return new InputRule(/^```(\w*)\s$/, (state, match, start, end) => {
    const language = match[1] || null;
    const tr = state.tr;
    const codeBlock = nodeType.create({ language });

    // 현재 블록을 코드 블록으로 교체
    const $pos = tr.doc.resolve(start);
    const blockStart = $pos.start($pos.depth);
    const blockEnd = $pos.end($pos.depth);

    tr.replaceWith(blockStart, blockEnd, codeBlock);
    tr.setSelection(state.selection.constructor.near(tr.doc.resolve(blockStart + 1)));

    return tr;
  });
}

// 가로선 변환 (---)
function horizontalRuleRule(): InputRule {
  return new InputRule(/^---$/, (state, _match, start, end) => {
    const hr = schema.nodes.horizontal_rule.create();
    const paragraph = schema.nodes.paragraph.create();

    // 현재 블록을 구분선 + 새 paragraph로 교체
    const $pos = state.tr.doc.resolve(start);
    const blockStart = $pos.start($pos.depth);
    const blockEnd = $pos.end($pos.depth);

    const tr = state.tr.replaceWith(blockStart, blockEnd, [hr, paragraph]);

    // 커서를 새 paragraph로 이동
    tr.setSelection(state.selection.constructor.near(tr.doc.resolve(blockStart + hr.nodeSize + 1)));

    return tr;
  });
}

/**
 * 인라인 마크 InputRule 생성
 * 패턴: opening + text + closing → mark가 적용된 text
 */
function markInputRule(
  regexp: RegExp,
  markType: MarkType,
  getAttrs?: (match: RegExpMatchArray) => Record<string, unknown> | null
): InputRule {
  return new InputRule(regexp, (state, match, start, end) => {
    const attrs = getAttrs ? getAttrs(match) : {};
    const textStart = start + match[1].length;
    const textEnd = end - match[3].length;
    const text = match[2];

    if (!text) return null;

    const tr = state.tr;
    tr.delete(start, end);
    tr.insertText(text, start);
    tr.addMark(start, start + text.length, markType.create(attrs));
    tr.removeStoredMark(markType);

    return tr;
  });
}

// Bold: **text**
function boldRule(): InputRule {
  return markInputRule(/(\*\*)([^*]+)(\*\*)$/, schema.marks.bold);
}

// Italic: *text* (단, **는 제외)
function italicRule(): InputRule {
  return markInputRule(/(?<!\*)(\*)([^*]+)(\*)$/, schema.marks.italic);
}

// Inline code: `code`
function inlineCodeRule(): InputRule {
  return markInputRule(/(`)([^`]+)(`)$/, schema.marks.code);
}

// Strikethrough: ~~text~~
function strikethroughRule(): InputRule {
  return markInputRule(/(~~)([^~]+)(~~)$/, schema.marks.strikethrough);
}

// Link: [text](url)
function linkRule(): InputRule {
  return new InputRule(
    /\[([^\]]+)\]\(([^)]+)\)$/,
    (state, match, start, end) => {
      const text = match[1];
      const href = match[2];

      if (!text || !href) return null;

      const tr = state.tr;
      tr.delete(start, end);
      tr.insertText(text, start);
      tr.addMark(start, start + text.length, schema.marks.link.create({ href }));

      return tr;
    }
  );
}

// Image: ![alt](url)
function imageRule(): InputRule {
  return new InputRule(
    /!\[([^\]]*)\]\(([^)]+)\)$/,
    (state, match, start, end) => {
      const alt = match[1];
      const src = match[2];

      if (!src) return null;

      const tr = state.tr;
      const image = schema.nodes.image.create({ src, alt });
      tr.replaceWith(start, end, image);

      return tr;
    }
  );
}

// 체크박스 변환 (커스텀 규칙)
// - [ ] 또는 - [x] + Space로 트리거
function checkboxRule(): InputRule {
  return new InputRule(
    /^-\s*\[([ xX])\]\s$/,
    (state, match, start, _end) => {
      const checked = match[1].toLowerCase() === 'x';
      const checkboxType = schema.nodes.checkbox;

      // 현재 블록의 시작과 끝 위치 찾기
      const $pos = state.doc.resolve(start);
      const blockStart = $pos.start($pos.depth);
      const blockEnd = $pos.end($pos.depth);

      // 체크박스 노드 생성
      const node = checkboxType.create({ checked });

      // 블록 전체를 체크박스로 교체
      const tr = state.tr.replaceWith(blockStart, blockEnd, node);

      // 커서를 체크박스 내부로 이동
      tr.setSelection(TextSelection.near(tr.doc.resolve(blockStart + 1)));

      return tr;
    }
  );
}

// 모든 InputRules 조합
export const markdownInputRules = inputRules({
  rules: [
    // 블록 변환
    headingRule(1),
    headingRule(2),
    headingRule(3),
    bulletListRule(schema.nodes.bullet_list),
    orderedListRule(schema.nodes.ordered_list),
    checkboxRule(),
    blockquoteRule(schema.nodes.blockquote),
    codeBlockRule(schema.nodes.code_block),
    horizontalRuleRule(),

    // 인라인 마크 변환
    boldRule(),
    italicRule(),
    inlineCodeRule(),
    strikethroughRule(),
    imageRule(),  // 이미지는 링크보다 먼저 (![)
    linkRule(),
  ],
});
