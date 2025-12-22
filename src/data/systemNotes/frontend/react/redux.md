# Redux와 Redux Toolkit

## Redux란?

**JavaScript 애플리케이션을 위한 예측 가능한 상태 관리 라이브러리**입니다. 

애플리케이션의 모든 상태를 하나의 저장소(Store)에서 관리하며, 상태 변경은 오직 Action이라는 객체를 통해서만 가능합니다. 이로 인해 상태가 언제, 어디서, 왜 변경되었는지 추적하기 쉬워집니다.

**사용 이유:**
- 여러 컴포넌트가 동일한 상태를 공유해야 할 때
- 상태 변경 로직이 복잡하고 예측 가능해야 할 때
- 상태 변경 히스토리를 추적하고 디버깅해야 할 때
- 서버 상태와 클라이언트 상태를 동기화해야 할 때

---

## Flux 패턴

Redux는 Facebook이 제안한 **Flux 아키텍처**를 기반으로 합니다. 핵심은 **단방향 데이터 흐름**입니다.

기존 MVC 패턴에서는 Model과 View가 양방향으로 데이터를 주고받아 복잡한 애플리케이션에서 데이터 흐름을 추적하기 어려웠습니다. Flux는 데이터가 한 방향으로만 흐르도록 강제하여 이 문제를 해결합니다.

```
Action → Dispatcher → Store → View → Action → ...
```

View에서 사용자 인터랙션이 발생하면 Action을 생성하고, 이 Action이 Dispatcher를 통해 Store로 전달되어 상태가 변경되고, 변경된 상태가 다시 View에 반영됩니다.

---

## Redux의 3가지 원칙

**1. Single Source of Truth (단일 진실의 원천)**

애플리케이션의 모든 상태는 하나의 스토어에 객체 트리 형태로 저장됩니다. 상태가 한 곳에 모여있어 디버깅이 쉽고, 서버에서 받은 상태를 클라이언트에 주입하기도 용이합니다.

**2. State is Read-Only (상태는 읽기 전용)**

상태를 변경하는 유일한 방법은 Action 객체를 dispatch하는 것입니다. View나 콜백에서 상태를 직접 수정할 수 없으므로, 모든 변경이 중앙에서 순차적으로 처리됩니다.

**3. Changes are Made with Pure Functions (순수 함수로 변경)**

상태 변경 로직은 Reducer라는 순수 함수로 작성합니다. 순수 함수는 같은 입력에 항상 같은 출력을 반환하고 부수 효과가 없어, 테스트와 예측이 쉽습니다.

---

## 핵심 개념

### Store

Store는 **애플리케이션의 전체 상태를 보관하는 객체**입니다. Redux 앱에는 단 하나의 스토어만 존재합니다.

스토어는 세 가지 역할을 합니다:
- `getState()`: 현재 상태 반환
- `dispatch(action)`: 액션을 전달하여 상태 변경 트리거
- `subscribe(listener)`: 상태 변경 시 호출될 리스너 등록

### Action

Action은 **상태 변경을 설명하는 평범한 JavaScript 객체**입니다. 반드시 `type` 필드를 가져야 하며, 이는 어떤 종류의 변경인지를 나타냅니다. 추가 데이터는 `payload` 필드에 담는 것이 관례입니다.

Action Creator는 Action 객체를 생성하는 함수입니다. 매번 객체를 직접 작성하는 대신 함수를 호출하여 일관된 형태의 Action을 생성합니다.

```javascript
const addTodo = (text) => ({ type: 'ADD_TODO', payload: { text } });
```

### Reducer

Reducer는 **현재 상태와 Action을 받아 새로운 상태를 반환하는 순수 함수**입니다. "Reducer"라는 이름은 배열의 `reduce` 메서드와 같은 개념에서 왔습니다.

Reducer 작성 시 중요한 규칙:
- 기존 상태를 직접 수정하면 안 됨 (불변성 유지)
- 부수 효과(API 호출, 라우팅 등)가 없어야 함
- 동일한 입력에 동일한 출력을 반환해야 함

```javascript
function todoReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, action.payload];  // 새 배열 반환 (불변성)
    default:
      return state;
  }
}
```

### Dispatch

Dispatch는 **Action을 스토어에 전달하는 함수**입니다. `store.dispatch(action)`을 호출하면 스토어가 Reducer를 실행하여 새 상태를 계산하고, 등록된 리스너들에게 상태 변경을 알립니다.

---

## React-Redux

React-Redux는 **Redux와 React를 연결하는 공식 바인딩 라이브러리**입니다.

### Provider

Provider는 React 앱 전체에 Redux 스토어를 제공하는 컴포넌트입니다. 앱 최상위에서 감싸면, 하위 모든 컴포넌트에서 스토어에 접근할 수 있습니다.

