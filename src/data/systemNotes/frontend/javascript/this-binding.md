# JavaScript this 바인딩

## this란?

**함수가 호출될 때 결정되는 실행 컨텍스트의 참조**입니다.

대부분의 객체지향 언어에서 this는 항상 자기 자신(인스턴스)을 가리킵니다. 하지만 JavaScript의 this는 **함수가 어떻게 호출되었는지**에 따라 동적으로 결정됩니다. 이것이 JavaScript this가 어려운 이유입니다.

```javascript
const obj = {
  name: 'John',
  sayHi() { console.log(this.name); }
};

obj.sayHi();           // 'John' - obj가 this
const fn = obj.sayHi;
fn();                  // undefined - 전역이 this
```

같은 함수인데 **호출 방식**에 따라 this가 달라집니다.

---

## this 바인딩 4가지 규칙

JavaScript의 this는 다음 4가지 규칙으로 결정됩니다. 우선순위 순서대로 설명합니다.

### 1. new 바인딩 (가장 높음)

`new` 키워드로 함수를 호출하면 this는 **새로 생성된 객체**를 가리킵니다.

```javascript
function Person(name) {
  this.name = name;  // this = 새로 생성된 객체
}

const john = new Person('John');
console.log(john.name);  // 'John'
```

new가 하는 일:
1. 빈 객체 생성
2. 이 객체를 this에 바인딩
3. 함수 실행 (this에 속성 추가)
4. 이 객체를 반환 (명시적 return이 없으면)

### 2. 명시적 바인딩

`call`, `apply`, `bind`로 this를 **직접 지정**합니다.

```javascript
function greet() {
  console.log(`Hello, ${this.name}`);
}

const user = { name: 'John' };

greet.call(user);   // 'Hello, John'
greet.apply(user);  // 'Hello, John'

const boundGreet = greet.bind(user);
boundGreet();       // 'Hello, John'
```

| 메서드 | 실행 | 인자 전달 |
|--------|------|-----------|
| call | 즉시 실행 | 개별 인자 `fn.call(this, a, b)` |
| apply | 즉시 실행 | 배열 `fn.apply(this, [a, b])` |
| bind | 새 함수 반환 | 개별 인자 (실행 안 함) |

### 3. 암시적 바인딩

객체의 메서드로 호출하면 this는 **그 객체**를 가리킵니다. 점(.) 앞의 객체가 this입니다.

```javascript
const obj = {
  name: 'John',
  sayHi() { console.log(this.name); }
};

obj.sayHi();  // 'John' - obj가 this
```

**중첩 객체**에서는 직접 호출한 객체가 this입니다.

```javascript
const outer = {
  inner: {
    name: 'Inner',
    sayHi() { console.log(this.name); }
  }
};

outer.inner.sayHi();  // 'Inner' (outer가 아닌 inner가 this)
```

### 4. 기본 바인딩 (가장 낮음)

위 규칙에 해당하지 않으면 **기본 바인딩**이 적용됩니다.

- **일반 모드**: 전역 객체 (브라우저: window, Node.js: global)
- **strict mode**: undefined

```javascript
function sayHi() {
  console.log(this);
}

sayHi();  // window (strict mode에서는 undefined)
```

---

## 바인딩 우선순위

```
new 바인딩 > 명시적 바인딩 > 암시적 바인딩 > 기본 바인딩
```

```javascript
function foo() {
  console.log(this.name);
}

const obj = { name: 'obj', foo };
const bound = foo.bind({ name: 'bound' });

obj.foo();           // 'obj' (암시적)
bound();             // 'bound' (명시적 - bind)
new bound();         // undefined (new가 bind보다 우선)
```

**new가 bind보다 우선**합니다. 이 특성 덕분에 bind된 함수도 생성자로 사용할 수 있습니다.

---

## 암시적 바인딩 소실

가장 흔한 this 관련 버그입니다. 메서드를 **변수에 할당하거나 콜백으로 전달**하면 암시적 바인딩이 소실됩니다.

### 변수 할당 시 소실

```javascript
const obj = {
  name: 'John',
  sayHi() { console.log(this.name); }
};

const fn = obj.sayHi;  // 메서드를 변수에 할당
fn();  // undefined (this = 전역)
```

`obj.sayHi`를 변수에 할당하면 **함수 참조만 복사**됩니다. obj와의 연결이 끊어지므로 fn()은 일반 함수 호출이 되어 기본 바인딩이 적용됩니다.

### 콜백으로 전달 시 소실

```javascript
const obj = {
  name: 'John',
  sayHi() { console.log(this.name); }
};

setTimeout(obj.sayHi, 1000);  // undefined
```

