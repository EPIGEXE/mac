# 상태 관리 라이브러리 선택

## 상태 관리 라이브러리가 필요한 이유

### React 기본 상태 관리의 한계

| 문제 | 설명 |
|------|------|
| **Props Drilling** | 깊은 컴포넌트 트리에서 데이터 전달 번거로움 |
| **상태 공유** | 형제 컴포넌트 간 상태 공유 어려움 (상태 끌어올리기 필요) |
| **복잡한 로직** | 여러 액션, 비동기 처리 시 useState/useReducer 한계 |
| **Context 리렌더링** | Context 값 변경 시 모든 소비자 리렌더링 |

### 상태 관리 라이브러리가 제공하는 것

- **전역 상태 저장소**: 어디서든 접근 가능
- **예측 가능한 상태 변경**: 명확한 업데이트 패턴
- **리렌더링 최적화**: 필요한 컴포넌트만 업데이트
- **DevTools**: 상태 변화 추적, 디버깅
- **미들웨어**: 비동기, 로깅, 영속성 등 확장

---

## Redux (Redux Toolkit)

### Redux란?

**예측 가능한 상태 컨테이너**입니다. 단방향 데이터 흐름과 불변성을 강조하며, 애플리케이션 전체 상태를 하나의 Store에서 관리합니다.

현재는 **Redux Toolkit(RTK)**이 공식 권장 방식입니다. 기존 Redux의 보일러플레이트를 대폭 줄였습니다.

### 핵심 개념

```
Action (무엇을) → Dispatch (전달) → Reducer (어떻게) → Store (저장) → UI (반영)
```

| 개념 | 역할 |
|------|------|
| **Store** | 애플리케이션의 전체 상태를 담는 단일 저장소 |
| **Action** | 상태 변경을 설명하는 객체 `{ type, payload }` |
| **Reducer** | 현재 상태와 Action을 받아 새 상태 반환 (순수 함수) |
| **Dispatch** | Action을 Store에 전달하는 함수 |
| **Selector** | Store에서 필요한 상태만 추출하는 함수 |

### 3가지 원칙

1. **Single Source of Truth**: 하나의 Store에 모든 상태
2. **State is Read-Only**: 상태 변경은 오직 Action을 통해서만
3. **Pure Reducers**: Reducer는 순수 함수 (같은 입력 → 같은 출력)

### Redux Toolkit 주요 API

| API | 역할 |
|-----|------|
| **configureStore** | Store 생성 (DevTools, 미들웨어 자동 설정) |
| **createSlice** | Reducer + Action 한 번에 생성 |
| **createAsyncThunk** | 비동기 로직 처리 |
| **createSelector** | 메모이제이션된 Selector 생성 |

### 기본 사용 패턴

```jsx
// 1. Slice 생성 (Reducer + Actions)
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },  // Immer로 불변성 자동 처리
    decrement: (state) => { state.value -= 1 },
    incrementByAmount: (state, action) => { state.value += action.payload },
  },
});

// 2. Store 생성
const store = configureStore({
  reducer: { counter: counterSlice.reducer },
});

// 3. 컴포넌트에서 사용
function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(increment())}>Count: {count}</button>;
}
```

### 비동기 처리 (createAsyncThunk)

```jsx
const fetchUser = createAsyncThunk('user/fetch', async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

// Slice에서 extraReducers로 처리
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => { state.loading = true })
    .addCase(fetchUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    })
    .addCase(fetchUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
}
```

### RTK Query (데이터 페칭)

Redux Toolkit에 포함된 **데이터 페칭/캐싱 솔루션**입니다. React Query와 유사한 기능을 Redux 생태계 내에서 제공합니다.

- 자동 캐싱, 재검증, 폴링
- 로딩/에러 상태 자동 관리
- 낙관적 업데이트

### Redux 장단점

| 장점 | 단점 |
|------|------|
| 예측 가능한 상태 변경 | 학습 곡선 (개념이 많음) |
| 강력한 DevTools | 상대적으로 많은 보일러플레이트 |
| 미들웨어 생태계 | 작은 앱에는 과도함 |
| 대규모 앱에서 검증됨 | 설정이 복잡할 수 있음 |
| 팀 협업에 유리 (명확한 패턴) | |
| TypeScript 지원 우수 | |

### Redux가 적합한 경우

- **대규모 애플리케이션**
- **복잡한 상태 로직** (여러 리듀서, 비동기)
- **팀 협업** (명확한 패턴, 코드 리뷰 용이)
- **상태 변화 추적/디버깅** 중요
- **미들웨어 확장** 필요 (로깅, 영속성, 분석)

---

