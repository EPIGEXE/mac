# JavaScript 이벤트 루프

## JavaScript는 싱글 스레드

JavaScript는 **싱글 스레드** 언어입니다. 한 번에 하나의 작업만 실행할 수 있습니다. 그런데 어떻게 여러 비동기 작업을 동시에 처리하는 것처럼 보일까요?

비밀은 **이벤트 루프**에 있습니다. JavaScript 엔진은 싱글 스레드지만, 브라우저나 Node.js 같은 **런타임 환경**이 비동기 작업을 처리하고, 이벤트 루프가 이를 조율합니다.

---

## JavaScript 런타임 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     JavaScript 런타임                         │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Call Stack    │    │          Web APIs (브라우저)      │ │
│  │   (콜 스택)      │    │   setTimeout, fetch, DOM,       │ │
│  │                 │    │   addEventListener 등            │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│           ▲                           │                      │
│           │                           ▼                      │
│  ┌────────┴───────────────────────────────────────────────┐ │
│  │                    Event Loop (이벤트 루프)              │ │
│  └────────────────────────────────────────────────────────┘ │
│           ▲                           ▲                      │
│           │                           │                      │
│  ┌────────┴────────┐        ┌────────┴────────┐            │
│  │ Microtask Queue │        │   Task Queue    │            │
│  │ (마이크로태스크)  │        │   (태스크 큐)    │            │
│  │ Promise.then    │        │   setTimeout    │            │
│  │ queueMicrotask  │        │   setInterval   │            │
│  │ MutationObserver│        │   I/O, UI 렌더링 │            │
│  └─────────────────┘        └─────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 콜 스택 (Call Stack)

**현재 실행 중인 함수들이 쌓이는 스택**입니다. 함수가 호출되면 push, 종료되면 pop됩니다. JavaScript 엔진은 콜 스택의 함수를 위에서부터 하나씩 실행합니다.

### 힙 (Heap)

객체와 변수가 저장되는 **메모리 영역**입니다. 가비지 컬렉션이 이 영역을 관리합니다.

### Web APIs (브라우저) / C++ APIs (Node.js)

**비동기 작업을 실제로 처리하는 환경**입니다. setTimeout, fetch, DOM 이벤트 등은 JavaScript 엔진이 아닌 브라우저가 처리합니다. 작업이 완료되면 콜백을 태스크 큐에 넣습니다.

### 태스크 큐 (Task Queue / Callback Queue)

**비동기 작업의 콜백이 대기하는 큐**입니다. setTimeout, setInterval, I/O, UI 이벤트 등의 콜백이 여기에 들어갑니다. 매크로태스크 큐(Macrotask Queue)라고도 합니다.

### 마이크로태스크 큐 (Microtask Queue)

**Promise, queueMicrotask, MutationObserver의 콜백이 대기하는 큐**입니다. 태스크 큐보다 **우선순위가 높습니다**.

---

## 이벤트 루프 동작 원리

이벤트 루프는 **콜 스택과 큐를 감시하며 작업을 조율**합니다.

### 동작 순서

1. **콜 스택의 모든 동기 코드 실행**
2. **콜 스택이 비면 마이크로태스크 큐 전체 실행**
3. **마이크로태스크 큐가 비면 태스크 큐에서 하나 실행**
4. **1~3 반복**

```
┌─────────────────────────────────────────────┐
│              이벤트 루프 사이클               │
│                                             │
│  1. 콜 스택 비었나? ──No──▶ 계속 실행        │
│         │                                   │
│        Yes                                  │
│         ▼                                   │
│  2. 마이크로태스크 있나? ──Yes──▶ 모두 실행  │
│         │                    │              │
│        No ◀──────────────────┘              │
│         ▼                                   │
│  3. 렌더링 필요하면 렌더링                   │
│         ▼                                   │
│  4. 태스크 큐에서 하나 실행                  │
│         │                                   │
│         └────────▶ 1번으로                  │
└─────────────────────────────────────────────┘
```

