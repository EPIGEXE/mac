# React.memo, useMemo, useCallback

## 개요

React의 **메모이제이션(Memoization)** 도구들입니다. 불필요한 렌더링이나 계산을 방지하여 성능을 최적화합니다.

| 도구 | 메모이제이션 대상 | 용도 |
|------|------------------|------|
| **React.memo** | 컴포넌트 | props가 같으면 리렌더링 스킵 |
| **useMemo** | 계산 결과 (값) | 비용이 큰 계산 결과 캐싱 |
| **useCallback** | 함수 | 함수 참조 유지 |

---

## React.memo

**컴포넌트를 메모이제이션하는 고차 컴포넌트(HOC)**입니다. props가 변경되지 않으면 리렌더링을 건너뜁니다.

```jsx
const MemoizedComponent = React.memo(function MyComponent({ name, age }) {
  console.log('렌더링!');
  return <div>{name}, {age}</div>;
});

// 부모가 리렌더링되어도 name, age가 같으면 리렌더링 안 함
```

기본적으로 **얕은 비교(shallow comparison)**를 수행합니다.

```jsx
// 원시값: 값 비교
{ name: 'John' } === { name: 'John' }  // ✅ 같음

// 객체/배열/함수: 참조 비교
{ user: { id: 1 } } === { user: { id: 1 } }  // ❌ 다름 (새 객체)
```

두 번째 인자로 **커스텀 비교 함수**를 전달할 수 있습니다.

```jsx
const MemoizedComponent = React.memo(MyComponent, (prevProps, nextProps) => {
  // true 반환: 리렌더링 스킵
  // false 반환: 리렌더링 수행
  return prevProps.id === nextProps.id;
});
```

| 사용하면 좋은 경우 | 불필요한 경우 |
|-------------------|--------------|
| 부모가 자주 리렌더링되는 경우 | props가 거의 항상 변경되는 경우 |
| 렌더링 비용이 큰 컴포넌트 | 매우 가벼운 컴포넌트 |
| 같은 props로 자주 렌더링되는 경우 | 자식이 없거나 단순한 경우 |
| 리스트의 개별 아이템 | |

주의할 점은 매번 새 객체/함수를 props로 전달하면 memo가 무효화된다는 것입니다.

```jsx
// ❌ 매번 새 객체/함수 전달 → memo 무효화
<MemoizedChild 
  user={{ name: 'John' }}  // 새 객체
  onClick={() => {}}        // 새 함수
/>

// ✅ 참조 유지
const user = useMemo(() => ({ name: 'John' }), []);
const handleClick = useCallback(() => {}, []);
<MemoizedChild user={user} onClick={handleClick} />
```

---

## useMemo

**계산 결과를 메모이제이션하는 Hook**입니다. 의존성이 변경될 때만 재계산합니다.

```jsx
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

첫 렌더링에서 함수를 실행하고 결과를 저장합니다. 이후 렌더링에서는 의존성을 비교하여, 변경되었으면 재계산하고 변경되지 않았으면 저장된 결과를 반환합니다.

```jsx
function ProductList({ products, filter }) {
  // filter가 바뀔 때만 필터링 재실행
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  // 비용 큰 계산 캐싱
  const statistics = useMemo(() => {
    return calculateComplexStatistics(products);
  }, [products]);

  return <List items={filteredProducts} stats={statistics} />;
}
```

**참조 동일성 유지**에도 사용됩니다. 객체나 배열을 매 렌더링마다 새로 생성하면 자식 컴포넌트가 불필요하게 리렌더링될 수 있습니다.

```jsx
// ❌ 매 렌더링마다 새 객체 → 자식 리렌더링
const style = { color: 'red', fontSize: size };

// ✅ size가 바뀔 때만 새 객체
const style = useMemo(() => ({ color: 'red', fontSize: size }), [size]);
```

| 사용하면 좋은 경우 | 불필요한 경우 |
|-------------------|--------------|
| 비용이 큰 계산 (정렬, 필터링, 변환) | 단순한 계산 |
| 참조 동일성이 중요한 객체/배열 | 원시값 계산 |
| React.memo 자식에 전달하는 객체 | 매번 달라져야 하는 값 |
| 다른 Hook의 의존성으로 사용되는 값 | |

---

## useCallback

**함수를 메모이제이션하는 Hook**입니다. 의존성이 변경될 때만 새 함수를 생성합니다.

```jsx
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

