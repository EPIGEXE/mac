# CSR vs SSR

## 정의

| 구분 | 설명 |
|------|------|
| CSR (Client-Side Rendering) | 브라우저가 JS를 실행해서 DOM을 생성하고 화면을 렌더링 |
| SSR (Server-Side Rendering) | 서버가 완성된 HTML을 생성해서 브라우저에 전달 |

## 렌더링 흐름

### CSR

```
1. 브라우저 → 서버 요청
2. 서버 → 빈 HTML + JS 번들 응답
3. 브라우저 → JS 다운로드 및 실행
4. JS → API 호출 → 데이터 수신
5. JS → DOM 생성 → 화면 렌더링
```

```html
<!-- 서버가 보내는 HTML (거의 비어있음) -->
<html>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

### SSR

```
1. 브라우저 → 서버 요청
2. 서버 → 데이터 조회 → HTML 생성
3. 서버 → 완성된 HTML 응답
4. 브라우저 → HTML 즉시 렌더링 (화면 보임)
5. 브라우저 → JS 다운로드 및 실행 (Hydration)
6. 인터랙션 가능
```

```html
<!-- 서버가 보내는 HTML (내용이 있음) -->
<html>
  <body>
    <div id="root">
      <h1>안녕하세요</h1>
      <p>서버에서 렌더링된 콘텐츠입니다</p>
    </div>
    <script src="bundle.js"></script>
  </body>
</html>
```

## Hydration이란?

SSR로 받은 **정적 HTML에 JavaScript를 연결**해서 인터랙티브하게 만드는 과정입니다.

### 왜 필요한가?

SSR은 서버에서 HTML 문자열만 만들어서 보냅니다. 이 HTML에는 이벤트 핸들러가 없습니다.

```jsx
// 서버에서 이 컴포넌트를 렌더링하면
function Button() {
  return <button onClick={() => alert('clicked')}>클릭</button>;
}

// 이렇게 HTML 문자열만 나옴 (onClick 없음!)
<button>클릭</button>
```

브라우저에서 JS가 실행되면서 이 HTML에 이벤트 핸들러를 "붙여주는" 과정이 Hydration입니다.

### Hydration 과정

```
1. 서버: HTML 생성 → 브라우저로 전송
   <button>클릭</button>  ← 이벤트 없음, 껍데기만

2. 브라우저: HTML 즉시 렌더링 (화면에 보임)
   [클릭] ← 버튼 보이지만 눌러도 반응 없음

3. 브라우저: JS 번들 다운로드 및 실행

4. React: 기존 DOM과 Virtual DOM 비교 (reconciliation)
   "서버가 만든 HTML이랑 내가 만들 DOM이 같네, 재사용하자"

5. React: 이벤트 핸들러 연결 (Hydration 완료)
   [클릭] ← 이제 클릭하면 동작함
```

### Hydration 전 vs 후

| 상태 | 화면 | 인터랙션 |
|------|------|----------|
| Hydration 전 | 보임 | 안 됨 (클릭해도 반응 없음) |
| Hydration 후 | 보임 | 됨 (이벤트 동작) |

### Hydration Mismatch

서버에서 만든 HTML과 클라이언트에서 만든 DOM이 다르면 에러가 발생합니다.

```jsx
// ❌ Hydration 에러 발생
function Time() {
  return <span>{new Date().toLocaleTimeString()}</span>;
}
// 서버: 14:30:00 / 클라이언트: 14:30:01 → 불일치!

// ✅ 해결: useEffect로 클라이언트에서만 실행
function Time() {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);
  
  return <span>{time}</span>;
}
```

**흔한 Mismatch 원인:**
- `Date.now()`, `Math.random()` 등 실행 시점마다 다른 값
- `window`, `localStorage` 등 브라우저 전용 API
- 서버/클라이언트 시간대 차이

### Selective Hydration (React 18+)

React 18부터는 Suspense와 함께 부분적으로 Hydration이 가능합니다.

```jsx
<Layout>
  <Header />           {/* 먼저 Hydration */}
  <Suspense fallback={<Loading />}>
    <HeavyComponent /> {/* 나중에 Hydration */}
  </Suspense>
