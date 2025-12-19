# React 19 주요 변경사항

## 개요

React 19는 2024년 12월 5일에 정식 출시되었으며, React 18 이후 2년 만의 메이저 업데이트입니다. React 18에서 실험적이었던 기능들이 안정화되고, 새로운 Hook과 API가 추가되었습니다.

**주요 변경사항:**
- Actions와 새로운 폼 관련 Hooks
- React Compiler (자동 메모이제이션)
- use() API
- ref를 prop으로 전달 (forwardRef 불필요)
- Server Components 안정화
- Document Metadata 지원
- Asset Loading 개선

---

## Actions

**transition에서 async 함수를 사용하여 pending 상태, 에러, 폼, 낙관적 업데이트를 자동으로 처리**할 수 있습니다.

**기존 방식:** isPending, error 상태를 수동으로 관리해야 했습니다.

**React 19 - useTransition으로 Action 처리:**

```jsx
function UpdateName() {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  
  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) return;
      redirect('/profile');
    });
  };
  
  return (
    <button onClick={handleSubmit} disabled={isPending}>
      {isPending ? '저장 중...' : '저장'}
    </button>
  );
}
```

Actions는 데이터 제출을 자동으로 관리합니다. 요청 시작 시 pending 상태가 되고, 최종 상태 업데이트가 커밋되면 자동으로 리셋됩니다.

---

## 새로운 Hooks

### useActionState

**폼 Action의 상태를 관리**하는 Hook입니다.

```jsx
import { useActionState } from 'react';

function ChangeName() {
  const [state, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const name = formData.get('name');
      const error = await updateName(name);
      if (error) {
        return { error };
      }
      return { success: true };
    },
    { error: null }  // 초기 상태
  );
  
  return (
    <form action={submitAction}>
      <input name="name" />
      <button disabled={isPending}>
        {isPending ? '저장 중...' : '저장'}
      </button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```

### useFormStatus

**폼의 제출 상태를 자식 컴포넌트에서 접근**할 수 있게 합니다.

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button disabled={pending}>
      {pending ? '제출 중...' : '제출'}
    </button>
  );
}

function Form() {
  return (
    <form action={submitForm}>
      <input name="email" />
      <SubmitButton />  {/* 폼 상태 자동 감지 */}
    </form>
  );
}
```

### useOptimistic

**서버 응답 전에 UI를 낙관적으로 업데이트**합니다.

```jsx
import { useOptimistic } from 'react';

function Messages({ messages }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMsg) => [...state, { ...newMsg, sending: true }]
  );
  
  const sendMessage = async (formData) => {
    addOptimistic({ text: formData.get('message') });  // 즉시 UI 업데이트
    await deliverMessage(formData);                     // 서버 요청
  };
  
  return (/* ... */);
}
```

---

## use() API

**Promise나 Context를 렌더링 중에 읽을 수 있는 새로운 API**입니다.

```jsx
import { use, Suspense } from 'react';

// Promise 읽기
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);  // Suspense와 함께 동작
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

function Page({ commentsPromise }) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}
```

**Context 읽기 (조건부 가능):**

```jsx
function Button({ showTheme }) {
  // 조건부로 Context 읽기 가능!
  if (showTheme) {
    const theme = use(ThemeContext);
    return <button className={theme}>테마 버튼</button>;
  }
  return <button>일반 버튼</button>;
}
```

**use() vs useContext:**
- `useContext`: 컴포넌트 최상위에서만 호출 가능
- `use`: 조건문, 반복문 내에서도 호출 가능

---

## React Compiler

**React 19의 핵심 기능입니다.** React 코드를 일반 JavaScript로 변환하여 성능을 높이고, 수동 최적화 작업에서 해방시켜 줍니다.

```jsx
// 기존: 수동 메모이제이션
const visibleTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);
const handleClick = useCallback(() => { /* ... */ }, []);

// React 19: 자동 최적화 (Compiler가 메모이제이션 적용)
const visibleTodos = filterTodos(todos, filter);
const handleClick = () => { /* ... */ };
```

useCallback, useMemo, memo 사이에서 고민하던 시절은 이제 끝났습니다. React 19에서는 컴파일러가 자동으로 최적화합니다.

```bash
npm install babel-plugin-react-compiler  # 별도 설치 필요
```

---

## ref를 prop으로 전달

**forwardRef를 사용해 ref를 전달하는 것은 번거로웠습니다. React 19에서는 ref를 일반 prop처럼 전달할 수 있습니다.**

**기존 방식:**

```jsx
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

**React 19:**

```jsx
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// 사용
function Form() {
  const inputRef = useRef(null);
  return <Input ref={inputRef} />;
}
```

`forwardRef`는 더 이상 필요하지 않으며, 향후 deprecated될 예정입니다.

---

## form action

**form 요소에 함수를 action으로 전달**할 수 있습니다.

