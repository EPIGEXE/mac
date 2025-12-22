# 이벤트 전파와 이벤트 위임

## 이벤트 전파 (Event Propagation)

이벤트가 발생하면 DOM 트리를 따라 전파됩니다.

### 전파 단계

```
        ┌─────────────────────────────────────┐
        │            document                 │
        │  ┌───────────────────────────────┐  │
        │  │           body                │  │
        │  │  ┌─────────────────────────┐  │  │
        │  │  │        parent           │  │  │
        │  │  │  ┌───────────────────┐  │  │  │
        │  │  │  │      child        │  │  │  │
        │  │  │  │    (클릭!)        │  │  │  │
        │  │  │  └───────────────────┘  │  │  │
        │  │  └─────────────────────────┘  │  │
        │  └───────────────────────────────┘  │
        └─────────────────────────────────────┘

1. 캡처링: document → body → parent → child (위에서 아래로)
2. 타깃:   child (이벤트 발생 요소)
3. 버블링: child → parent → body → document (아래에서 위로)
```

| 단계 | 방향 | 설명 |
|------|------|------|
| 캡처링 (Capturing) | 위 → 아래 | document에서 타깃까지 내려감 |
| 타깃 (Target) | - | 실제 이벤트가 발생한 요소 |
| 버블링 (Bubbling) | 아래 → 위 | 타깃에서 document까지 올라감 |

### 캡처링 vs 버블링

```javascript
const parent = document.querySelector('#parent');
const child = document.querySelector('#child');

// 캡처링 단계에서 실행 (세 번째 인자 true)
parent.addEventListener('click', () => console.log('1. parent capture'), true);

// 타깃 단계
child.addEventListener('click', () => console.log('2. child target'));

// 버블링 단계에서 실행 (기본값)
parent.addEventListener('click', () => console.log('3. parent bubble'));

// child 클릭 시 출력:
// 1. parent capture
// 2. child target
// 3. parent bubble
```

**기본값은 버블링입니다.** `addEventListener`의 세 번째 인자를 `true`로 설정해야 캡처링 단계에서 실행됩니다.

## event.target vs event.currentTarget

면접에서 자주 물어보는 차이점입니다.

| 속성 | 설명 |
|------|------|
| event.target | 실제로 이벤트가 발생한 요소 |
| event.currentTarget | 이벤트 핸들러가 등록된 요소 |

```html
<div id="parent">
  <button id="child">클릭</button>
</div>
```

```javascript
parent.addEventListener('click', (e) => {
  console.log(e.target);        // button#child (클릭한 요소)
  console.log(e.currentTarget); // div#parent (핸들러가 등록된 요소)
});
```

## 이벤트 제어 메서드

### stopPropagation()

이벤트 전파를 중단합니다. (캡처링/버블링 모두)

```javascript
child.addEventListener('click', (e) => {
  e.stopPropagation();  // 부모로 전파 안 됨
  console.log('child만 실행');
});

parent.addEventListener('click', () => {
  console.log('실행 안 됨');  // 전파가 막혀서 실행 안 됨
});
```

### stopImmediatePropagation()

전파 중단 + 같은 요소의 다른 핸들러도 중단

```javascript
child.addEventListener('click', (e) => {
  e.stopImmediatePropagation();
  console.log('첫 번째만 실행');
});

child.addEventListener('click', () => {
  console.log('실행 안 됨');  // 같은 요소지만 실행 안 됨
});
```

### preventDefault()

브라우저 기본 동작을 막습니다. (전파와 무관)

```javascript
// 링크 클릭해도 이동 안 함
link.addEventListener('click', (e) => {
  e.preventDefault();
});

// 폼 제출해도 새로고침 안 함
form.addEventListener('submit', (e) => {
  e.preventDefault();
});
```

### 비교

| 메서드 | 전파 중단 | 기본 동작 중단 | 같은 요소 다른 핸들러 |
|--------|----------|---------------|---------------------|
| stopPropagation() | O | X | 실행됨 |
| stopImmediatePropagation() | O | X | 중단됨 |
| preventDefault() | X | O | 실행됨 |

## 이벤트 위임 (Event Delegation)

부모 요소에 이벤트 리스너를 등록하고, 버블링을 이용해 자식 이벤트를 처리하는 패턴

### 왜 필요한가?