</Layout>
```

- 중요한 부분 먼저 인터랙티브하게 만들 수 있음
- 사용자가 클릭한 영역을 우선 Hydration (Selective Hydration)

## TTV vs TTI

| 지표 | 의미 | CSR | SSR |
|------|------|-----|-----|
| TTV (Time to View) | 콘텐츠가 보이는 시점 | 느림 | 빠름 |
| TTI (Time to Interactive) | 인터랙션 가능 시점 | TTV와 동시 | TTV 이후 (Hydration 필요) |

```
CSR:  [--------JS 로딩/실행--------][TTV + TTI]
SSR:  [--HTML--][TTV][-Hydration-][TTI]
```

**SSR의 함정:** 화면은 빨리 보이지만 버튼을 눌러도 반응이 없는 구간이 존재

## 비교 표

| 항목 | CSR | SSR |
|------|-----|-----|
| 초기 로딩 | 느림 (JS 실행 후 렌더링) | 빠름 (HTML 즉시 표시) |
| SEO | 불리 (빈 HTML) | 유리 (완성된 HTML) |
| 서버 부하 | 낮음 | 높음 (매 요청마다 렌더링) |
| 페이지 전환 | 빠름 (SPA) | 상대적 느림 |
| 인터랙션 시작 | JS 실행 완료 후 | Hydration 완료 후 |

## 장단점 정리

### CSR

| 장점 | 단점 |
|------|------|
| 페이지 전환이 빠름 (SPA) | 초기 로딩 느림 |
| 서버 부하 낮음 | SEO 불리 |
| 풍부한 인터랙션 | FCP(First Contentful Paint) 지연 |

### SSR

| 장점 | 단점 |
|------|------|
| 초기 화면 빠름 | 서버 부하 높음 |
| SEO 유리 | Hydration 전까지 인터랙션 불가 |
| 소셜 미리보기 (OG 태그) | 서버 비용 증가 |

## Next.js 렌더링 전략

Next.js는 페이지별로 다른 렌더링 전략을 선택할 수 있습니다.

### SSR (Server-Side Rendering)

**요청마다 서버에서 HTML을 생성**합니다.

```
사용자 요청 → 서버에서 데이터 조회 → HTML 생성 → 응답
```

```jsx
// Pages Router
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();
  
  return { props: { data } };
}

// App Router (기본값)
async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}
```

**장점:**
- 항상 최신 데이터
- SEO 유리

**단점:**
- 매 요청마다 서버 연산 → 서버 부하
- TTFB(Time to First Byte) 느림

**사용 시점:** 실시간 데이터, 사용자별 다른 내용 (마이페이지, 장바구니)

### SSG (Static Site Generation)

**빌드 시점에 HTML을 미리 생성**해둡니다.

```
빌드 시: 데이터 조회 → HTML 파일 생성 → 저장
요청 시: 미리 만든 HTML 즉시 응답 (서버 연산 없음)
```

```jsx
// Pages Router
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();
  
  return { props: { posts } };
}

// 동적 경로의 경우 어떤 경로를 생성할지 지정
export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: '1' } },
      { params: { id: '2' } },
    ],
    fallback: false,
  };
}
```

```jsx
// App Router
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'force-cache',  // SSG처럼 동작
  });
  return <div>{data}</div>;
}
```

**장점:**
- 매우 빠름 (CDN에서 정적 파일 제공)
- 서버 부하 없음

**단점:**
- 빌드 후 데이터 변경 반영 안 됨
- 빌드 시간이 페이지 수에 비례

**사용 시점:** 블로그, 문서, 마케팅 페이지 등 자주 안 바뀌는 콘텐츠

### ISR (Incremental Static Regeneration)

**SSG + 주기적 재생성**. 정적 페이지를 백그라운드에서 업데이트합니다.

```
빌드 시: HTML 생성
요청 시: 캐시된 HTML 응답
          + 설정된 시간 지나면 백그라운드에서 재생성
```

```jsx
// Pages Router
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();
  
  return {
    props: { products },
    revalidate: 60,  // 60초마다 재생성
  };
}
```

```jsx
// App Router
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 },  // 60초마다 재생성
  });
  return <div>{data}</div>;
}
```

**동작 방식:**

```
1. 첫 요청: 빌드 시 생성된 HTML 응답
2. 60초 내 요청: 캐시된 HTML 응답 (재생성 안 함)
3. 60초 후 요청: 
   - 일단 캐시된 HTML 응답 (사용자는 기다리지 않음)
   - 백그라운드에서 새 HTML 생성
4. 다음 요청: 새로 생성된 HTML 응답
```

**On-Demand ISR:** 특정 이벤트 시 수동으로 재생성

```jsx
// pages/api/revalidate.js
export default async function handler(req, res) {
  await res.revalidate('/products');  // /products 페이지 재생성
  return res.json({ revalidated: true });
}
```

**장점:**
- SSG의 속도 + 데이터 업데이트 가능
- 빌드 시간 단축 (필요할 때 생성)

**단점:**
- 완전한 실시간은 아님
- 첫 요청자는 오래된 데이터를 볼 수 있음

**사용 시점:** 상품 목록, 뉴스 등 가끔 업데이트되는 콘텐츠

### 렌더링 전략 비교

| 전략 | HTML 생성 시점 | 데이터 신선도 | 속도 | 서버 부하 |
|------|---------------|---------------|------|-----------|
| CSR | 브라우저 | 항상 최신 | 초기 느림 | 낮음 |
| SSR | 매 요청 | 항상 최신 | 중간 | 높음 |
| SSG | 빌드 시 | 빌드 시점 | 가장 빠름 | 없음 |
| ISR | 빌드 + 주기적 | 주기적 최신 | 빠름 | 낮음 |

### App Router: 서버 컴포넌트 vs 클라이언트 컴포넌트

Next.js 13+ App Router에서는 컴포넌트 단위로 렌더링 위치를 결정합니다.

```jsx
// 서버 컴포넌트 (기본값)
// - 서버에서만 실행
// - useState, useEffect 사용 불가
// - DB 직접 접근 가능
async function ProductList() {
  const products = await db.query('SELECT * FROM products');
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}