### useSelector

useSelector는 스토어에서 필요한 상태를 선택(select)하는 Hook입니다. 선택한 값이 변경될 때만 컴포넌트가 리렌더링됩니다. 이전 값과 새 값을 얕은 비교(===)하여 같으면 리렌더링을 건너뜁니다.

주의: 매번 새 객체를 반환하는 selector는 불필요한 리렌더링을 유발합니다. 필요한 원시값만 선택하거나, createSelector로 메모이제이션해야 합니다.

### useDispatch

useDispatch는 스토어의 dispatch 함수를 반환하는 Hook입니다. 이 함수로 Action을 전달하여 상태를 변경합니다.

```jsx
const count = useSelector((state) => state.counter.count);
const dispatch = useDispatch();
dispatch({ type: 'INCREMENT' });
```

---

## 기존 Redux의 문제점

**1. 보일러플레이트 코드가 많음**

Action 타입 상수 정의, Action Creator 함수 작성, Reducer의 switch문 등 반복적인 코드가 많습니다. 간단한 기능 하나 추가에도 여러 파일을 수정해야 했습니다.

**2. 불변성 직접 관리**

중첩된 객체 업데이트 시 스프레드 연산자를 여러 번 사용해야 합니다. 실수로 직접 수정하면 버그가 발생하지만 에러가 나지 않아 찾기 어렵습니다.

**3. 추가 패키지 필요**

비동기 처리를 위해 redux-thunk나 redux-saga, 불변성 관리를 위해 immer 등 별도 패키지 설치가 필요했습니다.

---

## Redux Toolkit (RTK)

Redux Toolkit은 **Redux 팀이 공식 권장하는 Redux 작성 방식**입니다. 기존 Redux의 문제점을 해결하고 모범 사례를 기본으로 내장합니다.

**RTK가 제공하는 것:**
- `configureStore`: 스토어 설정 간소화, DevTools와 미들웨어 자동 구성
- `createSlice`: Reducer와 Action Creator를 한 번에 생성
- `createAsyncThunk`: 비동기 로직의 생명주기(pending/fulfilled/rejected) 자동 관리
- **Immer 내장**: "mutating" 문법으로 작성해도 불변 업데이트로 자동 변환

---

## configureStore

configureStore는 **스토어 생성을 단순화하는 함수**입니다.

기존 Redux에서는 createStore, combineReducers, applyMiddleware를 조합하고 DevTools 설정을 별도로 해야 했습니다. configureStore는 이 모든 것을 자동으로 처리합니다.

기본적으로 redux-thunk 미들웨어가 포함되고, 개발 환경에서는 Redux DevTools가 자동 연결됩니다. 또한 상태 mutation이나 직렬화 불가능한 값을 감지하는 미들웨어도 포함됩니다.

```javascript
const store = configureStore({
  reducer: { counter: counterReducer, users: usersReducer },
});
```

---

## Middleware

### Middleware란?

**dispatch와 reducer 사이에서 액션을 가로채 추가 작업을 수행하는 함수**입니다. 액션이 리듀서에 도달하기 전에 로깅, 비동기 처리, 에러 핸들링 등을 수행할 수 있습니다.

```
Action → dispatch → [Middleware 1] → [Middleware 2] → ... → Reducer → Store
```

Redux의 핵심 원칙 중 하나는 Reducer가 순수 함수여야 한다는 것입니다. 부수 효과(Side Effect)가 있는 작업은 Reducer에서 할 수 없습니다. Middleware는 이런 부수 효과를 처리할 공간을 제공합니다.

### Middleware가 필요한 이유

| Reducer에서 할 수 없는 것 | Middleware에서 가능 |
|-------------------------|-------------------|
| API 호출 | ✅ |
| 로깅 | ✅ |
| 타이머 설정 | ✅ |
| 다른 액션 dispatch | ✅ |
| 랜덤 값 생성 | ✅ |
| localStorage 접근 | ✅ |

### Middleware 동작 원리

Middleware는 **커링(Currying)** 패턴을 사용합니다. 세 단계의 중첩 함수로 구성됩니다.

```javascript
const myMiddleware = (store) => (next) => (action) => {
  // 액션이 dispatch될 때마다 실행
  console.log('dispatching:', action);
  
  // 다음 미들웨어 또는 리듀서로 전달
  const result = next(action);
  
  // 상태 변경 후 실행
  console.log('next state:', store.getState());
  
  return result;
};
```

| 매개변수 | 설명 |
|---------|------|
| `store` | Redux 스토어 (getState, dispatch 접근) |
| `next` | 다음 미들웨어 또는 리듀서 호출 함수 |
| `action` | dispatch된 액션 객체 |

`next(action)`을 호출하지 않으면 액션이 리듀서에 도달하지 않습니다. 이를 활용해 특정 액션을 필터링하거나 변형할 수 있습니다.

