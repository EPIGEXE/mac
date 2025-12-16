# React 생명주기와 Hooks

## 생명주기(Lifecycle)란?

**컴포넌트가 생성되고, 업데이트되고, 제거되는 일련의 과정**입니다.

- **마운트(Mount)**: 컴포넌트가 DOM에 삽입
- **업데이트(Update)**: props나 state 변경으로 재렌더링
- **언마운트(Unmount)**: 컴포넌트가 DOM에서 제거

클래스 컴포넌트에서는 **생명주기 메서드**로, 함수 컴포넌트에서는 **Hooks**로 이 과정에 개입합니다.

---

## 클래스 컴포넌트의 생명주기

### 생명주기 흐름

```
마운트: constructor → render → DOM 업데이트 → componentDidMount

업데이트: render → DOM 업데이트 → componentDidUpdate

언마운트: componentWillUnmount
```

### 주요 생명주기 메서드

| 메서드 | 단계 | 용도 |
|--------|------|------|
| **constructor** | 마운트 | state 초기화, 이벤트 핸들러 바인딩 |
| **render** | 마운트/업데이트 | UI 반환 (순수 함수여야 함) |
| **componentDidMount** | 마운트 | DOM 접근, API 호출, 구독 설정 |
| **componentDidUpdate** | 업데이트 | 이전 props/state와 비교 후 작업 |
| **componentWillUnmount** | 언마운트 | 구독 해제, 타이머 정리 |
| **shouldComponentUpdate** | 업데이트 | 렌더링 여부 결정 (성능 최적화) |

---

## Hooks의 등장 배경

클래스 컴포넌트의 문제점:
- **로직 재사용 어려움**: HOC, render props 패턴의 복잡성
- **복잡한 컴포넌트**: 관련 없는 로직이 생명주기 메서드에 섞임
- **this 바인딩**: 혼란스럽고 실수하기 쉬움
- **코드 분산**: 하나의 기능이 여러 메서드에 흩어짐

Hooks는 **함수 컴포넌트에서 상태와 생명주기 기능을 사용**할 수 있게 합니다.

---

## 생명주기 메서드 → Hooks 대응

| 생명주기 메서드 | Hooks 대응 |
|----------------|-----------|
| constructor (state 초기화) | useState |
| componentDidMount | useEffect(..., []) |
| componentDidUpdate | useEffect(..., [deps]) |
| componentWillUnmount | useEffect의 cleanup 함수 |
| shouldComponentUpdate | React.memo, useMemo |

---

## useEffect와 생명주기

### 기본 구조

```jsx
useEffect(() => {
  // Effect 실행 (componentDidMount + componentDidUpdate)
  
  return () => {
    // Cleanup 함수 (componentWillUnmount + 다음 effect 전)
  };
}, [dependencies]);
```

### 의존성 배열에 따른 동작

| 의존성 배열 | 실행 시점 | 대응하는 생명주기 |
|------------|----------|------------------|
| 없음 `useEffect(fn)` | 매 렌더링마다 | componentDidMount + componentDidUpdate |
| 빈 배열 `useEffect(fn, [])` | 마운트 시 1번 | componentDidMount |
| 값 있음 `useEffect(fn, [a, b])` | 마운트 + a,b 변경 시 | componentDidMount + 조건부 componentDidUpdate |

### Cleanup 함수 실행 시점

1. **컴포넌트 언마운트 시** (componentWillUnmount)
2. **다음 effect 실행 전** (의존성 변경 시 이전 effect 정리)

```jsx
useEffect(() => {
  const subscription = subscribe(id);
  return () => subscription.unsubscribe();  // id 변경 시 & 언마운트 시 실행
}, [id]);
```

---

## 주요 Hooks

### 상태 관리

| Hook | 용도 |
|------|------|
| **useState** | 컴포넌트 상태 관리 |
| **useReducer** | 복잡한 상태 로직, 여러 하위 값 |

### 부수 효과

| Hook | 용도 |
|------|------|
| **useEffect** | DOM 조작, 구독, API 호출 (렌더링 후 비동기) |
| **useLayoutEffect** | DOM 측정, 동기적 조작 (페인트 전 동기) |

```
렌더링 → 화면 페인트 → useEffect (비동기)
렌더링 → useLayoutEffect (동기) → 화면 페인트
```

useLayoutEffect는 **화면 깜빡임 방지**가 필요할 때 사용 (예: 툴팁 위치 계산)

### 메모이제이션

| Hook | 용도 |
|------|------|
| **useMemo** | 계산 결과 캐싱 |
| **useCallback** | 함수 참조 유지 |

### 기타

