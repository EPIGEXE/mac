# 클로저 (Closure)

## 클로저란?

**함수가 선언될 때의 렉시컬 환경(Lexical Environment)을 기억하여, 함수가 그 환경 밖에서 실행되어도 해당 환경에 접근할 수 있는 현상**입니다.

쉽게 말해, **함수가 자신이 태어난 곳의 변수를 기억하는 것**입니다.

```javascript
function outer() {
  const message = 'Hello';
  
  function inner() {
    console.log(message);  // outer의 변수에 접근
  }
  
  return inner;
}

const fn = outer();  // outer 실행 종료
fn();  // 'Hello' - 여전히 message에 접근 가능!
```

`outer()` 함수가 실행 종료되면 일반적으로 지역 변수 `message`는 사라져야 합니다. 하지만 `inner` 함수가 `message`를 참조하고 있어서, JavaScript 엔진은 이 변수를 메모리에 유지합니다. 이것이 클로저입니다.

---

## 렉시컬 스코프 (Lexical Scope)

클로저를 이해하려면 먼저 **렉시컬 스코프**를 알아야 합니다.

### 스코프 결정 시점

JavaScript는 **렉시컬 스코프(정적 스코프)** 언어입니다. 함수의 스코프는 **함수가 호출되는 위치가 아닌, 함수가 정의된 위치**에서 결정됩니다.

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

`foo()`가 `bar()` 안에서 호출되었지만, `foo()`는 전역에서 정의되었으므로 전역의 `x = 10`을 참조합니다. 호출 위치의 `x = 20`은 무관합니다.

### 렉시컬 환경 (Lexical Environment)

함수가 생성될 때, 해당 함수는 자신의 **렉시컬 환경에 대한 참조**를 내부 슬롯에 저장합니다. 이 참조를 통해 외부 변수에 접근할 수 있고, 이것이 클로저의 기반입니다.

---

## 클로저가 만들어지는 조건

클로저는 다음 조건을 만족할 때 형성됩니다.

1. **중첩 함수**가 있어야 합니다 (함수 안에 함수)
2. 내부 함수가 **외부 함수의 변수를 참조**해야 합니다
3. 내부 함수가 **외부 함수보다 오래 생존**해야 합니다 (반환, 콜백 등록 등)

세 번째 조건이 중요합니다. 내부 함수가 외부 함수의 실행이 끝난 후에도 어딘가에서 사용되어야 클로저가 의미 있습니다.

---

## 클로저의 동작 원리

### 실행 컨텍스트와 렉시컬 환경

```javascript
function makeCounter() {
  let count = 0;
  
  return function() {
    return ++count;
  };
}

const counter = makeCounter();
console.log(counter());  // 1
console.log(counter());  // 2
```

1. `makeCounter()` 호출 → 실행 컨텍스트 생성, `count = 0` 등록
2. 내부 함수 생성 → `makeCounter`의 렉시컬 환경 참조를 저장
3. 내부 함수 반환 → `makeCounter` 실행 컨텍스트는 종료
4. 하지만 반환된 함수가 렉시컬 환경을 참조 → `count`는 메모리에 유지
5. `counter()` 호출할 때마다 같은 `count`에 접근 → 값 증가

### 각 클로저는 독립적

```javascript
const counter1 = makeCounter();
const counter2 = makeCounter();

console.log(counter1());  // 1
console.log(counter1());  // 2
console.log(counter2());  // 1 (counter1과 별개)
```

`makeCounter()`를 호출할 때마다 새로운 렉시컬 환경이 생성됩니다. 각 클로저는 **자신만의 `count`**를 가집니다.

---

## 실무 활용 사례

### 1. 데이터 은닉 (캡슐화)

JavaScript는 전통적으로 private 변수를 지원하지 않았습니다. 클로저를 사용하면 **외부에서 직접 접근할 수 없는 변수**를 만들 수 있습니다.

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance;  // private 변수
  
  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error('잔액 부족');
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    }
  };
}

