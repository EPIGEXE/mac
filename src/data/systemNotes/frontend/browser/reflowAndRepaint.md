# Reflow와 Repaint

## 개요

| 구분 | 정의 | 비용 |
|------|------|------|
| Reflow | 요소의 위치나 크기가 변경되어 레이아웃을 다시 계산 | 높음 |
| Repaint | 요소의 시각적 속성이 변경되어 픽셀을 다시 그림 | 낮음 |

```
DOM 변경 → Reflow(레이아웃 재계산) → Repaint(픽셀 그리기) → Composite(합성)
```

핵심: **Reflow가 발생하면 Repaint도 발생**하지만, Repaint는 단독 발생 가능

## Reflow (Layout)

### 정의

DOM의 레이아웃, 즉 요소의 **위치와 크기(Box Model)를 계산**하는 과정입니다. 렌더 트리 상에서 각 노드의 위치, 크기, 마진, 패딩을 결정합니다.

### 발생 조건

**레이아웃 관련 CSS 속성 변경:**
- `width`, `height`, `margin`, `padding`, `border`
- `position`, `top`, `left`, `right`, `bottom`
- `display`, `flex`, `grid`
- `font-size`, `line-height`, `font-family`

**DOM 구조 변경:**
- 노드 추가/삭제
- 텍스트 내용 변경

**뷰포트 변경:**
- 윈도우 리사이즈
- 스크롤 (일부 상황)

### 특징

- 계산 비용이 높음
- 부모 → 자식 → 형제 요소까지 연쇄적으로 영향
- 반복 발생 시 성능 저하의 주요 원인

## Repaint (Paint)

### 정의

요소의 **시각적 스타일을 픽셀 단위로 다시 그리는** 과정입니다. 위치/크기 변화 없이 색상, 배경, 그림자 등만 업데이트합니다.

### 발생 조건

- `color`, `background-color`, `border-color`
- `box-shadow`, `text-shadow`
- `visibility`
- `background-image`

### 특징

- Reflow보다 비용 낮음
- 해당 요소만 영향 (연쇄 영향 적음)

## Reflow vs Repaint 비교

| 구분 | Reflow | Repaint |
|------|--------|---------|
| 대상 | 위치/크기 계산 | 시각적 스타일 그리기 |
| 트리거 속성 | width, height, margin, display | color, background, box-shadow |
| 비용 | 높음 | 낮음 |
| 연쇄 영향 | 부모/자식/형제까지 | 해당 요소만 |
| 후속 단계 | Repaint + Composite | Composite |

## Layout Thrashing (강제 동기 레이아웃)

### 정의

레이아웃 정보를 **읽는 것만으로도 Reflow가 강제 발생**하는 현상입니다. 브라우저는 정확한 값을 반환하기 위해 대기 중인 스타일 변경을 즉시 계산합니다.

### Reflow를 강제하는 속성/메서드

```javascript
// 이 속성들을 읽기만 해도 Reflow 발생
element.offsetTop, offsetLeft, offsetWidth, offsetHeight
element.clientTop, clientLeft, clientWidth, clientHeight
element.scrollTop, scrollLeft, scrollWidth, scrollHeight
element.getBoundingClientRect()
window.getComputedStyle(element)
```

### 문제 상황

```javascript
// Layout Thrashing 발생
items.forEach(item => {
  const height = item.offsetHeight;    // 읽기 → Reflow
  item.style.width = height + 'px';    // 쓰기 → 다음 읽기 시 Reflow 필요
});
// 반복문 돌 때마다 Reflow 발생 → 심각한 성능 저하
```

### 해결 방법

```javascript
// 읽기/쓰기 분리
const heights = items.map(item => item.offsetHeight);  // 읽기 몰아서
items.forEach((item, i) => {
  item.style.width = heights[i] + 'px';                // 쓰기 몰아서
});
// Reflow 최소화
```

## 최적화 방법

### 1. Reflow 최소화

```javascript
// 여러 스타일 변경 시 class 토글 사용
element.classList.add('active');

// cssText로 한 번에 변경
element.style.cssText = 'width: 100px; height: 100px; margin: 10px;';
```

### 2. DOM 조작 배치 처리

```javascript
// DocumentFragment 사용
const fragment = document.createDocumentFragment();
items.forEach(item => fragment.appendChild(createNode(item)));
container.appendChild(fragment);  // 한 번만 DOM 수정
```

### 3. 애니메이션은 transform/opacity 사용

```css
/* Reflow 발생 */
.animate {
  left: 100px;
  width: 200px;
}

/* Reflow/Repaint 스킵 → Composite만 */
.animate {
  transform: translateX(100px) scale(1.2);
  opacity: 0.8;
}
```

### 4. 레이아웃 읽기/쓰기 분리

```javascript
// requestAnimationFrame으로 쓰기 작업 배치
function update() {
  // 읽기
  const height = element.offsetHeight;
  
  // 쓰기는 다음 프레임에
  requestAnimationFrame(() => {
    element.style.width = height + 'px';
  });
}
```

## 렌더링 파이프라인 정리

```
JavaScript → Style → Layout(Reflow) → Paint(Repaint) → Composite
```

| 변경 유형 | 실행 단계 | 예시 |
|-----------|-----------|------|
| 레이아웃 속성 | Style → Layout → Paint → Composite | width, height, margin |
| 페인트 속성 | Style → Paint → Composite | color, background, box-shadow |
| 컴포지트 속성 | Style → Composite | transform, opacity |

**포인트:** transform/opacity가 빠른 이유는 Reflow/Repaint를 건너뛰고 GPU에서 Composite만 처리하기 때문