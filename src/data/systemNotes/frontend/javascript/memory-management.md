# 메모리 누수 (Memory Leak)

## 메모리 누수란?

**더 이상 사용하지 않는 메모리가 해제되지 않고 계속 점유되는 현상**입니다.

JavaScript는 **가비지 컬렉션(GC)**이 자동으로 메모리를 관리하지만, 개발자의 실수로 GC가 메모리를 회수하지 못하는 상황이 발생할 수 있습니다. 메모리 누수가 쌓이면 애플리케이션이 느려지거나 브라우저가 크래시될 수 있습니다.

---

## 가비지 컬렉션 (Garbage Collection)

### GC의 동작 원리

JavaScript 엔진은 **도달 가능성(Reachability)**을 기준으로 메모리를 관리합니다. 어떤 방식으로든 접근하거나 사용할 수 있는 값은 메모리에 유지되고, 도달 불가능한 값은 GC가 회수합니다.

### 도달 가능한 값 (Root)

- 전역 변수
- 현재 실행 중인 함수의 지역 변수, 매개변수
- 콜 스택에 있는 함수들의 변수
- 위 값들이 참조하는 객체들 (체인으로 연결)

```javascript
let user = { name: 'John' };  // 객체 생성, user가 참조

user = null;  // 참조 끊김 → 객체는 도달 불가능 → GC 대상
```

### 메모리 누수의 본질

**도달 가능하지만 실제로는 사용하지 않는 메모리**가 메모리 누수입니다. GC는 "사용 여부"가 아닌 "도달 가능 여부"만 판단하므로, 참조가 남아있으면 회수하지 못합니다.

---

## 메모리 누수 원인

### 1. 의도치 않은 전역 변수

전역 변수는 페이지가 닫힐 때까지 메모리에 유지됩니다.

```javascript
// ❌ 실수로 전역 변수 생성
function foo() {
  bar = 'global';  // var/let/const 없이 선언 → 전역 변수
  this.baz = 'also global';  // 일반 함수에서 this는 window
}

// ✅ 예방: strict mode 사용
'use strict';
function foo() {
  bar = 'global';  // ReferenceError 발생
}
```

**예방:**
- `'use strict'` 사용 (ES6 모듈은 기본 strict mode)
- ESLint `no-undef` 규칙 활성화
- 변수 선언 시 항상 `const`/`let` 사용

### 2. 해제되지 않은 타이머

`setInterval`이나 `setTimeout`의 콜백이 외부 변수를 참조하면, 타이머가 해제될 때까지 해당 변수는 GC되지 않습니다.

```javascript
// ❌ 메모리 누수
function startTimer() {
  const hugeData = new Array(1000000).fill('data');
  
  setInterval(() => {
    console.log(hugeData.length);  // hugeData 참조 유지
  }, 1000);
}
// 컴포넌트가 사라져도 타이머는 계속 실행 → hugeData 메모리 유지

// ✅ 예방: 타이머 해제
function startTimer() {
  const hugeData = new Array(1000000).fill('data');
  
  const timerId = setInterval(() => {
    console.log(hugeData.length);
  }, 1000);
  
  return () => clearInterval(timerId);  // 정리 함수 반환
}

const cleanup = startTimer();
// 나중에...
cleanup();  // 타이머 해제 → hugeData GC 가능
```

### 3. 해제되지 않은 이벤트 리스너

DOM 요소에 등록한 이벤트 리스너를 해제하지 않으면, 콜백 함수와 그 클로저가 참조하는 변수들이 메모리에 유지됩니다.

```javascript
// ❌ 메모리 누수
function setup() {
  const data = { /* 큰 데이터 */ };
  
  document.getElementById('btn').addEventListener('click', () => {
    console.log(data);  // data 참조 유지
  });
}
// 버튼이 DOM에서 제거되어도 리스너가 data를 참조 → 메모리 유지

// ✅ 예방: 리스너 해제
function setup() {
  const data = { /* 큰 데이터 */ };
  
  const handler = () => console.log(data);
  const btn = document.getElementById('btn');
  
  btn.addEventListener('click', handler);
  
  return () => btn.removeEventListener('click', handler);
}
```

