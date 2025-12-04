# JavaScript ES6+ 핵심 문법

## ECMAScript란?

JavaScript 언어의 **표준 명세서**입니다. 브라우저(Chrome, Firefox, Safari)와 서버(Node.js)에서 동일하게 동작하도록 문법, 데이터 타입, 내장 객체 등의 규격을 정의합니다.

**ES6(2015)가 가장 큰 전환점**으로, 이후 매년 소규모 업데이트가 이루어지고 있습니다. 면접에서는 ES6 문법이 가장 많이 출제됩니다.

---

## 1. var vs let vs const

### 비교표

| 구분 | var | let | const |
|------|-----|-----|-------|
| 스코프 | 함수 스코프 | 블록 스코프 | 블록 스코프 |
| 재선언 | O | X | X |
| 재할당 | O | O | X |
| 호이스팅 | undefined로 초기화 | TDZ | TDZ |

### 스코프 차이

**var는 함수 스코프**입니다. if문, for문 같은 블록 안에서 선언해도 함수 전체에서 접근 가능합니다. 이로 인해 의도치 않은 변수 충돌이나 버그가 발생하기 쉽습니다.

**let과 const는 블록 스코프**입니다. 중괄호 `{}` 안에서 선언하면 그 블록 안에서만 유효합니다. 변수의 유효 범위가 명확해져 코드 예측이 쉬워집니다.

```javascript
if (true) {
  var x = 10;
  let y = 20;
}
console.log(x);  // 10 (블록 밖에서 접근 가능)
console.log(y);  // ReferenceError (블록 밖에서 접근 불가)
```

### TDZ (Temporal Dead Zone)

var는 호이스팅 시 선언과 동시에 `undefined`로 초기화됩니다. 그래서 선언 전에 접근해도 에러가 아닌 undefined가 나옵니다.

let과 const는 호이스팅은 되지만 **초기화되지 않습니다**. 선언문에 도달하기 전까지 "일시적 사각지대(TDZ)"에 있어서 접근하면 ReferenceError가 발생합니다. 이 덕분에 선언 전에 변수를 사용하는 실수를 컴파일 타임에 잡을 수 있습니다.

```javascript
console.log(a);  // undefined (var - 초기화됨)
console.log(b);  // ReferenceError (let - TDZ)
var a = 1;
let b = 2;
```

### const의 불변성

const는 **재할당이 불가능**하지만, 객체나 배열의 **내부 값 변경은 가능**합니다. const가 보호하는 것은 변수가 가리키는 참조(메모리 주소)이지, 참조 대상의 내용이 아닙니다.

```javascript
const arr = [1, 2, 3];
arr.push(4);      // ✅ 내부 변경 가능
arr = [5, 6];     // ❌ 재할당 불가 (TypeError)
```

### 실무 권장

- **기본: const** - 재할당이 필요 없는 대부분의 변수
- **재할당 필요 시: let** - 반복문 카운터, 상태 값 등
- **var: 사용하지 않음** - 스코프 문제, 호이스팅 혼란

---

## 2. 화살표 함수 (Arrow Function)

### 문법

```javascript
// 기존 함수
function add(a, b) { return a + b; }

// 화살표 함수
const add = (a, b) => a + b;
```

### this 바인딩 차이 (핵심!)

**일반 함수**는 **호출 시점**에 this가 결정됩니다. 누가 호출했느냐에 따라 this가 달라집니다. 객체의 메서드로 호출하면 그 객체가 this, 일반 함수로 호출하면 전역 객체(또는 strict mode에서 undefined)가 this입니다.

**화살표 함수**는 **선언 시점**의 상위 스코프 this를 그대로 사용합니다. 자신만의 this를 가지지 않고 외부 this를 "캡처"합니다. 이를 **Lexical this**라고 합니다.

```javascript
const obj = {
  name: 'John',
  sayHi() { console.log(this.name); },           // 'John' (obj가 this)
  sayBye: () => console.log(this.name),          // undefined (상위 스코프 this)
};
```

### 콜백에서의 활용

일반 함수를 콜백으로 넘기면 this가 바뀌어서 문제가 됩니다. 화살표 함수는 상위 스코프 this를 유지하므로 콜백에서 유용합니다.

```javascript
// forEach 콜백에서 화살표 함수 → 외부 this 유지
this.items.forEach((item) => {
  console.log(this.name);  // 상위 스코프의 this.name
});
```