setTimeout에 함수를 전달하면 내부에서 일반 함수로 호출합니다. 마찬가지로 암시적 바인딩이 소실됩니다.

### 해결 방법

```javascript
// 1. bind 사용
setTimeout(obj.sayHi.bind(obj), 1000);

// 2. 화살표 함수로 감싸기
setTimeout(() => obj.sayHi(), 1000);

// 3. 메서드를 화살표 함수로 정의 (클래스에서)
class MyClass {
  name = 'John';
  sayHi = () => console.log(this.name);  // 항상 인스턴스가 this
}
```

---

## 화살표 함수의 this

화살표 함수는 **자신만의 this를 가지지 않습니다**. 대신 **선언 시점의 상위 스코프 this**를 그대로 사용합니다. 이를 **렉시컬 this**라고 합니다.

```javascript
const obj = {
  name: 'John',
  
  // 일반 함수: 호출 시점에 this 결정
  regular() {
    console.log(this.name);  // 'John'
  },
  
  // 화살표 함수: 선언 시점의 상위 스코프 this
  arrow: () => {
    console.log(this.name);  // undefined (상위 = 전역)
  }
};
```

### 화살표 함수의 this는 바꿀 수 없다

```javascript
const arrow = () => console.log(this);

arrow.call({ name: 'John' });  // window (call 무시됨)
arrow.bind({ name: 'John' })();  // window (bind 무시됨)
new arrow();  // TypeError (생성자로 사용 불가)
```

call, apply, bind로도 화살표 함수의 this를 바꿀 수 없습니다.

### 콜백에서 유용한 이유

```javascript
const obj = {
  name: 'John',
  friends: ['Jane', 'Mike'],
  
  showFriends() {
    // 화살표 함수: showFriends의 this(obj)를 그대로 사용
    this.friends.forEach((friend) => {
      console.log(`${this.name} knows ${friend}`);
    });
  }
};

obj.showFriends();  // 'John knows Jane', 'John knows Mike'
```

일반 함수였다면 forEach 콜백 안에서 this가 전역이 됩니다. 화살표 함수는 상위 스코프(showFriends)의 this를 유지합니다.

---

## 상황별 this 정리

### 전역 컨텍스트

```javascript
console.log(this);  // window (브라우저) / global (Node.js)
```

최상위에서 this는 전역 객체입니다.

### 일반 함수 호출

```javascript
function fn() {
  console.log(this);
}
fn();  // window (strict mode: undefined)
```

### 메서드 호출

```javascript
obj.method();  // this = obj (점 앞의 객체)
```

### 생성자 호출

```javascript
new Constructor();  // this = 새로 생성된 객체
```

### 이벤트 핸들러

```javascript
button.addEventListener('click', function() {
  console.log(this);  // button 요소
});

button.addEventListener('click', () => {
  console.log(this);  // 상위 스코프의 this (주의!)
});
```

DOM 이벤트 핸들러에서 일반 함수의 this는 **이벤트가 발생한 요소**입니다. 하지만 화살표 함수는 상위 스코프의 this를 사용하므로 요소가 아닐 수 있습니다.

### setTimeout / setInterval

```javascript
setTimeout(function() {
  console.log(this);  // window
}, 1000);
```

타이머 콜백에서 this는 전역 객체입니다 (strict mode에서는 undefined).

---

## call, apply, bind 상세

### call과 apply

함수를 **즉시 실행**하면서 this를 지정합니다. 차이는 인자 전달 방식뿐입니다.

```javascript
function introduce(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const user = { name: 'John' };

introduce.call(user, 'Hello', '!');   // 개별 인자
introduce.apply(user, ['Hello', '!']); // 배열로 인자
```

**apply 활용**: 배열을 펼쳐서 전달할 때 유용합니다 (ES6 이전).

```javascript
const nums = [1, 2, 3, 4, 5];
Math.max.apply(null, nums);  // 5

// ES6 이후: 스프레드 연산자
Math.max(...nums);  // 5
```

### bind

함수를 **즉시 실행하지 않고** this가 고정된 새 함수를 반환합니다.

```javascript
const user = { name: 'John' };

function greet() {
  console.log(`Hello, ${this.name}`);
}

const boundGreet = greet.bind(user);
boundGreet();  // 'Hello, John'

// 나중에 어떻게 호출해도 this는 user
setTimeout(boundGreet, 1000);  // 'Hello, John'
```

**부분 적용**: bind로 인자도 미리 고정할 수 있습니다.

```javascript
function multiply(a, b) {
  return a * b;
}

const double = multiply.bind(null, 2);  // 첫 번째 인자 고정
double(5);  // 10
```

---

## strict mode에서의 this

