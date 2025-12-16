# Props Drilling 문제와 해결 방법

## Props Drilling이란?

**상위 컴포넌트의 데이터를 하위 컴포넌트에 전달하기 위해 중간 컴포넌트들을 거쳐 props를 전달하는 현상**입니다.

```
App (user 상태)
 └─ Layout (user 전달만)
     └─ Sidebar (user 전달만)
         └─ UserMenu (user 전달만)
             └─ UserAvatar (user 사용!)
```

`UserAvatar`만 `user`가 필요한데, 중간의 `Layout`, `Sidebar`, `UserMenu`가 모두 props를 전달해야 합니다.

```jsx
// 중간 컴포넌트들이 사용하지 않는 props를 전달
function Layout({ user }) {
  return <Sidebar user={user} />;
}

function Sidebar({ user }) {
  return <UserMenu user={user} />;
}

function UserMenu({ user }) {
  return <UserAvatar user={user} />;
}
```

---

## Props Drilling의 문제점

### 1. 코드 가독성 저하

중간 컴포넌트들이 **자신과 무관한 props**를 전달하면서 코드가 복잡해집니다.

### 2. 유지보수 어려움

props 이름 변경이나 추가 시 **모든 중간 컴포넌트를 수정**해야 합니다.

```jsx
// user → currentUser로 변경하려면?
// App, Layout, Sidebar, UserMenu 모두 수정 필요
```

### 3. 컴포넌트 결합도 증가

중간 컴포넌트가 **불필요한 의존성**을 갖게 됩니다. 재사용이 어려워집니다.

### 4. 불필요한 리렌더링 가능성

props가 변경되면 중간 컴포넌트들도 리렌더링될 수 있습니다.

### 5. 타입 정의 중복

TypeScript 사용 시 **중간 컴포넌트마다 타입 정의**가 필요합니다.

---

## 해결 방법 1: 컴포넌트 합성 (Composition)

### 개념

**children이나 컴포넌트를 props로 전달**하여, 중간 컴포넌트가 props를 알 필요 없게 합니다.

### 적용 전 vs 후

```jsx
// ❌ Props Drilling
function App() {
  const user = useUser();
  return <Layout user={user} />;
}

function Layout({ user }) {
  return (
    <div>
      <Sidebar user={user} />
    </div>
  );
}

// ✅ 컴포넌트 합성
function App() {
  const user = useUser();
  return (
    <Layout sidebar={<Sidebar avatar={<UserAvatar user={user} />} />}>
      <MainContent />
    </Layout>
  );
}

function Layout({ sidebar, children }) {
  return (
    <div>
      {sidebar}
      {children}
    </div>
  );
}
```

### 장점

- **추가 라이브러리 불필요**
- 중간 컴포넌트가 **props에 의존하지 않음**
- 컴포넌트 **재사용성 향상**
- **명시적인 데이터 흐름** 유지

### 단점

- 컴포넌트 계층이 깊으면 **JSX가 복잡**해질 수 있음
- **여러 곳에서 동일 데이터** 필요 시 적용 어려움

### 사용 시점

- 계층이 2~3단계 정도로 얕을 때
- 레이아웃 컴포넌트 구성 시
- 특정 영역에만 데이터가 필요할 때

---

## 해결 방법 2: Context API

### 개념

**컴포넌트 트리 전체에 데이터를 제공**하는 React 내장 기능입니다. props 전달 없이 어느 깊이에서든 데이터에 접근할 수 있습니다.

### 구조

```
Context.Provider (값 제공)
    └─ ... (중간 컴포넌트들 - props 전달 불필요)
        └─ useContext (값 소비)
```

### 기본 사용법

```jsx
// 1. Context 생성
const UserContext = createContext(null);

// 2. Provider로 값 제공
function App() {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Layout />
    </UserContext.Provider>
  );
}

// 3. 어디서든 소비 (중간 컴포넌트 무시)
function UserAvatar() {
  const { user } = useContext(UserContext);
  return <img src={user.avatar} />;
}
```