// 클라이언트 컴포넌트
// - 'use client' 명시 필요
// - useState, useEffect 사용 가능
// - 이벤트 핸들러 사용 가능
'use client';
function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);
  
  return (
    <button onClick={() => addToCart(productId)}>
      담기
    </button>
  );
}
```

**사용 패턴:** 서버 컴포넌트 안에 클라이언트 컴포넌트 배치

```jsx
// 서버 컴포넌트
async function ProductPage() {
  const product = await getProduct();  // 서버에서 데이터 조회
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <AddToCartButton productId={product.id} />  {/* 클라이언트 컴포넌트 */}
    </div>
  );
}
```

## 선택 가이드

| 상황 | 권장 |
|------|------|
| SEO 중요 (블로그, 쇼핑몰) | SSR 또는 SSG |
| 관리자 페이지, 대시보드 | CSR |
| 실시간 데이터 필요 | SSR |
| 정적 콘텐츠 (문서, 소개 페이지) | SSG |
| 자주 변경되는 정적 콘텐츠(마케팅, 랜딩 페이지 등) | ISR |

## Study

**Q. CSR과 SSR의 차이?**

CSR은 브라우저가 JS를 실행해서 화면을 그리고, SSR은 서버가 완성된 HTML을 보내줍니다. CSR은 초기 로딩이 느리지만 페이지 전환이 빠르고, SSR은 초기 화면이 빠르고 SEO에 유리하지만 서버 부하가 높습니다.

**Q. Hydration이란?**

SSR로 받은 정적 HTML에 JavaScript를 연결해서 인터랙티브하게 만드는 과정입니다. 서버가 보낸 HTML에는 이벤트 핸들러가 없어서, 브라우저에서 JS가 실행되면서 이벤트를 붙여줍니다. Hydration 전에는 화면은 보이지만 클릭 같은 인터랙션이 동작하지 않습니다.

**Q. Hydration Mismatch가 뭔가요?**

서버에서 렌더링한 HTML과 클라이언트에서 만든 DOM이 다를 때 발생하는 에러입니다. `Date.now()`, `Math.random()`, 브라우저 전용 API 등 서버와 클라이언트에서 다른 결과를 내는 코드가 원인입니다. useEffect로 클라이언트에서만 실행하도록 해결합니다.

**Q. SSR의 단점은?**

서버 부하가 높고, Hydration이 완료되기 전까지 인터랙션이 안 됩니다. 화면은 빨리 보이는데 버튼을 눌러도 반응이 없는 구간이 생길 수 있습니다. 이를 TTV와 TTI의 차이라고 합니다.

**Q. SSG와 SSR의 차이?**

SSG는 빌드 시점에 HTML을 미리 생성해두고, SSR은 요청마다 HTML을 생성합니다. SSG는 CDN에서 정적 파일을 제공하므로 매우 빠르고 서버 부하가 없지만, 빌드 후에는 데이터가 변경되어도 반영되지 않습니다. SSR은 항상 최신 데이터를 보여주지만 서버 부하가 높습니다.

**Q. ISR이란?**

Incremental Static Regeneration의 약자로, SSG의 장점과 데이터 업데이트를 결합한 방식입니다. 빌드 시 정적 페이지를 생성하고, 설정된 시간이 지나면 백그라운드에서 페이지를 재생성합니다. 사용자는 항상 캐시된 페이지를 즉시 받아서 빠르고, 데이터도 주기적으로 업데이트됩니다.

**Q. Next.js에서 렌더링 전략을 어떻게 선택하나요?**

페이지 특성에 따라 다릅니다. SEO가 중요하고 실시간 데이터가 필요하면 SSR, 정적 콘텐츠는 SSG, 가끔 업데이트되는 페이지는 ISR, 개인화된 대시보드는 CSR을 사용합니다. Next.js 13+에서는 서버 컴포넌트가 기본이고, 인터랙션이 필요한 부분만 'use client'로 클라이언트 컴포넌트로 만듭니다.

**Q. 서버 컴포넌트와 클라이언트 컴포넌트의 차이?**

서버 컴포넌트는 서버에서만 실행되어 번들 크기에 포함되지 않고, DB에 직접 접근할 수 있습니다. 하지만 useState, useEffect, 이벤트 핸들러를 사용할 수 없습니다. 클라이언트 컴포넌트는 'use client'를 명시하고, 기존 React처럼 상태와 이벤트를 사용할 수 있습니다. 보통 서버 컴포넌트 안에 필요한 부분만 클라이언트 컴포넌트로 배치합니다.