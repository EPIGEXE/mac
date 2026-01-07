# JavaScript 동작 방식

## 예제 코드: API 검색 모듈

검색어 입력 시 API를 호출하는 모듈이다. 디바운스로 불필요한 요청을 방지하고, 이전 요청을 취소하며, 에러를 처리한다. 실무에서 흔히 작성하는 패턴이다.

```javascript
// ========== 예제 코드 전체 ==========

const createSearchModule = (apiEndpoint) => {
  let currentController = null;
  let debounceTimer = null;

  const debounce = (fn, delay) => {
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  };

  const fetchResults = async function (query) {
    if (currentController) {
      currentController.abort();
    }

    currentController = new AbortController();
    const { signal } = currentController;

    try {
      console.log(`Fetching: ${query}`);
      const response = await fetch(`${apiEndpoint}?q=${query}`, { signal });
      const data = await response.json();
      console.log('Results:', data);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Fetch error:', error);
      }
    } finally {
      currentController = null;
    }
  };

  const search = debounce(fetchResults, 300);

  return { search, fetchResults };
};

// 사용
const searchModule = createSearchModule('https://api.example.com/search');
searchModule.search('hello');
searchModule.search('hello world');  // 300ms 내에 호출 → 이전 취소
```

이제 이 코드가 실행될 때 **엔진 내부에서 무슨 일이 벌어지는지** 단계별로 추적한다.

---

## 1단계: 스크립트 로드 - 파싱과 컴파일

브라우저가 이 스크립트를 로드하면 V8 엔진이 가장 먼저 **파싱**을 수행한다.

### 1-1. 토큰화와 AST 생성

소스 코드를 토큰으로 분리하고, **Abstract Syntax Tree**를 생성한다:

```
VariableDeclaration (const)
└── VariableDeclarator
    ├── Identifier: "createSearchModule"
    └── ArrowFunctionExpression
        ├── params: [Identifier: "apiEndpoint"]
        └── body: BlockStatement
            ├── VariableDeclaration: "currentController = null"
            ├── VariableDeclaration: "debounce = ..."
            ├── VariableDeclaration: "fetchResults = ..."
            └── ReturnStatement: { search, fetchResults }
```

AST가 중요한 이유는 **이후 모든 작업(컴파일, 스코프 분석, 바이트코드 생성)이 AST를 기반으로 수행**되기 때문이다.

### 1-2. 바이트코드 컴파일

V8의 **Ignition**이 AST를 바이트코드로 컴파일한다. 처음에는 바이트코드로 빠르게 실행을 시작하고, **TurboFan**은 나중에 자주 실행되는 코드를 최적화된 기계어로 컴파일한다.

---

## 2단계: 전역 실행 컨텍스트 생성

파싱/컴파일이 끝나면 코드를 실행할 차례다. 엔진은 **전역 실행 컨텍스트(Global Execution Context)**를 생성하고 콜 스택에 푸시한다.

### 2-1. 실행 컨텍스트 구조

```javascript
GlobalExecutionContext = {
  LexicalEnvironment: {
    EnvironmentRecord: {
      createSearchModule: <uninitialized>,  // const는 TDZ
      searchModule: <uninitialized>
    },
    OuterEnv: null  // 전역은 외부가 없음
  },
  VariableEnvironment: { /* var 변수, 여기선 없음 */ },
  ThisBinding: window  // 브라우저 환경
}
```

### 2-2. 생성 단계 (Creation Phase)

코드 실행 전에 **선언을 먼저 수집**한다. 이것이 호이스팅이다.

```javascript
// const로 선언된 변수들이 EnvironmentRecord에 등록됨
// 하지만 초기화는 안 됨 → TDZ(Temporal Dead Zone)

console.log(createSearchModule);  // ReferenceError!
// const 선언 전에 접근하면 TDZ 에러
```

`var`였다면 `undefined`로 초기화되어 접근 가능했겠지만, `const`/`let`은 선언 지점까지 TDZ에 있다.

### 2-3. 실행 단계 (Execution Phase)

이제 코드를 한 줄씩 실행한다.

```javascript
const createSearchModule = (apiEndpoint) => { ... };
```

이 줄이 실행되면:

1. 화살표 함수 객체가 **힙 메모리**에 생성됨
2. 함수 객체의 내부 슬롯 `[[Environment]]`에 **현재 렉시컬 환경(전역)** 참조가 저장됨
3. `createSearchModule` 변수에 이 함수 객체의 참조가 바인딩됨

