# useState와 useEffect 최적화

## useState 최적화

### 1. 지연 초기화 (Lazy Initialization)

초기값 계산이 비용이 클 때, **함수를 전달**하면 마운트 시 한 번만 실행됩니다.

```jsx
// ❌ 매 렌더링마다 계산 실행 (결과만 초기값으로 사용되지만 계산은 매번)
const [state, setState] = useState(expensiveComputation());

// ✅ 마운트 시 한 번만 실행
const [state, setState] = useState(() => expensiveComputation());
```

**사용 시점**:
- localStorage/sessionStorage 읽기
- 복잡한 계산이나 데이터 변환
- 큰 배열/객체 초기화

### 2. 함수형 업데이트 (Functional Updates)

이전 상태를 기반으로 업데이트할 때, **함수를 전달**하면 항상 최신 상태를 참조합니다.

```jsx
// ❌ 클로저에 캡처된 이전 값 참조 가능
setState(count + 1);

// ✅ 항상 최신 상태 기반으로 업데이트
setState(prevCount => prevCount + 1);
```

**필수 사용 시점**:
- 비동기 콜백(setTimeout, Promise) 안에서 상태 업데이트
- 여러 상태 업데이트가 연속될 때
- 이벤트 핸들러에서 이전 상태 의존 시

### 3. 상태 구조 설계

#### 관련 상태 그룹화

```jsx
// ❌ 항상 함께 변경되는 상태를 분리
const [x, setX] = useState(0);
const [y, setY] = useState(0);

// ✅ 함께 변경되면 함께 관리
const [position, setPosition] = useState({ x: 0, y: 0 });
```

#### 독립적인 상태 분리

```jsx
// ❌ 독립적인 상태를 하나로 묶음 → 불필요한 리렌더링
const [state, setState] = useState({ name: '', age: 0, theme: 'light' });

// ✅ 독립적으로 변경되면 분리
const [name, setName] = useState('');
const [age, setAge] = useState(0);
const [theme, setTheme] = useState('light');
```

#### 판단 기준

| 상황 | 권장 |
|------|------|
| 항상 함께 업데이트 | 하나의 객체로 통합 |
| 독립적으로 업데이트 | 분리된 상태 |
| 상태가 많고 복잡 | useReducer 고려 |

### 4. 파생 상태 피하기

다른 상태/props에서 **계산 가능한 값은 상태로 만들지 않습니다**.

```jsx
// ❌ 불필요한 상태 (items에서 계산 가능)
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);
const [hasItems, setHasItems] = useState(false);

// items 변경 시마다 동기화 필요 → 버그 가능성

// ✅ 렌더링 중 계산
const [items, setItems] = useState([]);
const count = items.length;
const hasItems = items.length > 0;

// 계산 비용이 크면 useMemo
const expensiveValue = useMemo(() => computeExpensive(items), [items]);
```

### 5. 불변성 유지

상태 객체/배열을 직접 수정하면 **React가 변경을 감지하지 못합니다**.

```jsx
// ❌ 직접 수정 (같은 참조 → 리렌더링 안 됨)
const addItem = (item) => {
  items.push(item);
  setItems(items);
};

// ✅ 새 배열/객체 생성
const addItem = (item) => {
  setItems(prev => [...prev, item]);
};

const updateUser = (key, value) => {
  setUser(prev => ({ ...prev, [key]: value }));
};
```

### 6. 배칭 (Batching)

React 18부터 모든 상황에서 **여러 setState를 하나의 렌더링으로 배칭**합니다.

```jsx
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  setName('React');
  // → 1번의 리렌더링
}

// setTimeout, Promise 안에서도 배칭됨 (React 18+)
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // → 1번의 리렌더링 (React 18+)
}, 1000);
```

**배칭 해제**: `flushSync`로 가능하지만 거의 필요 없음

---

## useEffect 최적화

### 1. 의존성 배열 올바르게 사용

#### 규칙

- effect 내에서 사용하는 **모든 반응형 값**을 포함
- 반응형 값: props, state, 이들로부터 계산된 값