### 화살표 함수를 쓰면 안 되는 경우

- **객체 메서드**: this가 객체를 가리키지 않음
- **생성자 함수**: new 키워드 사용 불가
- **addEventListener 콜백**: this가 이벤트 타겟이 아닌 상위 스코프를 가리킴

---

## 3. 구조 분해 할당 (Destructuring)

배열이나 객체에서 값을 추출해 변수에 할당하는 문법입니다. 코드가 간결해지고 의도가 명확해집니다.

### 객체 구조 분해

```javascript
const { name, age = 0 } = user;           // 기본값 설정 가능
const { name: userName } = user;          // 다른 변수명으로 할당
```

### 배열 구조 분해

```javascript
const [first, , third] = arr;             // 인덱스 건너뛰기
const [head, ...rest] = arr;              // 나머지는 배열로
```

### 함수 매개변수에서 활용

React에서 props를 받을 때 자주 사용합니다. 필요한 속성만 명시적으로 추출하고, 기본값도 설정할 수 있습니다.

```javascript
function UserCard({ name, age = 0, email }) {
  // props.name 대신 바로 name 사용
}
```

---

## 4. 스프레드 / 레스트 연산자 (...)

같은 `...` 문법이지만 **위치에 따라 역할이 다릅니다**.

### 스프레드 (Spread) - 펼치기

배열이나 객체를 개별 요소로 펼칩니다. 복사, 합치기, 함수 인자 전달에 사용합니다.

```javascript
const newArr = [...arr, 4, 5];              // 배열 복사 + 추가
const newObj = { ...obj, key: 'value' };    // 객체 복사 + 속성 추가/덮어쓰기
```

### 레스트 (Rest) - 모으기

여러 요소를 하나의 배열로 모읍니다. 함수 매개변수나 구조 분해에서 "나머지"를 받을 때 사용합니다.

```javascript
function sum(...numbers) { }                // 나머지 인자를 배열로
const { id, ...rest } = data;               // id 제외한 나머지를 객체로
```

### 얕은 복사 주의

스프레드로 복사하면 **1단계만 복사**됩니다. 중첩된 객체/배열은 여전히 참조를 공유합니다.

```javascript
const copy = { ...original };
copy.nested.value = 100;  // original.nested.value도 변경됨!
```

깊은 복사가 필요하면 `structuredClone()` 또는 라이브러리를 사용합니다.

---

## 5. 클래스 (Class)

ES6에서 도입된 객체 지향 문법입니다. 내부적으로는 프로토타입 기반으로 동작하지만, 다른 언어 사용자에게 친숙한 문법을 제공합니다.

```javascript
class Person {
  constructor(name) { this.name = name; }
  greet() { console.log(`Hello, ${this.name}`); }
  static create(name) { return new Person(name); }  // 정적 메서드
}

class Student extends Person {
  constructor(name, grade) {
    super(name);  // 부모 생성자 호출
    this.grade = grade;
  }
}
```

**클래스는 문법적 설탕(Syntactic Sugar)**입니다. `typeof Person`은 여전히 `'function'`입니다.

---

## 6. 모듈 (Modules)

파일 간 코드를 분리하고 재사용할 수 있게 합니다. 번들러(Webpack, Vite) 없이도 브라우저에서 `type="module"`로 사용 가능합니다.

### Named Export/Import

여러 개를 내보내고 이름으로 가져옵니다. 이름을 변경하려면 `as`를 사용합니다.

```javascript
// utils.js
export const PI = 3.14;
export function add(a, b) { return a + b; }

// app.js
import { PI, add as sum } from './utils.js';
```

### Default Export/Import

파일당 하나의 기본 내보내기. 가져올 때 이름을 자유롭게 지정할 수 있습니다.

```javascript
// Button.js
export default function Button() { }

// app.js
import MyButton from './Button.js';  // 이름 자유
```

---

## 7. Promise

비동기 작업의 **완료 또는 실패**를 나타내는 객체입니다. 콜백 지옥을 해결하고 비동기 코드를 더 읽기 쉽게 만듭니다.

### 세 가지 상태

- **Pending**: 대기 중 (아직 완료/실패 안 됨)
- **Fulfilled**: 완료됨 (resolve 호출)
- **Rejected**: 실패함 (reject 호출)

