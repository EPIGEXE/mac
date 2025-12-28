# Next.js

## Next.js란?

**React 기반의 풀스택 웹 프레임워크**입니다. Vercel에서 개발하며, 서버 사이드 렌더링(SSR), 정적 사이트 생성(SSG), 파일 기반 라우팅 등을 제공합니다.

React만으로는 클라이언트 사이드 렌더링(CSR)만 가능합니다. Next.js는 React 위에 **서버 렌더링, 라우팅, 빌드 최적화, API 라우트** 등을 추가하여 프로덕션 수준의 웹 애플리케이션을 쉽게 만들 수 있게 합니다.

### 왜 Next.js를 사용하는가?

| 이유 | 설명 |
|------|------|
| **SEO 최적화** | SSR/SSG로 검색 엔진이 콘텐츠를 크롤링 가능 |
| **빠른 초기 로딩** | 서버에서 HTML 생성하여 전송 |
| **파일 기반 라우팅** | 폴더 구조가 곧 URL 구조 |
| **풀스택 개발** | API Routes로 백엔드 로직 포함 |
| **자동 코드 분할** | 페이지별로 필요한 코드만 로드 |
| **이미지 최적화** | 자동 리사이징, 레이지 로딩, WebP 변환 |
| **Zero Config** | 복잡한 설정 없이 바로 시작 |

### React vs Next.js

| 구분 | React (CRA) | Next.js |
|------|-------------|---------|
| 렌더링 | CSR만 | SSR, SSG, ISR, CSR |
| 라우팅 | react-router 별도 설치 | 파일 기반 내장 |
| SEO | 어려움 (빈 HTML) | 용이 (서버 렌더링) |
| API | 별도 서버 필요 | API Routes 내장 |
| 빌드 | Webpack 직접 설정 | 자동 최적화 |
| 배포 | 정적 파일 | Vercel, Node 서버 등 |

---

## 렌더링 전략

Next.js의 핵심은 **다양한 렌더링 전략**을 페이지/컴포넌트 단위로 선택할 수 있다는 것입니다.

### CSR (Client-Side Rendering)

**브라우저에서 JavaScript로 렌더링**합니다. 전통적인 React 방식입니다.

- 초기 로딩: 빈 HTML → JS 다운로드 → 렌더링
- SEO 불리 (검색 엔진이 JS 실행 못함)
- 사용 사례: 대시보드, 로그인 후 페이지

### SSR (Server-Side Rendering)

**매 요청마다 서버에서 HTML을 생성**합니다.

- 초기 로딩: 완성된 HTML 전송 → Hydration
- SEO 유리, 항상 최신 데이터
- 서버 부하 있음
- 사용 사례: 사용자별 맞춤 페이지, 실시간 데이터

### SSG (Static Site Generation)

**빌드 시점에 HTML을 미리 생성**합니다.

- 빌드 시: HTML 생성 → CDN에 배포
- 가장 빠름 (CDN 캐싱)
- 빌드 후 데이터 변경 불가
- 사용 사례: 블로그, 문서, 마케팅 페이지

### ISR (Incremental Static Regeneration)

**SSG + 주기적 재생성**. 정적 페이지를 일정 시간마다 백그라운드에서 다시 생성합니다.

- SSG의 성능 + 데이터 갱신 가능
- `revalidate` 옵션으로 재생성 주기 설정
- 사용 사례: 상품 페이지, 뉴스 (분/시간 단위 갱신)

### 렌더링 전략 비교

| 전략 | 생성 시점 | 데이터 신선도 | 성능 | SEO |
|------|----------|-------------|------|-----|
| CSR | 브라우저 | 항상 최신 | 초기 느림 | 불리 |
| SSR | 매 요청 | 항상 최신 | 중간 | 유리 |
| SSG | 빌드 시 | 빌드 시점 | 가장 빠름 | 유리 |
| ISR | 빌드 + 재생성 | 주기적 갱신 | 빠름 | 유리 |

---

## App Router vs Pages Router

Next.js 13부터 **App Router**가 도입되었습니다. 기존 Pages Router도 계속 지원됩니다.

| 구분 | Pages Router | App Router |
|------|--------------|------------|
| 디렉토리 | `pages/` | `app/` |
| 도입 시기 | Next.js 초기 | Next.js 13+ |
| 컴포넌트 | 클라이언트 기본 | **서버 컴포넌트 기본** |
| 레이아웃 | `_app.js`, `_document.js` | `layout.js` (중첩 가능) |
| 데이터 페칭 | `getServerSideProps` 등 | `fetch()` + 캐싱 옵션 |
| 로딩 UI | 직접 구현 | `loading.js` 내장 |
| 에러 처리 | `_error.js` | `error.js` (경로별) |

