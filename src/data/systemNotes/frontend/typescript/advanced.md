# TypeScript 심화

## TypeScript의 타입 시스템

TypeScript는 **구조적 타입 시스템(Structural Type System)**을 사용합니다. 타입의 이름이 아닌 **구조(shape)**가 같으면 호환됩니다. 이는 Java나 C#의 명목적 타입 시스템과 다릅니다.

```typescript
interface Point { x: number; y: number; }
interface Coordinate { x: number; y: number; }

const p: Point = { x: 1, y: 2 };
const c: Coordinate = p;  // ✅ 구조가 같으므로 호환
```

이 특성을 이해하면 제네릭, 유틸리티 타입, 타입 가드 등 고급 기능을 더 잘 활용할 수 있습니다.

---

## 제네릭 (Generics)

### 제네릭이란?

**타입을 매개변수로 받아 재사용 가능한 컴포넌트를 만드는 기능**입니다. 함수, 클래스, 인터페이스에서 사용할 타입을 호출 시점에 결정합니다.

제네릭이 없다면 모든 타입에 대해 함수를 따로 만들거나, `any`를 사용해야 합니다. `any`는 타입 안전성을 포기하는 것이고, 함수를 여러 개 만드는 것은 중복입니다. 제네릭은 **타입 안전성을 유지하면서 재사용성을 제공**합니다.

### 기본 문법

```typescript
// 제네릭 함수
function identity<T>(value: T): T {
  return value;
}

// 호출 시 타입 결정
identity<string>("hello");  // T = string
identity<number>(42);       // T = number
identity("hello");          // 타입 추론으로 T = string
```

`<T>`는 타입 매개변수입니다. 관례적으로 `T`(Type), `U`, `V` 또는 `K`(Key), `V`(Value), `E`(Element) 등을 사용합니다.

### 제네릭 제약 조건 (Constraints)

타입 매개변수에 **제약을 걸어 특정 속성이나 메서드를 사용**할 수 있게 합니다. `extends` 키워드를 사용합니다.

```typescript
// T는 length 속성을 가진 타입이어야 함
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);  // ✅ length 접근 가능
}

logLength("hello");     // ✅ string은 length 있음
logLength([1, 2, 3]);   // ✅ array는 length 있음
logLength(123);         // ❌ number는 length 없음
```

### 여러 타입 매개변수

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair<string, number>("age", 30);  // [string, number]
```

### 제네릭 인터페이스와 타입

```typescript
// 제네릭 인터페이스
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// 사용
const userResponse: ApiResponse<User> = { ... };
const productResponse: ApiResponse<Product[]> = { ... };
```

### 제네릭 활용 패턴

| 패턴 | 예시 |
|------|------|
| 컬렉션 | `Array<T>`, `Map<K, V>` |
| API 응답 래핑 | `ApiResponse<T>` |
| 상태 관리 | `useState<T>` |
| 유틸리티 타입 | `Partial<T>`, `Pick<T, K>` |

### keyof와 제네릭

`keyof`는 객체 타입의 **모든 키를 유니온 타입으로 추출**합니다. 제네릭과 함께 사용하면 강력합니다.

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Kim", age: 30 };
getProperty(user, "name");  // ✅ 반환 타입: string
getProperty(user, "age");   // ✅ 반환 타입: number
getProperty(user, "email"); // ❌ "email"은 keyof User에 없음
```

`K extends keyof T`는 K가 T의 키 중 하나여야 함을 의미합니다. `T[K]`는 해당 키의 값 타입입니다.

---

## Utility Types

TypeScript는 **타입 변환을 위한 내장 유틸리티 타입**을 제공합니다. 기존 타입을 기반으로 새로운 타입을 쉽게 만들 수 있습니다.

### Partial<T>

**모든 속성을 선택적(optional)으로** 만듭니다. 부분 업데이트에 유용합니다. `Partial<User>`는 `{ id?: number; name?: string; }`이 됩니다.

### Required<T>

**모든 속성을 필수로** 만듭니다. Partial의 반대입니다. optional 속성이 있는 Config 타입을 Required로 감싸면 모든 필드가 필수가 됩니다.

### Readonly<T>

**모든 속성을 읽기 전용으로** 만듭니다. 불변성을 강제하여 속성 재할당 시 컴파일 에러가 발생합니다.

### Pick<T, K>

**특정 속성만 선택**하여 새 타입을 만듭니다. `Pick<User, "id" | "name">`은 id와 name만 가진 타입이 됩니다.

### Omit<T, K>

**특정 속성을 제외**한 새 타입을 만듭니다. Pick의 반대입니다. 생성 DTO에서 서버가 생성하는 id를 제외할 때 유용합니다.

### Record<K, T>

**키 타입 K와 값 타입 T로 객체 타입**을 만듭니다.

```typescript
type UserRole = "admin" | "user" | "guest";
type RolePermissions = Record<UserRole, string[]>;
// { admin: string[]; user: string[]; guest: string[]; }
```

### Exclude<T, U>와 Extract<T, U>

