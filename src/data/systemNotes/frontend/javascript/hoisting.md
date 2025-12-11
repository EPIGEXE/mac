# 호이스팅 (Hoisting)과 TDZ

## 호이스팅이란?

**선언문이 코드의 최상단으로 끌어올려지는 것처럼 동작하는 JavaScript의 특성**입니다.

실제로 코드가 이동하는 것은 아닙니다. JavaScript 엔진이 코드 실행 전 **"생성 단계"**에서 변수와 함수 선언을 먼저 메모리에 등록하기 때문에 이런 현상이 발생합니다.

```javascript
console.log(name);  // undefined (에러가 아님!)
var name = 'John';
```

위 코드가 실행되면 에러가 아닌 `undefined`가 출력됩니다. 이는 JavaScript 엔진이 내부적으로 아래처럼 해석하기 때문입니다.

```javascript
var name;           // 선언이 끌어올려짐
console.log(name);  // undefined
name = 'John';      // 할당은 원래 위치에서 실행
```

## JavaScript 엔진의 실행 과정

코드 실행은 **두 단계**로 나뉩니다.

### 1단계: 생성 단계 (Creation Phase)

- 변수, 함수 선언을 스캔
- 메모리에 공간 할당
- **var**: undefined로 초기화
- **let/const**: 초기화하지 않음 (TDZ)
- **함수 선언문**: 함수 전체를 메모리에 저장

### 2단계: 실행 단계 (Execution Phase)

- 코드를 한 줄씩 실행
- 변수에 값 할당
- 함수 호출

이 두 단계 때문에 선언 전에 변수나 함수에 접근하는 것이 가능(또는 에러)해집니다.

## 변수 호이스팅

### var의 호이스팅

var는 **선언과 초기화가 동시에** 호이스팅됩니다. 초기값은 `undefined`입니다.

```javascript
console.log(a);  // undefined
var a = 10;
console.log(a);  // 10
```

선언 전에 접근해도 에러가 나지 않아서 **버그를 발견하기 어렵습니다**. 의도치 않게 undefined를 사용하는 실수가 발생할 수 있습니다.

### let/const의 호이스팅

let과 const도 **호이스팅은 됩니다**. 하지만 **초기화되지 않습니다**. 선언문에 도달하기 전까지 변수에 접근할 수 없는 구간이 생기는데, 이를 **TDZ(Temporal Dead Zone)**라고 합니다.

```javascript
console.log(b);  // ReferenceError: Cannot access 'b' before initialization
let b = 20;
```

"호이스팅이 안 된다"가 아니라 "호이스팅은 되지만 TDZ 때문에 접근 불가"가 정확한 표현입니다.

### 호이스팅은 되지만 TDZ에 있다는 증거

```javascript
let x = 'outer';

function test() {
  console.log(x);  // ReferenceError (outer가 아님!)
  let x = 'inner';
}

test();
```

만약 `let x`가 호이스팅되지 않았다면, 외부의 `'outer'`가 출력되어야 합니다. 하지만 에러가 발생합니다. 이는 **함수 내부의 `let x`가 호이스팅되어 스코프 최상단에서 인식되지만, TDZ에 있어서 접근할 수 없기 때문**입니다.

---

## TDZ (Temporal Dead Zone)

### TDZ란?

**변수가 선언되었지만 아직 초기화되지 않은 구간**입니다. 이 구간에서 변수에 접근하면 ReferenceError가 발생합니다.

```
┌─────────────────────────────────────┐
│ // TDZ 시작 (스코프 진입 시점)       │
│                                     │
│ console.log(x);  // ❌ ReferenceError│
│                                     │
│ let x = 10;  // ← TDZ 끝            │
│                                     │
│ console.log(x);  // ✅ 10           │
└─────────────────────────────────────┘
```

### TDZ가 필요한 이유

1. **버그 조기 발견**: 선언 전에 변수를 사용하는 실수를 런타임이 아닌 개발 시점에 잡을 수 있습니다.

2. **const의 의미 보장**: const는 선언과 동시에 값이 할당되어야 합니다. 만약 undefined로 초기화된다면 const의 "상수" 의미가 훼손됩니다.

3. **코드 예측 가능성**: 변수는 선언된 이후에만 사용한다는 직관적인 규칙을 강제합니다.

### TDZ가 적용되는 것들

| 대상 | TDZ 적용 |
|------|----------|
| let | O |
| const | O |
| class | O |
| 함수 매개변수 기본값 | O |
| var | X (undefined로 초기화) |
| 함수 선언문 | X (전체가 호이스팅) |

## 함수 호이스팅

### 함수 선언문 (Function Declaration)

함수 선언문은 **전체가 호이스팅**됩니다. 선언 전에 호출해도 정상 동작합니다.

```javascript
sayHi();  // 'Hello!' (정상 동작)

function sayHi() {
  console.log('Hello!');
}
```

이는 생성 단계에서 함수 선언문을 발견하면 **함수 이름과 함수 본문 전체**를 메모리에 저장하기 때문입니다.

### 함수 표현식 (Function Expression)

함수 표현식은 **변수에 함수를 할당**하는 형태입니다. 변수 호이스팅 규칙을 따릅니다.

```javascript
// var로 선언한 함수 표현식
sayHi();  // TypeError: sayHi is not a function
var sayHi = function() {
  console.log('Hello!');
};
```

var는 undefined로 초기화되므로, `sayHi()`는 `undefined()`를 호출하는 것과 같습니다. 함수가 아닌 것을 호출했으니 TypeError가 발생합니다.