### 핵심 포인트

- **마이크로태스크는 태스크보다 먼저 실행**됩니다
- **마이크로태스크는 큐가 빌 때까지 모두 실행**됩니다
- **태스크는 한 번에 하나씩** 실행됩니다
- 마이크로태스크 실행 중 새 마이크로태스크가 추가되면 **그것도 실행**됩니다

---

## 태스크 vs 마이크로태스크

### 분류

| 마이크로태스크 | 태스크 (매크로태스크) |
|---------------|---------------------|
| Promise.then/catch/finally | setTimeout |
| queueMicrotask | setInterval |
| MutationObserver | setImmediate (Node.js) |
| process.nextTick (Node.js) | I/O 콜백 |
| | UI 렌더링 |
| | requestAnimationFrame |

### 우선순위

```
동기 코드 > 마이크로태스크 > 렌더링 > 태스크
```

### 실행 순서 예제

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// 출력: 1, 4, 3, 2
```

**실행 과정:**

1. `console.log('1')` - 동기, 즉시 실행 → **1**
2. `setTimeout` - 콜백을 태스크 큐에 등록
3. `Promise.then` - 콜백을 마이크로태스크 큐에 등록
4. `console.log('4')` - 동기, 즉시 실행 → **4**
5. 콜 스택 비었음 → 마이크로태스크 실행 → **3**
6. 마이크로태스크 비었음 → 태스크 실행 → **2**

### 복잡한 예제

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => console.log('3'));
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => console.log('5'), 0);
});

console.log('6');

// 출력: 1, 6, 4, 2, 3, 5
```

**실행 과정:**

1. `console.log('1')` → **1**
2. setTimeout 콜백 → 태스크 큐에 등록
3. Promise.then 콜백 → 마이크로태스크 큐에 등록
4. `console.log('6')` → **6**
5. 마이크로태스크 실행 → **4**, setTimeout 등록
6. 태스크 실행 → **2**, Promise.then 등록
7. 마이크로태스크 실행 → **3**
8. 태스크 실행 → **5**

---

## setTimeout(fn, 0)의 의미

`setTimeout(fn, 0)`은 "0ms 후에 실행"이 아니라 **"현재 콜 스택과 마이크로태스크가 끝나면 실행"**입니다.

### 용도

```javascript
// 무거운 작업을 다음 태스크로 미루기
function heavyWork() {
  // 현재 실행 흐름을 막지 않고 나중에 처리
  setTimeout(() => {
    // CPU 집약적 작업
  }, 0);
}

// UI 업데이트 후 실행 보장
button.textContent = 'Loading...';
setTimeout(() => {
  // 렌더링 후 실행
  doHeavyCalculation();
}, 0);
```

### 최소 지연 시간

브라우저는 중첩된 setTimeout에 **최소 4ms 지연**을 적용합니다 (5번째 호출부터). 0ms를 지정해도 실제로는 약간의 지연이 있습니다.

---

## requestAnimationFrame

**다음 렌더링 직전에 콜백을 실행**합니다. 애니메이션에 최적화되어 있습니다.

### 실행 시점

```
태스크 → 마이크로태스크 → requestAnimationFrame → 렌더링
```

### setTimeout vs requestAnimationFrame

| 구분 | setTimeout | requestAnimationFrame |
|------|------------|----------------------|
| 실행 시점 | 지정한 시간 후 | 다음 렌더링 직전 |
| 프레임 동기화 | X | O (60fps 보장) |
| 탭 비활성화 시 | 계속 실행 | 일시 정지 |
| 애니메이션 | 끊김 가능 | 부드러움 |

```javascript
// ❌ setTimeout 애니메이션 (프레임 드롭 가능)
function animate() {
  moveElement();
  setTimeout(animate, 16);  // 약 60fps
}

// ✅ requestAnimationFrame 애니메이션
function animate() {
  moveElement();
  requestAnimationFrame(animate);  // 브라우저 렌더링과 동기화
}
```