```javascript
// ❌ 나쁜 예: 각 항목마다 리스너 등록
document.querySelectorAll('li').forEach(li => {
  li.addEventListener('click', handleClick);
});
// 문제점:
// 1. 100개 항목 = 100개 리스너 = 메모리 낭비
// 2. 동적으로 추가된 항목에는 리스너 없음

// ✅ 좋은 예: 부모에 한 번만 등록
document.querySelector('ul').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    handleClick(e);
  }
});
// 장점:
// 1. 리스너 1개로 모든 항목 처리
// 2. 동적 추가 항목도 자동으로 처리됨
```

### 동작 원리

```
1. 자식 요소(li) 클릭
2. 이벤트 버블링으로 부모(ul)까지 전파
3. 부모의 핸들러에서 event.target으로 실제 클릭된 요소 확인
4. 조건에 맞으면 처리
```

### 실무 예제

```javascript
// 테이블 행 버튼 처리
document.querySelector('tbody').addEventListener('click', (e) => {
  const button = e.target.closest('button');  // 버튼 또는 버튼 내부 요소 클릭 처리
  if (!button) return;
  
  const action = button.dataset.action;
  const row = button.closest('tr');
  const id = row.dataset.id;
  
  if (action === 'edit') editItem(id);
  if (action === 'delete') deleteItem(id);
});
```

```html
<tbody>
  <tr data-id="1">
    <td>Item 1</td>
    <td>
      <button data-action="edit">수정</button>
      <button data-action="delete">삭제</button>
    </td>
  </tr>
</tbody>
```

### closest() 활용

`event.target`이 정확히 원하는 요소가 아닐 수 있습니다.

```html
<button><span>텍스트</span></button>
```

```javascript
// span을 클릭하면 e.target은 span
// closest()로 가장 가까운 button을 찾음
const button = e.target.closest('button');
```

## React에서의 이벤트 처리

### React는 이벤트 위임을 내부적으로 사용

React는 각 요소에 직접 이벤트를 등록하지 않고, 루트 요소에서 이벤트 위임으로 처리합니다.

```jsx
// 이렇게 작성해도
<button onClick={handleClick}>클릭</button>

// 내부적으로는 루트에서 위임 처리
// (React 17+: root 요소, React 16: document)
```

### SyntheticEvent

React는 브라우저 네이티브 이벤트를 감싼 SyntheticEvent를 사용합니다.

```jsx
function Button() {
  const handleClick = (e) => {
    // e는 SyntheticEvent
    e.preventDefault();      // 동작함
    e.stopPropagation();     // 동작함
    e.nativeEvent;           // 원본 브라우저 이벤트
  };
  
  return <button onClick={handleClick}>클릭</button>;
}
```

## 요약

| 개념 | 설명 |
|------|------|
| 이벤트 전파 | 캡처링 → 타깃 → 버블링 순서로 DOM 트리를 따라 이벤트 전달 |
| 이벤트 위임 | 부모에 리스너 등록하고 버블링으로 자식 이벤트 처리 |
| event.target | 실제 이벤트 발생 요소 |
| event.currentTarget | 핸들러가 등록된 요소 |
| stopPropagation() | 전파 중단 |
| preventDefault() | 기본 동작 중단 |

## Study

**Q. 이벤트 버블링과 캡처링의 차이?**

캡처링은 이벤트가 document에서 타깃 요소까지 내려가는 단계이고, 버블링은 타깃에서 document까지 올라가는 단계입니다. addEventListener의 세 번째 인자를 true로 하면 캡처링, 생략하거나 false면 버블링 단계에서 핸들러가 실행됩니다.

**Q. event.target과 event.currentTarget의 차이?**

target은 실제로 이벤트가 발생한 요소이고, currentTarget은 이벤트 핸들러가 등록된 요소입니다. 이벤트 위임 패턴에서 부모에 핸들러를 등록하면 currentTarget은 부모, target은 실제 클릭한 자식 요소가 됩니다.

**Q. 이벤트 위임의 장점?**

첫째, 메모리 효율적입니다. 자식마다 리스너를 등록하지 않고 부모에 하나만 등록합니다. 둘째, 동적으로 추가되는 요소도 자동으로 이벤트 처리가 됩니다. 셋째, 핸들러를 한 곳에서 관리하므로 유지보수가 쉽습니다.

**Q. stopPropagation과 preventDefault의 차이?**

stopPropagation은 이벤트가 부모로 전파되는 것을 막고, preventDefault는 브라우저 기본 동작(링크 이동, 폼 제출 등)을 막습니다. 두 메서드는 독립적으로 동작합니다.