## Zustand

### Zustand란?

**간단하고 빠른 상태 관리 라이브러리**입니다. 독일어로 "상태"를 의미합니다. 최소한의 API로 보일러플레이트 없이 전역 상태를 관리합니다.

### 핵심 특징

| 특징 | 설명 |
|------|------|
| **간단한 API** | create 함수 하나로 Store 생성 |
| **보일러플레이트 없음** | Action, Reducer, Dispatch 구분 없음 |
| **Provider 불필요** | Context 없이 어디서든 사용 |
| **선택적 구독** | Selector로 필요한 상태만 구독 → 최적화 |
| **작은 번들 크기** | ~1KB (gzipped) |

### 기본 사용 패턴

```jsx
import { create } from 'zustand';

// Store 생성 (상태 + 액션 함께 정의)
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  // get()으로 현재 상태 읽기
  doubleCount: () => get().count * 2,
}));

// 컴포넌트에서 사용
function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);
  return <button onClick={increment}>Count: {count}</button>;
}
```

### 선택적 구독 (리렌더링 최적화)

```jsx
// ✅ count만 구독 → count 변경 시에만 리렌더링
const count = useStore((state) => state.count);

// ✅ 여러 값 선택 (얕은 비교)
import { shallow } from 'zustand/shallow';
const { count, name } = useStore(
  (state) => ({ count: state.count, name: state.name }),
  shallow
);

// ❌ 전체 상태 구독 → 모든 변경에 리렌더링
const state = useStore();
```

### 미들웨어

```jsx
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

const useStore = create(
  devtools(  // Redux DevTools 연동
    persist(  // localStorage 영속성
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: 'counter-storage' }
    )
  )
);
```

| 미들웨어 | 기능 |
|---------|------|
| **persist** | localStorage/sessionStorage 영속성 |
| **devtools** | Redux DevTools 연동 |
| **immer** | Immer로 불변성 자동 처리 |
| **subscribeWithSelector** | 세밀한 구독 제어 |

### 비동기 처리

별도 API 없이 **async 함수를 그대로 사용**합니다.

```jsx
const useStore = create((set) => ({
  users: [],
  loading: false,
  fetchUsers: async () => {
    set({ loading: true });
    const response = await fetch('/api/users');
    const users = await response.json();
    set({ users, loading: false });
  },
}));
```

### Zustand 장단점

| 장점 | 단점 |
|------|------|
| 매우 간단한 API | Redux만큼 체계화된 패턴 없음 |
| 보일러플레이트 거의 없음 | 대규모 앱에서 구조화 어려울 수 있음 |
| Provider 불필요 | 생태계가 Redux보다 작음 |
| 작은 번들 크기 | 팀 컨벤션 필요 |
| TypeScript 지원 우수 | |
| 리렌더링 최적화 쉬움 | |

### Zustand가 적합한 경우

- **소~중규모 애플리케이션**
- **빠른 개발** 원할 때
- **간단한 전역 상태** (복잡한 로직 적음)
- **보일러플레이트 싫을 때**
- **Provider 중첩 피하고 싶을 때**

---

## Redux vs Zustand 비교

| 구분 | Redux Toolkit | Zustand |
|------|---------------|---------|
| **철학** | Flux 아키텍처, 엄격한 패턴 | 단순함, 유연함 |
| **보일러플레이트** | 중간 (RTK로 감소) | 거의 없음 |
| **학습 곡선** | 중~상 | 낮음 |
| **번들 크기** | ~10KB | ~1KB |
| **Provider** | 필요 | 불필요 |
| **DevTools** | 강력함 | 미들웨어로 지원 |
| **비동기 처리** | createAsyncThunk | 그냥 async/await |
| **미들웨어** | 풍부한 생태계 | 기본 제공 + 커스텀 |
| **TypeScript** | 우수 | 우수 |
| **팀 협업** | 명확한 패턴으로 유리 | 컨벤션 필요 |
| **적합한 규모** | 중~대규모 | 소~중규모 |

---

## 다른 상태 관리 라이브러리

### Jotai

**원자(Atom) 기반 상향식 접근**입니다. Recoil과 유사하지만 더 간단합니다.

| 특징 | 설명 |
|------|------|
| 원자 단위 상태 | 작은 단위로 상태 분리 |
| 상향식(Bottom-up) | 작은 atom을 조합해 큰 상태 |
| 세밀한 리렌더링 | atom 단위로 구독 |
| Provider 선택적 | 기본은 불필요 |

```jsx
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);  // 파생 상태

function Counter() {
  const [count, setCount] = useAtom(countAtom);
}
```

### Recoil