**App Router를 권장**합니다. 서버 컴포넌트, 스트리밍, 중첩 레이아웃 등 최신 기능을 사용할 수 있습니다.

---

## 파일 기반 라우팅 (App Router)

### 기본 라우팅

폴더 구조가 URL 경로가 됩니다. `page.js`(또는 `.tsx`)가 해당 경로의 페이지입니다.

```
app/
├── page.js              → /
├── about/
│   └── page.js          → /about
├── blog/
│   ├── page.js          → /blog
│   └── [slug]/
│       └── page.js      → /blog/:slug (동적)
└── shop/
    └── [...slug]/
        └── page.js      → /shop/* (Catch-all)
```

### 특수 파일

| 파일 | 역할 |
|------|------|
| `page.js` | 해당 경로의 UI |
| `layout.js` | 공유 레이아웃 (하위 경로에 적용) |
| `loading.js` | 로딩 UI (Suspense 경계) |
| `error.js` | 에러 UI (Error Boundary) |
| `not-found.js` | 404 페이지 |
| `route.js` | API 엔드포인트 |

### 동적 라우팅

```
app/
├── blog/
│   └── [slug]/           → /blog/hello-world
│       └── page.js
├── shop/
│   └── [...categories]/  → /shop/a/b/c (Catch-all)
│       └── page.js
└── docs/
    └── [[...slug]]/      → /docs 또는 /docs/a/b (Optional)
        └── page.js
```

```typescript
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>;
}
```

### 레이아웃

`layout.js`는 **하위 모든 페이지에 공유**됩니다. 중첩 레이아웃이 가능합니다. 루트 레이아웃에서 `<html>`, `<body>` 태그를 정의하고, 각 섹션별 레이아웃(대시보드, 블로그 등)을 추가로 중첩할 수 있습니다.

---

## 서버 컴포넌트 vs 클라이언트 컴포넌트

App Router의 핵심 개념입니다. **기본값이 서버 컴포넌트**입니다.

### 서버 컴포넌트 (Server Components)

**서버에서만 실행**됩니다. JavaScript가 클라이언트로 전송되지 않습니다.

```typescript
// 서버 컴포넌트 (기본값)
async function UserList() {
  const users = await db.users.findMany();  // 직접 DB 접근!
  
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

| 특징 | 설명 |
|------|------|
| DB/파일 직접 접근 | API 없이 서버 리소스 접근 |
| 번들 크기 감소 | JS가 클라이언트로 안 감 |
| 민감한 정보 안전 | API 키 등 노출 안 됨 |
| **제약**: 상태/이벤트 불가 | useState, onClick 등 사용 불가 |

### 클라이언트 컴포넌트 (Client Components)

**브라우저에서 실행**됩니다. `'use client'` 지시어를 파일 상단에 추가합니다.

```typescript
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

| 특징 | 설명 |
|------|------|
| 상태 관리 | useState, useReducer |
| 이벤트 핸들러 | onClick, onChange 등 |
| 브라우저 API | window, localStorage |
| 라이프사이클 | useEffect |

### 선택 기준

| 필요한 기능 | 서버 | 클라이언트 |
|------------|------|-----------|
| DB/API 키 접근 | ✅ | ❌ |
| 무거운 의존성 | ✅ (번들 제외) | ❌ |
| useState, useEffect | ❌ | ✅ |
| onClick 등 이벤트 | ❌ | ✅ |
| 브라우저 API | ❌ | ✅ |

**전략**: 가능한 서버 컴포넌트를 사용하고, 인터랙션이 필요한 부분만 클라이언트 컴포넌트로 분리합니다.

---

## 데이터 페칭 (App Router)

App Router에서는 **서버 컴포넌트에서 직접 async/await**을 사용합니다.

### 기본 사용

```typescript
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`);
  const data = await product.json();
  
  return <div>{data.name}</div>;
}
```

### 캐싱 옵션

```typescript
// SSG (기본값) - 빌드 시 캐싱
fetch(url);
fetch(url, { cache: 'force-cache' });

// SSR - 매 요청마다 새로 페칭
fetch(url, { cache: 'no-store' });

// ISR - 60초마다 재검증
fetch(url, { next: { revalidate: 60 } });
```

### 페이지 레벨 설정

```typescript
// 전체 페이지를 동적으로
export const dynamic = 'force-dynamic';  // SSR