### 4. 분리된 DOM 참조 (Detached DOM)

DOM 요소를 변수에 저장해두면, 해당 요소가 DOM에서 제거되어도 변수가 참조를 유지하여 메모리에 남습니다.

```javascript
// ❌ 메모리 누수
const elements = [];

function addElement() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  elements.push(div);  // 배열에 참조 저장
}

function removeElement() {
  const div = elements.pop();
  div.remove();  // DOM에서 제거
  // 하지만 elements 배열에 참조가 남아있을 수 있음
}

// ✅ 예방: DOM 제거 시 참조도 정리
function removeElement() {
  const div = elements.pop();
  div.remove();
  // elements에서 제거했으므로 참조 끊김 → GC 가능
}
```

### 5. 클로저의 부적절한 사용

클로저가 외부 변수를 참조하면, 클로저가 살아있는 한 해당 변수는 GC되지 않습니다.

```javascript
// ❌ 불필요한 참조 유지
function outer() {
  const hugeData = new Array(1000000).fill('data');
  const smallData = 'small';
  
  return function inner() {
    console.log(smallData);  // smallData만 사용
    // 하지만 같은 스코프의 hugeData도 참조 유지될 수 있음 (엔진에 따라 다름)
  };
}

// ✅ 예방: 필요한 값만 클로저에 전달
function outer() {
  const hugeData = new Array(1000000).fill('data');
  const smallData = 'small';
  
  // hugeData 사용 후
  processData(hugeData);
  
  // 클로저는 필요한 값만 사용
  return function inner() {
    console.log(smallData);
  };
}
```

### 6. 콘솔 로그

개발자 도구가 열려있으면 `console.log`로 출력한 객체가 메모리에 유지됩니다.

```javascript
// ❌ 프로덕션에서 주의
function processData() {
  const largeObject = { /* 큰 데이터 */ };
  console.log(largeObject);  // 개발자 도구가 참조 유지
  return result;
}

// ✅ 예방: 프로덕션에서 콘솔 제거
// 빌드 시 console 제거하는 플러그인 사용
// 또는 환경별로 로깅 함수 분기
```

---

## React에서의 메모리 누수

### useEffect 정리 함수

컴포넌트가 언마운트될 때 정리(cleanup)하지 않으면 메모리 누수가 발생합니다.

```javascript
// ❌ 메모리 누수
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  // 정리 함수 없음 → 컴포넌트 언마운트 후에도 타이머 실행
}, []);

// ✅ 예방: 정리 함수 반환
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
  
  return () => clearInterval(timer);  // 언마운트 시 정리
}, []);
```

### 이벤트 리스너

```javascript
// ❌ 메모리 누수
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // 정리 없음
}, []);

// ✅ 예방
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 비동기 작업

컴포넌트가 언마운트된 후 setState를 호출하면 경고가 발생하고 메모리 누수가 됩니다.

```javascript
// ❌ 경고 발생
useEffect(() => {
  fetchData().then(data => {
    setData(data);  // 언마운트 후 호출될 수 있음
  });
}, []);

// ✅ 예방: AbortController 사용
useEffect(() => {
  const controller = new AbortController();
  
  fetchData({ signal: controller.signal })
    .then(data => setData(data))
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });
  
  return () => controller.abort();
}, []);

// ✅ 또는 플래그 사용
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  
  return () => { isMounted = false; };
}, []);
```

### 구독 해제

```javascript
// ❌ 메모리 누수
useEffect(() => {
  const subscription = eventEmitter.subscribe(handleEvent);
  // 구독 해제 없음
}, []);