### Custom Hook 패턴 (권장)

```jsx
// context/UserContext.jsx
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);
  
  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

// 사용
function UserAvatar() {
  const { user } = useUser();
  return <img src={user?.avatar} />;
}
```

### 장점

- **React 내장** (추가 설치 불필요)
- **간단한 API**
- props drilling 완전 해결
- 전역 상태에 적합 (테마, 인증, 언어 등)

### 단점

- **리렌더링 최적화 어려움**: value 변경 시 모든 소비자 리렌더링
- **여러 Context 중첩** 시 Provider Hell
- 복잡한 상태 로직에는 부적합
- 디버깅 도구 제한적

### Context 리렌더링 문제와 해결

```jsx
// ❌ value가 매번 새 객체 → 모든 소비자 리렌더링
<UserContext.Provider value={{ user, setUser }}>

// ✅ useMemo로 참조 유지
const value = useMemo(() => ({ user, setUser }), [user]);
<UserContext.Provider value={value}>

// ✅ Context 분리 (자주 변경 vs 드물게 변경)
<UserStateContext.Provider value={user}>
  <UserDispatchContext.Provider value={setUser}>
```

### 사용 시점

- **전역적이고 자주 변경되지 않는** 데이터 (테마, 인증, 언어, 설정)
- 상태 로직이 단순할 때
- 소규모~중규모 앱

---

## 해결 방법 3: 상태 관리 라이브러리

복잡한 상태 관리가 필요할 때 사용합니다.

### 라이브러리 비교

| 라이브러리 | 특징 | 적합한 상황 |
|-----------|------|------------|
| **Redux Toolkit** | 단일 스토어, 예측 가능, DevTools | 대규모 앱, 복잡한 상태, 팀 협업 |
| **Zustand** | 간단한 API, 적은 보일러플레이트 | 중소규모, 빠른 개발 |
| **Jotai** | 원자(atom) 단위, 상향식 | 세밀한 상태 관리, 리렌더링 최적화 |
| **Recoil** | atom + selector, React스러운 API | 파생 상태 많을 때 |
| **MobX** | 반응형, 클래스 기반 가능 | OOP 선호, 자동 추적 원할 때 |

### Zustand 예시

```jsx
// store.js
import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null }),
}));

// 사용 - 어느 컴포넌트에서든
function UserAvatar() {
  const user = useUserStore((state) => state.user);
  return <img src={user?.avatar} />;
}

function LoginButton() {
  const login = useUserStore((state) => state.login);
  return <button onClick={() => login({ name: 'John' })}>Login</button>;
}
```

### Redux Toolkit 예시

```jsx
// createSlice로 리듀서 + 액션 생성, configureStore로 스토어 구성
// useSelector로 상태 구독, useDispatch로 액션 발행
const user = useSelector((state) => state.user);
dispatch(login({ name: 'John' }));
```

### 장점

- **리렌더링 최적화** (selector로 필요한 부분만 구독)
- **DevTools**로 상태 변화 추적
- **미들웨어** (비동기, 로깅, 영속성)
- 복잡한 상태 로직 관리
- 대규모 앱에서 **확장성**

### 단점

- **추가 의존성**
- **학습 곡선** (특히 Redux)
- 작은 앱에서는 과도할 수 있음

### 사용 시점

- **복잡한 상태 로직** (여러 액션, 비동기)
- **여러 컴포넌트가 같은 상태** 공유
- **상태 변화 추적/디버깅** 필요
- 대규모 앱, 팀 협업

---

## 해결 방법 비교

