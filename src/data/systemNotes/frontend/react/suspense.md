# React Suspense

## Suspense란?

**컴포넌트가 렌더링되기 전에 무언가를 "기다릴" 수 있게 해주는 기능**입니다. 비동기 작업(코드 로딩, 데이터 페칭)이 완료될 때까지 대체 UI(fallback)를 보여줍니다.

```jsx
<Suspense fallback={<Loading />}>
  <SomeComponent />  {/* 준비될 때까지 Loading 표시 */}
</Suspense>
```

**지원하는 비동기 작업:**
- **코드 분할** - `React.lazy()`로 동적 import
- **데이터 페칭** - React Query, Relay, Next.js 등 Suspense 지원 라이브러리
- **리소스 로딩** - React 19의 이미지, 스크립트 등

---

## 코드 분할 (Code Splitting)

**React.lazy()와 함께 사용하여 컴포넌트를 동적으로 로드**합니다.

```jsx
import { Suspense, lazy } from 'react';

// 동적 import (별도 청크로 분리)
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function App() {
  return (
    <div>
      <h1>My App</h1>
      
      <Suspense fallback={<div>로딩 중...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}
```

**동작 원리:**

```
1. 초기 로드: HeavyComponent 코드 미포함 (번들 크기 감소)
2. 컴포넌트 렌더링 시도 → lazy가 Promise throw
3. Suspense가 Promise catch → fallback 표시
4. 청크 다운로드 완료 → Promise resolve
5. Suspense가 실제 컴포넌트 렌더링
```

**라우트 기반 코드 분할:**

```jsx
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

---

## 데이터 페칭과 Suspense

**Suspense를 지원하는 라이브러리와 함께 데이터 로딩 상태를 선언적으로 처리**합니다.

```jsx
// TanStack Query (v5)
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  // isLoading 체크 불필요! Suspense가 처리
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  return <div>{data.name}</div>;
}

// 사용
function App() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

**기존 방식 vs Suspense:**

```jsx
// 기존: 명령형 로딩 처리
function UserProfile({ userId }) {
  const { data, isLoading, error } = useQuery(...);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  
  return <div>{data.name}</div>;
}

// Suspense: 선언적 로딩 처리
function UserProfile({ userId }) {
  const { data } = useSuspenseQuery(...);
  
  // 로딩/에러 처리가 컴포넌트 외부로 분리
  return <div>{data.name}</div>;
}

<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Skeleton />}>
    <UserProfile userId={1} />
  </Suspense>
</ErrorBoundary>
```

**장점:**
- 컴포넌트는 "성공" 케이스만 처리
- 로딩/에러 UI가 컴포넌트와 분리되어 재사용 가능
- 여러 컴포넌트의 로딩 상태를 하나의 Suspense로 통합 가능

---

## 중첩 Suspense

**로딩 순서와 범위를 세밀하게 제어**할 수 있습니다.

```jsx
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Header />
      
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
      
      <main>
        <Suspense fallback={<ContentSkeleton />}>
          <MainContent />
        </Suspense>
      </main>
    </Suspense>
  );
}
```

```
로딩 순서:
1. PageLoader 표시 (Header 로딩 중)
2. Header 완료 → Header 표시, Sidebar/Content는 각자 스켈레톤
3. Sidebar 완료 → Sidebar 표시
4. Content 완료 → Content 표시

(각각 독립적으로 로딩, 먼저 완료된 것부터 표시)
```

**vs 단일 Suspense:**

```jsx
// 단일 Suspense: 모두 완료될 때까지 전체 로딩
<Suspense fallback={<PageLoader />}>
  <Header />
  <Sidebar />
  <MainContent />
</Suspense>
// → 가장 느린 컴포넌트가 병목

// 중첩 Suspense: 부분별 독립 로딩
// → 빠른 것부터 점진적 표시
```

---

## SuspenseList (실험적)

**여러 Suspense의 표시 순서를 조정**합니다.

```jsx
<SuspenseList revealOrder="forwards">
  <Suspense fallback={<Skeleton />}><Item1 /></Suspense>
  <Suspense fallback={<Skeleton />}><Item2 /></Suspense>
</SuspenseList>

// revealOrder: "forwards" | "backwards" | "together"
```

---

## Error Boundary와 함께 사용

**Suspense는 로딩, Error Boundary는 에러 처리**를 담당합니다.

```jsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<div>에러 발생!</div>}
  onError={(error) => logError(error)}
>
  <Suspense fallback={<Loading />}>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
```

---

## useTransition과 함께 사용

**Suspense 전환 시 이전 UI를 유지**하면서 새 컨텐츠를 준비합니다.