```jsx
// ❌ 의존성 누락 → 오래된 값 참조 (stale closure)
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []);  // count 누락!

// ✅ 모든 의존성 포함
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, [count]);
```

#### ESLint 규칙 활용

`eslint-plugin-react-hooks`의 `exhaustive-deps` 규칙이 의존성 누락을 경고합니다. **경고를 무시하지 말고 해결**하세요.

### 2. 불필요한 effect 피하기

#### 렌더링 중 계산 가능한 것

```jsx
// ❌ 불필요한 effect
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');

useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ 렌더링 중 계산
const fullName = firstName + ' ' + lastName;
```

#### props/state 변경에 따른 state 리셋

```jsx
// ❌ effect로 동기화 (불필요한 렌더링)
useEffect(() => {
  setSelection(null);
}, [items]);

// ✅ key를 사용해 컴포넌트 리셋
<List items={items} key={items.id} />
```

#### 이벤트에 대한 반응

```jsx
// ❌ effect로 이벤트 처리
useEffect(() => {
  if (submitted) {
    sendAnalytics('form_submitted');
  }
}, [submitted]);

// ✅ 이벤트 핸들러에서 직접 처리
const handleSubmit = () => {
  setSubmitted(true);
  sendAnalytics('form_submitted');
};
```

### 3. effect가 적절한 경우

| 적절한 사용 | 부적절한 사용 |
|------------|--------------|
| 외부 시스템과 동기화 (API, 구독) | props/state에서 계산 가능한 값 |
| DOM 직접 조작 | 이벤트에 대한 반응 |
| 타이머 설정 | 상태 동기화 |
| 브라우저 API 사용 | |

### 4. cleanup 함수 작성

구독, 타이머, 이벤트 리스너는 **반드시 정리**해야 합니다.

```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal }).then(res => res.json()).then(setData);
  return () => controller.abort();  // 언마운트 시 요청 취소
}, []);
```

### 5. 무한 루프 방지

#### 객체/배열/함수 의존성

```jsx
// ❌ 매 렌더링마다 새 객체 → 무한 루프
useEffect(() => {
  fetchData(options);
}, [options]);  // options = { page: 1 } 매번 새로 생성

// ✅ 방법 1: 원시값으로 분해
useEffect(() => {
  fetchData({ page, limit });
}, [page, limit]);

// ✅ 방법 2: useMemo로 참조 유지
const options = useMemo(() => ({ page, limit }), [page, limit]);
useEffect(() => {
  fetchData(options);
}, [options]);
```

#### effect 안에서 setState

```jsx
// ❌ 무한 루프
useEffect(() => {
  setCount(count + 1);
}, [count]);

// ✅ 조건부 업데이트
useEffect(() => {
  if (shouldUpdate) {
    setCount(c => c + 1);
  }
}, [shouldUpdate]);
```

---

## 주요 주의사항

### 1. Stale Closure (오래된 클로저)

콜백 함수가 **생성 시점의 상태값을 캡처**하여 발생합니다.

```jsx
// ❌ 3번 클릭해도 "clicked 1 times" 출력
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setTimeout(() => {
      alert(`clicked ${count} times`);  // 클릭 시점의 count 캡처
    }, 3000);
  };

  return <button onClick={handleClick}>Click ({count})</button>;
}

// ✅ 해결 1: 함수형 업데이트
setCount(c => c + 1);

// ✅ 해결 2: useRef로 최신 값 참조
const countRef = useRef(count);
countRef.current = count;
setTimeout(() => alert(`clicked ${countRef.current} times`), 3000);
```

### 2. useEffect 의존성 관련

| 문제 | 증상 | 해결 |
|------|------|------|
| 의존성 누락 | 오래된 값 사용 | 모든 의존성 추가 |
| 객체/배열 의존성 | 무한 루프 | useMemo 또는 원시값 분해 |
| 함수 의존성 | 매번 재실행 | useCallback 또는 effect 안에서 정의 |

### 3. 함수 의존성 처리