// ✅ 예방
useEffect(() => {
  const subscription = eventEmitter.subscribe(handleEvent);
  return () => subscription.unsubscribe();
}, []);
```

---

## 메모리 누수 디버깅

### Chrome DevTools 사용

**Memory 탭:**
1. **Heap Snapshot**: 현재 메모리 상태 스냅샷
2. **Allocation Timeline**: 시간에 따른 메모리 할당 추적
3. **Allocation Sampling**: 함수별 메모리 할당 프로파일링

**기본 디버깅 과정:**
1. Heap Snapshot 찍기 (기준점)
2. 의심되는 작업 수행
3. GC 강제 실행 (휴지통 아이콘)
4. Heap Snapshot 다시 찍기
5. 두 스냅샷 비교하여 증가한 객체 확인

### Performance 탭

1. Record 시작
2. 작업 수행
3. Record 중지
4. Memory 그래프에서 지속적 증가 패턴 확인

### 자주 보이는 누수 패턴

- **Detached DOM tree**: DOM에서 분리됐지만 참조가 남은 요소
- **Array/Object가 계속 커짐**: 배열에 push만 하고 정리 안 함
- **Closure**: 불필요한 외부 변수 참조

---

## 예방 체크리스트

### 일반

- [ ] `'use strict'` 사용 또는 ES6 모듈 사용
- [ ] 전역 변수 최소화
- [ ] 변수 선언 시 항상 `const`/`let` 사용
- [ ] 큰 데이터는 사용 후 `null` 할당 고려

### 타이머/리스너

- [ ] `setInterval` → `clearInterval`
- [ ] `setTimeout` → `clearTimeout` (필요시)
- [ ] `addEventListener` → `removeEventListener`

### DOM

- [ ] DOM 요소 참조를 오래 유지하지 않기
- [ ] 캐시된 DOM 참조 정리

### React

- [ ] useEffect에서 cleanup 함수 반환
- [ ] 비동기 작업 취소 (AbortController 또는 플래그)
- [ ] 구독 해제

---

## 면접 예상 질문

**Q. 메모리 누수란?**

더 이상 사용하지 않는 메모리가 해제되지 않고 계속 점유되는 현상입니다. JavaScript는 가비지 컬렉션이 자동으로 메모리를 관리하지만, 참조가 남아있으면 GC가 회수하지 못해 메모리 누수가 발생합니다.

**Q. 메모리 누수의 주요 원인은?**

의도치 않은 전역 변수, 해제되지 않은 타이머와 이벤트 리스너, DOM에서 제거됐지만 참조가 남은 요소, 클로저의 부적절한 사용 등이 있습니다. 공통점은 모두 불필요한 참조가 남아있어서 GC가 메모리를 회수하지 못하는 것입니다.

**Q. React에서 메모리 누수 예방법은?**

useEffect에서 cleanup 함수를 반환해야 합니다. 타이머는 clearInterval/clearTimeout, 이벤트 리스너는 removeEventListener, 구독은 unsubscribe를 호출합니다. 비동기 작업은 AbortController로 취소하거나 마운트 상태를 확인한 후 setState를 호출해야 합니다.

**Q. 메모리 누수를 어떻게 디버깅하나요?**

Chrome DevTools의 Memory 탭을 사용합니다. Heap Snapshot을 찍어 메모리 상태를 비교하고, 작업 전후로 스냅샷을 비교하면 누수된 객체를 찾을 수 있습니다. Performance 탭에서 메모리가 지속적으로 증가하는 패턴도 확인할 수 있습니다.

**Q. 가비지 컬렉션은 어떻게 동작하나요?**

도달 가능성(Reachability)을 기준으로 합니다. 전역 변수, 실행 중인 함수의 변수, 이들이 참조하는 객체는 도달 가능합니다. 어떤 경로로도 도달할 수 없는 객체는 GC가 메모리를 회수합니다. 참조가 남아있으면 사용하지 않아도 회수하지 못합니다.