`useCallback(fn, deps)`는 `useMemo(() => fn, deps)`와 동일합니다. 함수 자체를 캐싱하는 것입니다.

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // 함수 참조 유지 → MemoizedChild 리렌더링 방지
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  // count를 사용하지만 함수형 업데이트로 의존성 제거
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <>
      <MemoizedChild onClick={handleClick} />
      <button onClick={handleIncrement}>+</button>
    </>
  );
}
```

| 사용하면 좋은 경우 | 불필요한 경우 |
|-------------------|--------------|
| React.memo 자식에 콜백 전달 | 메모이제이션 안 된 자식에 전달 |
| useEffect 의존성으로 사용 | 렌더링마다 달라져야 하는 함수 |
| 커스텀 Hook에서 반환하는 함수 | 이벤트 핸들러가 최적화 불필요할 때 |
| 다른 Hook의 의존성으로 사용 | |

---

## 세 가지 비교

| 구분 | React.memo | useMemo | useCallback |
|------|------------|---------|-------------|
| **대상** | 컴포넌트 | 값 | 함수 |
| **형태** | HOC | Hook | Hook |
| **반환** | 메모이제이션된 컴포넌트 | 계산된 값 | 함수 |
| **비교 기준** | props | 의존성 배열 | 의존성 배열 |
| **목적** | 리렌더링 방지 | 재계산 방지 | 함수 재생성 방지 |

세 가지를 조합해야 최적화가 완성됩니다.

```jsx
function Parent() {
  const [items, setItems] = useState([]);
  
  // useMemo: 객체 참조 유지
  const config = useMemo(() => ({ theme: 'dark' }), []);
  
  // useCallback: 함수 참조 유지
  const handleSelect = useCallback((id) => {
    console.log(id);
  }, []);
  
  // React.memo된 자식에 전달
  return <MemoizedList items={items} config={config} onSelect={handleSelect} />;
}

const MemoizedList = React.memo(function List({ items, config, onSelect }) {
  return items.map(item => (
    <Item key={item.id} {...item} onSelect={onSelect} />
  ));
});
```

React.memo만 사용하고 props로 새 객체/함수를 전달하면 memo가 무효화됩니다. useMemo/useCallback으로 참조를 유지해야 효과가 있습니다.

---

## 언제 사용하지 말아야 하는가

메모이제이션도 **비용이 있습니다**. 메모리 사용(이전 값 저장), 비교 연산(의존성 체크), 코드 복잡도 증가가 발생합니다.

```jsx
// ❌ 단순 계산에 useMemo
const double = useMemo(() => count * 2, [count]);
// ✅ 그냥 계산
const double = count * 2;

// ❌ 메모이제이션 안 된 자식에 useCallback
<RegularChild onClick={useCallback(() => {}, [])} />
// ✅ 그냥 함수
<RegularChild onClick={() => {}} />

// ❌ props가 항상 변경되는 컴포넌트에 React.memo
const MemoizedTimer = React.memo(Timer);  // time이 매초 변경
```

**최적화 전 확인 사항:**
1. 실제로 성능 문제가 있는가? (측정 먼저!)
2. 컴포넌트가 자주 리렌더링되는가?
3. 렌더링 비용이 큰가?
4. props가 실제로 같은 경우가 많은가?

---

## 최적화 권장 케이스

**React.memo 권장:**
- 리스트 아이템 컴포넌트
- 복잡한 자식 컴포넌트 (차트, 테이블 등)
- 자주 리렌더링되는 부모의 자식 (props는 안 변함)

**useMemo 권장:**
- 비용 큰 계산 (정렬, 필터링, 통계)
- memo된 자식에 전달하는 객체/배열
- useEffect 의존성으로 사용되는 객체

**useCallback 권장:**
- memo된 자식에 콜백 전달
- useEffect 의존성으로 사용되는 함수
- 커스텀 Hook에서 반환하는 함수

---

## 흔한 실수

**의존성 누락** - 오래된 값을 참조하는 stale closure 버그가 발생합니다.

```jsx
// ❌ id 누락 → 오래된 id 사용
const handleClick = useCallback(() => {
  fetchItem(id);
}, []);