```jsx
// ❌ 함수가 매번 새로 생성 → effect 매번 실행
const fetchData = () => fetch(`/api/${id}`);
useEffect(() => {
  fetchData().then(setData);
}, [fetchData]);

// ✅ 방법 1: effect 안에서 함수 정의
useEffect(() => {
  const fetchData = () => fetch(`/api/${id}`);
  fetchData().then(setData);
}, [id]);

// ✅ 방법 2: useCallback으로 감싸기
const fetchData = useCallback(() => fetch(`/api/${id}`), [id]);
useEffect(() => {
  fetchData().then(setData);
}, [fetchData]);
```

### 4. 개발 모드 이중 실행

React 18 Strict Mode에서 effect가 **두 번 실행**됩니다 (마운트 → 언마운트 → 마운트). cleanup이 제대로 작성되었는지 검증하는 목적입니다.

```jsx
// cleanup이 없으면 문제 발생
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 1000);
  return () => clearInterval(id);  // cleanup 필수!
}, []);
```

---

## 최적화 체크리스트

### useState

- [ ] 비싼 초기값은 함수로 지연 초기화
- [ ] 이전 상태 기반 업데이트는 함수형으로
- [ ] 파생 가능한 값은 상태로 만들지 않기
- [ ] 함께 변경되는 상태는 그룹화
- [ ] 독립적인 상태는 분리
- [ ] 불변성 유지 (새 객체/배열 생성)

### useEffect

- [ ] 모든 반응형 값을 의존성에 포함
- [ ] 불필요한 effect 제거 (계산, 이벤트 반응)
- [ ] cleanup 함수로 구독/타이머 정리
- [ ] 객체/함수 의존성은 메모이제이션 또는 분해
- [ ] exhaustive-deps 린트 규칙 준수

---

## 면접 예상 질문

**Q. useState의 지연 초기화란?**

초기값으로 함수를 전달하면 마운트 시 한 번만 실행됩니다. `useState(expensiveFn())`은 매 렌더링마다 함수를 호출하지만 (결과만 초기값으로 사용), `useState(() => expensiveFn())`은 마운트 시에만 호출됩니다. localStorage 읽기나 복잡한 계산에 유용합니다.

**Q. 함수형 업데이트는 언제 사용하나요?**

이전 상태를 기반으로 업데이트할 때 `setState(prev => prev + 1)` 형태로 사용합니다. 특히 비동기 콜백이나 연속 업데이트에서 클로저에 캡처된 이전 값이 아닌 최신 상태를 참조할 수 있습니다.

**Q. Stale closure 문제와 해결법?**

콜백이 생성 시점의 상태값을 캡처하여 오래된 값을 참조하는 문제입니다. 해결 방법으로 함수형 업데이트(`setCount(c => c + 1)`)를 사용하거나, useRef로 최신 값을 유지하거나, useEffect 의존성 배열을 올바르게 설정합니다.

**Q. useEffect에서 객체 의존성 문제와 해결?**

객체/배열은 매 렌더링마다 새로 생성되어 참조가 달라지고, effect가 무한 실행될 수 있습니다. 해결 방법으로 원시값으로 분해하거나, useMemo로 참조를 유지하거나, effect 안에서 객체를 생성합니다.

**Q. 불필요한 useEffect의 예시?**

props나 state에서 계산 가능한 값을 effect로 동기화하는 경우입니다. `useEffect(() => setFullName(first + last), [first, last])` 대신 `const fullName = first + last`로 렌더링 중 계산하면 됩니다. 이벤트에 대한 반응도 effect보다 이벤트 핸들러에서 직접 처리하는 것이 좋습니다.

**Q. React 18 Strict Mode에서 effect가 두 번 실행되는 이유?**

cleanup 로직이 제대로 작성되었는지 검증하기 위해서입니다. 마운트 → 언마운트 → 다시 마운트로 실행하여, cleanup이 없거나 부실하면 문제가 드러납니다. 프로덕션에서는 한 번만 실행됩니다.