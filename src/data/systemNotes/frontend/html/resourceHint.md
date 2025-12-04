# 리소스 힌트 (Resource Hints)

## 개요

브라우저에게 리소스 로딩 방법을 미리 알려주어 성능을 최적화하는 기법

```html
<link rel="dns-prefetch" ...>  <!-- DNS만 미리 -->
<link rel="preconnect" ...>    <!-- DNS + TCP + TLS 미리 -->
<link rel="preload" ...>       <!-- 지금 필요한 리소스 미리 다운로드 -->
<link rel="prefetch" ...>      <!-- 나중에 필요한 리소스 미리 다운로드 -->
```

## 연결 준비 단계

### dns-prefetch

**DNS 조회만 미리 수행**

```html
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//api.example.com">
```

- 도메인 → IP 변환을 미리 해둠
- 실제 요청 시 DNS 조회 시간 절약 (보통 20~120ms)
- 비용이 낮아서 여러 도메인에 적용 가능

### preconnect

**DNS + TCP + TLS 연결까지 미리 수행**

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.example.com">
```

- dns-prefetch보다 더 많은 준비를 미리 함
- 연결 비용이 있어서 중요한 도메인에만 사용 (2~4개 권장)
- 외부 폰트, 중요 API 서버에 적용

### dns-prefetch vs preconnect

```
dns-prefetch: [DNS 조회]
preconnect:   [DNS 조회] → [TCP 연결] → [TLS 핸드셰이크]
```

| 구분 | dns-prefetch | preconnect |
|------|--------------|------------|
| 수행 단계 | DNS만 | DNS + TCP + TLS |
| 비용 | 낮음 | 높음 |
| 권장 개수 | 많아도 OK | 2~4개 |
| 용도 | 덜 중요한 외부 도메인 | 중요한 외부 도메인 |

**실무 팁:** 둘 다 같이 쓰면 preconnect 미지원 브라우저에서 fallback

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="//fonts.gstatic.com">
```

## 리소스 로딩 단계

### preload

**현재 페이지에서 곧 필요한 리소스를 즉시 다운로드**

```html
<link rel="preload" href="/critical.css" as="style">
<link rel="preload" href="/hero.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.jpg" as="image">
```

- 높은 우선순위로 즉시 다운로드
- HTML 파싱과 병렬로 실행
- 초기 렌더링에 필수인 리소스에 사용

**as 속성 (필수):**

| 값 | 용도 |
|----|------|
| style | CSS 파일 |
| script | JavaScript 파일 |
| font | 폰트 파일 |
| image | 이미지 |
| fetch | fetch/XHR 요청 |

**주의:** preload한 리소스를 3초 내에 사용하지 않으면 콘솔 경고

```
The resource was preloaded using link preload but not used within a few seconds
```

### prefetch

**다음 페이지에서 필요한 리소스를 미리 다운로드**

```html
<link rel="prefetch" href="/next-page.js">
<link rel="prefetch" href="/dashboard.css">
```

- 낮은 우선순위로 브라우저 idle 시간에 다운로드
- 현재 페이지 로딩에 영향 없음
- 다음 페이지 방문 시 캐시에서 즉시 로드

**용도:**
- 다음 단계 페이지 리소스
- SPA 라우트별 chunk 파일
- 사용자가 높은 확률로 방문할 페이지

### preload vs prefetch

| 구분 | preload | prefetch |
|------|---------|----------|
| 우선순위 | 높음 | 낮음 |
| 시점 | 즉시 | idle 시간 |
| 용도 | 현재 페이지 필수 리소스 | 다음 페이지 리소스 |
| 미사용 시 | 경고 발생 | 괜찮음 |

## 사용 가이드

### 언제 무엇을 쓸까?

```
외부 도메인 연결?
├─ 중요함 (폰트, 메인 API) → preconnect
└─ 덜 중요함 → dns-prefetch

리소스 다운로드?
├─ 현재 페이지에서 곧 필요 → preload
└─ 다음 페이지에서 필요 → prefetch
```

### 실무 예시

```html
<head>
  <!-- 1. 외부 도메인 연결 준비 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="//analytics.example.com">
  
  <!-- 2. 현재 페이지 필수 리소스 -->
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/hero.webp" as="image">
  
  <!-- 3. 다음 페이지 리소스 (하단에 배치) -->
  <link rel="prefetch" href="/about.js">
</head>
```

### 주의사항

| 상황 | 권장 |
|------|------|
| preconnect 남용 | 2~4개로 제한 (연결 오버헤드) |
| 작은 파일 preload | 불필요 (인라인이 나음) |
| 사용 안 할 리소스 preload | 하지 않음 (경고 + 대역폭 낭비) |
| 모바일에서 prefetch | 신중하게 (데이터 사용량) |
| 방문 확률 낮은 페이지 prefetch | 하지 않음 |

## Next.js에서 활용

### next/font (자동 최적화)

```jsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Next.js가 자동으로 preconnect, preload 처리
```

### next/link (자동 prefetch)

```jsx
import Link from 'next/link';

// 뷰포트에 보이면 자동으로 해당 페이지 prefetch
<Link href="/about">About</Link>

// prefetch 비활성화
<Link href="/about" prefetch={false}>About</Link>
```

### 수동 설정

```jsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://api.example.com" />
        <link rel="preload" href="/hero.webp" as="image" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 요약 표

| 힌트 | 하는 일 | 우선순위 | 용도 |
|------|---------|----------|------|
| dns-prefetch | DNS 조회 | - | 외부 도메인 (다수 가능) |
| preconnect | DNS + TCP + TLS | - | 중요 외부 도메인 (2~4개) |
| preload | 리소스 다운로드 | 높음 | 현재 페이지 필수 리소스 |
| prefetch | 리소스 다운로드 | 낮음 | 다음 페이지 리소스 |

## Study

**Q. preload와 prefetch의 차이?**

preload는 현재 페이지에서 곧 필요한 리소스를 높은 우선순위로 즉시 다운로드합니다. prefetch는 다음 페이지에서 필요한 리소스를 브라우저 idle 시간에 낮은 우선순위로 다운로드합니다. preload한 리소스를 사용하지 않으면 경고가 발생합니다.

**Q. dns-prefetch와 preconnect의 차이?**

dns-prefetch는 DNS 조회만 미리 수행하고, preconnect는 DNS + TCP + TLS 연결까지 미리 수행합니다. preconnect가 더 많은 준비를 하지만 비용도 높아서 중요한 도메인 2~4개에만 사용하고, 나머지는 dns-prefetch를 사용합니다.

**Q. 언제 preload를 사용하나요?**

초기 렌더링에 필수적인 리소스에 사용합니다. 예를 들어 Hero 이미지, 웹폰트, Critical CSS 등입니다. HTML 파싱과 병렬로 다운로드되어 LCP(Largest Contentful Paint)를 개선할 수 있습니다. 단, 사용하지 않을 리소스를 preload하면 오히려 성능이 저하됩니다.