### 대표적인 Middleware

| Middleware | 용도 | 특징 |
|------------|------|------|
| **redux-thunk** | 비동기 처리 | 함수를 dispatch 가능. 가장 간단 |
| **redux-saga** | 복잡한 비동기 | Generator 기반. 테스트 용이 |
| **redux-observable** | 복잡한 비동기 | RxJS 기반. 스트림 처리 |
| **redux-logger** | 로깅 | 액션과 상태 변화 콘솔 출력 |

### redux-thunk

RTK에 기본 포함된 미들웨어입니다. **함수를 dispatch할 수 있게** 해줍니다. 일반적으로 액션은 객체여야 하지만, thunk를 사용하면 함수도 dispatch할 수 있습니다.

```javascript
// thunk 액션 (함수를 반환)
const fetchUser = (userId) => async (dispatch, getState) => {
  dispatch({ type: 'user/loading' });
  
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    dispatch({ type: 'user/loaded', payload: data });
  } catch (error) {
    dispatch({ type: 'user/error', payload: error.message });
  }
};

// 사용
dispatch(fetchUser(123));
```

thunk 함수는 `dispatch`와 `getState`를 인자로 받아, 비동기 작업 후 다른 액션을 dispatch할 수 있습니다. RTK의 `createAsyncThunk`는 이 패턴을 더 간편하게 만든 것입니다.

### Middleware 설정 (RTK)

RTK의 configureStore는 기본 미들웨어를 자동 설정합니다. 커스텀 미들웨어를 추가하려면 `middleware` 옵션에서 `getDefaultMiddleware().concat(customMiddleware)`를 사용합니다.

| 기본 미들웨어 | 역할 | 환경 |
|---------|------|------|
| redux-thunk | 비동기 처리 | 개발/프로덕션 |
| serializableCheck | 직렬화 불가 값 감지 | 개발 |
| immutableCheck | 상태 mutation 감지 | 개발 |

개발 환경에서만 동작하는 미들웨어는 버그를 조기에 발견하게 도와줍니다. 프로덕션 빌드에서는 자동으로 제거됩니다.

---

## createSlice

createSlice는 **Reducer 로직과 Action을 한 곳에서 정의**하게 해줍니다. "slice"는 전체 상태 중 한 기능 영역을 담당하는 리듀서와 액션의 모음입니다.

createSlice의 핵심 기능:
- `name`: 액션 타입의 접두사로 사용 (예: `counter/increment`)
- `initialState`: 초기 상태
- `reducers`: 리듀서 함수들, 동시에 Action Creator도 자동 생성
- Immer 내장으로 상태를 직접 수정하는 것처럼 작성 가능

```javascript
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: (state) => { state.count += 1; },  // Immer가 불변 처리
  },
});
export const { increment } = counterSlice.actions;
```

`state.count += 1`처럼 작성해도 Immer가 내부적으로 `{ ...state, count: state.count + 1 }`로 변환합니다.

---

## createAsyncThunk

createAsyncThunk는 **비동기 로직을 위한 표준 패턴을 제공**합니다.

API 호출 같은 비동기 작업에는 "요청 시작 → 성공/실패 → 완료" 생명주기가 있습니다. createAsyncThunk는 이 세 단계에 해당하는 Action 타입을 자동 생성합니다:
- `pending`: 요청 시작
- `fulfilled`: 요청 성공
- `rejected`: 요청 실패

이 Action들을 `extraReducers`에서 처리하여 로딩 상태, 데이터, 에러를 관리합니다. `rejectWithValue`를 사용하면 에러 정보를 커스터마이즈할 수 있고, `thunkAPI.signal`로 요청 취소도 가능합니다.

```javascript
export const fetchUsers = createAsyncThunk('users/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/users');
    return response.json();
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
```

---

## extraReducers

extraReducers는 **createSlice 외부에서 정의된 Action을 처리**합니다.

createAsyncThunk가 생성한 pending/fulfilled/rejected 액션이나, 다른 slice의 액션에 반응해야 할 때 사용합니다. builder 패턴으로 각 케이스를 추가합니다.

```javascript
extraReducers: (builder) => {
  builder
    .addCase(fetchUsers.pending, (state) => { state.loading = true; })
    .addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    });
}
```

---

## Selector와 메모이제이션

Selector는 **스토어 상태에서 특정 값을 추출하는 함수**입니다. 컴포넌트에서 직접 상태 구조에 접근하는 대신 selector를 사용하면, 상태 구조가 변경되어도 selector만 수정하면 됩니다.

`createSelector`(reselect 기반)는 입력값이 변경되지 않으면 이전 결과를 재사용하는 메모이제이션된 selector를 생성합니다. 파생 데이터를 계산할 때 불필요한 재계산을 방지합니다.

