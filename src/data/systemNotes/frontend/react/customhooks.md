# Custom Hook

## Custom Hook이란?

**React의 내장 Hook을 조합하여 재사용 가능한 로직을 추출한 함수**입니다. `use`로 시작하는 이름을 가지며, 컴포넌트에서 상태 로직을 분리하여 여러 컴포넌트에서 공유할 수 있게 합니다.

```jsx
// Custom Hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  return { count, increment, decrement, reset };
}

// 여러 컴포넌트에서 재사용
function ComponentA() {
  const { count, increment } = useCounter(0);
  return <button onClick={increment}>{count}</button>;
}

function ComponentB() {
  const { count, decrement } = useCounter(100);
  return <button onClick={decrement}>{count}</button>;
}
```

Custom Hook은 로직만 공유하고, **상태는 각 컴포넌트에서 독립적**입니다. ComponentA와 ComponentB의 count는 별개입니다.

---

## Custom Hook의 장점

- **관심사 분리**: 컴포넌트는 UI에 집중하고, 로직은 Hook으로 분리
- **재사용성**: 같은 로직을 여러 컴포넌트에서 공유
- **테스트 용이성**: Hook을 독립적으로 테스트 가능
- **가독성**: 컴포넌트가 간결해지고 의도가 명확해짐

```jsx
// ❌ 컴포넌트에 로직이 섞여 있음
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { /* 페칭 로직 */ }, []);
  // ...렌더링
}

// ✅ 로직을 Hook으로 분리
function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { /* 페칭 로직 */ }, []);
  return { user, loading };
}

function UserProfile() {
  const { user, loading } = useUser();
  // ...렌더링만
}
```

---

## 작성 규칙

**1. `use`로 시작하는 이름**

React가 Hook으로 인식하고 규칙 위반을 검사합니다.

```jsx
// ✅ 올바른 이름
function useWindowSize() { }
function useFetch() { }
function useLocalStorage() { }

// ❌ Hook으로 인식 안 됨
function getWindowSize() { }
function fetchData() { }
```

**2. 최상위에서만 Hook 호출**

조건문, 반복문, 중첩 함수 안에서 Hook을 호출하면 안 됩니다. Custom Hook 내부에서도 마찬가지입니다.

```jsx
// ❌ 조건부 Hook 호출
function useData(shouldFetch) {
  if (shouldFetch) {
    const [data, setData] = useState(null);  // 규칙 위반
  }
}

// ✅ Hook은 항상 호출, 조건은 내부에서
function useData(shouldFetch) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (shouldFetch) {
      fetchData().then(setData);
    }
  }, [shouldFetch]);
  
  return data;
}
```

**3. React 함수에서만 호출**

컴포넌트 또는 다른 Custom Hook에서만 호출해야 합니다.

---

## 실용적인 Custom Hook 예시

**useToggle - 불리언 상태 토글**

```jsx
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return { value, toggle, setTrue, setFalse };
}

// 사용
const { value: isOpen, toggle: toggleModal } = useToggle();
```

**useLocalStorage - localStorage 동기화**

```jsx
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}

// 사용
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

**useFetch - 데이터 페칭**

```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    
    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(setData)
      .catch(err => { if (err.name !== 'AbortError') setError(err); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
```

**useDebounce - 디바운스된 값**

```jsx
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 사용: 검색어 입력 시 API 호출 최적화
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);
}
```

**useClickOutside - 외부 클릭 감지**

```jsx
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

