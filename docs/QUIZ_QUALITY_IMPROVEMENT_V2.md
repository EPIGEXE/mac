# 퀴즈 품질 개선 리포트 v2

## 현재 문제점 분석

### 문제 1: 중요하지 않은 개념이 빈칸으로 선정됨

| 빈칸 | 정답 | 문제점 |
|------|------|--------|
| BLANK_5 | 리소스 힌트 | 섹션 제목을 그대로 빈칸으로 만듦 |
| BLANK_6 | 폰트 최적화 | 섹션 제목을 그대로 빈칸으로 만듦 |
| BLANK_7 | 이미지 최적화 | 섹션 제목을 그대로 빈칸으로 만듦 |

**원인**: LLM이 "각 섹션에 최소 1개 빈칸" 요구사항을 충족하려고 섹션 제목 자체를 빈칸으로 만들어버림. 실제로 면접에서 중요한 건 `preload`, `prefetch`, `font-display: swap`, `loading="lazy"` 같은 **구체적인 기술 키워드**임.

### 문제 2: 문제 유형의 고착화

현재 LLM이 생성하는 문제 패턴:
```
- "[개념]은 ~이다" (정의형)
- "[개념]을 사용하면 ~할 수 있다" (역할형)
- "~ 과정에서 [개념]이 발생한다" (결과형)
```

**문제**: 항상 비슷한 문장 구조 → 학습 효과 감소, AI 활용 가치 저하

### 문제 3: 불필요한 섹션 커버리지 강제

현재 프롬프트:
```
You have N sections. EACH section MUST have at least 1 blank.
```

**문제**: 중요하지 않은 섹션도 무조건 빈칸을 만들어야 해서 "폰트 최적화", "이미지 최적화" 같은 섹션 제목이 빈칸으로 선정됨.

**실제로 필요한 것**: 중요한 섹션에서 여러 개, 덜 중요한 섹션에서는 0개도 가능해야 함.

---

## 개선 방안

### 방안 1: Stage 1 개념 추출 시 "구체성 레벨" 추가

**현재:**
```json
{ "term": "폰트 최적화", "importance": "critical" }
```

**개선:**
```json
{
  "term": "font-display: swap",
  "importance": "critical",
  "specificity": "implementation",
  "context": "폰트 로딩 전략으로 사용되는 CSS 속성"
}
```

**Specificity 레벨:**
| 레벨 | 설명 | 빈칸 선정 |
|------|------|----------|
| `abstract` | 추상적 개념 (최적화, 성능 개선) | ❌ 제외 |
| `concept` | 핵심 개념 (CRP, FOUC, Reflow) | ✅ 우선 |
| `implementation` | 구현 세부사항 (defer, preload, swap) | ✅ 우선 |

### 방안 2: 문제 유형 다양화 - "변형 전략" 도입

**현재**: 원문을 약간 수정해서 빈칸 생성

**개선**: 다양한 변형 전략 중 랜덤 선택

| 변형 전략 | 예시 |
|-----------|------|
| **역순 질문** | "defer를 사용하면 어떤 효과가 있는가?" → "[BLANK]를 사용하면 HTML 파싱 완료 후 스크립트가 실행된다" |
| **비교 질문** | "defer와 async의 차이점은?" → "[BLANK]는 순서 보장, async는 순서 미보장" |
| **코드 완성** | `<script src="app.js" [BLANK]></script>` → 코드 블록 내부 빈칸 |
| **결과 추론** | "CSS 없이 HTML이 먼저 렌더링되면?" → "[BLANK] 현상 발생" |
| **원인 추론** | "FOUC가 발생하는 이유는?" → "CSS가 [BLANK]을 차단하기 때문" |

### 방안 3: 빈칸 선정 금지 목록 강화

**현재 금지 목록:**
```
❌ 조작, 수정, 변경, 생성...
```

**추가할 금지 패턴:**
```
❌ 섹션 제목 그대로 사용 (폰트 최적화, 이미지 최적화, CRP 최적화 전략)
❌ "~하기", "~방법", "~전략" 으로 끝나는 추상명사
❌ 문서에 한 번만 등장하는 일반 명사
```

### 방안 4: 코드 블록 내부 빈칸 지원