// ✅ 모든 의존성 포함
const handleClick = useCallback(() => {
  fetchItem(id);
}, [id]);
```

**불필요한 의존성** - 매 렌더링마다 변경되는 값을 의존성에 넣으면 메모이제이션이 무의미해집니다.

```jsx
// ❌ helper가 매번 새로 생성 → useCallback 무의미
const Parent = () => {
  const helper = () => {};
  const handleClick = useCallback(() => {
    helper();
  }, [helper]);
};

// ✅ helper도 useCallback 또는 내부로 이동
const handleClick = useCallback(() => {
  const helper = () => {};
  helper();
}, []);
```

**React.memo 무효화** - 인라인 객체/함수가 memo를 무력화합니다.

```jsx
// ❌ 인라인 객체/함수 → memo 무효화
<MemoizedChild 
  style={{ color: 'red' }}
  onClick={() => {}}
/>

// ✅ 메모이제이션으로 참조 유지
const style = useMemo(() => ({ color: 'red' }), []);
const handleClick = useCallback(() => {}, []);
<MemoizedChild style={style} onClick={handleClick} />
```

**children으로 인한 무효화** - JSX children도 매번 새 React element가 생성됩니다.

```jsx
// ❌ children이 매번 새로 생성
<MemoizedWrapper>
  <div>Content</div>
</MemoizedWrapper>

// ✅ children도 메모이제이션 또는 구조 변경
const content = useMemo(() => <div>Content</div>, []);
<MemoizedWrapper>{content}</MemoizedWrapper>
```

---

## 성능 측정

**측정 먼저, 최적화 나중**이 원칙입니다.

1. **React DevTools Profiler**: Record로 렌더링 시간, 리렌더링 횟수 확인
2. 문제 컴포넌트 식별
3. 적절한 최적화 적용
4. 다시 측정하여 개선 확인

```jsx
// 개발 중 렌더링 추적
function MyComponent() {
  console.log('MyComponent 렌더링');
  // ...
}
```

추측으로 최적화하지 말고, Profiler로 실제 병목을 찾은 후 적용해야 합니다.

---

## 면접 예상 질문

**Q. React.memo, useMemo, useCallback의 차이?**

React.memo는 컴포넌트를 메모이제이션하여 props가 같으면 리렌더링을 스킵합니다. useMemo는 계산 결과를 캐싱하여 의존성이 변경될 때만 재계산합니다. useCallback은 함수를 메모이제이션하여 참조를 유지합니다. useCallback(fn, deps)는 useMemo(() => fn, deps)와 동일합니다.

**Q. 언제 사용해야 하나요?**

React.memo는 부모가 자주 리렌더링되고 자식의 props가 자주 같을 때 사용합니다. useMemo는 비용이 큰 계산이나 참조 동일성이 필요한 객체에 사용합니다. useCallback은 React.memo된 자식에 콜백을 전달하거나 useEffect 의존성으로 함수를 사용할 때 씁니다.

**Q. 왜 항상 사용하면 안 되나요?**

메모이제이션도 비용이 있습니다. 메모리 사용, 비교 연산, 코드 복잡도가 증가합니다. 단순한 계산이나 항상 변경되는 props에는 오히려 오버헤드만 추가됩니다. 실제 성능 문제가 있을 때 측정 후 적용해야 합니다.

**Q. React.memo가 무효화되는 경우?**

props로 매번 새로운 객체, 배열, 함수를 전달하면 얕은 비교에서 다르다고 판단되어 memo가 무효화됩니다. children도 매번 새 React element가 생성되므로 같은 문제가 발생합니다. useMemo, useCallback으로 참조를 유지해야 합니다.

**Q. useMemo와 useCallback 의존성 관리 주의점?**

모든 사용하는 값을 의존성에 포함해야 합니다. 누락하면 오래된 값을 참조하는 stale closure 문제가 발생합니다. 반대로 매번 변경되는 값을 의존성에 넣으면 메모이제이션이 무의미해집니다.