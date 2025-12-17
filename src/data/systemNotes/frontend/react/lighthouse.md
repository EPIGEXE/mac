# Lighthouse 성능 지표와 개선

## Lighthouse란?

**Google에서 만든 웹 페이지 품질 측정 도구**입니다. 성능, 접근성, SEO, PWA, 모범 사례를 점수화하여 보여주고, 개선 방안을 제안합니다.

Chrome DevTools, CLI, Node 모듈, PageSpeed Insights 등 다양한 방식으로 실행할 수 있습니다.

```bash
# CLI 실행
npx lighthouse https://example.com --view

# Node 모듈
import lighthouse from 'lighthouse';
```

---

## Core Web Vitals

**Google이 정의한 핵심 사용자 경험 지표**입니다. 검색 순위에도 영향을 미칩니다.

| 지표 | 측정 대상 | 좋음 | 개선 필요 | 나쁨 |
|------|----------|------|----------|------|
| **LCP** | 로딩 성능 | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** | 상호작용 반응성 | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** | 시각적 안정성 | ≤ 0.1 | ≤ 0.25 | > 0.25 |

---

## LCP (Largest Contentful Paint)

**뷰포트 내 가장 큰 콘텐츠 요소가 렌더링되는 시점**입니다. 사용자가 "페이지가 로드됐다"고 느끼는 순간을 측정합니다.

LCP 대상 요소:
- `<img>` 요소
- `<video>` 포스터 이미지
- CSS background-image
- 텍스트 블록 (`<p>`, `<h1>` 등)

**LCP가 느린 원인:**
- 서버 응답 시간 지연
- 렌더 블로킹 리소스 (CSS, JS)
- 리소스 로드 시간
- 클라이언트 사이드 렌더링

**개선 방안:**

서버 응답 최적화:
```
- CDN 사용으로 지리적 거리 단축
- 서버 사이드 캐싱 (Redis, Varnish)
- HTML 스트리밍 (React 18 renderToPipeableStream)
- TTFB 개선 (데이터베이스 쿼리 최적화)
```

리소스 우선순위 최적화:
```html
<!-- LCP 이미지 우선 로드 -->
<link rel="preload" as="image" href="hero.webp">

<!-- 중요한 CSS 인라인 -->
<style>/* Critical CSS */</style>

<!-- 덜 중요한 CSS 지연 로드 -->
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">
```

이미지 최적화:
```html
<!-- 최신 포맷 사용 -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="...">
</picture>

<!-- 적절한 크기 제공 -->
<img srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
     sizes="(max-width: 600px) 400px, 800px"
     src="medium.jpg">

<!-- lazy loading은 LCP 이미지에 사용 금지 -->
<img src="hero.jpg" fetchpriority="high">  <!-- LCP 이미지 -->
<img src="below-fold.jpg" loading="lazy">  <!-- 스크롤 후 이미지 -->
```

렌더 블로킹 제거:
```html
<!-- JS 지연 로드 -->
<script src="app.js" defer></script>

<!-- 중요하지 않은 CSS 비동기 로드 -->
<link rel="stylesheet" href="print.css" media="print">
```

---

## INP (Interaction to Next Paint)

**사용자 상호작용(클릭, 탭, 키 입력)부터 다음 화면 업데이트까지의 시간**입니다. 페이지의 전반적인 반응성을 측정합니다.

기존 FID(First Input Delay)는 첫 번째 상호작용만 측정했지만, INP는 페이지 수명 전체의 모든 상호작용 중 가장 느린 것을 측정합니다.

**INP가 느린 원인:**
- 긴 JavaScript 작업 (Long Tasks)
- 큰 DOM 크기
- 메인 스레드 블로킹
- 무거운 이벤트 핸들러

**개선 방안:**

Long Tasks 분할:
```javascript
// ❌ 긴 작업이 메인 스레드 블로킹
function processData(items) {
  items.forEach(item => heavyComputation(item));
}

// ✅ 작업을 청크로 분할
async function processData(items) {
  for (const item of items) {
    heavyComputation(item);
    // 브라우저에게 제어권 양보
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// ✅ scheduler.yield() 사용 (최신 API)
async function processData(items) {
  for (const item of items) {
    heavyComputation(item);
    if (navigator.scheduling?.isInputPending()) {
      await scheduler.yield();
    }
  }
}
```