코드 블록 예시에서 빈칸이 제대로 렌더링되도록 클라이언트 수정 후:
```html
<script src="app.js" [BLANK]></script>
```
이런 형태의 **실용적인 코드 완성 문제** 추가 가능

### 방안 5: 섹션 커버리지 강제 제거 ⭐ NEW

**현재 프롬프트:**
```
### 1. Section Coverage (MANDATORY - DO NOT SKIP ANY)
You have N sections. EACH section MUST have at least 1 blank.
```

**개선:**
```
### 1. Concept Priority (NOT Section Coverage)
- Focus on HIGH-VALUE concepts regardless of which section they belong to
- Important sections may have multiple blanks
- Less important sections may have ZERO blanks - this is OK
- Never create a blank just to "cover" a section
```

**효과:**
- 중요도가 낮은 섹션(폰트 최적화, 이미지 최적화)에서 억지로 빈칸 생성 방지
- 중요한 섹션(CRP란?, JavaScript 로딩 전략)에 빈칸 집중
- 섹션 제목 자체를 빈칸으로 만드는 현상 해결

---

## 우선순위 및 구현 난이도

| 순위 | 방안 | 효과 | 난이도 | 비고 |
|------|------|------|--------|------|
| 1 | 방안 5: 섹션 커버리지 강제 제거 | ⭐⭐⭐ | 🟢 쉬움 | 프롬프트만 수정 |
| 2 | 방안 3: 금지 목록 강화 | ⭐⭐⭐ | 🟢 쉬움 | 프롬프트만 수정 |
| 3 | 방안 1: specificity 레벨 추가 | ⭐⭐ | 🟡 중간 | Stage 1 프롬프트 + 타입 수정 |
| 4 | 방안 2: 변형 전략 도입 | ⭐⭐ | 🟡 중간 | Stage 2 프롬프트 대폭 수정 |
| 5 | 방안 4: 코드 블록 빈칸 | ⭐ | 🔴 어려움 | 클라이언트 렌더링 수정 |

---

## 즉시 적용 가능한 변경사항

### Stage 2 프롬프트 수정 (prompts.ts)

```typescript
// 변경 전
### 1. Section Coverage (MANDATORY - DO NOT SKIP ANY)
You have ${extractedConcepts.sections.length} sections. EACH section MUST have at least 1 blank.

// 변경 후
### 1. Concept Priority (NOT Section Coverage)
- Focus on HIGH-VALUE technical concepts regardless of section
- Important sections may have 2-3 blanks, less important sections may have 0
- NEVER create a blank just to "cover" a section
- Prefer specific terms (defer, preload, FOUC) over abstract terms (최적화, 전략)
```

### 금지 목록 확장

```typescript
// 변경 전
### 3.5. FORBIDDEN ANSWERS (NEVER use these as blanks)
❌ Generic verbs: 조작, 수정, 변경, 생성, 삭제, 추가, 처리, 실행
❌ Generic adjectives: 중요한, 필수적인, 다양한
❌ Common words: 화면, 요소, 과정, 단계, 결과

// 변경 후
### 3.5. FORBIDDEN ANSWERS (NEVER use these as blanks)
❌ Generic verbs: 조작, 수정, 변경, 생성, 삭제, 추가, 처리, 실행
❌ Generic adjectives: 중요한, 필수적인, 다양한
❌ Common words: 화면, 요소, 과정, 단계, 결과
❌ Section titles: 폰트 최적화, 이미지 최적화, CRP 최적화 전략, 리소스 힌트 사용
❌ Abstract nouns ending with: ~최적화, ~전략, ~방법, ~방식, ~하기
❌ Generic category names that are not specific technical terms
✅ ONLY use: Specific APIs, attributes, properties, acronyms, error names
   Examples: defer, async, preload, prefetch, FOUC, font-display, loading="lazy"
```

---

## 기대 효과

| 지표 | 현재 | 개선 후 예상 |
|------|------|-------------|
| 추상적 답변 비율 | ~30% | <10% |
| 코드 관련 답변 비율 | ~20% | ~50% |
| 면접 출제 가능성 높은 답변 | ~50% | ~80% |
| 문제 유형 다양성 | 3가지 | 5가지+ |