// 사용: 모달/드롭다운 외부 클릭 시 닫기
const ref = useRef(null);
useClickOutside(ref, () => setIsOpen(false));
```

**useWindowSize - 윈도우 크기 추적**

```jsx
function useWindowSize() {
  const [size, setSize] = useState({ width: innerWidth, height: innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ width: innerWidth, height: innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

**usePrevious - 이전 값 추적**

```jsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}
```

---

## 재사용성을 높이는 설계 원칙

**1. 단일 책임 원칙** - 하나의 Hook은 하나의 관심사만 다룹니다.

```jsx
// ❌ useUserDashboard (사용자 정보, 알림, 테마, 분석 모두 처리)
// ✅ useUser, useNotifications, useTheme 으로 분리
```

**2. 적절한 추상화 수준** - 너무 구체적이면 재사용이 어렵고, 너무 추상적이면 사용하기 어렵습니다.

```jsx
// ❌ 너무 구체적: useUserList() → 특정 API에 종속
// ❌ 너무 추상적: useData(fetcher, transformer, validator, cacher, retrier)
// ✅ 적절함: useFetch(url, options) + useUserList(filters)
```

**3. 설정 가능한 옵션** - 기본값을 제공하면서 다양한 상황에서 사용할 수 있도록 합니다.

```jsx
function useDebounce(value, delay = 300) { }
function useFetch(url, { immediate = true, retryCount = 0, onSuccess, onError } = {}) { }
```

**4. 일관된 반환 형식** - 비슷한 유형의 Hook은 비슷한 형식으로 반환합니다.

**5. 에러 처리와 엣지 케이스** - SSR 환경, JSON 파싱 실패, 스토리지 접근 불가 등을 고려합니다.

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;  // SSR
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  // ...
}
```

---

## Hook 조합 패턴

Custom Hook은 다른 Custom Hook을 조합하여 더 복잡한 로직을 구현할 수 있습니다.

```jsx
// 기본 Hook들을 조합하여 검색 Hook 구현
function useSearch(baseUrl) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data, loading, error } = useFetch(
    debouncedQuery ? `${baseUrl}?q=${debouncedQuery}` : null
  );
  
  return { query, setQuery, results: data, loading, error };
}
```

작은 단위의 Hook을 만들고 조합하면 복잡한 기능도 깔끔하게 구현할 수 있습니다.

---

## 테스트

`@testing-library/react`의 `renderHook`을 사용합니다.

```jsx
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useCounter', () => {
  it('should increment count', () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => { result.current.increment(); });
    
    expect(result.current.count).toBe(1);
  });
});

describe('useFetch', () => {
  it('should fetch data', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) })
    );

    const { result } = renderHook(() => useFetch('/api/data'));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: 1 });
  });
});
```

---

## 안티패턴

**과도한 추상화** - 한 번만 쓸 로직을 Hook으로 만들지 마세요.

**상태와 무관한 로직** - 순수 계산은 일반 함수로 충분합니다.

```jsx
// ❌ Hook이 필요 없음
function useFormatDate(date) { return new Date(date).toLocaleDateString(); }
// ✅ 일반 함수
function formatDate(date) { return new Date(date).toLocaleDateString(); }
```

**props를 그대로 반환** - Hook은 상태, 부수 효과, 또는 다른 Hook을 사용해야 의미 있습니다.

---

## 면접 예상 질문

**Q. Custom Hook이란?**

React 내장 Hook을 조합하여 재사용 가능한 상태 로직을 추출한 함수입니다. use로 시작하는 이름을 가지며, 컴포넌트 간 로직을 공유하면서 상태는 독립적으로 유지됩니다. 컴포넌트에서 로직을 분리하여 관심사를 분리하고 테스트를 용이하게 합니다.

**Q. Custom Hook 작성 시 주의점?**

use로 시작하는 이름을 사용해야 React가 Hook으로 인식합니다. 최상위에서만 Hook을 호출해야 하고, 조건문이나 반복문 안에서 호출하면 안 됩니다. 단일 책임 원칙을 지키고, 적절한 추상화 수준을 유지해야 재사용성이 높아집니다.

**Q. 재사용성을 높이는 방법?**

하나의 Hook은 하나의 관심사만 다루고, 설정 가능한 옵션을 제공합니다. 너무 구체적이거나 추상적이지 않은 적절한 추상화 수준을 유지하고, 일관된 반환 형식을 사용합니다. 에러 처리와 엣지 케이스(SSR 등)도 고려해야 합니다.

**Q. Custom Hook을 사용해본 경험?**

useDebounce로 검색 입력 최적화, useLocalStorage로 사용자 설정 유지, useClickOutside로 모달/드롭다운 외부 클릭 처리, useFetch로 API 호출 로직 재사용 등의 경험이 있습니다. 이를 통해 컴포넌트 코드가 간결해지고 같은 로직을 여러 곳에서 일관되게 사용할 수 있었습니다.

**Q. Hook을 만들지 말아야 할 때?**

상태나 부수 효과가 없는 순수 계산 로직은 일반 함수로 충분합니다. 한 번만 사용되는 로직이나 특정 컴포넌트에 강하게 결합된 로직은 컴포넌트에 두는 것이 낫습니다. 과도한 추상화는 오히려 코드를 복잡하게 만듭니다.