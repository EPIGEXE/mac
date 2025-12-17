# TypeScript

## TypeScript란?

**JavaScript에 정적 타입을 추가한 프로그래밍 언어**입니다. Microsoft가 개발했으며, JavaScript의 상위 집합(Superset)입니다.

```
TypeScript = JavaScript + 정적 타입 시스템
```

```typescript
// JavaScript
function add(a, b) {
  return a + b;
}
add(1, "2");  // "12" - 런타임에 문자열 연결 (버그)

// TypeScript
function add(a: number, b: number): number {
  return a + b;
}
add(1, "2");  // 컴파일 에러! - 개발 단계에서 발견
```

**핵심 특징:**
- JavaScript로 컴파일됨 (브라우저/Node.js는 JS만 실행)
- 점진적 도입 가능 (기존 JS와 호환)
- 컴파일 타임에 타입 검사
- 런타임에는 타입 정보 제거됨

---

## 정적 타입 vs 동적 타입

| 구분 | 정적 타입 | 동적 타입 |
|------|----------|----------|
| 타입 검사 시점 | 컴파일 타임 | 런타임 |
| 타입 선언 | 명시적 (또는 추론) | 불필요 |
| 오류 발견 | 실행 전 | 실행 중 |
| 예시 | TypeScript, Java, C++ | JavaScript, Python |

```typescript
// 정적 타입 (TypeScript)
let name: string = "John";
name = 123;  // 컴파일 에러!

// 동적 타입 (JavaScript)
let name = "John";
name = 123;  // OK - 런타임에 타입 변경
```

---

## TypeScript를 사용하는 이유

### 1. 버그 조기 발견

런타임 에러를 컴파일 타임에 미리 잡습니다.

```typescript
// 흔한 JavaScript 버그들
function getUser(id) {
  // API 호출...
  return { name: "John", age: 30 };
}

const user = getUser(1);
console.log(user.naem);  // undefined (오타)
console.log(user.email); // undefined (존재하지 않는 속성)

// TypeScript로 방지
interface User {
  name: string;
  age: number;
}

function getUser(id: number): User {
  return { name: "John", age: 30 };
}

const user = getUser(1);
console.log(user.naem);  // 컴파일 에러: 'naem' 없음
console.log(user.email); // 컴파일 에러: 'email' 없음
```

### 2. 개발 생산성 향상

IDE의 자동완성, 리팩토링, 타입 힌트 지원이 강화됩니다.

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const product: Product = { id: 1, name: "Phone", price: 999, category: "Electronics" };

product.  // IDE가 id, name, price, category 자동완성 제안
```

### 3. 코드 문서화

타입 자체가 문서 역할을 합니다.

```typescript
// 타입 없이 - 함수 사용법을 알기 어려움
function createUser(name, age, email, isAdmin) { ... }

// 타입 있으면 - 인터페이스가 명세서 역할
interface CreateUserParams {
  name: string;
  age: number;
  email: string;
  isAdmin?: boolean;  // 선택적
}

function createUser(params: CreateUserParams): User { ... }
```

### 4. 리팩토링 안전성

타입 시스템이 변경 영향을 추적합니다.

```typescript
// User 인터페이스의 name을 fullName으로 변경하면?
// → 모든 사용처에서 컴파일 에러 발생
// → 누락 없이 수정 가능
```

### 5. 팀 협업

코드 의도가 명확해져 협업이 쉬워집니다.

---

## 기본 타입

```typescript
// 원시 타입
let isDone: boolean = false;
let count: number = 42;
let name: string = "John";

// 배열
let list: number[] = [1, 2, 3];
let list: Array<number> = [1, 2, 3];

// 튜플 (고정 길이, 각 위치의 타입 지정)
let tuple: [string, number] = ["hello", 10];

// 열거형
enum Color { Red, Green, Blue }

// any (타입 검사 비활성화 - 사용 자제)
// unknown (any보다 안전, 타입 검사 필요)
// void (반환값 없음)
// never (절대 반환하지 않음)
// null, undefined
```

---

## 인터페이스와 타입 별칭

**인터페이스 (Interface):**

```typescript
interface User {
  id: number;
  name: string;
  email?: string;           // 선택적 속성
  readonly createdAt: Date; // 읽기 전용
}

// 확장
interface Admin extends User {
  role: string;
  permissions: string[];
}

// 함수 타입
interface SearchFunc {
  (query: string, limit: number): User[];
}
```

**타입 별칭 (Type Alias):**

```typescript
type ID = number | string;

type User = {
  id: ID;
  name: string;
};

// 유니온 타입
type Status = "pending" | "approved" | "rejected";

// 인터섹션 타입
type Admin = User & { role: string };
```

**Interface vs Type:**

| 구분 | Interface | Type |
|------|-----------|------|
| 확장 | extends | & (인터섹션) |
| 선언 병합 | 가능 | 불가능 |
| 유니온 | 불가능 | 가능 |
| 권장 사용 | 객체 구조 정의 | 유니온, 복잡한 타입 |

---

## 제네릭 (Generics)

**타입을 매개변수로 받아 재사용 가능한 컴포넌트**를 만듭니다.

```typescript
// 제네릭 없이 - 타입별로 함수 작성
function identityNumber(arg: number): number { return arg; }
function identityString(arg: string): string { return arg; }

