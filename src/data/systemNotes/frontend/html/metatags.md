# meta 태그

## meta 태그란?

HTML 문서의 **메타데이터(문서에 대한 정보)**를 정의하는 태그

- 페이지에 보이지 않음
- 브라우저, 검색엔진, 소셜미디어가 페이지를 해석하는 데 사용

---

## 필수 meta 태그

```html
<head>
  <!-- 1. 문자 인코딩 (가장 먼저!) -->
  <meta charset="UTF-8">
  
  <!-- 2. 뷰포트 설정 (반응형 필수) -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- 3. 페이지 제목 -->
  <title>페이지 제목</title>
  
  <!-- 4. 페이지 설명 (SEO) -->
  <meta name="description" content="페이지에 대한 설명">
</head>
```

---

## 카테고리별 meta 태그

### 1. 문서 기본 정보

```html
<!-- 문자 인코딩 -->
<meta charset="UTF-8">

<!-- 작성자 -->
<meta name="author" content="김개발">
```

### 2. 브라우저 동작 제어

```html
<!-- 뷰포트 설정 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**viewport 옵션:**

| 옵션 | 설명 |
|------|------|
| width=device-width | 디바이스 너비에 맞춤 |
| initial-scale=1.0 | 초기 확대 비율 |
| user-scalable=no | 사용자 확대/축소 금지 (접근성 문제로 비권장) |
| maximum-scale=1.0 | 최대 확대 비율 제한 |

```html
<!-- 접근성을 고려한 viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 확대 제한 (비권장 - 시각장애인 접근성 저해) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 3. SEO (검색엔진 최적화)

```html
<!-- 페이지 설명 - 검색 결과 스니펫에 표시 -->
<meta name="description" content="React 완벽 가이드 - 초보자부터 전문가까지">

<!-- 크롤링/인덱싱 제어 -->
<meta name="robots" content="index, follow">
```

**robots 옵션:**

| 값 | 설명 |
|----|------|
| index | 검색 결과에 포함 |
| noindex | 검색 결과에서 제외 |
| follow | 페이지 내 링크 따라감 |
| nofollow | 페이지 내 링크 무시 |

```html
<!-- 검색에 포함, 링크 따라감 (기본값) -->
<meta name="robots" content="index, follow">

<!-- 검색에서 완전히 제외 (관리자 페이지 등) -->
<meta name="robots" content="noindex, nofollow">

<!-- 검색에는 포함하지만 링크는 무시 -->
<meta name="robots" content="index, nofollow">
```

```html
<!-- 정규 URL 지정 (중복 콘텐츠 방지) -->
<link rel="canonical" href="https://example.com/page">
```

### 4. 소셜 미디어 (Open Graph)

링크 공유 시 미리보기를 결정합니다.

```html
<!-- Open Graph (페이스북, 카카오톡, 슬랙 등) -->
<meta property="og:title" content="페이지 제목">
<meta property="og:description" content="페이지 설명">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="페이지 제목">
<meta name="twitter:description" content="페이지 설명">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

**og:type 값:**

| 값 | 용도 |
|----|------|
| website | 일반 웹사이트 |
| article | 블로그 글, 뉴스 기사 |
| product | 상품 페이지 |

---

## 성능 최적화

### 1. meta 태그 순서가 중요

```html
<!-- ❌ 잘못된 순서 -->
<head>
  <title>페이지</title>
  <link rel="stylesheet" href="style.css">
  <meta charset="UTF-8">  <!-- 너무 늦음! 브라우저가 다시 파싱 -->
</head>

<!-- ✅ 올바른 순서 -->
<head>
  <meta charset="UTF-8">  <!-- 1. 가장 먼저 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">  <!-- 2. 그다음 -->
  <title>페이지</title>
  <meta name="description" content="...">
  <link rel="stylesheet" href="style.css">
</head>
```

**왜?** 브라우저가 charset을 늦게 발견하면 이미 파싱한 내용을 다시 해석해야 합니다.

### 2. viewport 없으면 성능 저하

```html
<!-- viewport 없음 -->
브라우저: 980px 기준으로 렌더링 → 모바일 화면에 맞게 축소
         → 불필요한 연산 + 글자가 작아짐

<!-- viewport 있음 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
브라우저: 디바이스 너비로 바로 렌더링 → 최적화됨
```

### 3. 리소스 힌트 (link 태그)

```html
<!-- DNS 미리 연결 -->
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="preconnect" href="https://api.example.com">

<!-- 중요 리소스 미리 로드 -->
<link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.jpg" as="image">
```

---

## Next.js에서 meta 태그

### App Router (Next.js 13+)

```tsx
// app/page.tsx
export const metadata = {
  title: '페이지 제목',
  description: '페이지 설명',
  openGraph: {
    title: '페이지 제목',
    description: '페이지 설명',
    images: ['/og-image.jpg'],
  },
};

export default function Page() {
  return <div>...</div>;
}
```

### 동적 메타데이터

```tsx
// app/posts/[id]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.id);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.thumbnail],
    },
  };
}
```

---

## 완성된 head 예시

```html
<head>
  <!-- 필수 -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>사이트명 | 페이지 제목</title>
  <meta name="description" content="150자 이내의 페이지 설명">
  
  <!-- SEO -->
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://example.com/page">
  
  <!-- Open Graph -->
  <meta property="og:title" content="페이지 제목">
  <meta property="og:description" content="페이지 설명">
  <meta property="og:image" content="https://example.com/og.jpg">
  <meta property="og:url" content="https://example.com/page">
  <meta property="og:type" content="website">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  
  <!-- 성능 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- 스타일/스크립트 -->
  <link rel="stylesheet" href="/styles.css">
</head>
```

---

## Study

**Q. viewport meta 태그가 왜 필요한가요?**

모바일 브라우저는 기본적으로 980px 너비로 페이지를 렌더링한 후 화면에 맞게 축소합니다. viewport 태그로 `width=device-width`를 설정하면 디바이스 너비에 맞게 바로 렌더링되어 반응형 디자인이 제대로 동작하고 성능도 향상됩니다.

**Q. Open Graph 태그가 뭔가요?**

페이스북이 만든 프로토콜로, 링크를 공유할 때 미리보기(제목, 설명, 이미지)를 결정합니다. 카카오톡, 슬랙, 트위터 등 대부분의 플랫폼이 og 태그를 읽어서 링크 미리보기를 생성합니다.

**Q. meta 태그 순서가 왜 중요한가요?**

charset이 늦게 선언되면 브라우저가 이미 파싱한 내용을 다시 해석해야 해서 성능이 저하됩니다. charset과 viewport는 head 태그의 가장 앞에 위치해야 합니다.

**Q. robots meta 태그로 뭘 할 수 있나요?**

검색엔진 크롤러의 동작을 제어합니다. `noindex`로 검색 결과에서 제외하고, `nofollow`로 페이지 내 링크를 따라가지 않게 할 수 있습니다. 관리자 페이지나 비공개 페이지에 주로 사용합니다.