strict mode에서는 기본 바인딩 시 this가 전역 객체가 아닌 **undefined**가 됩니다.

```javascript
'use strict';

function fn() {
  console.log(this);
}

fn();  // undefined (일반 모드에서는 window)
```

ES6 모듈은 기본적으로 strict mode입니다. 실수로 전역 객체를 수정하는 버그를 방지합니다.

---

## 클래스에서의 this

### 메서드 바인딩 문제

클래스 메서드를 콜백으로 전달하면 this 바인딩이 소실됩니다.

```javascript
class Button {
  constructor(label) {
    this.label = label;
  }
  
  handleClick() {
    console.log(`Clicked: ${this.label}`);
  }
}

const btn = new Button('Submit');
document.querySelector('button')
  .addEventListener('click', btn.handleClick);  // this = button 요소
```

### 해결 방법들

```javascript
class Button {
  constructor(label) {
    this.label = label;
    
    // 방법 1: 생성자에서 bind
    this.handleClick = this.handleClick.bind(this);
  }
  
  // 방법 2: 클래스 필드 + 화살표 함수 (권장)
  handleClick = () => {
    console.log(`Clicked: ${this.label}`);
  };
}
```

**클래스 필드 화살표 함수**가 가장 깔끔합니다. 각 인스턴스마다 함수가 새로 생성되는 단점이 있지만, 대부분의 경우 문제되지 않습니다.

---

## React에서의 this

### 클래스 컴포넌트

```javascript
class Counter extends React.Component {
  state = { count: 0 };
  
  // ❌ 일반 메서드: this 바인딩 소실
  handleClick() {
    this.setState({ count: this.state.count + 1 });
  }
  
  // ✅ 클래스 필드 화살표 함수
  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };
  
  render() {
    return <button onClick={this.handleClick}>{this.state.count}</button>;
  }
}
```

JSX에서 이벤트 핸들러로 메서드를 전달하면 콜백으로 전달되므로 this 바인딩이 소실됩니다. 클래스 필드 화살표 함수로 해결합니다.

### 함수 컴포넌트

함수 컴포넌트에서는 this를 사용하지 않습니다. useState, useRef 등 Hook으로 상태를 관리하므로 this 바인딩 문제가 없습니다. 이것이 함수 컴포넌트를 권장하는 이유 중 하나입니다.

---

## this 결정 흐름

```
1. 화살표 함수인가? → 상위 스코프의 this

2. new로 호출했는가? → 새로 생성된 객체

3. call/apply/bind로 호출했는가? → 명시적으로 지정한 객체

4. 객체의 메서드로 호출했는가? → 그 객체 (점 앞의 객체)

5. 위 모두 아니면 → 전역 객체 (strict mode: undefined)
```

---

## 면접 예상 질문

**Q. JavaScript의 this는 어떻게 결정되나요?**

JavaScript의 this는 함수가 정의된 위치가 아닌 호출 방식에 따라 동적으로 결정됩니다. 크게 4가지 규칙이 있습니다. new 바인딩은 새 객체, 명시적 바인딩(call/apply/bind)은 지정한 객체, 암시적 바인딩은 메서드를 호출한 객체, 그 외에는 전역 객체(strict mode에서는 undefined)가 this가 됩니다.

**Q. 화살표 함수의 this는 어떻게 다른가요?**

화살표 함수는 자신만의 this를 가지지 않고 선언 시점의 상위 스코프 this를 그대로 사용합니다. 호출 방식에 영향받지 않으며, call, apply, bind로도 this를 바꿀 수 없습니다. 콜백 함수에서 외부 this를 유지하고 싶을 때 유용합니다.

**Q. call, apply, bind의 차이는?**

셋 다 this를 명시적으로 지정합니다. call과 apply는 함수를 즉시 실행하고, bind는 this가 고정된 새 함수를 반환합니다. call은 인자를 개별적으로, apply는 배열로 전달합니다.

**Q. 암시적 바인딩 소실이란?**

메서드를 변수에 할당하거나 콜백으로 전달하면 객체와의 연결이 끊어져서 일반 함수 호출이 됩니다. 이때 this가 전역 객체(또는 undefined)가 되는 현상입니다. bind를 사용하거나 화살표 함수로 감싸서 해결합니다.

**Q. React 클래스 컴포넌트에서 이벤트 핸들러의 this 문제와 해결법은?**

JSX에서 이벤트 핸들러로 메서드를 전달하면 콜백으로 전달되어 this 바인딩이 소실됩니다. 해결 방법으로는 생성자에서 bind하거나, 클래스 필드 화살표 함수로 메서드를 정의하는 방법이 있습니다. 클래스 필드 화살표 함수가 더 깔끔해서 권장됩니다.