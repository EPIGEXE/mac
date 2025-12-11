# 프로토타입 체인과 상속

## 프로토타입이란?

JavaScript는 **프로토타입 기반 언어**입니다. 모든 객체는 자신의 **프로토타입(원형) 객체**에 대한 참조를 가지고 있고, 프로토타입의 속성과 메서드를 마치 자신의 것처럼 사용할 수 있습니다.

Java나 C++ 같은 클래스 기반 언어와 달리, JavaScript는 **객체가 다른 객체를 직접 상속**합니다.

```javascript
const arr = [1, 2, 3];
arr.push(4);  // push는 arr에 없지만 사용 가능
```

`arr`에는 `push`가 없지만, 프로토타입인 `Array.prototype`에 있어서 사용할 수 있습니다.

---

## [[Prototype]], __proto__, prototype

혼란스러운 세 가지 개념을 정리합니다.

### [[Prototype]] (내부 슬롯)

모든 객체가 가지는 **내부 숨김 속성**입니다. 자신의 프로토타입 객체를 참조합니다. 직접 접근할 수 없고, `Object.getPrototypeOf()`로 읽습니다.

### __proto__ (접근자 프로퍼티)

`[[Prototype]]`에 접근하기 위한 **접근자 프로퍼티**입니다. 대부분의 브라우저에서 지원하지만, `Object.getPrototypeOf()` 사용을 권장합니다.

```javascript
const obj = {};
obj.__proto__ === Object.prototype;  // true
Object.getPrototypeOf(obj) === Object.prototype;  // true (권장)
```

### prototype (함수의 속성)

**함수만 가지는 속성**입니다. 이 함수를 생성자로 사용해 `new`로 객체를 만들 때, 생성된 객체의 `[[Prototype]]`이 이 `prototype`을 참조합니다.

```javascript
function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const john = new Person('John');
john.sayHi();  // 'Hi, I'm John'
```

### 관계 정리

```
생성자 함수 (Person)
    │
    ├── prototype ──────────────▶ Person.prototype 객체
    │                                    │
    │                                    ├── constructor ──▶ Person
    │                                    ├── sayHi()
new Person()                             │
    │                                    │
    ▼                                    │
인스턴스 (john)                          │
    │                                    │
    └── [[Prototype]] ──────────────────┘
```

---

## 프로토타입 체인

객체에서 속성이나 메서드를 찾을 때, JavaScript는 다음 순서로 탐색합니다.

1. 객체 자신에게서 찾기
2. 없으면 `[[Prototype]]`이 가리키는 객체에서 찾기
3. 없으면 그 객체의 `[[Prototype]]`에서 찾기
4. `null`에 도달할 때까지 반복

이 연결된 구조를 **프로토타입 체인**이라고 합니다.

```javascript
const arr = [1, 2, 3];

arr.length;      // arr 자신의 속성
arr.push(4);     // Array.prototype에서 찾음
arr.toString();  // Object.prototype에서 찾음
arr.foo;         // 체인 끝까지 없으면 undefined
```

### 체인 구조

```
arr (배열 인스턴스)
  └──▶ Array.prototype (push, pop, map...)
         └──▶ Object.prototype (toString, hasOwnProperty...)
                └──▶ null (체인의 끝)
```

모든 객체의 프로토타입 체인은 `Object.prototype`에서 끝납니다.

---

## 속성 탐색과 가려짐 (Shadowing)

### 속성 읽기 vs 쓰기

- **읽기**: 프로토타입 체인을 따라 올라가며 찾음
- **쓰기**: 항상 객체 자신에게 속성을 추가

```javascript
const parent = { x: 10 };
const child = Object.create(parent);

console.log(child.x);  // 10 (parent에서 찾음)

child.x = 20;          // child 자신에게 x 추가
console.log(child.x);  // 20 (child 자신의 x)
console.log(parent.x); // 10 (변경 안 됨)
```

`child.x = 20`은 `child` 자신에게 `x`를 만들어서 `parent.x`를 **가립니다(shadow)**.

### hasOwnProperty

객체 **자신의 속성**인지 확인합니다 (프로토타입 체인 제외).

```javascript
child.hasOwnProperty('x');  // true (child 자신의 속성)

delete child.x;
console.log(child.x);  // 10 (다시 parent.x가 보임)
```

---

## ES5 방식의 상속 구현

```javascript
// 부모 생성자
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

// 자식 생성자
function Dog(name, breed) {
  Animal.call(this, name);  // 부모 생성자 호출 (super 역할)
  this.breed = breed;
}

// 프로토타입 체인 연결
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;  // constructor 복구

// 자식 메서드 추가
Dog.prototype.bark = function() {
  console.log('Woof!');
};

const dog = new Dog('Max', 'Labrador');
dog.speak();  // 'Max makes a sound' (상속)
dog.bark();   // 'Woof!'
```