---

## 비동기 처리 흐름 예시

### fetch 요청

```javascript
console.log('시작');

fetch('/api/data')
  .then(res => res.json())
  .then(data => console.log('데이터:', data));

console.log('끝');
```

**실행 흐름:**

1. `console.log('시작')` 실행
2. `fetch()` 호출 → Web API가 네트워크 요청 처리
3. `console.log('끝')` 실행
4. (시간 경과... 응답 도착)
5. Web API가 Promise를 resolve
6. `.then` 콜백이 마이크로태스크 큐에 등록
7. 콜 스택 비어있으면 마이크로태스크 실행

---

## Node.js의 이벤트 루프

Node.js의 이벤트 루프는 브라우저와 유사하지만 **페이즈(Phase)**로 구분됩니다.

```
   ┌───────────────────────────┐
┌─▶│           timers          │ ← setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │ ← I/O 콜백
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │ ← 새 I/O 이벤트
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │ ← setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```

### process.nextTick vs setImmediate

- `process.nextTick`: 현재 페이즈 끝, 다음 페이즈 전에 실행 (마이크로태스크와 유사)
- `setImmediate`: check 페이즈에서 실행

```javascript
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));

// 출력: nextTick, immediate
```

---

## 주의사항

### 마이크로태스크 무한 루프

마이크로태스크 안에서 계속 마이크로태스크를 추가하면 **렌더링이 블로킹**됩니다.

```javascript
// ❌ 위험: 무한 마이크로태스크
function loop() {
  Promise.resolve().then(loop);
}
loop();  // 페이지 멈춤!
```

### 오래 걸리는 동기 작업

콜 스택이 비어야 비동기 콜백이 실행됩니다. 동기 작업이 오래 걸리면 비동기 콜백도 지연됩니다.

```javascript
setTimeout(() => console.log('timeout'), 0);

// 3초 동안 블로킹
const start = Date.now();
while (Date.now() - start < 3000) {}

console.log('done');
// 출력: done (3초 후), timeout
```

---

## 면접 예상 질문

**Q. 이벤트 루프란?**

콜 스택과 태스크 큐를 감시하며 비동기 작업을 조율하는 메커니즘입니다. 콜 스택이 비면 마이크로태스크 큐를 먼저 모두 처리하고, 그 다음 태스크 큐에서 하나씩 꺼내 실행합니다.

**Q. 마이크로태스크와 태스크의 차이?**

마이크로태스크(Promise.then, queueMicrotask)는 태스크(setTimeout, setInterval)보다 우선순위가 높습니다. 콜 스택이 비면 마이크로태스크 큐를 전부 비운 후에 태스크를 실행합니다.

**Q. setTimeout(fn, 0)은 즉시 실행되나요?**

아닙니다. 현재 콜 스택의 동기 코드와 마이크로태스크가 모두 끝난 후에 실행됩니다. 또한 브라우저는 최소 4ms 지연을 적용할 수 있습니다. 0ms는 "가능한 빨리"라는 의미입니다.

**Q. JavaScript가 싱글 스레드인데 어떻게 비동기가 가능한가요?**

JavaScript 엔진은 싱글 스레드지만, 브라우저나 Node.js 같은 런타임 환경이 Web APIs를 통해 비동기 작업을 별도로 처리합니다. 작업이 완료되면 콜백을 태스크 큐에 넣고, 이벤트 루프가 이를 콜 스택으로 옮겨 실행합니다.

**Q. requestAnimationFrame은 언제 사용하나요?**

애니메이션에 사용합니다. 브라우저 렌더링 주기와 동기화되어 60fps를 보장하고, 탭이 비활성화되면 자동으로 일시 정지되어 리소스를 절약합니다. setTimeout보다 부드러운 애니메이션이 가능합니다.