**Facebook에서 만든 상태 관리 라이브러리**입니다. Atom + Selector 패턴.

| 특징 | 설명 |
|------|------|
| Atom | 상태의 단위 |
| Selector | 파생 상태 (동기/비동기) |
| React스러운 API | Hooks와 자연스럽게 통합 |
| 비동기 지원 | Selector에서 비동기 처리 내장 |

### MobX

**반응형 프로그래밍 기반**입니다. Observable 상태를 자동 추적하고, 클래스 기반 OOP 스타일을 선호할 때 적합합니다.

### 선택 가이드 요약

| 라이브러리 | 적합한 상황 |
|-----------|------------|
| **Redux Toolkit** | 대규모, 복잡한 로직, 팀 협업, 엄격한 패턴 원할 때 |
| **Zustand** | 소~중규모, 빠른 개발, 간단한 전역 상태 |
| **Jotai** | 세밀한 리렌더링 제어, 상향식 접근 선호 |
| **Recoil** | 파생 상태 많음, 비동기 데이터 흐름 |
| **MobX** | OOP 선호, 자동 추적 원할 때 |
| **Context API** | 자주 안 변하는 전역 상태 (테마, 인증) |

---

## 선택 기준 플로우차트

```
전역 상태 관리 필요?
    │
    ├─ 자주 변경 안 됨? (테마, 인증) ──▶ Context API
    │
    └─ 자주 변경됨
        │
        ├─ 소규모 + 간단한 상태 ──▶ Zustand
        │
        ├─ 중규모 + 적당한 복잡도 ──▶ Zustand 또는 Jotai
        │
        └─ 대규모 + 복잡한 로직
            │
            ├─ 엄격한 패턴 원함 ──▶ Redux Toolkit
            └─ 유연함 원함 ──▶ Zustand + 구조화
```

---

## 실무 선택 팁

### 1. 새 프로젝트 시작

- **소규모/MVP**: Zustand (빠르게 시작)
- **대규모/엔터프라이즈**: Redux Toolkit (검증된 패턴)
- **서버 상태 위주**: React Query + 간단한 클라이언트 상태 (Zustand)

### 2. 기존 프로젝트

- 이미 Redux? → **RTK로 마이그레이션** 권장
- Context 성능 문제? → **Zustand로 교체** 고려

### 3. 혼합 사용

```
서버 상태: React Query / SWR
클라이언트 UI 상태: Zustand
전역 설정 (테마, 언어): Context API
```

### 4. 팀 상황 고려

- 주니어 많음 → Redux (명확한 패턴, 문서 풍부)
- 빠른 개발 필요 → Zustand (낮은 진입 장벽)

---

## 면접 예상 질문

**Q. Redux의 3가지 원칙은?**

Single Source of Truth (하나의 Store), State is Read-Only (Action으로만 변경), Pure Reducers (순수 함수로 상태 변경)입니다. 이 원칙들이 상태 변화를 예측 가능하게 만들고 디버깅을 쉽게 합니다.

**Q. Redux와 Zustand의 차이?**

Redux는 Flux 아키텍처 기반으로 Action, Reducer, Dispatch 등 명확한 패턴을 따릅니다. 보일러플레이트가 있지만 대규모 앱에서 예측 가능성과 팀 협업에 유리합니다. Zustand는 훨씬 간단한 API로 보일러플레이트가 거의 없고, Provider 없이 사용 가능합니다. 소~중규모 앱이나 빠른 개발에 적합합니다.

**Q. 상태 관리 라이브러리 선택 기준은?**

앱 규모, 상태 복잡도, 팀 상황을 고려합니다. 대규모이고 복잡한 로직이 많으면 Redux, 소~중규모이고 빠른 개발이 필요하면 Zustand를 선택합니다. 서버 상태는 React Query 같은 전용 라이브러리를 쓰고, 클라이언트 상태만 관리하는 것도 좋은 패턴입니다.

**Q. Redux Toolkit을 사용하는 이유?**

기존 Redux의 보일러플레이트를 줄이고, createSlice로 Reducer와 Action을 한 번에 생성하며, Immer로 불변성을 자동 처리합니다. configureStore로 DevTools와 미들웨어가 자동 설정됩니다. 현재 Redux 팀이 공식 권장하는 방식입니다.

**Q. Zustand의 장점은?**

API가 매우 간단하고 보일러플레이트가 거의 없습니다. Provider 없이 사용 가능하고, Selector로 필요한 상태만 구독하여 리렌더링을 최적화합니다. 번들 크기도 약 1KB로 작습니다. 비동기 처리도 별도 API 없이 async/await를 그대로 사용합니다.