// 제네릭 사용 - 하나로 통합
function identity<T>(arg: T): T {
  return arg;
}

identity<number>(42);   // T = number
identity<string>("hi"); // T = string
identity(42);           // 타입 추론으로 T = number
```

**제네릭 제약:**

```typescript
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
  console.log(arg.length);  // length 속성 보장됨
}

logLength("hello");     // OK
logLength([1, 2, 3]);   // OK
logLength(123);         // 에러: number에는 length 없음
```

**제네릭 활용:**

```typescript
// 제네릭 인터페이스
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const userResponse: ApiResponse<User> = { ... };
const productResponse: ApiResponse<Product> = { ... };

// 제네릭 클래스
class Queue<T> {
  private items: T[] = [];
  enqueue(item: T): void { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
}
```

---

## 타입 가드와 타입 좁히기

**런타임에 타입을 확인하여 타입 범위를 좁힙니다.**

```typescript
// typeof
function process(value: string | number) {
  if (typeof value === "string") {
    console.log(value.toUpperCase());  // string으로 좁혀짐
  } else {
    console.log(value.toFixed(2));     // number로 좁혀짐
  }
}

// instanceof - 클래스 인스턴스 확인
// in 연산자 - 속성 존재 확인
// 사용자 정의 타입 가드 - animal is Fish 형태
```

---

## 유틸리티 타입

TypeScript가 제공하는 내장 타입 변환 도구입니다.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Partial<T> - 모든 속성을 선택적으로
type PartialUser = Partial<User>;

// Required<T> - 모든 속성을 필수로
// Pick<T, K> - 특정 속성만 선택
type UserBasic = Pick<User, "id" | "name">;

// Omit<T, K> - 특정 속성 제외
type UserWithoutEmail = Omit<User, "email">;

// Readonly<T> - 모든 속성을 읽기 전용으로
// Record<K, T> - 키-값 타입 정의
type UserRoles = Record<string, string[]>;

// ReturnType<T> - 함수 반환 타입 추출
```

---

## 컴파일 과정

```
TypeScript (.ts) → 타입 검사 → 타입 제거 → JavaScript (.js) → 실행
```

**tsconfig.json 주요 옵션:**

```json
{
  "compilerOptions": {
    "target": "ES2020",        // 출력 JS 버전
    "module": "ESNext",        // 모듈 시스템
    "strict": true,            // 엄격한 타입 검사
    "outDir": "./dist"         // 출력 디렉토리
  }
}
```

**strict 모드:** `strictNullChecks`, `noImplicitAny` 등 엄격한 타입 검사 활성화

---

## 구조적 타이핑 (Structural Typing)

TypeScript는 **타입의 구조(형태)**로 호환성을 판단합니다.

```typescript
interface Point { x: number; y: number; }
interface Coordinate { x: number; y: number; }

let point: Point = { x: 10, y: 20 };
let coord: Coordinate = point;  // OK! 구조가 같으면 호환

// 덕 타이핑: "오리처럼 걷고 꽥꽥거리면, 그것은 오리다"
const obj = { x: 1, y: 2, z: 3 };
function printPoint(p: Point) { console.log(p.x, p.y); }
printPoint(obj);  // OK! x, y가 있으면 됨
```

---

## 면접 예상 질문

**Q. TypeScript란?**

JavaScript에 정적 타입을 추가한 언어입니다. 컴파일 타임에 타입 검사를 수행하여 버그를 조기에 발견하고, JavaScript로 컴파일되어 실행됩니다. JavaScript의 상위 집합이라 기존 코드와 호환됩니다.

**Q. TypeScript를 사용하는 이유?**

컴파일 타임 타입 검사로 런타임 에러를 미리 방지합니다. IDE 자동완성과 리팩토링 지원이 강화되고, 타입이 문서 역할을 하여 코드 가독성과 팀 협업이 개선됩니다.

**Q. interface와 type의 차이?**

interface는 객체 구조 정의에 적합하고 선언 병합이 가능합니다. type은 유니온, 인터섹션 등 복잡한 타입 표현에 적합합니다. 객체 타입은 interface, 유니온이나 별칭은 type을 권장합니다.

**Q. 제네릭이란?**

타입을 매개변수로 받아 재사용 가능한 컴포넌트를 만드는 기능입니다. 타입 안전성을 유지하면서 다양한 타입에 대응할 수 있습니다. `Array<T>`, `Promise<T>` 등이 제네릭 예시입니다.

**Q. any와 unknown의 차이?**

any는 타입 검사를 완전히 비활성화하여 어떤 연산이든 허용합니다. unknown은 타입이 불명확하지만 사용 전 타입 검사(타입 가드)가 필요합니다. unknown이 더 안전하여 권장됩니다.

**Q. 구조적 타이핑이란?**

타입의 이름이 아닌 구조(속성과 메서드)로 호환성을 판단하는 방식입니다. 두 타입이 같은 구조를 가지면 이름이 달라도 호환됩니다. 덕 타이핑과 유사한 개념입니다.