**유니온 타입에서 특정 타입을 제외하거나 추출**합니다. `Exclude<"a" | "b" | "c", "a">`는 `"b" | "c"`, `Extract<"a" | "b" | "c", "a" | "b">`는 `"a" | "b"`가 됩니다.

### NonNullable<T>

**null과 undefined를 제외**합니다. `NonNullable<string | null | undefined>`는 `string`이 됩니다.

### ReturnType<T>과 Parameters<T>

**함수의 반환 타입과 매개변수 타입을 추출**합니다. 라이브러리 함수의 타입을 재사용하거나 래퍼 함수를 만들 때 유용합니다.

### 유틸리티 타입 요약

| 유틸리티 | 설명 | 사용 사례 |
|---------|------|----------|
| `Partial<T>` | 모든 속성 optional | 부분 업데이트 |
| `Required<T>` | 모든 속성 필수 | 설정 검증 |
| `Readonly<T>` | 모든 속성 읽기 전용 | 불변 객체 |
| `Pick<T, K>` | 특정 속성만 선택 | DTO, 뷰 모델 |
| `Omit<T, K>` | 특정 속성 제외 | 생성 DTO |
| `Record<K, T>` | 키-값 매핑 | 사전, 설정 |
| `Exclude<T, U>` | 유니온에서 제외 | 상태 필터링 |
| `Extract<T, U>` | 유니온에서 추출 | 공통 타입 |
| `NonNullable<T>` | null/undefined 제외 | 값 보장 |
| `ReturnType<T>` | 함수 반환 타입 | 타입 추론 |
| `Parameters<T>` | 함수 매개변수 타입 | 래퍼 함수 |

---

## Type Guard (타입 가드)

### 타입 가드란?

**런타임에 타입을 좁히는(narrowing) 표현식**입니다. 조건문 내에서 TypeScript가 더 구체적인 타입을 추론할 수 있게 합니다.

유니온 타입은 여러 타입 중 하나일 수 있습니다. 특정 속성이나 메서드를 사용하려면 어떤 타입인지 확인해야 합니다. 타입 가드는 이 확인을 타입 시스템이 이해할 수 있게 합니다.

### typeof 가드

**원시 타입을 구분**합니다. `string`, `number`, `boolean`, `symbol`, `undefined`, `object`, `function`을 확인할 수 있습니다.

```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();  // string으로 추론
  }
  return value.toFixed(2);  // number로 추론
}
```

### instanceof 가드

**클래스 인스턴스를 구분**합니다. 프로토타입 체인을 확인합니다. `if (animal instanceof Dog)`처럼 사용하면 해당 블록에서 Dog로 추론됩니다.

### in 연산자 가드

**속성 존재 여부로 구분**합니다. 인터페이스나 타입 별칭에서 유용합니다.

```typescript
function move(animal: Bird | Fish) {
  if ("fly" in animal) {
    animal.fly();   // Bird로 추론
  } else {
    animal.swim();  // Fish로 추론
  }
}
```

### 사용자 정의 타입 가드

`is` 키워드로 **커스텀 타입 가드 함수**를 만듭니다. 복잡한 타입 검사 로직을 캡슐화할 수 있습니다. 반환 타입을 `value is Type` 형태로 선언하면 조건문에서 해당 타입으로 좁혀집니다.

```typescript
function isAdmin(person: User | Admin): person is Admin {
  return person.type === "admin";
}

// isAdmin(person)이 true면 person은 Admin으로 추론
```

### 타입 가드 활용 패턴

| 상황 | 적합한 가드 |
|------|------------|
| 원시 타입 구분 | `typeof` |
| 클래스 인스턴스 구분 | `instanceof` |
| 속성 존재 여부 | `in` 연산자 |
| 복잡한 조건 | 사용자 정의 타입 가드 |
| null/undefined 체크 | `!= null` 또는 옵셔널 체이닝 |
| 배열 여부 | `Array.isArray()` |

### Assertion Functions

TypeScript 3.7+에서 **조건이 거짓이면 에러를 던지는 단언 함수**를 정의할 수 있습니다. `asserts value is Type` 형태로 반환 타입을 선언하면, 함수 호출 이후 해당 타입으로 추론됩니다.

---

## Discriminated Union (판별 유니온)

### Discriminated Union이란?

**공통 리터럴 속성(판별자)을 가진 유니온 타입**입니다. 이 판별자로 타입을 좁힐 수 있어 타입 안전한 분기 처리가 가능합니다. "Tagged Union" 또는 "Algebraic Data Types"라고도 합니다.

### 기본 구조

```typescript
// 공통 속성 type이 판별자
interface Circle {
  type: "circle";
  radius: number;
}

interface Rectangle {
  type: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  type: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;
```

### 패턴 매칭

판별자를 기준으로 **switch문으로 타입을 좁힙니다**. 각 case에서 해당 타입의 속성에 안전하게 접근할 수 있습니다.

