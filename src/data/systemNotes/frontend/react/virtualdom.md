# Virtual DOM

## Virtual DOM이란?

**실제 DOM의 가벼운 JavaScript 객체 복사본**입니다.

React는 UI 상태를 Virtual DOM으로 먼저 표현하고, 변경이 발생하면 새 Virtual DOM과 이전 Virtual DOM을 비교하여 **실제로 변경된 부분만** Real DOM에 반영합니다.

```javascript
// Virtual DOM은 이런 형태의 JavaScript 객체
const vdom = {
  type: 'div',
  props: {
    className: 'container',
    children: [
      { type: 'h1', props: { children: 'Hello' } },
      { type: 'p', props: { children: 'World' } }
    ]
  }
};
```

---

## 왜 Virtual DOM이 필요한가?

### Real DOM의 문제점

DOM 조작은 **비용이 큰 작업**입니다.

```javascript
element.innerHTML = 'new content';

// 발생하는 일:
// 1. DOM 트리 수정
// 2. CSSOM 재계산
// 3. 레이아웃 재계산 (Reflow)
// 4. 페인트 (Repaint)
// 5. 합성 (Composite)
```

작은 변경 하나에도 브라우저는 많은 작업을 수행합니다. 특히 **Reflow**는 비용이 큽니다.

### Virtual DOM의 해결책

1. **변경 사항을 메모리(Virtual DOM)에 먼저 적용**
2. **이전 상태와 비교하여 차이점만 파악**
3. **최소한의 DOM 조작으로 실제 반영**

---

## Virtual DOM 동작 원리

### 전체 흐름

```
상태 변경 → 새 Virtual DOM 생성 → 이전과 비교 (Diffing)
         → 변경된 부분 파악 → Real DOM에 최소한의 변경 (Reconciliation)
```

### 1. 렌더링 (Rendering)

상태가 변경되면 React는 **새로운 Virtual DOM 트리**를 생성합니다.

### 2. Diffing (비교)

두 Virtual DOM 트리를 비교하여 **차이점을 찾습니다**.

```
이전 Virtual DOM          새 Virtual DOM
      div                      div
     /   \                    /   \
  span   button            span   button
    |       |                |       |
   "0"     "+"              "1"     "+"
                              ↑
                           변경됨!
```

### 3. Reconciliation (재조정)

찾아낸 차이점만 **실제 DOM에 반영**합니다.

```javascript
// 전체를 교체하는 게 아니라
container.innerHTML = '<div>...</div>';  // ❌

// 변경된 텍스트 노드만 업데이트
spanElement.textContent = '1';  // ✅
```

---

## Diffing 알고리즘

두 트리를 완전히 비교하면 O(n³) 복잡도가 필요합니다. React는 두 가지 가정으로 **O(n)** 복잡도를 달성합니다.

### 가정 1: 다른 타입의 요소는 다른 트리를 만든다

```jsx
// div → span으로 변경되면
// React: 완전히 다른 트리로 판단 → 기존 트리 제거, 새 트리 생성
```

루트 요소의 타입이 다르면 **하위 트리 전체를 교체**합니다.

### 가정 2: key를 통해 자식 요소를 식별한다

```jsx
// key가 없으면 - C를 맨 앞에 추가 시
<ul>
  <li>A</li>  →  <li>C</li>  // 변경
  <li>B</li>  →  <li>A</li>  // 변경
              →  <li>B</li>  // 추가
</ul>
// React: 3번의 DOM 조작 (비효율)

// key가 있으면
<ul>
  <li key="a">A</li>  →  <li key="c">C</li>  // 추가
  <li key="b">B</li>  →  <li key="a">A</li>  // 이동
                      →  <li key="b">B</li>  // 이동
</ul>
// React: 1번의 추가만 (효율적)
```

### key 사용 규칙

```jsx
// ✅ 안정적이고 고유한 ID 사용
{items.map(item => <Item key={item.id} {...item} />)}

// ❌ 배열 인덱스는 피하기
{items.map((item, index) => <Item key={index} {...item} />)}
```

**인덱스를 key로 쓰면 안 되는 이유:**
- 순서 변경 시 key도 바뀜 → 불필요한 재렌더링
- 상태가 꼬일 수 있음 (input 값 등)

---

## 배치 업데이트 (Batching)

React는 여러 상태 변경을 **하나로 묶어서** 처리합니다.

```jsx
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  setName('React');
  // 3번의 setState → 1번의 렌더링
}
```

React 18부터는 setTimeout, Promise 안에서도 **자동 배칭**됩니다.

---

## React Fiber

React 16에서 도입된 **새로운 재조정 엔진**입니다.

### 기존 문제

