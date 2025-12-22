# JavaScript 자료구조 선택 및 React에서의 선택

## 개요

JavaScript에서 데이터를 저장할 때 **Object vs Map**, **Array vs Set** 중 어떤 것을 선택할지 고민되는 경우가 많습니다. 각각의 특성과 성능을 이해하면 상황에 맞는 최적의 선택을 할 수 있습니다.

React에서는 **불변성 유지**와 **렌더링 최적화**까지 고려해야 하므로 선택이 더 중요해집니다.

---

## Object vs Map

### Object

JavaScript의 가장 기본적인 키-값 저장소입니다. 리터럴 문법(`{}`)으로 쉽게 생성하고, 점 표기법이나 대괄호 표기법으로 접근합니다.

```javascript
const user = { name: 'Kim', age: 30 };
user.name;      // 'Kim'
user['age'];    // 30
```

### Map

ES6에서 도입된 키-값 컬렉션입니다. `get()`, `set()`, `has()`, `delete()` 메서드로 조작합니다.

```javascript
const userMap = new Map();
userMap.set('name', 'Kim');
userMap.get('name');  // 'Kim'
userMap.has('name');  // true
```

### 핵심 차이점

| 특성 | Object | Map |
|------|--------|-----|
| **키 타입** | 문자열, Symbol만 | 모든 타입 (객체, 함수 포함) |
| **키 순서** | 보장 안 됨 (ES2015+부터 일부 보장) | 삽입 순서 보장 |
| **크기 확인** | `Object.keys(obj).length` | `map.size` (O(1)) |
| **이터러블** | 직접 순회 불가 | `for...of` 직접 사용 가능 |
| **프로토타입** | 기본 키 존재 가능 | 순수한 키-값만 |
| **직렬화** | `JSON.stringify` 지원 | 직접 변환 필요 |
| **성능 (잦은 추가/삭제)** | 느림 | 빠름 |

### 키 타입의 차이

Object는 키가 항상 문자열로 변환됩니다. 숫자를 키로 사용해도 내부적으로 문자열입니다.

```javascript
const obj = {};
obj[1] = 'one';
obj['1'] = 'ONE';
console.log(obj[1]);  // 'ONE' (덮어씀)

const map = new Map();
map.set(1, 'one');
map.set('1', 'ONE');
console.log(map.get(1));    // 'one'
console.log(map.get('1'));  // 'ONE' (별개의 키)
```

Map은 **객체를 키로 사용**할 수 있어, DOM 요소나 컴포넌트 인스턴스를 키로 매핑할 때 유용합니다.

```javascript
const elementData = new Map();
const button = document.querySelector('button');
elementData.set(button, { clicks: 0 });
```

### 프로토타입 오염

Object는 프로토타입 체인 때문에 예상치 못한 키가 존재할 수 있습니다.

```javascript
const obj = {};
console.log('toString' in obj);  // true (프로토타입에서 상속)

// 안전한 방법
const safeObj = Object.create(null);  // 프로토타입 없는 객체
console.log('toString' in safeObj);   // false
```

Map은 프로토타입 오염 걱정이 없습니다.

### 성능 비교

| 연산 | Object | Map |
|------|--------|-----|
| 조회 | O(1) | O(1) |
| 삽입 | O(1) | O(1) |
| 삭제 | O(1) 하지만 느림 | O(1) 최적화됨 |
| 크기 확인 | O(n) | O(1) |

**잦은 추가/삭제**가 발생하면 Map이 유리합니다. Object의 `delete` 연산은 엔진 최적화를 깨뜨려 성능이 저하될 수 있습니다.

### 언제 Object를 사용하는가?

| 상황 | 이유 |
|------|------|
| **고정된 구조의 데이터** | 사용자 정보, 설정 등 |
| **JSON 직렬화 필요** | API 통신, localStorage |
| **리터럴로 선언** | 간결한 문법 |
| **TypeScript 타입 정의** | interface, type과 자연스러움 |

```javascript
// Object가 적합: 구조가 정해진 데이터
const user = {
  id: 1,
  name: 'Kim',
  email: 'kim@example.com',
};
```

### 언제 Map을 사용하는가?

| 상황 | 이유 |
|------|------|
| **동적 키** | 런타임에 키가 결정됨 |
| **키가 문자열이 아님** | 객체, 함수 등을 키로 |
| **잦은 추가/삭제** | 성능 최적화 |
| **삽입 순서 유지** | 순서가 중요한 경우 |
| **크기를 자주 확인** | `size` 프로퍼티 활용 |

```javascript
// Map이 적합: 사용자 ID로 데이터 매핑 (동적 키)
const userCache = new Map();
userCache.set(userId, userData);

// Map이 적합: DOM 요소를 키로 사용
const elementStates = new Map();
elementStates.set(buttonElement, { isLoading: false });
```