### 주요 정적 메서드

| 메서드 | 설명 |
|--------|------|
| Promise.all | 모두 성공해야 성공, 하나라도 실패하면 즉시 실패 |
| Promise.allSettled | 모두 완료될 때까지 대기 (성공/실패 상관없이) |
| Promise.race | 가장 먼저 완료되는 결과 반환 |
| Promise.any | 가장 먼저 성공하는 결과 반환 |

---

## 8. async / await

Promise를 더 **동기 코드처럼** 작성할 수 있는 문법입니다. 내부적으로는 Promise와 동일하게 동작합니다.

### 기본 사용

```javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
```

### 병렬 처리 주의

await를 연속으로 쓰면 **순차 실행**됩니다. 독립적인 작업은 `Promise.all`로 병렬 처리해야 성능이 좋습니다.

```javascript
// ❌ 순차 실행 - 총 2초
const a = await fetchA();  // 1초
const b = await fetchB();  // 1초

// ✅ 병렬 실행 - 총 1초
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

---

## 9. Optional Chaining (?.)

중첩된 객체 속성에 **안전하게 접근**할 수 있습니다. 중간에 null이나 undefined가 있으면 에러 대신 undefined를 반환합니다.

```javascript
// 기존: 매번 존재 여부 체크
const city = user && user.address && user.address.city;

// Optional Chaining
const city = user?.address?.city;
const first = arr?.[0];           // 배열
const result = obj?.method?.();   // 메서드
```

API 응답처럼 구조가 불확실한 데이터를 다룰 때 특히 유용합니다.

---

## 10. Nullish Coalescing (??)

**null 또는 undefined일 때만** 기본값을 사용합니다.

### || 와의 차이

`||`는 모든 falsy 값(0, '', false, null, undefined)에서 기본값을 사용합니다. 하지만 0이나 빈 문자열이 **의도된 값**일 수 있습니다.

`??`는 null과 undefined만 체크합니다. 0, '', false는 유효한 값으로 취급합니다.

```javascript
const count = 0;
count || 10    // 10 (0이 falsy라서 기본값 적용)
count ?? 10    // 0 (0은 null/undefined가 아니므로 유지)
```

### 실무 예시

```javascript
// 설정 값이 0일 수 있는 경우
const timeout = options.timeout ?? 3000;
const retries = options.retries ?? 3;
```

---

## Study

**Q. var, let, const 차이?**

var는 함수 스코프이고 재선언이 가능합니다. let과 const는 블록 스코프이고 재선언이 불가능합니다. 호이스팅 시 var는 undefined로 초기화되지만, let과 const는 TDZ가 있어서 선언 전에 접근하면 에러가 발생합니다. const는 추가로 재할당도 불가능하지만, 객체/배열의 내부 값 변경은 가능합니다.

**Q. 화살표 함수와 일반 함수 차이?**

가장 큰 차이는 this 바인딩입니다. 일반 함수는 호출 시점에 this가 결정되지만, 화살표 함수는 선언 시점의 상위 스코프 this를 사용합니다. 그래서 콜백 함수에서 외부 this를 사용할 때 유용합니다. 단, 객체 메서드나 생성자 함수에서는 화살표 함수를 쓰면 안 됩니다.

**Q. Promise와 async/await 관계?**

async/await는 Promise를 더 읽기 쉽게 작성하는 문법적 설탕입니다. async 함수는 항상 Promise를 반환하고, await는 Promise가 완료될 때까지 기다립니다. 내부적으로 동일하게 동작하지만 동기 코드처럼 작성할 수 있어 가독성이 좋습니다.

**Q. `??`와 `||`의 차이?**

`||`는 falsy 값(0, '', false, null, undefined)일 때 기본값을 사용하고, `??`는 null과 undefined일 때만 기본값을 사용합니다. 0이나 빈 문자열을 유효한 값으로 취급해야 할 때 `??`를 사용합니다.

**Q. 스프레드 연산자의 얕은 복사란?**

스프레드로 객체/배열을 복사하면 1단계 깊이만 새로 만들어집니다. 중첩된 객체나 배열은 여전히 원본과 같은 참조를 공유합니다. 그래서 중첩된 값을 수정하면 원본도 함께 변경됩니다. 깊은 복사가 필요하면 structuredClone()이나 라이브러리를 사용해야 합니다.