```jsx
function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();
  
  const handleTabChange = (newTab) => {
    startTransition(() => {
      setTab(newTab);  // 낮은 우선순위로 처리
    });
  };
  
  return (
    <div>
      <TabButtons 
        onSelect={handleTabChange} 
        disabled={isPending}
      />
      
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <Suspense fallback={<TabSkeleton />}>
          {tab === 'home' && <HomeTab />}
          {tab === 'posts' && <PostsTab />}
          {tab === 'about' && <AboutTab />}
        </Suspense>
      </div>
    </div>
  );
}
```

**동작:**
- 탭 전환 시 이전 탭 UI 유지 (fallback 안 보임)
- isPending으로 로딩 인디케이터 표시
- 새 탭 준비 완료 시 전환

---

## Streaming SSR (React 18+)

**서버에서 HTML을 점진적으로 스트리밍**합니다. Suspense 경계를 기준으로 준비된 부분부터 전송합니다.

```jsx
// 서버
import { renderToPipeableStream } from 'react-dom/server';

const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() { pipe(res); }
});

// App - Header는 즉시 전송, SlowContent는 준비되면 스트리밍
<Header />
<Suspense fallback={<Skeleton />}>
  <SlowContent />
</Suspense>
```

---

## Suspense의 동작 원리

**Promise를 throw하여 렌더링 중단을 알림**:

```jsx
// 간단한 원리
function read() {
  if (status === 'pending') throw promise;  // Suspense가 catch
  if (status === 'error') throw result;     // ErrorBoundary가 catch
  return result;
}
```

실제로는 React Query, Relay 등 라이브러리가 이 패턴을 구현합니다.

---

## 주의사항

**1. lazy는 default export만 지원:**

```jsx
// ✅ OK
export default function MyComponent() { ... }
const MyComponent = lazy(() => import('./MyComponent'));

// ❌ Named export는 직접 안 됨
export function MyComponent() { ... }

// 우회 방법
const MyComponent = lazy(() => 
  import('./MyComponent').then(module => ({ default: module.MyComponent }))
);
```

**2. 서버 컴포넌트에서 lazy 사용 불가:**

```jsx
// 클라이언트 컴포넌트에서만 사용
'use client';
const Heavy = lazy(() => import('./Heavy'));
```

**3. Suspense 경계 설계:**

```jsx
// ❌ 너무 세분화 → 로딩 UI 파편화
<Suspense><Title /></Suspense>
<Suspense><Description /></Suspense>
<Suspense><Image /></Suspense>

// ✅ 적절한 그룹화
<Suspense fallback={<CardSkeleton />}>
  <Card>
    <Title />
    <Description />
    <Image />
  </Card>
</Suspense>
```

---

## Skeleton UI 패턴

```jsx
function CardSkeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-image" />
      <div className="skeleton-title" />
    </div>
  );
}

// CSS: pulse 애니메이션으로 로딩 효과
.skeleton { animation: pulse 1.5s ease-in-out infinite; }
```

---

## 면접 예상 질문

**Q. Suspense란?**

컴포넌트가 렌더링되기 전에 비동기 작업을 기다릴 수 있게 해주는 기능입니다. 코드 분할(lazy), 데이터 페칭 등에서 로딩 상태를 선언적으로 처리합니다. 작업이 완료될 때까지 fallback UI를 표시합니다.

**Q. Suspense의 동작 원리?**

비동기 작업이 완료되지 않으면 Promise를 throw합니다. Suspense가 이 Promise를 catch하여 fallback을 렌더링하고, Promise가 resolve되면 실제 컴포넌트를 렌더링합니다.

**Q. React.lazy란?**

컴포넌트를 동적으로 import하여 코드 분할을 가능하게 합니다. 해당 컴포넌트가 필요할 때만 청크를 로드하여 초기 번들 크기를 줄입니다. Suspense와 함께 사용해야 합니다.

**Q. Suspense와 Error Boundary의 관계?**

Suspense는 로딩 상태를 처리하고, Error Boundary는 에러를 처리합니다. 둘을 함께 사용하면 비동기 컴포넌트의 로딩과 에러를 선언적으로 처리할 수 있습니다.

**Q. 중첩 Suspense의 장점?**

각 영역이 독립적으로 로딩되어 먼저 준비된 부분부터 표시됩니다. 단일 Suspense는 가장 느린 컴포넌트가 병목이 되지만, 중첩하면 점진적 로딩이 가능합니다.

**Q. useTransition과 Suspense?**

useTransition은 Suspense 전환 시 fallback 대신 이전 UI를 유지합니다. isPending으로 전환 중임을 표시하고, 새 컨텐츠가 준비되면 전환합니다. 탭 전환 등에서 깜빡임을 방지합니다.