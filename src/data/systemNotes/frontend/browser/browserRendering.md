# 브라우저 렌더링 과정

브라우저가 HTML, CSS, JavaScript를 화면에 나타내기까지의 과정입니다.

```
HTML 파싱 → DOM 생성 → CSSOM 생성 → 렌더 트리 → 레이아웃 → 페인트 → 컴포지팅
```

## 1. HTML 파싱 및 DOM 트리 생성

브라우저는 HTML 문서를 읽고 **DOM(Document Object Model) 트리**를 생성합니다.

**DOM 트리란?**
- HTML 문서의 계층 구조를 객체 모델로 표현
- 각 요소, 속성, 텍스트는 노드(Node)로 표현
- 부모-자식, 형제 노드 관계를 파악 가능

**역할:** JavaScript가 HTML 요소를 탐색, 수정, 조작할 수 있게 함

## 2. CSS 파싱 및 CSSOM 트리 생성

브라우저는 CSS 파일과 `<style>` 태그를 파싱하여 **CSSOM(CSS Object Model) 트리**를 생성합니다.

**CSSOM이란?**
- 각 HTML 요소에 적용된 CSS 규칙을 객체화
- DOM과 결합해 시각적 스타일 준비

## 3. 렌더 트리 생성

**DOM + CSSOM** 결합 → **렌더 트리** 생성

**렌더 트리 특징:**
- 화면에 표시될 요소만 포함 (`display: none` 제외)
- 각 요소에 적용될 스타일과 시각적 정보 포함

**역할:** 화면 렌더링을 위한 핵심 데이터 구조

## 4. 레이아웃 (Layout / Reflow)

렌더 트리를 바탕으로 각 요소의 **위치와 크기**를 계산합니다.

- 화면에서 요소가 어디에 표시될지 결정
- 어떤 크기를 가질지 결정
- 이 과정에서 **Reflow** 발생 가능

## 5. 페인트 (Paint / Repaint)

레이아웃 단계에서 계산된 위치와 크기를 참고해 **픽셀 단위로 화면에 그립니다.**

**적용되는 스타일 속성:**
- 색상, 텍스트, 그림자, 테두리 등

**페인트 레이어:**
- `z-index`, `position`, `opacity`, `transform` 등 속성에 따라 독립 레이어 생성 가능

## 6. 컴포지팅 (Compositing)

페인트 과정에서 생성된 **레이어들을 합성**하여 최종 화면을 만듭니다.

- 겹침 순서(z-index, position) 고려
- GPU 가속 활용 가능
- 최종적으로 브라우저 화면에 렌더링 완료

## 과정 요약

| 단계 | 설명 | 비고 |
|------|------|------|
| HTML 파싱 | HTML → DOM 트리 | JS 조작 가능 |
| CSS 파싱 | CSS → CSSOM 트리 | 스타일 규칙 준비 |
| 렌더 트리 생성 | DOM + CSSOM → 렌더 트리 | 화면 표시용 데이터 |
| 레이아웃 | 요소 위치/크기 계산 | Reflow 발생 가능 |
| 페인트 | 요소 스타일/픽셀 그림 | Repaint 발생 가능 |
| 컴포지팅 | 레이어 합성 → 화면 렌더 | 최종 화면 표시 |

## CSR(Client-Side Rendering)의 렌더링 과정

React 같은 CSR 프레임워크에서는 다음과 같이 진행됩니다:

```
HTML 파싱 → <script> 만나면 중단 → JS 다운로드/파싱/실행
    → React 초기화 → Virtual DOM 생성 → 실제 DOM 생성
    → CSSOM과 결합하여 Render Tree 생성 → Layout → Paint
```

**CSR 특징:**
- 초기 HTML은 거의 비어있음 (`<div id="root">`)
- JavaScript가 실행되어야 콘텐츠가 보임
- 초기 로딩은 느리지만, 이후 페이지 전환은 빠름

## Reflow vs Repaint

| 구분 | Reflow | Repaint |
|------|--------|---------|
| 발생 조건 | 레이아웃(위치/크기) 변경 | 시각적 스타일만 변경 |
| 트리거 속성 | `width`, `height`, `margin`, `padding`, `position` | `color`, `background`, `visibility`, `box-shadow` |
| 비용 | 높음 (레이아웃 재계산) | 상대적으로 낮음 |
| 연쇄 효과 | Repaint도 함께 발생 | Reflow 없이 단독 발생 가능 |

## 렌더링 성능 최적화 팁

**Reflow 최소화:**
- DOM 조작을 한 번에 묶어서 처리 (DocumentFragment, innerHTML)
- 스타일 변경 시 class 토글 사용
- `offsetHeight`, `getBoundingClientRect()` 등 강제 동기 레이아웃 주의

**컴포지팅 레이어 활용:**
- `transform`, `opacity` 속성은 컴포지팅 단계에서 처리 → Reflow/Repaint 회피
- `will-change` 속성으로 GPU 가속 힌트 제공

**Critical Rendering Path 최적화:**
- CSS는 `<head>`에, JS는 `<body>` 하단에 배치
- `async`, `defer` 속성으로 JS 로딩 최적화
- 중요한 CSS는 인라인으로 처리 (Critical CSS)