// 전체 페이지를 정적으로
export const dynamic = 'force-static';   // SSG

// ISR
export const revalidate = 60;  // 60초마다 재생성
```

---

## API Routes

### App Router (Route Handlers)

`app/api/` 폴더에 `route.js`를 생성합니다. HTTP 메서드명(GET, POST 등)으로 함수를 export합니다.

```typescript
// app/api/users/route.ts
export async function GET() {
  const users = await db.users.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.users.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

동적 라우트는 `app/api/users/[id]/route.ts`처럼 폴더를 만들고, 함수의 두 번째 인자에서 `params`를 받습니다.

---

## 이미지 최적화

`next/image`는 자동으로 이미지를 최적화합니다.

```typescript
import Image from 'next/image';

export default function Profile() {
  return (
    <Image
      src="/profile.jpg"
      alt="Profile"
      width={500}
      height={300}
      priority  // LCP 이미지에 사용
    />
  );
}
```

| 기능 | 설명 |
|------|------|
| 자동 리사이징 | 디바이스에 맞는 크기 제공 |
| 레이지 로딩 | 뷰포트 진입 시 로드 |
| WebP/AVIF | 모던 포맷 자동 변환 |
| 플레이스홀더 | blur, empty 옵션 |
| 외부 이미지 | `next.config.js`에 도메인 설정 필요 |

---

## 메타데이터 / SEO

페이지에서 `metadata` 객체를 export하면 `<title>`, `<meta>` 태그가 생성됩니다. 동적 메타데이터는 `generateMetadata()` async 함수를 사용합니다.

```typescript
// 정적
export const metadata = { title: 'About', description: '...' };

// 동적
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  return { title: product.name };
}
```

---

## 미들웨어

**모든 요청 전에 실행**되는 코드입니다. 인증, 리다이렉트, 헤더 수정 등에 사용합니다. 루트에 `middleware.ts`를 생성하고, `config.matcher`로 적용 경로를 지정합니다.

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
```

---

## 배포

| 방법 | 설명 |
|------|------|
| **Vercel** | Next.js 제작사. Git 연동으로 자동 배포, 가장 쉽고 최적화됨 |
| **셀프 호스팅** | `npm run build` → `npm run start`로 Node.js 서버 실행 |
| **정적 내보내기** | `output: 'export'` 설정으로 정적 파일만 생성 (SSG만 사용 시) |

---

## 면접 예상 질문

**Q. Next.js란?**

React 기반 풀스택 프레임워크입니다. SSR, SSG, ISR 등 다양한 렌더링 전략, 파일 기반 라우팅, API Routes, 이미지 최적화 등을 제공합니다. SEO와 초기 로딩 성능이 중요한 프로젝트에 적합합니다.

**Q. SSR, SSG, ISR의 차이?**

SSR은 매 요청마다 서버에서 HTML을 생성합니다. SSG는 빌드 시 HTML을 미리 생성하여 CDN에서 제공합니다. ISR은 SSG에 주기적 재생성을 추가하여 정적 성능과 데이터 갱신을 모두 얻습니다.

**Q. 서버 컴포넌트와 클라이언트 컴포넌트의 차이?**

서버 컴포넌트는 서버에서만 실행되어 DB 직접 접근이 가능하고 번들에 포함되지 않습니다. 클라이언트 컴포넌트는 브라우저에서 실행되어 useState, onClick 등 인터랙션이 가능합니다. 'use client' 지시어로 클라이언트 컴포넌트를 명시합니다.

**Q. App Router와 Pages Router의 차이?**

App Router는 Next.js 13+의 새 라우팅으로 서버 컴포넌트가 기본입니다. layout.js로 중첩 레이아웃, loading.js로 로딩 UI를 제공합니다. Pages Router는 기존 방식으로 getServerSideProps 등을 사용합니다.

**Q. Next.js에서 데이터 페칭 방법?**

App Router에서는 서버 컴포넌트에서 async/await로 직접 fetch합니다. cache 옵션으로 SSG(force-cache), SSR(no-store), ISR(revalidate)을 선택합니다. Pages Router에서는 getServerSideProps(SSR), getStaticProps(SSG)를 사용합니다.

**Q. 미들웨어의 역할?**

모든 요청 전에 실행되는 코드입니다. 인증 체크 후 리다이렉트, 헤더 수정, 지역화 등에 사용합니다. 루트의 middleware.ts에 작성하고 matcher로 적용 경로를 지정합니다.