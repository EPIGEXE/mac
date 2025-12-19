# TanStack Query (React Query)

## TanStack Query란?

**서버 상태(Server State)를 관리하는 라이브러리**입니다. 데이터 페칭, 캐싱, 동기화, 업데이트를 선언적으로 처리합니다.

```
클라이언트 상태 (Redux, Zustand)     서버 상태 (TanStack Query)
- UI 상태 (모달 열림/닫힘)           - API 응답 데이터
- 폼 입력값                         - 사용자 목록
- 테마 설정                         - 게시글 데이터
- 로컬에서 완전히 제어               - 서버와 동기화 필요
```

**해결하는 문제:**
- 중복 요청 제거
- 백그라운드에서 데이터 갱신
- 캐싱과 캐시 무효화
- 로딩/에러 상태 관리
- 페이지네이션, 무한 스크롤
- Optimistic Updates

---

## 설치 및 설정

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,       // 1분간 fresh
      gcTime: 1000 * 60 * 5,      // 5분간 캐시 유지
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyApp />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

---

## useQuery - 데이터 조회

```jsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId],  // 캐시 키 (의존성 포함)
    queryFn: () => fetchUser(userId),  // 데이터 페칭 함수
  });
  
  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>에러: {error.message}</div>;
  
  return <div>{data.name}</div>;
}
```

**반환값:**

| 속성 | 설명 |
|------|------|
| `data` | 성공 시 응답 데이터 |
| `isLoading` | 첫 로딩 중 (캐시 없음) |
| `isFetching` | 백그라운드 포함 모든 페칭 중 |
| `isError` | 에러 발생 여부 |
| `error` | 에러 객체 |
| `isSuccess` | 성공 여부 |
| `refetch` | 수동 리페치 함수 |
| `status` | 'pending' | 'error' | 'success' |

**주요 옵션:**

```jsx
useQuery({
  queryKey: ['todos', { status, page }],
  queryFn: fetchTodos,
  staleTime: 1000 * 60,        // fresh 유지 시간
  gcTime: 1000 * 60 * 5,       // 캐시 보관 시간
  refetchOnWindowFocus: true,  // 윈도우 포커스 시 리페치
  refetchInterval: 5000,       // 폴링 간격
  enabled: !!userId,           // false면 쿼리 비활성화
  select: (data) => data.name, // 데이터 변환
  retry: 3,                    // 재시도 횟수
});
```

---

## Query Key

**쿼리를 식별하고 캐싱하는 고유 키**입니다. 배열 형태로, 의존성을 포함합니다.

```jsx
// 단순 키
useQuery({ queryKey: ['todos'], ... })

// 변수 포함 (userId가 바뀌면 새 쿼리)
useQuery({ queryKey: ['user', userId], ... })

// 객체 포함 (필터 조건)
useQuery({ queryKey: ['todos', { status: 'done', page: 1 }], ... })

// 계층 구조
useQuery({ queryKey: ['todos', todoId, 'comments'], ... })
```

**키 매칭 규칙:**

```jsx
// 이 쿼리들은 모두 다른 캐시
['todos']
['todos', 1]
['todos', { status: 'done' }]

// 무효화 시 부분 매칭
queryClient.invalidateQueries({ queryKey: ['todos'] });
// → 위 3개 모두 무효화
```

---

## Stale & Cache 개념

```
Fresh (신선) ──staleTime 경과──► Stale (오래됨) ──gcTime 경과──► 삭제
     │                              │
     │ 캐시 즉시 반환               │ 캐시 반환 + 백그라운드 리페치
     │ 리페치 안 함                 │
```

**staleTime:**
- 데이터가 "신선"하다고 간주하는 시간
- fresh 상태에서는 리페치하지 않음
- 기본값: 0 (즉시 stale)

**gcTime (구 cacheTime):**
- 비활성 쿼리의 캐시 유지 시간
- 컴포넌트 언마운트 후 이 시간 동안 캐시 보관
- 기본값: 5분

```jsx
// 사용자 정보 (자주 안 바뀜)
useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  staleTime: 1000 * 60 * 10,  // 10분간 fresh
});

// 실시간 데이터 (자주 바뀜)
useQuery({
  queryKey: ['stockPrice'],
  queryFn: fetchStockPrice,
  staleTime: 0,
  refetchInterval: 1000,      // 1초마다 폴링
});
```

---

## useMutation - 데이터 변경

**서버 데이터를 생성, 수정, 삭제**할 때 사용합니다.

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (newTodo) => axios.post('/todos', newTodo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
  
  return (
    <button 
      onClick={() => mutation.mutate({ title: 'New Todo' })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? '추가 중...' : '할 일 추가'}
    </button>
  );
}
```

**반환값:**

| 속성 | 설명 |
|------|------|
| `mutate` | mutation 실행 (콜백 없음) |
| `mutateAsync` | Promise 반환 (await 가능) |
| `isPending` | 진행 중 여부 |
| `isError` | 에러 여부 |
| `isSuccess` | 성공 여부 |
| `data` | 성공 시 응답 |
| `error` | 에러 객체 |
| `reset` | 상태 초기화 |

---

## 캐시 무효화

```jsx
const queryClient = useQueryClient();