const account = createBankAccount(1000);
account.deposit(500);     // 1500
account.balance;          // undefined (직접 접근 불가)
account.getBalance();     // 1500
```

`balance`는 클로저 안에 숨겨져 있어서 오직 반환된 메서드를 통해서만 조작할 수 있습니다. 이를 통해 데이터 무결성을 보장하고 의도치 않은 수정을 방지합니다.

### 2. 함수 팩토리

특정 값이 고정된 함수를 생성하는 팩토리 패턴에 클로저가 사용됩니다.

```javascript
function createMultiplier(multiplier) {
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

double(5);  // 10
triple(5);  // 15
```

각 함수는 생성 시점의 `multiplier` 값을 기억합니다. 설정이 다른 함수를 쉽게 찍어낼 수 있습니다.

### 3. 부분 적용 (Partial Application)

함수의 일부 인자를 미리 고정하고, 나머지 인자만 받는 새 함수를 만듭니다.

```javascript
function log(level, message) {
  console.log(`[${level}] ${message}`);
}

function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

const logError = partial(log, 'ERROR');
const logInfo = partial(log, 'INFO');

logError('서버 연결 실패');  // [ERROR] 서버 연결 실패
logInfo('서버 시작');        // [INFO] 서버 시작
```

### 4. 디바운스 / 스로틀

사용자 입력이나 스크롤 이벤트처럼 빈번하게 발생하는 이벤트를 제어할 때 클로저가 필수적입니다.

```javascript
function debounce(fn, delay) {
  let timeoutId;  // 클로저로 유지
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const handleSearch = debounce((query) => {
  console.log('검색:', query);
}, 300);
```

`timeoutId`는 클로저 안에 저장되어, 반환된 함수가 호출될 때마다 이전 타이머를 취소하고 새 타이머를 설정할 수 있습니다.

### 5. 이벤트 핸들러에서 상태 유지

```javascript
function createToggle(element) {
  let isOn = false;  // 클로저로 상태 유지
  
  element.addEventListener('click', () => {
    isOn = !isOn;
    element.textContent = isOn ? 'ON' : 'OFF';
  });
}
```

전역 변수 없이 각 버튼이 **독립적인 상태**를 가질 수 있습니다.

### 6. 모듈 패턴

ES6 모듈 이전에 클로저로 모듈을 구현했습니다. 여전히 즉시 실행 함수(IIFE)와 함께 사용되는 패턴입니다.

```javascript
const Calculator = (function() {
  // private
  let result = 0;
  
  // public
  return {
    add(num) { result += num; return this; },
    subtract(num) { result -= num; return this; },
    getResult() { return result; }
  };
})();

Calculator.add(10).subtract(3).getResult();  // 7
```

---

## React에서의 클로저

### useState와 클로저

React의 `useState`는 클로저를 활용합니다. 하지만 이로 인해 **stale closure(오래된 클로저)** 문제가 발생할 수 있습니다.

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    // 이 함수는 생성 시점의 count를 기억
    setTimeout(() => {
      console.log(count);  // 오래된 값일 수 있음
    }, 3000);
  };
  
  return <button onClick={handleClick}>{count}</button>;
}
```

버튼을 클릭하고 3초 안에 여러 번 count를 증가시키면, setTimeout 콜백은 **클릭 시점의 count**를 출력합니다. 최신 값이 아닙니다.

### 해결: 함수형 업데이트 또는 useRef

```javascript
// 함수형 업데이트: 최신 상태 기반으로 업데이트
setCount(prevCount => prevCount + 1);

// useRef: 항상 최신 값 참조
const countRef = useRef(count);
countRef.current = count;
```

### useEffect 의존성 배열

```javascript
useEffect(() => {
  const id = setInterval(() => {
    console.log(count);  // 클로저가 초기 count를 기억
  }, 1000);
  
  return () => clearInterval(id);
}, []);  // 빈 배열: count 변화 감지 못함
```

의존성 배열에 `count`를 추가하거나, 함수형 업데이트를 사용해야 합니다.

---

## 클로저와 메모리

### 메모리 유지

클로저가 참조하는 변수는 가비지 컬렉션 대상이 아닙니다. 클로저가 살아있는 한 해당 변수도 메모리에 유지됩니다.

### 메모리 누수 주의

불필요한 클로저가 오래 유지되면 메모리 누수가 발생할 수 있습니다.

```javascript
function setup() {
  const hugeData = new Array(1000000).fill('data');
  
  return function() {
    console.log(hugeData.length);  // hugeData 계속 메모리에 유지
  };
}

const fn = setup();
// fn이 살아있는 한 hugeData도 메모리에 존재
```

**해결**: 필요 없어진 클로저 참조를 `null`로 설정하거나, 클로저 내에서 꼭 필요한 데이터만 참조합니다.

---

## 흔한 실수: 반복문에서의 클로저

### 문제 상황

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 1000);
}
// 출력: 3, 3, 3 (0, 1, 2가 아님!)
```

`var`는 함수 스코프라서 반복문 전체에서 하나의 `i`를 공유합니다. setTimeout 콜백이 실행될 때는 반복문이 이미 끝났고, `i`는 3입니다. 모든 콜백이 **같은 `i`**를 참조하므로 3이 세 번 출력됩니다.

### 해결 1: let 사용

```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 1000);
}
// 출력: 0, 1, 2
```

`let`은 블록 스코프입니다. 각 반복마다 **새로운 `i`**가 생성되고, 각 콜백은 해당 반복의 `i`를 클로저로 캡처합니다.

### 해결 2: 즉시 실행 함수 (IIFE)

ES6 이전에 사용하던 방법입니다.

```javascript
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => {
      console.log(j);
    }, 1000);
  })(i);
}
```

IIFE를 통해 각 반복에서 `i` 값을 `j`에 복사하고, 콜백은 각자의 `j`를 클로저로 캡처합니다.

---

## 면접 예상 질문

**Q. 클로저란 무엇인가요?**

클로저는 함수가 선언될 때의 렉시컬 환경을 기억하여, 외부 함수가 종료된 후에도 외부 함수의 변수에 접근할 수 있는 현상입니다. 내부 함수가 외부 함수의 변수를 참조하고, 내부 함수가 외부로 반환되거나 콜백으로 사용될 때 클로저가 형성됩니다.

**Q. 클로저가 왜 필요한가요? (활용 사례)**

데이터 은닉과 캡슐화에 사용됩니다. private 변수를 만들어 외부에서 직접 접근을 막고 메서드를 통해서만 조작하게 할 수 있습니다. 또한 함수 팩토리, 디바운스/스로틀, 이벤트 핸들러에서 상태 유지, 부분 적용 등에 활용됩니다.

**Q. for문에서 var와 let의 클로저 차이는?**

var는 함수 스코프라서 반복문 전체에서 하나의 변수를 공유합니다. 반복문 안의 비동기 콜백은 모두 같은 변수를 참조해서 반복문이 끝난 후의 값만 보게 됩니다. let은 블록 스코프라서 각 반복마다 새로운 변수가 생성되고, 각 콜백은 해당 반복의 변수를 개별적으로 클로저로 캡처합니다.

**Q. React에서 클로저로 인한 문제는?**

useState의 상태 값이 콜백 함수에 의해 클로저로 캡처되면, 콜백 실행 시점에 최신 상태가 아닌 캡처 시점의 오래된 상태를 참조하는 stale closure 문제가 발생합니다. 이를 해결하려면 함수형 업데이트를 사용하거나, useRef로 항상 최신 값을 참조하거나, useEffect 의존성 배열에 해당 상태를 포함해야 합니다.

**Q. 클로저의 메모리 관점 주의사항은?**

클로저가 참조하는 변수는 클로저가 살아있는 한 가비지 컬렉션되지 않습니다. 불필요하게 큰 데이터를 참조하는 클로저가 오래 유지되면 메모리 누수가 발생할 수 있습니다. 필요 없어진 클로저 참조를 null로 설정하거나, 클로저 내에서 필요한 최소한의 데이터만 참조하도록 해야 합니다.