| 방법 | 복잡도 | 최적화 | 적합한 상황 |
|------|--------|--------|------------|
| **Props** | 낮음 | 좋음 | 1~2단계, 명시적 전달 원할 때 |
| **합성** | 낮음 | 좋음 | 레이아웃, 얕은 계층 |
| **Context** | 중간 | 보통 | 전역/드문 변경, 소규모 앱 |
| **Zustand** | 낮음 | 좋음 | 중소규모, 간단한 전역 상태 |
| **Redux** | 높음 | 좋음 | 대규모, 복잡한 상태 |
| **Jotai/Recoil** | 중간 | 매우 좋음 | 세밀한 구독, 파생 상태 |

---

## 선택 가이드

### 1. Props Drilling이 항상 나쁜가?

**아닙니다.** 1~2단계 전달은 자연스럽고, **명시적인 데이터 흐름**이 장점이 될 수 있습니다.

```jsx
// 이 정도는 괜찮음
<Parent>
  <Child data={data} />
</Parent>
```

### 2. 언제 어떤 해결책?

```
Props Drilling 발생
    │
    ├─ 2~3단계 이내? ──Yes──▶ 그냥 Props 사용
    │
    └─ 더 깊음?
        │
        ├─ 레이아웃/슬롯 패턴? ──Yes──▶ 컴포넌트 합성
        │
        └─ 여러 곳에서 필요?
            │
            ├─ 자주 변경? ──No──▶ Context API
            │
            └─ 자주 변경 / 복잡한 로직?
                │
                ├─ 소규모 ──▶ Zustand
                └─ 대규모 ──▶ Redux Toolkit
```

### 3. 혼합 사용

실제 프로젝트에서는 **여러 방법을 조합**합니다.

```jsx
// 테마, 인증 → Context
// 서버 상태 → React Query
// 복잡한 UI 상태 → Zustand
// 단순 전달 → Props
```

---

## 안티패턴

| 안티패턴 | 문제 | 해결 |
|---------|------|------|
| 모든 것을 전역으로 | 지역 상태까지 전역화 | 지역 상태는 지역에서 관리 |
| Context 남용 | 자주 변경되는 상태 → 리렌더링 | 상태 라이브러리나 지역 상태 |
| 과도한 추상화 | 약간의 drilling에 바로 라이브러리 도입 | 실제 문제 될 때 해결 |

---

## 면접 예상 질문

**Q. Props Drilling이란?**

상위 컴포넌트의 데이터를 하위 컴포넌트에 전달하기 위해 중간 컴포넌트들이 사용하지 않는 props를 계속 전달하는 현상입니다. 코드 가독성 저하, 유지보수 어려움, 컴포넌트 결합도 증가 등의 문제가 있습니다.

**Q. Props Drilling 해결 방법들은?**

컴포넌트 합성, Context API, 상태 관리 라이브러리(Redux, Zustand 등)가 있습니다. 합성은 children을 활용해 중간 컴포넌트가 props를 몰라도 되게 합니다. Context는 전역적이고 드물게 변경되는 데이터에 적합합니다. 상태 관리 라이브러리는 복잡한 상태나 리렌더링 최적화가 필요할 때 사용합니다.

**Q. Context API의 단점은?**

value가 변경되면 해당 Context를 구독하는 모든 컴포넌트가 리렌더링됩니다. 이를 해결하려면 Context 분리, useMemo 사용 등이 필요합니다. 또한 여러 Context 사용 시 Provider Hell이 발생할 수 있고, 복잡한 상태 로직에는 부적합합니다.

**Q. 상태 관리 라이브러리는 언제 사용하나요?**

복잡한 상태 로직, 여러 컴포넌트의 상태 공유, 세밀한 리렌더링 최적화, 상태 변화 추적이 필요할 때 사용합니다. 소규모 앱이나 단순한 전역 상태만 필요하면 Context API로 충분합니다.

**Q. Props Drilling이 항상 나쁜가요?**

아닙니다. 1~2단계 전달은 자연스럽고, 명시적인 데이터 흐름이 장점입니다. 과도한 추상화보다 단순한 props 전달이 나을 수 있습니다. 실제로 문제가 될 때 해결하는 것이 좋습니다.