```
렌더링 시작 ────────────────────────────────▶ 완료
           [            블로킹            ]
           사용자 입력, 애니메이션 처리 불가
```

기존 방식은 렌더링을 **중단할 수 없어서** UI가 멈췄습니다.

### Fiber의 해결책

작업을 **작은 단위(Fiber)**로 쪼개고, **중단/재개**할 수 있게 만들었습니다.

```
렌더링 ──▶ 중단 ──▶ 우선순위 높은 작업 ──▶ 재개 ──▶ 완료
  [청크1]           [사용자 입력 처리]      [청크2]
```

### Fiber의 특징

- **증분 렌더링**: 렌더링을 여러 청크로 나눠 처리
- **작업 우선순위**: 긴급한 업데이트(입력)를 먼저 처리
- **중단/재개 가능**: 필요하면 작업을 멈추고 나중에 계속

React 18의 `useTransition`, `useDeferredValue`가 이 우선순위를 활용합니다.

---

## Virtual DOM의 성능상 이점

### 1. 최소한의 DOM 조작

```jsx
// 1000개 항목 중 1개만 변경되면
// Virtual DOM이 1개만 변경된 것을 감지하여 해당 요소만 업데이트
```

### 2. 배치 처리

여러 변경을 모아서 한 번에 DOM 업데이트

### 3. 효율적인 비교

O(n) 복잡도의 Diffing으로 빠르게 변경점 파악

### 4. 선언적 프로그래밍

```jsx
// "어떻게" 변경할지 신경 쓸 필요 없음
// "무엇을" 보여줄지만 선언하면 React가 최적화
return <div>{isLoggedIn ? <Dashboard /> : <Login />}</div>;
```

---

## Virtual DOM의 한계와 진짜 가치

### 항상 빠르지는 않다

Virtual DOM 비교 자체도 비용입니다. 단순한 DOM 조작은 직접 하는 게 더 빠를 수 있습니다.

### 진짜 가치

"빠르다"보다는 **"충분히 빠르면서 개발 경험이 좋다"**가 핵심입니다.

- 선언적 UI 작성
- 상태 기반 렌더링
- 컴포넌트 재사용
- 예측 가능한 UI 업데이트

Svelte, SolidJS 같은 Virtual DOM 없는 프레임워크도 좋은 성능을 냅니다. React의 진짜 가치는 **개발 모델의 단순함**에 있습니다.

---

## 최적화 팁

```jsx
// 1. key 올바르게 사용
{items.map(item => <Item key={item.id} />)}

// 2. React.memo로 불필요한 렌더링 방지
const MemoizedComponent = React.memo(Component);

// 3. useMemo, useCallback으로 참조 유지
const result = useMemo(() => expensiveCalc(data), [data]);
const handler = useCallback(() => {}, []);

// 4. 상태 분리 - 관련 상태만 묶기
const [a, setA] = useState();  // ✅
const [state, setState] = useState({ a, b, c });  // ❌ 일부 변경에도 전체 리렌더
```

---

## 면접 예상 질문

**Q. Virtual DOM이란?**

실제 DOM의 가벼운 JavaScript 객체 복사본입니다. React는 상태가 변경되면 새 Virtual DOM을 생성하고, 이전 Virtual DOM과 비교하여 변경된 부분만 실제 DOM에 반영합니다. 이를 통해 DOM 조작을 최소화합니다.

**Q. Virtual DOM이 왜 필요한가요?**

DOM 조작은 비용이 큰 작업입니다. Virtual DOM은 변경 사항을 메모리에서 먼저 계산하고, 최소한의 DOM 조작만 수행하여 성능을 개선합니다. 또한 선언적 프로그래밍을 가능하게 해서 개발 경험도 좋아집니다.

**Q. Diffing 알고리즘은 어떻게 동작하나요?**

두 가지 가정으로 O(n) 복잡도를 달성합니다. 첫째, 다른 타입의 요소는 다른 트리를 만든다고 가정하여 타입이 다르면 하위 트리 전체를 교체합니다. 둘째, key를 통해 자식 요소를 식별하여 순서가 바뀌어도 같은 요소임을 인식합니다.

**Q. key를 배열 인덱스로 쓰면 안 되는 이유?**

요소의 순서가 바뀌면 인덱스도 바뀌어서 React가 다른 요소로 인식합니다. 불필요한 재렌더링이 발생하고, input 같은 상태를 가진 요소에서 값이 꼬일 수 있습니다.

**Q. React Fiber란?**

React 16에서 도입된 새로운 재조정 엔진입니다. 렌더링 작업을 작은 단위로 쪼개서 중단하고 재개할 수 있어서, 긴 렌더링 중에도 사용자 입력 같은 우선순위 높은 작업을 먼저 처리할 수 있습니다.