| Hook | 용도 |
|------|------|
| **useRef** | DOM 참조, 렌더링 간 값 유지 (변경해도 리렌더 안 함) |
| **useContext** | Context 값 구독 |

---

## 클래스 vs Hooks 비교

### 같은 기능, 다른 구현

```jsx
// 클래스 컴포넌트
class Timer extends React.Component {
  state = { count: 0 };

  componentDidMount() {
    this.id = setInterval(() => this.setState(s => ({ count: s.count + 1 })), 1000);
  }
  componentWillUnmount() {
    clearInterval(this.id);
  }
  render() { return <div>{this.state.count}</div>; }
}

// 함수 컴포넌트 + Hooks
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(c => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <div>{count}</div>;
}
```

### Hooks의 장점

| 관점 | 클래스 | Hooks |
|------|--------|-------|
| **로직 구성** | 생명주기별로 분산 | 관련 로직을 함께 |
| **재사용** | HOC, render props | Custom Hook |
| **this** | 바인딩 필요 | 없음 |
| **코드량** | 많음 | 적음 |

### 관련 로직의 응집

```jsx
// 클래스: 구독 로직이 3개 메서드에 분산
componentDidMount() { subscribe(this.props.id); }
componentDidUpdate(prev) {
  if (prev.id !== this.props.id) {
    unsubscribe(prev.id);
    subscribe(this.props.id);
  }
}
componentWillUnmount() { unsubscribe(this.props.id); }

// Hooks: 구독 로직이 하나로 응집
useEffect(() => {
  subscribe(id);
  return () => unsubscribe(id);
}, [id]);
```

---

## Custom Hooks

**로직을 재사용 가능한 함수로 추출**합니다. `use`로 시작하는 이름을 사용합니다.

```jsx
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setSize({ 
      width: window.innerWidth, 
      height: window.innerHeight 
    });
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

**장점**: 로직 재사용, 관심사 분리, 테스트 용이, 조합 가능

---

## Hooks 규칙

### 1. 최상위에서만 호출

조건문, 반복문, 중첩 함수 안에서 호출 금지

```jsx
// ❌ if (condition) { useEffect(() => {}); }
// ✅ useEffect(() => { if (condition) { ... } }, [condition]);
```

**이유**: React는 Hook 호출 순서로 상태를 관리합니다. 순서가 바뀌면 상태가 꼬입니다.

### 2. React 함수에서만 호출

함수 컴포넌트 또는 Custom Hook에서만 사용 (일반 함수에서 사용 불가)

---

## React 18+의 새로운 Hook

| Hook | 용도 |
|------|------|
| **useTransition** | 긴급하지 않은 상태 업데이트 표시 |
| **useDeferredValue** | 값의 업데이트를 지연 |
| **useId** | 고유 ID 생성 (SSR 호환) |

### Strict Mode 주의

React 18 Strict Mode에서 useEffect가 **마운트 → 언마운트 → 다시 마운트**로 실행됩니다. Cleanup 로직이 제대로 작성되었는지 검증하는 목적입니다.

---

## 면접 예상 질문

**Q. useEffect와 생명주기 메서드의 관계?**

useEffect는 componentDidMount, componentDidUpdate, componentWillUnmount를 통합합니다. 의존성 배열이 빈 배열이면 마운트 시에만, 값이 있으면 해당 값 변경 시에도 실행됩니다. return하는 cleanup 함수가 언마운트와 다음 effect 실행 전 정리 역할을 합니다.

**Q. useEffect와 useLayoutEffect의 차이?**

useEffect는 화면 페인트 후 비동기로 실행되고, useLayoutEffect는 DOM 업데이트 직후 페인트 전에 동기로 실행됩니다. useLayoutEffect는 DOM 측정이나 깜빡임 방지가 필요할 때 사용하지만, 렌더링을 블로킹하므로 대부분 useEffect를 사용합니다.

**Q. Hooks 규칙은?**

두 가지입니다. 첫째, 최상위에서만 호출 (조건문/반복문 안 금지). React가 Hook 순서로 상태를 추적하기 때문입니다. 둘째, React 함수(컴포넌트, Custom Hook)에서만 호출해야 합니다.

**Q. 클래스 대비 Hooks의 장점?**

관련 로직을 함께 배치할 수 있어 응집도가 높아집니다. Custom Hook으로 로직을 쉽게 재사용하고, this 바인딩이 필요 없어 코드가 간결합니다.

**Q. useEffect cleanup은 언제 실행되나요?**

두 경우입니다. 컴포넌트 언마운트 시, 그리고 의존성 변경으로 다음 effect 실행 직전에 이전 effect의 cleanup이 먼저 실행됩니다.