---

## Array vs Set

### Array

순서가 있는 요소들의 컬렉션입니다. 중복을 허용하고, 인덱스로 접근합니다.

```javascript
const arr = [1, 2, 3, 2, 1];
arr[0];        // 1
arr.length;    // 5 (중복 포함)
```

### Set

ES6에서 도입된 **고유한 값들의 컬렉션**입니다. 중복을 자동으로 제거합니다.

```javascript
const set = new Set([1, 2, 3, 2, 1]);
set.size;      // 3 (중복 제거됨)
set.has(2);    // true
```

### 핵심 차이점

| 특성 | Array | Set |
|------|-------|-----|
| **중복** | 허용 | 불허 (자동 제거) |
| **순서** | 인덱스 기반 | 삽입 순서 |
| **접근** | `arr[0]` | 인덱스 접근 불가 |
| **존재 확인** | `includes()` O(n) | `has()` O(1) |
| **요소 추가** | `push()` O(1) | `add()` O(1) |
| **요소 삭제** | `splice()` O(n) | `delete()` O(1) |
| **크기** | `length` | `size` |

### 성능 비교

| 연산 | Array | Set |
|------|-------|-----|
| 존재 확인 (`includes` vs `has`) | O(n) | O(1) |
| 추가 | O(1) | O(1) |
| 중간 삭제 | O(n) | O(1) |
| 중복 제거 | O(n²) 또는 Set 변환 | 자동 |

**존재 확인이 빈번**하면 Set이 압도적으로 유리합니다. Array의 `includes()`는 처음부터 끝까지 순회해야 합니다.

```javascript
const arr = [1, 2, 3, ..., 10000];
arr.includes(9999);  // O(n) - 9999번 비교

const set = new Set(arr);
set.has(9999);       // O(1) - 해시 테이블 조회
```

### 중복 제거

Array에서 중복을 제거하는 가장 간단한 방법은 Set을 거치는 것입니다.

```javascript
const arr = [1, 2, 3, 2, 1, 3];
const unique = [...new Set(arr)];  // [1, 2, 3]
```

### 언제 Array를 사용하는가?

| 상황 | 이유 |
|------|------|
| **순서와 인덱스 중요** | 첫 번째, 마지막 요소 접근 |
| **중복 허용** | 같은 값 여러 개 저장 |
| **다양한 메서드 필요** | map, filter, reduce 등 |
| **JSON 직렬화** | API 통신 |

```javascript
// Array가 적합: 순서가 중요한 목록
const todoList = [
  { id: 1, text: '공부하기' },
  { id: 2, text: '운동하기' },
];

// Array가 적합: map, filter 등 변환 필요
const doubled = numbers.map(n => n * 2);
```

### 언제 Set을 사용하는가?

| 상황 | 이유 |
|------|------|
| **고유성 보장** | 중복 없는 값 |
| **빠른 존재 확인** | `has()` O(1) |
| **빈번한 추가/삭제** | O(1) 성능 |
| **집합 연산** | 합집합, 교집합, 차집합 |

```javascript
// Set이 적합: 고유한 태그 목록
const tags = new Set(['react', 'javascript', 'typescript']);

// Set이 적합: 선택된 ID 관리 (빠른 존재 확인)
const selectedIds = new Set([1, 5, 10]);
if (selectedIds.has(userId)) { ... }

// Set이 적합: 집합 연산
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);
const union = new Set([...setA, ...setB]);       // 합집합: {1, 2, 3, 4}
const intersection = new Set([...setA].filter(x => setB.has(x)));  // 교집합: {2, 3}
```

---

## React에서의 고려사항

### 불변성 유지

React는 상태 변경을 **참조 비교**로 감지합니다. Map과 Set을 직접 수정하면 참조가 그대로여서 리렌더링이 발생하지 않습니다.

```javascript
// ❌ 잘못된 방법: 직접 수정
const [userMap, setUserMap] = useState(new Map());
userMap.set('name', 'Kim');  // Map은 변경되지만 참조는 같음
setUserMap(userMap);         // 리렌더링 안 됨!

// ✅ 올바른 방법: 새 Map 생성
setUserMap(new Map(userMap).set('name', 'Kim'));

// 또는 함수형 업데이트
setUserMap(prev => new Map(prev).set('name', 'Kim'));
```

Set도 마찬가지입니다.

```javascript
// ❌ 잘못된 방법
selectedIds.add(5);
setSelectedIds(selectedIds);  // 리렌더링 안 됨!

// ✅ 올바른 방법
setSelectedIds(prev => new Set(prev).add(5));
```