```javascript
// let/const로 선언한 함수 표현식
sayBye();  // ReferenceError: Cannot access 'sayBye' before initialization
const sayBye = function() {
  console.log('Bye!');
};
```

let/const는 TDZ에 있으므로 ReferenceError가 발생합니다.

### 화살표 함수

화살표 함수도 함수 표현식의 일종이므로 **변수 호이스팅 규칙**을 따릅니다.

```javascript
greet();  // ReferenceError
const greet = () => console.log('Hi');
```

## 함수 선언문 vs 함수 표현식 비교

| 구분 | 함수 선언문 | 함수 표현식 |
|------|-------------|-------------|
| 문법 | `function fn() {}` | `const fn = function() {}` |
| 호이스팅 | 전체 (선언 + 본문) | 변수만 (var면 undefined, let/const면 TDZ) |
| 선언 전 호출 | O | X |

### 어떤 것을 사용해야 할까?

**함수 표현식(const + 화살표 함수)을 권장**하는 의견이 많습니다.

- 호이스팅에 의존하지 않는 명확한 코드 흐름
- 선언 전 사용 시 에러로 버그 조기 발견
- 화살표 함수의 this 바인딩 장점

다만 함수 선언문도 가독성이 좋고, 상호 재귀 함수 작성 시 유용합니다. 팀/프로젝트 컨벤션을 따르는 것이 좋습니다.

## 클래스 호이스팅

클래스도 호이스팅되지만 **TDZ가 적용**됩니다. let/const와 동일한 동작입니다.

```javascript
const p = new Person();  // ReferenceError

class Person {
  constructor(name) {
    this.name = name;
  }
}
```

클래스는 함수로 변환되지만, 함수 선언문처럼 전체가 호이스팅되지는 않습니다. 이는 클래스의 설계 의도입니다. 클래스는 반드시 선언 후에 사용해야 한다는 직관을 강제합니다.

## 변수별 호이스팅 동작 정리

| 선언 방식 | 호이스팅 | 초기화 | 선언 전 접근 |
|-----------|----------|--------|--------------|
| var | O | undefined | undefined 반환 |
| let | O | X (TDZ) | ReferenceError |
| const | O | X (TDZ) | ReferenceError |
| 함수 선언문 | O (전체) | 함수 본문 | 정상 호출 가능 |
| 함수 표현식 | 변수 규칙 따름 | 변수 규칙 따름 | 에러 |
| class | O | X (TDZ) | ReferenceError |

## 실무에서 주의할 점

### 1. var 사용 금지

var는 호이스팅으로 인한 예측 불가능한 동작을 유발합니다. ESLint의 `no-var` 규칙을 활성화하세요.

### 2. 선언은 스코프 최상단에

호이스팅에 의존하지 말고, 변수와 함수는 사용하기 전에 명시적으로 선언하세요. 코드 가독성과 유지보수성이 높아집니다.

### 3. 함수 선언문의 조건부 선언 피하기

```javascript
// ❌ 피해야 함 - 브라우저마다 동작이 다를 수 있음
if (condition) {
  function doSomething() { }
}

// ✅ 함수 표현식 사용
let doSomething;
if (condition) {
  doSomething = function() { };
}
```

## 면접 예상 질문

**Q. 호이스팅이란 무엇인가요?**

호이스팅은 변수와 함수 선언이 코드의 최상단으로 끌어올려지는 것처럼 동작하는 JavaScript의 특성입니다. 실제로 코드가 이동하는 것은 아니고, JavaScript 엔진이 실행 전 생성 단계에서 선언을 먼저 메모리에 등록하기 때문에 이런 현상이 발생합니다.

**Q. var, let, const의 호이스팅 차이는?**

세 가지 모두 호이스팅됩니다. 차이는 초기화 시점입니다. var는 호이스팅될 때 undefined로 초기화되어 선언 전에 접근하면 undefined가 반환됩니다. let과 const는 호이스팅되지만 초기화되지 않아서 TDZ에 놓이고, 선언 전에 접근하면 ReferenceError가 발생합니다.

**Q. TDZ(Temporal Dead Zone)란?**

변수가 스코프에 등록되었지만 아직 초기화되지 않은 구간입니다. let, const, class에 적용됩니다. TDZ 안에서 변수에 접근하면 ReferenceError가 발생합니다. 이를 통해 선언 전에 변수를 사용하는 실수를 조기에 발견할 수 있습니다.

**Q. 함수 선언문과 함수 표현식의 호이스팅 차이는?**

함수 선언문은 함수 전체가 호이스팅되어 선언 전에 호출해도 정상 동작합니다. 함수 표현식은 변수에 함수를 할당하는 형태라서 변수 호이스팅 규칙을 따릅니다. var면 undefined로 초기화되어 호출 시 TypeError, let/const면 TDZ라서 ReferenceError가 발생합니다.

**Q. let이 호이스팅되지 않는다고 하면 틀린 건가요?**

네, 틀린 표현입니다. let도 호이스팅됩니다. 다만 var처럼 undefined로 초기화되지 않고 TDZ에 놓여서 접근이 불가능할 뿐입니다. 만약 호이스팅이 안 됐다면 외부 스코프의 같은 이름 변수에 접근할 수 있어야 하는데, 실제로는 ReferenceError가 발생합니다. 이것이 호이스팅은 되지만 TDZ에 있다는 증거입니다.