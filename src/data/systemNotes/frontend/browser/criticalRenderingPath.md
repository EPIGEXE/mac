# Critical Rendering Path (CRP)

## CRP란?

브라우저가 HTML, CSS, JavaScript를 받아서 **첫 번째 픽셀을 화면에 렌더링하기까지의 과정**입니다.

```
DOM 구성 → CSSOM 구성 → 렌더 트리 생성 → 레이아웃 → 페인트
```

브라우저 렌더링 과정과 동일해 보이지만, CRP를 따로 언급하는 이유는 **리소스를 받은 시점부터 최초 렌더링까지의 시간을 최적화**하는 것이 웹 성능에서 중요하기 때문입니다.

## 렌더링 차단 리소스

### CSS는 렌더링을 차단한다

```html
<!-- 이 CSS가 로드되기 전까지 렌더링 대기 -->
<link rel="stylesheet" href="styles.css">
```

- CSS가 로드되기 전까지 **렌더 트리 생성을 차단**
- 이유: CSS 없이 렌더링하면 스타일 없는 HTML이 잠깐 보였다가 CSS 적용 후 화면이 바뀌는 현상 발생
- 이 현상을 **FOUC(Flash of Unstyled Content)** 라고 함

### JavaScript는 파싱을 차단한다

```html
<!-- 이 스크립트가 실행되기 전까지 HTML 파싱 중단 -->
<script src="app.js"></script>
```

- JavaScript가 실행되기 전까지 **HTML 파싱을 차단**
- 이유: JavaScript가 DOM 구조를 변경할 수 있기 때문

## CRP 최적화 전략

### 1. JavaScript 로딩 최적화

```html
<!-- 파싱 차단 (기본) -->
<script src="app.js"></script>

<!-- HTML 파싱 완료 후 실행 -->
<script src="app.js" defer></script>

<!-- 병렬 다운로드, 완료 즉시 실행 -->
<script src="analytics.js" async></script>

<!-- 모듈 방식 (자동 defer) -->
<script type="module" src="app.js"></script>
```

| 속성 | 다운로드 | 실행 시점 | 실행 순서 |
|------|----------|-----------|-----------|
| 없음 | 파싱 차단 | 즉시 | 순서 보장 |
| defer | 병렬 | DOM 파싱 완료 후 | 순서 보장 |
| async | 병렬 | 다운로드 완료 즉시 | 순서 보장 안됨 |
| type="module" | 병렬 | DOM 파싱 완료 후 | 순서 보장 |

**사용 기준:**
- `defer`: 메인 애플리케이션 스크립트 (DOM 필요, 순서 중요)
- `async`: 독립적인 스크립트 (분석, 광고 등)

### 2. 리소스 힌트 (Resource Hints)

```html
<!-- 중요 리소스 미리 로드 -->
<link rel="preload" as="font" href="/font.woff2" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="/hero.jpg">

<!-- 다음 페이지에 필요한 리소스 미리 가져오기 -->
<link rel="prefetch" href="/next-page.bundle.js" as="script">

<!-- DNS 미리 연결 -->
<link rel="preconnect" href="https://api.example.com">
```

| 힌트 | 용도 | 우선순위 |
|------|------|----------|
| preload | 현재 페이지에 필수인 리소스 | 높음 |
| prefetch | 다음 페이지에 필요할 리소스 | 낮음 (유휴 시간) |
| preconnect | 외부 도메인 연결 미리 수립 | - |

### 3. 폰트 최적화

```css
@font-face {
  font-family: 'MyFont';
  src: url('myfont.woff2') format('woff2');
  font-display: swap;
}
```

**font-display 옵션:**

| 값 | 동작 |
|-----|------|
| swap | 시스템 폰트로 먼저 표시, 로드 후 교체 |
| fallback | 짧은 대기 후 시스템 폰트, 로드되면 교체 |
| optional | 즉시 사용 가능하면 적용, 아니면 시스템 폰트 유지 |

**폰트 최적화 팁:**
- WOFF2 포맷 사용 (압축률 높음)
- 필요한 글자만 포함 (서브셋)
- preload로 미리 로드

### 4. 이미지 최적화

```html
<!-- Lazy Loading -->
<img src="thumb.webp" loading="lazy" alt="Thumbnail">

<!-- 반응형 이미지 -->
<img 
  srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
  sizes="(max-width: 600px) 400px, 800px"
  src="medium.jpg"
  alt="Responsive"
>
```

**최적화 방법:**

| 방법 | 설명 |
|------|------|
| 포맷 | WebP, AVIF 사용 (JPEG 대비 30~50% 용량 감소) |
| Lazy Loading | 뷰포트 진입 전까지 로드 지연 |
| 반응형 이미지 | 화면 크기에 맞는 이미지 제공 |
| CDN | 이미지 전용 CDN으로 캐싱 및 최적화 |

### 5. Critical CSS (인라인 CSS)

```html
<head>
  <!-- 초기 렌더링에 필요한 CSS만 인라인 -->
  <style>
    .header { ... }
    .hero { ... }
  </style>
  
  <!-- 나머지 CSS는 비동기 로드 -->
  <link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'">
</head>
```

- 첫 화면(Above the Fold)에 필요한 CSS만 인라인으로 삽입
- 나머지 CSS는 비동기로 로드
- 초기 렌더링 차단 시간 단축

## 최적화 체크리스트

| 항목 | 방법 |
|------|------|
| JavaScript | defer/async 사용, body 하단 배치 |
| CSS | Critical CSS 인라인, 나머지 비동기 |
| 폰트 | preload + font-display: swap |
| 이미지 | WebP/AVIF, lazy loading, 반응형 |
| 외부 리소스 | preconnect로 연결 미리 수립 |

## Next.js에서의 CRP 최적화

Next.js는 대부분의 CRP 최적화를 자동으로 처리합니다.

```jsx
// next/font - 폰트 자동 최적화
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

// next/image - 이미지 자동 최적화
import Image from 'next/image';
<Image src="/hero.jpg" priority />  // LCP 이미지는 priority 추가

// next/script - 스크립트 로딩 전략
import Script from 'next/script';
<Script src="/analytics.js" strategy="lazyOnload" />
```

| Next.js 기능 | 자동 최적화 내용 |
|--------------|------------------|
| next/font | 폰트 프리로드, font-display: swap |
| next/image | WebP 변환, lazy loading, 반응형 |
| next/script | defer/async 자동 적용 |
| CSS | Critical CSS 자동 추출 (App Router) |