```typescript
function calculateArea(shape: Shape): number {
  switch (shape.type) {
    case "circle":
      // shape은 Circle로 추론
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape은 Rectangle로 추론
      return shape.width * shape.height;
    case "triangle":
      // shape은 Triangle로 추론
      return (shape.base * shape.height) / 2;
  }
}
```

### 철저한 검사 (Exhaustive Check)

**모든 케이스를 처리했는지 컴파일 타임에 검증**합니다. 새 타입이 추가되면 컴파일 에러가 발생하여 누락을 방지합니다.

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function calculateArea(shape: Shape): number {
  switch (shape.type) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // 모든 케이스를 처리했으면 shape은 never
      // 새 타입 추가 시 여기서 컴파일 에러 발생
      return assertNever(shape);
  }
}
```

### 실전 활용 예시

**API 응답 처리:** status가 "success" | "error" | "loading"인 유니온으로 정의하면, switch문에서 각 상태에 맞는 속성(data, error)에 안전하게 접근할 수 있습니다.

**Redux 액션:** type이 "INCREMENT" | "SET_VALUE" 등인 유니온으로 정의하면, reducer에서 각 액션 타입별로 payload에 안전하게 접근할 수 있습니다.

### Discriminated Union vs 일반 Union

| 특성 | 일반 Union | Discriminated Union |
|------|-----------|---------------------|
| 타입 좁히기 | `in`, `typeof` 등 필요 | 판별자로 간단히 |
| 패턴 매칭 | 어려움 | switch문으로 자연스럽게 |
| 철저한 검사 | 수동 | never로 자동 |
| 새 타입 추가 | 누락 위험 | 컴파일 에러로 감지 |
| 코드 가독성 | 낮음 | 높음 |

### 판별자 선택 가이드

| 권장 | 비권장 |
|------|--------|
| 문자열 리터럴 (`"circle"`) | boolean (`true`/`false`) |
| 명확한 이름 (`type`, `kind`, `tag`) | 일반 속성 (`name`) |
| 모든 타입에 공통 | 일부만 가진 속성 |

---

## 고급 패턴

### 조건부 타입 (Conditional Types)

**조건에 따라 다른 타입을 반환**합니다. `T extends U ? X : Y` 형태로, 삼항 연산자와 유사합니다. `infer` 키워드와 함께 사용하면 타입을 추론하여 추출할 수 있습니다.

```typescript
// 배열이면 요소 타입 추출, 아니면 그대로
type Unwrap<T> = T extends Array<infer U> ? U : T;

type A = Unwrap<string[]>;  // string
type B = Unwrap<number>;    // number
```

### 템플릿 리터럴 타입

**문자열 리터럴을 조합**하여 새 타입을 만듭니다.

```typescript
type Color = "red" | "blue";
type Size = "small" | "large";
type ClassName = `${Size}-${Color}`;  // "small-red" | "small-blue" | ...
```

---

## 면접 예상 질문

**Q. 제네릭이란 무엇이고 왜 사용하나요?**

타입을 매개변수로 받아 재사용 가능한 컴포넌트를 만드는 기능입니다. any를 사용하면 타입 안전성을 잃고, 타입별로 함수를 만들면 중복입니다. 제네릭은 타입 안전성을 유지하면서 재사용성을 제공합니다. `Array<T>`, `Promise<T>`, React의 `useState<T>` 등이 대표적입니다.

**Q. Partial과 Pick의 차이?**

`Partial<T>`는 모든 속성을 optional로 만들어 부분 업데이트에 사용합니다. `Pick<T, K>`는 특정 속성만 선택하여 새 타입을 만들어 필요한 필드만 가진 DTO나 뷰 모델에 사용합니다. Partial은 "전체 중 일부만 채워도 됨", Pick은 "이것만 있음"입니다.

**Q. 타입 가드란?**

런타임에 타입을 좁히는 표현식입니다. `typeof`, `instanceof`, `in` 연산자, 또는 `is` 키워드를 사용한 사용자 정의 함수가 있습니다. 유니온 타입에서 특정 타입의 속성에 안전하게 접근하기 위해 사용합니다.

**Q. Discriminated Union이란?**

공통 리터럴 속성(판별자)을 가진 유니온 타입입니다. 이 판별자로 switch문을 통해 타입을 좁힐 수 있습니다. never 타입과 함께 사용하면 모든 케이스를 처리했는지 컴파일 타임에 검증할 수 있어 새 타입 추가 시 누락을 방지합니다.

**Q. keyof와 typeof의 차이?**

`keyof`는 객체 타입의 모든 키를 유니온으로 추출합니다 (`keyof User` → `"id" | "name"`). `typeof`는 값에서 타입을 추론합니다 (`typeof user` → `User`). keyof는 타입에, typeof는 값에 사용합니다.

**Q. unknown과 any의 차이?**

둘 다 모든 타입을 받을 수 있지만, any는 타입 검사를 비활성화하고, unknown은 사용 전 타입 검사를 강제합니다. unknown은 타입 가드로 좁힌 후에만 사용할 수 있어 더 안전합니다. API 응답 등 알 수 없는 데이터에는 any 대신 unknown을 사용해야 합니다.