```javascript
GlobalExecutionContext.LexicalEnvironment.EnvironmentRecord = {
  createSearchModule: <function object ref>,  // 이제 초기화됨
  searchModule: <uninitialized>  // 아직 TDZ
}
```

---

## 3단계: createSearchModule 호출

```javascript
const searchModule = createSearchModule('https://api.example.com/search');
```

이 줄이 실행되면 **새로운 실행 컨텍스트**가 생성된다.

### 3-1. 함수 실행 컨텍스트 생성

```javascript
createSearchModuleExecutionContext = {
  LexicalEnvironment: {
    EnvironmentRecord: {
      apiEndpoint: 'https://api.example.com/search',  // 매개변수
      currentController: <uninitialized>,
      debounceTimer: <uninitialized>,
      debounce: <uninitialized>,
      fetchResults: <uninitialized>,
      search: <uninitialized>
    },
    OuterEnv: GlobalLexicalEnvironment  // 함수가 정의된 환경
  },
  ThisBinding: undefined  // 화살표 함수는 자신의 this가 없음
}
```

### 3-2. 콜 스택 상태

```
┌─────────────────────────────────────┐
│ createSearchModule Execution Context │ ← 현재 실행 중
├─────────────────────────────────────┤
│ Global Execution Context             │
└─────────────────────────────────────┘
```

### 3-3. 내부 변수 초기화

```javascript
let currentController = null;
let debounceTimer = null;
```

`EnvironmentRecord`가 업데이트된다:

```javascript
EnvironmentRecord: {
  apiEndpoint: 'https://api.example.com/search',
  currentController: null,
  debounceTimer: null,
  debounce: <uninitialized>,  // 아직
  ...
}
```

### 3-4. debounce 함수 정의

```javascript
const debounce = (fn, delay) => {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};
```

`debounce` 함수 객체가 생성될 때, **`[[Environment]]`에 현재 환경이 저장**된다:

```javascript
debounceFunction.[[Environment]] = createSearchModuleExecutionContext.LexicalEnvironment
```

이것이 **클로저의 핵심**이다. `debounce`가 반환하는 내부 함수는 `debounceTimer`를 참조하는데, 이 변수는 `createSearchModule`의 렉시컬 환경에 있다.

### 3-5. fetchResults 함수 정의

```javascript
const fetchResults = async function (query) {
  if (currentController) {
    currentController.abort();
  }
  // ...
};
```

`fetchResults`도 마찬가지로 `[[Environment]]`에 현재 환경이 저장된다. `currentController` 변수에 접근할 수 있는 이유다.

### 3-6. search 함수 생성

```javascript
const search = debounce(fetchResults, 300);
```

여기서 **`debounce` 함수가 호출**된다. 새로운 실행 컨텍스트가 생성된다.

```
┌─────────────────────────────────────┐
│ debounce Execution Context           │ ← 현재
├─────────────────────────────────────┤
│ createSearchModule Execution Context │
├─────────────────────────────────────┤
│ Global Execution Context             │
└─────────────────────────────────────┘
```

`debounce` 내부에서 반환되는 익명 함수:

```javascript
return function (...args) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fn.apply(this, args);
  }, delay);
};
```

이 함수의 `[[Environment]]`는 **`debounce`의 렉시컬 환경**을 참조한다:

```javascript
returnedFunction.[[Environment]] = debounceExecutionContext.LexicalEnvironment
```

그리고 `debounce`의 `OuterEnv`는 `createSearchModule`의 렉시컬 환경이므로:

```
returnedFunction → debounce 환경 → createSearchModule 환경 → 전역 환경
```

이 **스코프 체인** 덕분에 반환된 함수는 `debounceTimer`, `currentController`, `apiEndpoint` 모두에 접근할 수 있다.

### 3-7. 객체 반환과 실행 컨텍스트 소멸

```javascript
return { search, fetchResults };
```

`createSearchModule` 실행이 끝나고 **실행 컨텍스트가 콜 스택에서 pop**된다.

```
┌─────────────────────────────────────┐
│ Global Execution Context             │ ← 다시 전역만 남음
└─────────────────────────────────────┘
```

**하지만** `createSearchModule`의 렉시컬 환경은 **메모리에서 해제되지 않는다**. 왜?

- `search` 함수의 `[[Environment]]`가 참조하고 있음
- `fetchResults` 함수의 `[[Environment]]`가 참조하고 있음
- 이 함수들은 반환된 객체에 있고, `searchModule` 변수가 참조함

가비지 컬렉터는 **도달 가능한 객체는 해제하지 않는다**. 이것이 클로저가 동작하는 원리다.