// 특정 쿼리 무효화 (부분 매칭)
queryClient.invalidateQueries({ queryKey: ['todos'] });

// 정확히 일치하는 키만
queryClient.invalidateQueries({ queryKey: ['todos'], exact: true });

// 캐시 직접 수정
queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);

// 캐시 데이터 조회
const todos = queryClient.getQueryData(['todos']);
```

---

## Optimistic Updates

**서버 응답 전에 UI를 먼저 업데이트**하여 빠른 UX를 제공합니다.

```jsx
const mutation = useMutation({
  mutationFn: updateTodo,
  
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previousTodos = queryClient.getQueryData(['todos']);
    
    // 낙관적 업데이트
    queryClient.setQueryData(['todos'], (old) =>
      old.map((todo) => todo.id === newTodo.id ? { ...todo, ...newTodo } : todo)
    );
    return { previousTodos };  // 롤백용
  },
  
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos);  // 롤백
  },
  
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });  // 동기화
  },
});
```

---

## 의존적 쿼리 (Dependent Queries)

```jsx
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

// user가 있을 때만 실행
const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => fetchProjects(user.id),
  enabled: !!user?.id,  // 조건부 실행
});
```

---

## 병렬 쿼리

```jsx
// 여러 useQuery는 자동 병렬 실행
const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
const todosQuery = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });

// 동적 개수: useQueries
const results = useQueries({
  queries: userIds.map((id) => ({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })),
});
```

---

## 무한 스크롤 (useInfiniteQuery)

```jsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, pages) => 
    lastPage.hasMore ? pages.length + 1 : undefined,
});

// data.pages: 각 페이지 데이터 배열
// fetchNextPage(): 다음 페이지 로드
// hasNextPage: 더 불러올 페이지 있는지
```

---

## 에러 처리

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => 
        error.status !== 404 && failureCount < 3,
    },
  },
});

// Error Boundary 연동
useQuery({ queryKey: ['user'], queryFn: fetchUser, throwOnError: true });
```

---

## Suspense 모드

```jsx
const { data } = useSuspenseQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
});

// Suspense와 함께 사용
<Suspense fallback={<Loading />}>
  <UserProfile />
</Suspense>
```

---

## vs SWR

| 기능 | TanStack Query | SWR |
|------|---------------|-----|
| 캐싱 | ✅ 강력 | ✅ |
| Devtools | ✅ | ❌ |
| Mutation | ✅ 강력 | △ |
| Optimistic Updates | ✅ 내장 | △ |
| 무한 스크롤 | ✅ 내장 | ✅ |
| 번들 크기 | 크다 | 작다 |

---

## 면접 예상 질문

**Q. TanStack Query란?**

서버 상태를 관리하는 라이브러리입니다. 데이터 페칭, 캐싱, 동기화, 업데이트를 선언적으로 처리합니다. 중복 요청 제거, 백그라운드 리페치, 캐시 무효화 등을 자동으로 처리해 줍니다.

**Q. staleTime과 gcTime의 차이?**

staleTime은 데이터가 "신선"하다고 간주하는 시간으로, 이 시간 동안은 리페치하지 않습니다. gcTime은 비활성 쿼리의 캐시 유지 시간으로, 컴포넌트 언마운트 후 이 시간이 지나면 캐시가 삭제됩니다.

**Q. useQuery와 useMutation의 차이?**

useQuery는 데이터 조회(GET)에 사용하고 캐싱됩니다. useMutation은 데이터 변경(POST, PUT, DELETE)에 사용하고 캐싱되지 않습니다. mutation 성공 후 invalidateQueries로 관련 쿼리를 무효화합니다.

**Q. Optimistic Update란?**

서버 응답 전에 UI를 먼저 업데이트하는 기법입니다. onMutate에서 캐시를 낙관적으로 업데이트하고, 에러 시 onError에서 이전 값으로 롤백합니다. 빠른 사용자 경험을 제공합니다.

**Q. Query Key의 역할?**

쿼리를 식별하고 캐싱하는 고유 키입니다. 키가 변경되면 새로운 쿼리로 인식하여 리페치합니다. 배열 형태로 의존성(userId, filters)을 포함하며, invalidateQueries 시 부분 매칭으로 여러 쿼리를 한 번에 무효화할 수 있습니다.

**Q. 클라이언트 상태와 서버 상태의 차이?**

클라이언트 상태는 UI 상태, 폼 입력 등 로컬에서 제어되는 데이터입니다. 서버 상태는 API 응답처럼 서버와 동기화가 필요한 데이터입니다. TanStack Query는 서버 상태 관리에 특화되어 있고, 클라이언트 상태는 useState나 Zustand로 관리합니다.