Web Worker 활용:
```javascript
// 무거운 계산을 별도 스레드로
const worker = new Worker('heavy-task.js');
worker.postMessage(data);
worker.onmessage = (e) => updateUI(e.data);
```

이벤트 핸들러 최적화:
```javascript
// ❌ 동기적으로 모든 작업 처리
button.addEventListener('click', () => {
  updateState();        // 필수
  sendAnalytics();      // 나중에 해도 됨
  updateRecommendations();  // 나중에 해도 됨
});

// ✅ 필수 작업만 먼저, 나머지는 지연
button.addEventListener('click', () => {
  updateState();  // 즉시 실행
  
  requestIdleCallback(() => {
    sendAnalytics();
    updateRecommendations();
  });
});
```

React에서의 최적화:
```jsx
// useTransition으로 긴급하지 않은 업데이트 표시
const [isPending, startTransition] = useTransition();

function handleChange(e) {
  // 긴급: 입력값 업데이트
  setInputValue(e.target.value);
  
  // 긴급하지 않음: 검색 결과 업데이트
  startTransition(() => {
    setSearchResults(filterResults(e.target.value));
  });
}
```

DOM 크기 줄이기:
```jsx
// 가상화로 렌더링되는 DOM 노드 수 제한
import { FixedSizeList } from 'react-window';

<FixedSizeList height={400} itemCount={10000} itemSize={35}>
  {({ index, style }) => <Row style={style}>{items[index]}</Row>}
</FixedSizeList>
```

---

## CLS (Cumulative Layout Shift)

**페이지 로드 중 예상치 못한 레이아웃 이동의 누적 점수**입니다. 갑자기 버튼이 움직여서 잘못 클릭하는 경험을 수치화합니다.

```
CLS = 영향 비율 × 거리 비율
```

**CLS가 높은 원인:**
- 크기가 지정되지 않은 이미지/iframe
- 동적으로 삽입되는 콘텐츠 (광고, 배너)
- 웹폰트 로드로 인한 FOUT/FOIT
- 비동기 DOM 조작

**개선 방안:**

이미지/비디오 크기 명시:
```html
<!-- width, height 속성으로 aspect ratio 예약 -->
<img src="image.jpg" width="800" height="600" alt="...">

<!-- 또는 CSS aspect-ratio -->
<style>
img {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}
</style>
```

동적 콘텐츠 공간 예약:
```css
/* 광고 슬롯 공간 미리 확보 */
.ad-container {
  min-height: 250px;
}

/* 스켈레톤 UI로 레이아웃 유지 */
.skeleton {
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  animation: shimmer 1.5s infinite;
}
```

웹폰트 최적화:
```css
/* font-display로 폰트 로드 전략 지정 */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap;  /* 시스템 폰트로 먼저 표시 → 폰트 로드 후 교체 */
}

/* optional: 폰트 로드 실패해도 시스템 폰트 유지 */
font-display: optional;
```

```html
<!-- 폰트 미리 로드 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
```

transform 애니메이션 사용:
```css
/* ❌ top/left 변경 → 레이아웃 이동 */
.moving {
  position: relative;
  top: 100px;
}

/* ✅ transform → 레이아웃 이동 없음 */
.moving {
  transform: translateY(100px);
}
```

---

## 기타 Lighthouse 지표

| 지표 | 설명 | 좋음 | 개선 방법 |
|------|------|------|----------|
| **FCP** | 첫 콘텐츠 렌더링 | ≤ 1.8s | 렌더 블로킹 제거, Critical CSS |
| **TTFB** | 첫 바이트 수신 | ≤ 800ms | CDN, 서버 최적화, HTTP/2-3 |
| **TBT** | 메인 스레드 블로킹 총 시간 | ≤ 200ms | Long Tasks 분할, JS 최적화 |
| **SI** | 콘텐츠 채워지는 속도 | ≤ 3.4s | Critical Rendering Path 최적화 |

---

## Lighthouse 점수 계산

| 지표 | 가중치 |
|------|--------|
| TBT | 30% |
| LCP | 25% |
| CLS | 25% |
| FCP | 10% |
| SI | 10% |

TBT, LCP, CLS가 전체 점수의 80%를 차지합니다. Core Web Vitals 개선이 핵심입니다.

---

## 측정 방법과 도구

**Lab Data (실험실 데이터)**