```javascript
export const selectCompletedTodos = createSelector(
  [(state) => state.todos],
  (todos) => todos.filter(todo => todo.completed)
);
```

---

## Redux vs Context API

**Context API**는 React 내장 기능으로, 컴포넌트 트리 전체에 값을 전달합니다. **Redux**는 예측 가능한 상태 관리를 위한 별도 라이브러리입니다.

| 구분 | Redux | Context API |
|------|-------|-------------|
| 목적 | 복잡한 상태 로직 관리 | 값의 깊은 전달 |
| 리렌더링 | selector로 필요한 것만 | Provider 값 변경 시 전체 |
| 디버깅 | DevTools로 시간 여행 | 제한적 |
| 적합한 상황 | 자주 변경되는 복잡한 상태 | 테마, 언어 등 정적 설정 |

Context는 값이 변경되면 해당 Context를 사용하는 모든 컴포넌트가 리렌더링됩니다. Redux는 useSelector가 반환하는 값이 변경된 컴포넌트만 리렌더링되어 성능상 유리합니다.

---

## Redux vs Zustand

Zustand는 더 가벼운 상태 관리 라이브러리입니다. Redux Toolkit이 약 11KB인 반면 Zustand는 약 1KB입니다.

Zustand는 Provider가 필요 없고, 보일러플레이트가 거의 없습니다. 소규모 프로젝트나 간단한 상태 관리에 적합합니다. 반면 Redux는 미들웨어 생태계, DevTools, 대규모 팀에서의 일관된 패턴 등에서 장점이 있습니다.

---

## 면접 예상 질문

**Q. Redux란 무엇이고 왜 사용하나요?**

예측 가능한 상태 관리 라이브러리입니다. 모든 상태를 단일 스토어에서 관리하고, Action을 통해서만 상태를 변경하여 데이터 흐름을 추적하기 쉽습니다. 여러 컴포넌트가 상태를 공유하거나, 복잡한 상태 로직을 관리하거나, DevTools로 디버깅이 필요할 때 사용합니다.

**Q. Redux의 3가지 원칙?**

첫째, Single Source of Truth로 모든 상태를 하나의 스토어에 저장합니다. 둘째, State is Read-Only로 Action을 통해서만 상태를 변경합니다. 셋째, 상태 변경은 순수 함수인 Reducer로만 수행합니다.

**Q. Redux Toolkit을 사용하는 이유?**

기존 Redux의 보일러플레이트를 줄입니다. createSlice로 리듀서와 액션을 한 번에 정의하고, Immer가 내장되어 불변성을 자동 관리합니다. configureStore로 DevTools와 미들웨어가 자동 설정되어 초기 설정이 간단합니다.

**Q. createAsyncThunk의 역할?**

비동기 작업의 생명주기를 자동 관리합니다. 함수를 정의하면 pending, fulfilled, rejected 세 가지 액션 타입이 자동 생성되어, 로딩 상태와 에러 처리를 일관되게 구현할 수 있습니다.

**Q. Immer가 하는 역할?**

상태를 직접 수정하는 것처럼 코드를 작성해도 내부적으로 불변 업데이트로 변환합니다. `state.count += 1` 같은 코드가 실제로는 새 객체를 생성하여 불변성이 유지됩니다.

**Q. Redux Middleware란?**

dispatch와 reducer 사이에서 액션을 가로채 추가 작업을 수행하는 함수입니다. Reducer는 순수 함수여야 하므로 API 호출, 로깅 같은 부수 효과를 처리할 수 없습니다. Middleware가 이런 부수 효과를 처리할 공간을 제공합니다. redux-thunk, redux-saga, redux-logger 등이 대표적입니다.

**Q. redux-thunk가 하는 역할?**

함수를 dispatch할 수 있게 해주는 미들웨어입니다. 일반 액션은 객체여야 하지만, thunk를 사용하면 함수를 dispatch할 수 있습니다. 이 함수는 dispatch와 getState를 인자로 받아 비동기 작업 후 다른 액션을 dispatch할 수 있습니다. RTK에 기본 포함되어 있습니다.

**Q. useSelector 리렌더링 최적화?**

useSelector는 이전 값과 새 값을 얕은 비교하여 같으면 리렌더링하지 않습니다. 객체를 반환하면 매번 새 참조가 되므로, 필요한 원시값만 선택하거나 createSelector로 메모이제이션합니다.

**Q. Redux vs Context API 선택 기준?**

상태가 자주 변경되고 여러 컴포넌트에서 사용하면 Redux가 적합합니다. Redux는 selector로 필요한 컴포넌트만 리렌더링하지만, Context는 값 변경 시 모든 Consumer가 리렌더링됩니다. 테마나 언어 같은 정적 설정은 Context API로 충분합니다.