```javascript
// 전역 EnvironmentRecord 업데이트
GlobalExecutionContext.LexicalEnvironment.EnvironmentRecord = {
  createSearchModule: <function>,
  searchModule: { search: <function>, fetchResults: <function> }
}
```

---

## 4단계: search 호출과 이벤트 루프

```javascript
searchModule.search('hello');
```

### 4-1. search 실행 컨텍스트 생성

`search`는 `debounce`가 반환한 함수다:

```javascript
function (...args) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fn.apply(this, args);
  }, delay);
}
```

실행 컨텍스트:

```javascript
searchExecutionContext = {
  LexicalEnvironment: {
    EnvironmentRecord: {
      args: ['hello']
    },
    OuterEnv: debounceExecutionContext.LexicalEnvironment
  },
  ThisBinding: searchModule  // 메서드로 호출됨
}
```

### 4-2. 스코프 체인을 통한 변수 탐색

```javascript
clearTimeout(debounceTimer);
```

`debounceTimer`를 찾는 과정:

1. 현재 `EnvironmentRecord`에 있나? → 없음
2. `OuterEnv`(debounce 환경)에 있나? → 없음
3. 그 외부(createSearchModule 환경)에 있나? → **있음!** `null`

```javascript
debounceTimer = setTimeout(() => { ... }, delay);
```

`delay`도 스코프 체인을 따라 `debounce` 환경에서 찾는다 (`300`).

### 4-3. setTimeout과 Web API

`setTimeout`은 JavaScript 엔진이 아닌 **브라우저 Web API**가 처리한다.

```javascript
setTimeout(() => {
  fn.apply(this, args);
}, 300);
```

1. 엔진이 `setTimeout`을 호출
2. Web API에 콜백과 지연 시간을 전달
3. **즉시 반환** (비동기!)
4. `debounceTimer`에 타이머 ID 저장
5. `search` 실행 컨텍스트가 콜 스택에서 pop

```
300ms 동안:
┌──────────────────────────────────┐
│ Global Execution Context          │ ← 콜 스택
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Web API: setTimeout (300ms 카운트) │
└──────────────────────────────────┘
```

### 4-4. 두 번째 search 호출

```javascript
searchModule.search('hello world');  // 300ms 내에 호출
```

같은 과정이 반복되지만:

```javascript
clearTimeout(debounceTimer);  // 이전 타이머 취소!
```

Web API에서 대기 중이던 첫 번째 타이머가 취소된다. 새 타이머가 등록된다.

이것이 **디바운스의 원리**다. 클로저 덕분에 `debounceTimer`가 호출 간에 공유되어 이전 타이머를 취소할 수 있다.

### 4-5. 300ms 후: Task Queue

300ms가 지나면 Web API가 콜백을 **Task Queue**에 넣는다.

```
┌──────────────────────────────────┐
│ Global Execution Context          │ ← 콜 스택 (비어있거나 작업 중)
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Task Queue: [setTimeout 콜백]     │
└──────────────────────────────────┘
```

**이벤트 루프**가 콜 스택이 비었는지 확인하고, 비었으면 Task Queue에서 콜백을 꺼내 실행한다.

### 4-6. 콜백 실행: fn.apply(this, args)

```javascript
() => {
  fn.apply(this, args);
}
```

**화살표 함수의 this**: 화살표 함수는 자신의 `this`가 없다. 정의 시점의 외부 `this`를 사용한다. 이 화살표 함수는 `search` 함수 내부에서 정의되었으므로, `search`의 `this`(`searchModule`)를 캡처한다.

**`fn`**: 스코프 체인을 따라 `debounce` 환경에서 찾음 → `fetchResults`

**`args`**: 스코프 체인을 따라 `search` 호출 시의 환경에서 찾음 → `['hello world']`

---

## 5단계: fetchResults 실행 (async/await)

```javascript
const fetchResults = async function (query) {
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();
  // ...
};
```

### 5-1. async 함수의 특별한 점

`async` 함수는 호출되면 **항상 Promise를 반환**한다. 내부적으로 제너레이터와 유사하게 동작한다.

```javascript
fetchResults.apply(this, ['hello world']);
```

실행 컨텍스트가 생성되고, `currentController`를 스코프 체인에서 찾아 업데이트한다.

### 5-2. await와 Microtask

```javascript
const response = await fetch(`${apiEndpoint}?q=${query}`, { signal });
```

`await`를 만나면:

1. `fetch()`가 호출되어 Promise 반환
2. **`fetchResults` 실행이 일시 중단**
3. 실행 컨텍스트가 콜 스택에서 pop (하지만 상태는 보존)
4. Promise가 resolve되면 **Microtask Queue**에 continuation 추가

```
┌──────────────────────────────────┐
│ (비어있음)                        │ ← 콜 스택
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Pending: fetch Promise            │
└──────────────────────────────────┘
```

### 5-3. Microtask vs Task 우선순위

fetch가 완료되면:

```
┌──────────────────────────────────┐
│ Microtask Queue: [await 재개]     │ ← 우선순위 높음
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Task Queue: [다른 setTimeout...]  │ ← 우선순위 낮음
└──────────────────────────────────┘
```

이벤트 루프는 **Microtask Queue를 먼저 전부 비운다**. 그 다음 Task Queue에서 하나를 가져온다.

### 5-4. await 재개

Microtask가 실행되면 `fetchResults`가 **중단된 지점부터 재개**된다:

```javascript
const response = await fetch(...);  // 여기서 재개, response에 값 할당
const data = await response.json();  // 또 await → 또 중단 → Microtask
console.log('Results:', data);
return data;
```

---

## 6단계: 에러 처리와 finally

빠르게 연속 호출하면 디바운스가 이전 타이머를 취소한다. 하지만 디바운스 시간이 지나 fetch가 시작된 후 다시 호출하면:

```javascript
if (currentController) {
  currentController.abort();  // 진행 중인 요청 취소
}
```

`abort()`가 호출되면 fetch Promise가 `AbortError`로 reject된다. `finally` 블록은 **정상 종료, 에러, return 모두에서 실행**되어 `currentController = null`로 정리한다.

---

## 전체 메모리 구조 정리

최종 상태:

```
Global LexicalEnvironment
  └── searchModule: { search, fetchResults }
        │
        └── [[Environment]] 참조
              │
              ▼
      createSearchModule LexicalEnvironment (힙에 살아있음)
        - apiEndpoint: 'https://api.example.com/search'
        - currentController: null
        - debounceTimer: <timer id>
```

`createSearchModule`의 실행 컨텍스트는 콜 스택에서 사라졌지만, 렉시컬 환경은 클로저 참조로 인해 **힙에 살아있다**.

---

## 면접 예상 질문

**Q. 이 코드에서 클로저가 어디서 형성되고 왜 필요한가?**

`debounce`가 반환하는 함수와 `fetchResults`가 클로저다. 둘 다 `createSearchModule`의 렉시컬 환경을 `[[Environment]]`로 참조한다. `debounceTimer`와 `currentController`는 이 환경에 있어서, 여러 번 호출해도 같은 변수를 공유한다. 디바운스가 이전 타이머를 취소하고, fetch가 이전 요청을 abort할 수 있는 이유다.

**Q. setTimeout 콜백 내부의 this는 어떻게 결정되나?**

화살표 함수를 사용했으므로 자신의 this가 없다. 정의 시점의 외부 this를 캡처한다. `debounce`가 반환한 함수의 this는 호출 방식에 따라 결정되고(`searchModule`), 내부 화살표 함수가 이를 캡처한다. `fn.apply(this, args)`에서 `this`는 `searchModule`이다.

**Q. await에서 무슨 일이 일어나나?**

await를 만나면 async 함수 실행이 일시 중단되고 실행 컨텍스트가 콜 스택에서 pop된다. Promise가 settle되면 continuation이 Microtask Queue에 추가된다. 이벤트 루프가 콜 스택이 비었을 때 Microtask를 실행하여 함수가 재개된다.

**Q. 디바운스된 search를 연속 호출하면 이벤트 루프에서 어떤 일이 벌어지나?**

각 호출마다 `clearTimeout`으로 이전 타이머를 취소하고 새 `setTimeout`을 등록한다. Web API에서 타이머가 관리되고, 300ms 내에 새 호출이 오면 이전 콜백은 Task Queue에 들어가지 못한다. 마지막 호출의 타이머만 완료되어 Task Queue에 콜백이 추가되고, 이벤트 루프가 이를 실행한다.

**Q. createSearchModule 실행이 끝났는데 내부 변수가 왜 살아있나?**

실행 컨텍스트는 콜 스택에서 제거되지만, 렉시컬 환경은 힙 메모리에 있다. 반환된 함수들의 `[[Environment]]`가 이 환경을 참조하고, 이 함수들은 `searchModule` 객체를 통해 전역에서 접근 가능하다. 가비지 컬렉터는 도달 가능한 객체를 해제하지 않으므로 렉시컬 환경이 유지된다.