### Object와 Array의 불변 업데이트

Object와 Array는 스프레드 연산자로 간편하게 복사할 수 있습니다.

```javascript
// Object 업데이트
setUser(prev => ({ ...prev, name: 'Lee' }));

// Array 추가
setItems(prev => [...prev, newItem]);

// Array 삭제
setItems(prev => prev.filter(item => item.id !== targetId));
```

### React 상태로 Map/Set 사용 시 패턴

Map/Set 상태를 관리하는 커스텀 훅을 만들면 편리합니다. `set`, `delete` 메서드를 래핑하여 항상 새 인스턴스를 반환하도록 합니다.

### 직렬화 문제

Map과 Set은 `JSON.stringify`로 직렬화되지 않습니다.

```javascript
JSON.stringify(new Map([['a', 1]]));  // '{}'
JSON.stringify(new Set([1, 2, 3]));   // '{}'
```

**localStorage 저장이나 API 통신** 시 변환이 필요합니다.

```javascript
// Map 직렬화
const map = new Map([['a', 1], ['b', 2]]);
const serialized = JSON.stringify([...map]);  // '[["a",1],["b",2]]'
const restored = new Map(JSON.parse(serialized));

// Set 직렬화
const set = new Set([1, 2, 3]);
const serialized = JSON.stringify([...set]);  // '[1,2,3]'
const restored = new Set(JSON.parse(serialized));
```

### React에서 실전 선택 가이드

| 상황 | 권장 | 이유 |
|------|------|------|
| 컴포넌트 props/state | Object, Array | 직렬화 용이, 친숙한 패턴 |
| 고유 ID 선택 상태 | Set | 빠른 존재 확인, 중복 방지 |
| 동적 키-값 캐시 | Map | 다양한 키 타입, 잦은 업데이트 |
| 목록 렌더링 | Array | `map()`, 인덱스 접근 |
| API 요청/응답 | Object, Array | JSON 호환 |

### 선택된 항목 관리 예시

```javascript
// Array 사용: includes()로 O(n) 탐색
const isSelected = selectedIds.includes(id);

// Set 사용: has()로 O(1) 탐색
const isSelected = selectedIds.has(id);
const toggle = (id) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};
```

많은 항목에서 선택 상태를 확인할 때 Set이 훨씬 효율적입니다.

---

## 요약: 선택 기준 플로우차트

```
키-값 저장이 필요한가?
├─ Yes
│   ├─ 키가 문자열/심볼만? → Object
│   ├─ 키가 객체/함수? → Map
│   ├─ 잦은 추가/삭제? → Map
│   ├─ JSON 직렬화 필요? → Object
│   └─ 고정된 구조? → Object
│
└─ No (값만 저장)
    ├─ 중복 허용? → Array
    ├─ 고유성 필요? → Set
    ├─ 인덱스 접근 필요? → Array
    ├─ 빠른 존재 확인? → Set
    └─ map/filter 필요? → Array
```

---

## 면접 예상 질문

**Q. Object와 Map의 차이?**

Object는 키가 문자열/Symbol만 가능하고, Map은 모든 타입을 키로 사용할 수 있습니다. Map은 삽입 순서를 보장하고, `size`로 O(1)에 크기를 확인할 수 있으며, 잦은 추가/삭제에 최적화되어 있습니다. Object는 JSON 직렬화가 가능하고 리터럴 문법으로 간편합니다.

**Q. Array와 Set의 차이?**

Array는 중복을 허용하고 인덱스로 접근하며, Set은 고유한 값만 저장하고 인덱스 접근이 불가합니다. Set의 `has()`는 O(1)이고 Array의 `includes()`는 O(n)이라 존재 확인이 빈번하면 Set이 유리합니다.

**Q. 언제 Map을 사용하나요?**

키가 문자열이 아닐 때(객체, DOM 요소 등), 잦은 추가/삭제가 발생할 때, 삽입 순서 유지가 필요할 때 사용합니다. 캐시 구현이나 동적 키-값 매핑에 적합합니다.

**Q. 언제 Set을 사용하나요?**

고유한 값들을 저장할 때, 빠른 존재 확인이 필요할 때, 집합 연산(합집합, 교집합)이 필요할 때 사용합니다. 선택된 ID 목록 관리, 태그 목록 등에 적합합니다.

**Q. React에서 Map/Set 상태 관리 시 주의점?**

Map/Set을 직접 수정하면 참조가 그대로라 리렌더링이 발생하지 않습니다. 항상 `new Map(prev)`이나 `new Set(prev)`로 새 인스턴스를 생성해야 합니다. 또한 JSON 직렬화가 안 되므로 localStorage나 API 통신 시 배열로 변환해야 합니다.