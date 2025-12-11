# 스코프와 실행 컨텍스트

## 스코프 (Scope)

### 스코프란?

**변수에 접근할 수 있는 유효 범위**입니다. 스코프는 변수의 **가시성(visibility)**과 **생명주기(lifetime)**를 결정합니다.

```javascript
function outer() {
  const x = 10;
  
  function inner() {
    const y = 20;
    console.log(x);  // ✅ 외부 스코프 접근 가능
  }
  
  console.log(y);  // ❌ ReferenceError (내부 스코프 접근 불가)
}
```

스코프는 **안에서 밖으로는 접근 가능**하지만, **밖에서 안으로는 접근 불가능**합니다.

---

## 스코프의 종류

### 1. 전역 스코프 (Global Scope)

코드의 최상위 레벨입니다. 어디서든 접근 가능합니다. 전역 변수는 예측하기 어렵고 버그의 원인이 되므로 최소화하는 것이 좋습니다.

### 2. 함수 스코프 (Function Scope)

함수 내부에서 선언된 변수는 **함수 안에서만** 유효합니다. `var`는 함수 스코프를 따릅니다.

```javascript
function foo() {
  if (true) {
    var y = 20;  // 함수 스코프 (블록 무시)
  }
  console.log(y);  // 20 (if 블록 밖에서도 접근 가능)
}
```

### 3. 블록 스코프 (Block Scope)

중괄호 `{}` 내부에서 선언된 변수는 **블록 안에서만** 유효합니다. `let`과 `const`는 블록 스코프를 따릅니다.

```javascript
function foo() {
  if (true) {
    let y = 20;  // 블록 스코프
  }
  console.log(y);  // ❌ ReferenceError
}
```

### var vs let/const 스코프

| 키워드 | 스코프 | 특징 |
|--------|--------|------|
| var | 함수 스코프 | if, for 등 블록 무시 |
| let/const | 블록 스코프 | 블록 안에서만 유효 |

```javascript
for (var i = 0; i < 3; i++) { }
console.log(i);  // 3 (var는 for 블록 밖에서 접근 가능)

for (let j = 0; j < 3; j++) { }
console.log(j);  // ❌ ReferenceError
```

---

## 스코프 체인 (Scope Chain)

### 스코프 체인이란?

변수를 찾을 때 **현재 스코프 → 상위 스코프 → ... → 전역 스코프** 순으로 탐색하는 연결 구조입니다.

```javascript
const a = 1;  // 전역

function outer() {
  const b = 2;
  
  function inner() {
    const c = 3;
    console.log(a, b, c);  // 1, 2, 3
  }
  inner();
}
```

`inner`에서 `a`를 찾는 과정: inner 스코프 → outer 스코프 → 전역 스코프 → **찾음!**

### 변수 섀도잉 (Variable Shadowing)

내부 스코프에서 외부와 **같은 이름의 변수를 선언**하면, 외부 변수가 가려집니다.

```javascript
const x = 'global';

function foo() {
  const x = 'local';  // 전역 x를 가림
  console.log(x);  // 'local'
}
```

---

## 렉시컬 스코프 (Lexical Scope)

JavaScript는 **렉시컬 스코프(정적 스코프)** 언어입니다. 함수의 스코프는 **함수가 호출된 위치가 아닌, 함수가 정의된 위치**에서 결정됩니다.

```javascript
const x = 10;

function foo() {
  console.log(x);
}

function bar() {
  const x = 20;
  foo();
}

bar();  // 10 (20이 아님!)
```

`foo()`가 `bar()` 안에서 호출되었지만, `foo()`는 **전역에서 정의**되었으므로 전역의 `x = 10`을 참조합니다.

렉시컬 스코프 덕분에 **코드만 보고 변수가 어디서 왔는지** 파악할 수 있습니다.

---

## 실행 컨텍스트 (Execution Context)

### 실행 컨텍스트란?

**코드가 실행되기 위해 필요한 환경 정보를 담은 객체**입니다. JavaScript 엔진이 코드를 실행할 때 생성합니다.

실행 컨텍스트는 다음 정보를 포함합니다:
- 변수, 함수 선언
- this 바인딩
- 외부 환경에 대한 참조 (스코프 체인)

### 실행 컨텍스트의 종류

| 종류 | 생성 시점 |
|------|----------|
| **전역 실행 컨텍스트** | 코드 실행 시 가장 먼저 생성 |
| **함수 실행 컨텍스트** | 함수 호출 시마다 생성 |

---

## 실행 컨텍스트의 구성 요소

```
실행 컨텍스트
├── Lexical Environment
│   ├── Environment Record (let, const, 함수 저장)
│   └── Outer Reference (상위 스코프 참조 → 스코프 체인)
├── Variable Environment
│   └── Environment Record (var 저장)
└── This Binding
```