```jsx
function SearchForm() {
  const search = async (formData) => {
    const query = formData.get('query');
    const results = await searchAPI(query);
    // ...
  };
  
  return (
    <form action={search}>
      <input name="query" />
      <button type="submit">검색</button>
    </form>
  );
}
```

`<form>` 요소의 action과 formAction prop에 함수를 전달할 수 있습니다. 함수를 전달하면 기본적으로 Actions로 동작하며, 제출 후 폼이 자동으로 리셋됩니다.

---

## Server Components

**React 19의 새로운 기능으로, 서버에서 실행되는 상태 없는 React 컴포넌트를 만들 수 있습니다.**

```jsx
// Server Component (기본) - 'use client' 없으면 서버 컴포넌트
async function UserProfile({ userId }) {
  const user = await db.users.findById(userId);  // 직접 DB 접근 가능
  return <div><h1>{user.name}</h1></div>;
}

// Client Component
'use client';
function ClientButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>클릭: {count}</button>;
}

// Server Action
async function createPost(formData) {
  'use server';
  await db.posts.create({ title: formData.get('title') });
}
```

---

## Document Metadata

**컴포넌트 내에서 문서 메타데이터 태그를 네이티브로 렌더링할 수 있습니다.** React가 `<title>`, `<link>`, `<meta>` 태그를 발견하면 자동으로 문서의 `<head>` 섹션으로 호이스팅합니다.

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.summary} />
      <meta name="author" content={post.author} />
      <link rel="canonical" href={`https://example.com/posts/${post.id}`} />
      
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

컴포넌트 내에서 `<title>`, `<meta>`, `<link>` 태그를 렌더링하면 자동으로 `<head>`로 호이스팅됩니다.

---

## Stylesheet 지원

```jsx
// precedence로 스타일시트 우선순위 제어
<link rel="stylesheet" href="base.css" precedence="default" />
<link rel="stylesheet" href="theme.css" precedence="high" />
```

---

## 리소스 프리로딩

```jsx
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom';

prefetchDNS('https://api.example.com');     // DNS 프리페치
preconnect('https://api.example.com');      // 연결 미리 수립
preload('/font.woff2', { as: 'font' });     // 리소스 미리 로드
preinit('/script.js', { as: 'script' });    // 스크립트 미리 초기화
```

---

## 기타 개선사항

```jsx
// 1. ref 콜백 클린업
<input ref={(ref) => {
  // 마운트
  return () => { /* 언마운트 시 실행 */ };
}} />

// 2. Context를 Provider로 직접 사용
<ThemeContext value={theme}>  {/* .Provider 불필요 */}

// 3. useDeferredValue 초기값
const deferredValue = useDeferredValue(value, initialValue);
```

**향상된 에러 메시지:** 하이드레이션 오류 시 더 자세한 diff 정보 제공

---

## 제거된 기능

- `propTypes`, `defaultProps` (함수 컴포넌트)
- `ReactDOM.render` → `createRoot` 사용
- `ReactDOM.hydrate` → `hydrateRoot` 사용
- Legacy Context (`contextTypes`, `childContextTypes`)
- String refs
- `findDOMNode`

---

## 마이그레이션

```bash
npx @react-codemod/v19 ./src  # 자동 변환
npm install react@19 react-dom@19
```

---

## 면접 예상 질문

**Q. React 19의 주요 변경사항?**

Actions로 비동기 폼 처리가 간소화되었고, useActionState, useOptimistic, useFormStatus 등 새로운 Hook이 추가되었습니다. React Compiler로 자동 메모이제이션이 가능해져 useMemo, useCallback을 덜 사용해도 됩니다. ref를 prop으로 전달할 수 있어 forwardRef가 불필요해졌습니다.

**Q. use() API란?**

렌더링 중에 Promise나 Context를 읽을 수 있는 새로운 API입니다. useContext와 달리 조건문이나 반복문 내에서도 호출할 수 있습니다. Suspense와 함께 사용하면 데이터 로딩을 선언적으로 처리할 수 있습니다.

**Q. React Compiler의 역할?**

코드를 분석하여 자동으로 메모이제이션을 적용합니다. 개발자가 수동으로 useMemo, useCallback, memo를 사용하지 않아도 React가 최적화를 처리합니다. 다만 별도 설치와 설정이 필요합니다.

**Q. Server Components란?**

서버에서 실행되는 React 컴포넌트입니다. 데이터베이스에 직접 접근할 수 있고, 클라이언트로 전송되는 JavaScript 양을 줄입니다. 'use client' 디렉티브가 없으면 기본적으로 서버 컴포넌트입니다.

**Q. useOptimistic은 언제 사용하나요?**

서버 응답 전에 UI를 즉시 업데이트하여 빠른 사용자 경험을 제공할 때 사용합니다. 좋아요 버튼, 메시지 전송 등에서 서버 확인 전에 결과를 먼저 보여주고, 실패 시 롤백합니다.