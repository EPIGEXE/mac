# script 태그의 async/defer

## 기본 동작 (속성 없음)

```html
<script src="script.js"></script>
```

```
HTML: ──────█████████████──────────────────────▶
            ↑ 파싱 중단
JS:         ████ 다운로드 ████ 실행 ████
                               ↓ 파싱 재개
```

- 브라우저가 `<script>`를 만나면 **HTML 파싱을 멈춤**
- 스크립트 다운로드 완료 후 실행
- 실행 완료 후 HTML 파싱 재개
- **문제:** JS 파일이 크면 페이지 렌더링이 지연됨

## async

```html
<script src="script.js" async></script>
```

```
HTML: ──────────────────────────█████──────────▶
                                ↑ 잠시 중단
JS:         ████ 다운로드 ████ 실행 ████
            (파싱과 병렬)       ↓ 파싱 재개
```

- HTML 파싱과 **병렬로 다운로드**
- 다운로드 완료 즉시 **파싱을 멈추고 실행**
- 실행 순서 보장 안 됨 (다운로드 완료 순)

**용도:** 독립적인 스크립트
- Google Analytics
- 광고 스크립트
- 챗봇

```html
<!-- 순서 보장 안 됨 - b.js가 먼저 다운되면 먼저 실행 -->
<script src="a.js" async></script>
<script src="b.js" async></script>
```

## defer

```html
<script src="script.js" defer></script>
```

```
HTML: ──────────────────────────────────────────▶ 파싱 완료
                                                 ↓
JS:         ████ 다운로드 ████                  ████ 실행 ████
            (파싱과 병렬)
```

- HTML 파싱과 **병렬로 다운로드**
- HTML 파싱이 **완전히 끝난 후 실행**
- 선언 순서대로 실행 보장

**용도:** 대부분의 JavaScript
- DOM 조작 스크립트
- 순서가 중요한 스크립트
- 메인 애플리케이션 코드

```html
<!-- 순서 보장됨 - 항상 a.js → b.js 순서로 실행 -->
<script src="a.js" defer></script>
<script src="b.js" defer></script>
```

## 비교 표

| 속성 | 다운로드 | 실행 시점 | 순서 보장 | 용도 |
|------|----------|-----------|-----------|------|
| 없음 | 파싱 중단 후 | 다운로드 직후 | O | 레거시, 인라인 |
| async | 파싱과 병렬 | 다운로드 완료 즉시 | X | 독립 스크립트 (분석, 광고) |
| defer | 파싱과 병렬 | 파싱 완료 후 | O | 대부분의 JS |

## DOMContentLoaded와의 관계

```javascript
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 준비 완료');
});
```

| 속성 | DOMContentLoaded 전/후 |
|------|------------------------|
| 없음 | 스크립트 실행 후 DOMContentLoaded |
| async | 순서 보장 안 됨 (전일 수도, 후일 수도) |
| defer | defer 스크립트 모두 실행 후 DOMContentLoaded |

```
defer 스크립트들 실행 → DOMContentLoaded 발생 → load 발생
```

## type="module"

ES 모듈은 **기본적으로 defer처럼 동작**합니다.

```html
<!-- 이 둘은 동일하게 동작 -->
<script type="module" src="app.js"></script>
<script src="app.js" defer></script>
```

```html
<!-- 모듈에 async 적용 가능 -->
<script type="module" src="analytics.js" async></script>
```

## 인라인 스크립트

| 속성 | 외부 스크립트 | 인라인 스크립트 |
|------|---------------|-----------------|
| async | 동작함 | **동작 안 함** |
| defer | 동작함 | **동작 안 함** |

```html
<!-- async/defer 무시됨 - 즉시 실행 -->
<script async>
  console.log('즉시 실행됨');
</script>

<!-- 단, type="module"은 인라인에서도 defer처럼 동작 -->
<script type="module">
  console.log('파싱 완료 후 실행');
</script>
```

## 실무 선택 가이드

```
메인 애플리케이션 JS?
└─ defer (또는 body 끝에 배치)

서드파티 스크립트? (분석, 광고, 챗봇)
└─ async

순서가 중요한 여러 스크립트?
└─ defer

ES 모듈?
└─ type="module" (기본 defer 동작)
```

## Next.js에서 스크립트 로딩

```jsx
import Script from 'next/script';

// defer처럼 동작 (기본값)
<Script src="/script.js" />

// async처럼 동작
<Script src="/analytics.js" strategy="lazyOnload" />

// 페이지 인터랙티브 후 로드
<Script src="/chat.js" strategy="afterInteractive" />

// 가장 먼저 로드 (blocking)
<Script src="/critical.js" strategy="beforeInteractive" />
```

| strategy | 동작 |
|----------|------|
| beforeInteractive | head에 blocking으로 삽입 |
| afterInteractive | 페이지 인터랙티브 후 (기본값) |
| lazyOnload | 브라우저 idle 시간에 |
| worker | Web Worker에서 실행 (실험적) |

## body 끝에 배치 vs defer

```html
<!-- 방법 1: body 끝에 배치 -->
<body>
  ...콘텐츠...
  <script src="app.js"></script>
</body>

<!-- 방법 2: head에 defer -->
<head>
  <script src="app.js" defer></script>
</head>
```

| 비교 | body 끝 | head + defer |
|------|---------|--------------|
| 다운로드 시작 | HTML 파싱 끝나갈 때 | HTML 파싱 초반 |
| 실행 시점 | 파싱 완료 후 | 파싱 완료 후 |
| 성능 | 약간 느림 | **더 빠름** (병렬 다운로드) |

**결론:** `defer`가 더 좋음 (다운로드를 일찍 시작)

## Study

**Q. async와 defer의 차이?**

둘 다 HTML 파싱과 병렬로 스크립트를 다운로드합니다. 차이는 실행 시점입니다. async는 다운로드 완료 즉시 파싱을 멈추고 실행하고, defer는 HTML 파싱이 완전히 끝난 후 실행합니다. 또한 async는 실행 순서가 보장되지 않지만, defer는 선언 순서대로 실행됩니다.

**Q. 언제 async를 쓰고 언제 defer를 쓰나요?**

async는 다른 스크립트나 DOM에 의존하지 않는 독립적인 스크립트에 사용합니다. Google Analytics, 광고, 챗봇 같은 서드파티 스크립트가 대표적입니다. defer는 DOM 조작이 필요하거나 다른 스크립트와 순서가 중요한 경우에 사용합니다. 대부분의 메인 애플리케이션 코드는 defer가 적합합니다.

**Q. script를 body 끝에 넣는 것과 defer의 차이?**

둘 다 HTML 파싱이 끝난 후 스크립트가 실행됩니다. 하지만 defer는 HTML 파싱 초반부터 스크립트 다운로드를 병렬로 시작하고, body 끝에 넣으면 파싱이 거의 끝날 때 다운로드를 시작합니다. 따라서 defer가 다운로드를 일찍 시작해서 성능이 더 좋습니다.

**Q. type="module"의 특징은?**

ES 모듈 스크립트는 기본적으로 defer처럼 동작합니다. HTML 파싱과 병렬로 다운로드하고, 파싱 완료 후 실행됩니다. async 속성을 추가하면 async처럼 동작하게 할 수도 있습니다.