- **Lexical Environment**: let, const, 함수 선언 저장. Outer Reference가 스코프 체인을 구현
- **Variable Environment**: var 선언 저장
- **This Binding**: 현재 컨텍스트의 this 값

---

## 콜 스택 (Call Stack)

**실행 컨텍스트를 저장하는 스택 자료구조**입니다. 함수가 호출되면 해당 실행 컨텍스트가 스택에 **push**되고, 함수가 종료되면 **pop**됩니다.

```javascript
function first() { second(); }
function second() { third(); }
function third() { console.log('done'); }

first();
```

```
실행 순서:
[전역] → [전역, first] → [전역, first, second] → [전역, first, second, third]
       → [전역, first, second] → [전역, first] → [전역]
```

재귀 함수가 종료 조건 없이 무한 호출되면 콜 스택이 꽉 차서 **Stack Overflow** 에러가 발생합니다.

---

## 실행 컨텍스트의 생성 과정

### 1. 생성 단계 (Creation Phase)

코드 실행 전에 환경을 세팅합니다.

- 변수/함수 선언 스캔 (호이스팅)
- var → undefined로 초기화
- let/const → 초기화하지 않음 (TDZ)
- 함수 선언 → 함수 전체 저장
- this 바인딩 결정
- 외부 환경 참조 설정

### 2. 실행 단계 (Execution Phase)

코드를 한 줄씩 실행하며 변수에 값을 할당합니다.

```javascript
console.log(a);  // undefined (생성 단계에서 초기화됨)
console.log(b);  // ReferenceError (TDZ)

var a = 10;
let b = 20;
```

---

## 스코프와 실행 컨텍스트의 관계

### 차이점

| 구분 | 스코프 | 실행 컨텍스트 |
|------|--------|--------------|
| 정의 | 변수의 유효 범위 | 코드 실행 환경 |
| 결정 시점 | 코드 작성 시 (정적) | 코드 실행 시 (동적) |
| 생성 시점 | 함수 정의 시 | 함수 호출 시 |
| 개수 | 함수당 하나 | 호출마다 새로 생성 |

### 관계

1. **스코프는 정적**, 실행 컨텍스트는 **동적**
   - 스코프는 코드 작성 시 결정됨 (렉시컬 스코프)
   - 실행 컨텍스트는 함수 호출 시마다 생성됨

2. **실행 컨텍스트가 스코프 체인을 구현**
   - Lexical Environment의 Outer Reference가 상위 스코프를 참조

3. **같은 함수, 다른 실행 컨텍스트**
   - 함수를 여러 번 호출하면 매번 새 실행 컨텍스트 생성
   - 하지만 스코프(변수 접근 범위)는 동일

---

## 클로저와의 관계

클로저는 스코프와 실행 컨텍스트의 상호작용으로 발생합니다.

```javascript
function outer() {
  const x = 10;
  return function inner() {
    console.log(x);
  };
}

const fn = outer();  // outer 컨텍스트 종료
fn();  // 10 (x에 여전히 접근 가능!)
```

`outer` 실행 컨텍스트는 사라졌지만, `inner`가 outer의 **렉시컬 환경을 참조**하고 있어서 `x`가 메모리에 유지됩니다. 이것이 **클로저**입니다.

---

## 면접 예상 질문

**Q. 스코프란?**

변수에 접근할 수 있는 유효 범위입니다. JavaScript는 전역, 함수, 블록 스코프가 있습니다. var는 함수 스코프, let과 const는 블록 스코프를 따릅니다. 스코프는 안에서 밖으로는 접근 가능하지만 밖에서 안으로는 접근 불가능합니다.

**Q. 렉시컬 스코프란?**

함수의 스코프가 호출된 위치가 아닌 정의된 위치에서 결정되는 것입니다. JavaScript는 렉시컬 스코프 언어라서 코드만 보고 변수가 어디서 왔는지 파악할 수 있습니다.

**Q. 실행 컨텍스트란?**

코드가 실행되기 위해 필요한 환경 정보를 담은 객체입니다. 변수, 함수 선언, this 바인딩, 외부 스코프 참조 등을 포함합니다. 함수가 호출될 때마다 새로운 실행 컨텍스트가 생성되어 콜 스택에 쌓입니다.

**Q. 스코프와 실행 컨텍스트의 차이?**

스코프는 변수의 유효 범위로 코드 작성 시 정적으로 결정됩니다. 실행 컨텍스트는 코드 실행 환경으로 함수 호출 시 동적으로 생성됩니다. 같은 함수를 여러 번 호출하면 매번 새 실행 컨텍스트가 생성되지만, 스코프 구조는 동일합니다.

**Q. 스코프 체인이란?**

변수를 찾을 때 현재 스코프에서 시작해 상위 스코프로 올라가며 탐색하는 연결 구조입니다. 실행 컨텍스트의 Outer Reference가 상위 스코프를 참조하여 이 체인을 구현합니다.