통제된 환경에서 측정합니다. 디버깅과 개발에 유용합니다.

- Chrome DevTools (Performance, Lighthouse 탭)
- Lighthouse CLI
- WebPageTest

**Field Data (실제 사용자 데이터)**

실제 사용자 환경에서 수집합니다. 실제 성능을 반영합니다.

- Chrome User Experience Report (CrUX)
- PageSpeed Insights (Lab + Field 모두 제공)
- web-vitals 라이브러리

```javascript
// web-vitals로 실제 사용자 데이터 수집
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);

// 분석 서비스로 전송
onLCP((metric) => {
  sendToAnalytics({ name: 'LCP', value: metric.value });
});
```

DevTools Performance 탭에서 녹화 후 Timings(LCP, FCP), Main(Long Tasks), Experience(Layout Shifts)를 확인할 수 있습니다.

---

## 실무 개선 체크리스트

**LCP 개선:**
- [ ] LCP 이미지에 `fetchpriority="high"` 추가
- [ ] LCP 이미지 `preload`
- [ ] 이미지 포맷 최적화 (WebP, AVIF)
- [ ] CDN 사용
- [ ] Critical CSS 인라인
- [ ] 렌더 블로킹 JS 제거/지연

**INP 개선:**
- [ ] Long Tasks 식별 및 분할
- [ ] 무거운 계산 Web Worker로 이동
- [ ] `useTransition`, `useDeferredValue` 활용
- [ ] 가상화로 DOM 크기 감소
- [ ] 이벤트 핸들러 최적화

**CLS 개선:**
- [ ] 모든 이미지/비디오에 크기 명시
- [ ] 광고/동적 콘텐츠 공간 예약
- [ ] 웹폰트 `font-display: swap` 또는 `optional`
- [ ] 폰트 preload
- [ ] transform 애니메이션 사용

---

## 최적화 우선순위

1. **측정**: Lighthouse, CrUX로 현재 상태 파악
2. **분석**: 가장 나쁜 지표와 원인 식별
3. **개선**: 가장 영향이 큰 문제부터 해결
4. **검증**: 재측정으로 효과 확인 후 반복

---

## 면접 예상 질문

**Q. Core Web Vitals란?**

Google이 정의한 핵심 사용자 경험 지표입니다. LCP(로딩), INP(상호작용), CLS(시각적 안정성)로 구성됩니다. 검색 순위에 영향을 미치며, LCP는 2.5초 이내, INP는 200ms 이내, CLS는 0.1 이하가 좋은 점수입니다.

**Q. LCP를 개선하는 방법은?**

LCP 이미지를 preload하고 fetchpriority="high"를 설정합니다. 이미지 포맷을 WebP/AVIF로 최적화하고, CDN을 사용합니다. Critical CSS를 인라인하고 렌더 블로킹 JS를 제거하거나 defer합니다. 서버 응답 시간(TTFB)도 개선해야 합니다.

**Q. CLS가 발생하는 원인과 해결책은?**

크기가 지정되지 않은 이미지, 동적으로 삽입되는 콘텐츠, 웹폰트 로드가 주요 원인입니다. 이미지에 width/height 또는 aspect-ratio를 명시하고, 동적 콘텐츠 공간을 미리 예약합니다. 웹폰트는 font-display: swap이나 optional을 사용하고 preload합니다.

**Q. INP와 FID의 차이는?**

FID는 첫 번째 상호작용의 지연만 측정했지만, INP는 페이지 수명 전체에서 모든 상호작용 중 가장 느린 것을 측정합니다. INP가 실제 사용자 경험을 더 잘 반영하여 FID를 대체했습니다.

**Q. Long Tasks를 어떻게 해결하나요?**

50ms 이상 걸리는 작업을 청크로 분할합니다. setTimeout(0)이나 scheduler.yield()로 브라우저에 제어권을 양보합니다. 무거운 계산은 Web Worker로 옮기고, React에서는 useTransition으로 긴급하지 않은 업데이트를 지연시킵니다.

**Q. Lab Data와 Field Data의 차이?**

Lab Data는 통제된 환경(DevTools, Lighthouse)에서 측정하며 디버깅에 유용합니다. Field Data는 실제 사용자 환경(CrUX, web-vitals)에서 수집하며 실제 성능을 반영합니다. 두 데이터가 다를 수 있으므로 둘 다 확인해야 합니다.