**핵심 단계:**
1. `Animal.call(this, name)` - 부모 생성자로 부모 속성 초기화
2. `Object.create(Animal.prototype)` - 프로토타입 체인 연결
3. `constructor` 복구 - Object.create로 덮어쓰면 사라짐

### 왜 Object.create를 사용하는가?

```javascript
// ❌ Dog.prototype = new Animal();
// 문제: Animal 생성자가 실행되어 불필요한 속성이 생김

// ✅ Dog.prototype = Object.create(Animal.prototype);
// Animal.prototype만 상속, 생성자 실행 안 함
```

---

## ES6 class와 프로토타입

ES6의 class는 **프로토타입의 문법적 설탕(Syntactic Sugar)**입니다. 내부적으로는 동일하게 프로토타입 기반으로 동작합니다.

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // 부모 생성자 호출 (필수)
    this.breed = breed;
  }
  bark() {
    console.log('Woof!');
  }
}
```

### class는 함수다

```javascript
typeof Animal;  // 'function'
Animal.prototype.speak;  // 메서드가 여기 있음
```

### ES5 vs ES6 비교

| 구분 | ES5 | ES6 |
|------|-----|-----|
| 문법 | 생성자 함수 + prototype | class 키워드 |
| 부모 호출 | `Parent.call(this)` | `super()` |
| 체인 연결 | `Object.create()` | `extends` |
| 내부 동작 | 프로토타입 | 프로토타입 (동일) |

class 문법이 직관적이지만, 프로토타입을 이해해야 JavaScript 상속을 제대로 이해할 수 있습니다.

---

## Object.create()

주어진 객체를 프로토타입으로 하는 새 객체를 생성합니다.

```javascript
const personProto = {
  greet() { console.log(`Hello, I'm ${this.name}`); }
};

const john = Object.create(personProto);
john.name = 'John';
john.greet();  // "Hello, I'm John"
```

생성자 함수 없이도 객체 간 상속이 가능합니다.

```javascript
// 프로토타입이 없는 순수 객체
const dict = Object.create(null);
dict.toString;  // undefined (Object.prototype도 없음)
```

---

## 프로토타입 관련 메서드

| 메서드 | 설명 |
|--------|------|
| `Object.getPrototypeOf(obj)` | obj의 프로토타입 반환 |
| `Object.setPrototypeOf(obj, proto)` | 프로토타입 변경 (성능상 비권장) |
| `obj.isPrototypeOf(target)` | obj가 target의 프로토타입 체인에 있는지 |
| `obj instanceof Constructor` | 체인에 Constructor.prototype이 있는지 |

```javascript
dog instanceof Dog;     // true
dog instanceof Animal;  // true (체인에 있음)
dog instanceof Object;  // true
```

---

## 주의사항

### 내장 프로토타입 수정 금지

```javascript
// ❌ 비권장
Array.prototype.first = function() { return this[0]; };
```

라이브러리 충돌, 미래 표준과 충돌 가능성이 있습니다. 폴리필 구현 시에만 사용합니다.

### hasOwnProperty 안전하게 사용

```javascript
// 프로토타입 오염 방어
if (Object.prototype.hasOwnProperty.call(obj, key)) {
  // obj 자신의 속성만 처리
}
```

---

## 면접 예상 질문

**Q. 프로토타입 체인이란?**

객체에서 속성을 찾을 때, 자신에게 없으면 [[Prototype]]이 가리키는 객체에서 찾고, 거기도 없으면 그 객체의 [[Prototype]]에서 찾는 과정을 반복합니다. 이 연결 구조를 프로토타입 체인이라고 하며, 체인의 끝은 Object.prototype → null입니다.

**Q. __proto__와 prototype의 차이는?**

`__proto__`는 모든 객체가 가지며, 객체의 프로토타입을 참조합니다. `prototype`은 함수만 가지며, new로 생성된 객체의 [[Prototype]]이 됩니다.

**Q. ES6 class는 프로토타입과 어떤 관계인가요?**

class는 프로토타입의 문법적 설탕입니다. class로 정의해도 내부적으로는 생성자 함수와 프로토타입으로 동작합니다. typeof로 확인하면 'function'이고, 메서드는 prototype에 저장됩니다.

**Q. Object.create()의 역할은?**

주어진 객체를 프로토타입으로 하는 새 객체를 생성합니다. ES5 상속에서 프로토타입 체인을 연결할 때 사용하고, `Object.create(null)`로 프로토타입 없는 순수 객체도 만들 수 있습니다.

**Q. instanceof는 어떻게 동작하나요?**

객체의 프로토타입 체인을 따라 올라가면서 생성자의 prototype이 있는지 확인합니다. `dog instanceof Animal`은 dog의 체인 어딘가에 Animal.prototype이 있으면 true입니다.