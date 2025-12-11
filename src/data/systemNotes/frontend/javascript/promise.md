# 비동기 처리 (Promise, async/await)

## 비동기 처리가 필요한 이유

JavaScript는 **싱글 스레드** 언어입니다. 한 번에 하나의 작업만 실행할 수 있습니다. 서버에서 데이터를 가져오는 동안 다른 작업을 못하면, 사용자는 빈 화면을 보며 기다려야 합니다.

**비동기 처리**는 시간이 오래 걸리는 작업을 **백그라운드에서 처리**하고, 완료되면 결과를 받아오는 방식입니다. 그동안 메인 스레드는 다른 작업을 계속할 수 있습니다.

대표적인 비동기 작업: 네트워크 요청, 파일 읽기/쓰기, 타이머, 데이터베이스 쿼리

---

## 콜백과 콜백 지옥

비동기 처리의 가장 기본적인 방식은 **콜백**입니다. 작업이 완료되면 호출될 함수를 전달합니다.

```javascript
fetchUser(userId, function(user) {
  fetchPosts(user.id, function(posts) {
    fetchComments(posts[0].id, function(comments) {
      // 계속 중첩...
    });
  });
});
```

**콜백 지옥의 문제점:**
- 코드가 옆으로 들어가서 **가독성 저하**
- 각 콜백마다 에러 처리 필요
- 흐름 파악과 디버깅이 어려움

이 문제를 해결하기 위해 **Promise**가 등장했습니다.

---

## Promise

### Promise란?

**비동기 작업의 완료 또는 실패를 나타내는 객체**입니다. "미래에 값을 줄게"라는 **약속**을 표현합니다.

### 세 가지 상태

| 상태 | 설명 | 전환 |
|------|------|------|
| **Pending** | 대기 중 | 초기 상태 |
| **Fulfilled** | 성공 | resolve() 호출 |
| **Rejected** | 실패 | reject() 호출 |

상태는 **한 번 결정되면 변경되지 않습니다**.

### Promise 생성과 사용

```javascript
const promise = new Promise((resolve, reject) => {
  if (success) resolve(result);
  else reject(error);
});

promise
  .then(result => { /* 성공 */ })
  .catch(error => { /* 실패 */ })
  .finally(() => { /* 항상 실행 */ });
```

### 체이닝 (Chaining)

`then`은 **새로운 Promise를 반환**합니다. 이 덕분에 체이닝이 가능합니다.

```javascript
fetchUser(userId)
  .then(user => fetchPosts(user.id))
  .then(posts => fetchComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(error => console.error(error));
```

콜백 지옥과 비교하면 **세로로 흐르는 평평한 구조**가 됩니다. 에러 처리도 `catch` 하나로 통합됩니다.

---

## Promise 정적 메서드

| 메서드 | 성공 조건 | 실패 조건 | 사용 시점 |
|--------|-----------|-----------|-----------|
| **all** | 모두 성공 | 하나라도 실패 | 모든 결과가 필요할 때 |
| **allSettled** | 항상 성공 | - | 일부 실패해도 결과 필요 |
| **race** | 가장 빠른 것 | 가장 빠른 것이 실패 | 타임아웃 구현 |
| **any** | 하나라도 성공 | 모두 실패 | 대안 중 하나만 필요 |

```javascript
// 가장 많이 쓰는 Promise.all
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts()
]);
```

---

## async / await

### async/await란?

ES2017에 도입된 **Promise를 더 직관적으로 사용하는 문법**입니다. 비동기 코드를 **동기 코드처럼** 작성할 수 있습니다. 내부적으로는 Promise와 동일하게 동작하는 **문법적 설탕**입니다.

### 기본 문법

```javascript
async function fetchData() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  return posts;
}
```

- **async**: 함수 앞에 붙임. 항상 Promise를 반환
- **await**: Promise 완료까지 대기. async 함수 안에서만 사용 가능

### 에러 처리

try-catch로 **동기 코드처럼** 에러를 처리합니다.

```javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

---

## Promise vs async/await 비교

```javascript
// Promise 체이닝
function getData() {
  return fetchUser()
    .then(user => fetchPosts(user.id))
    .then(posts => fetchComments(posts[0].id))
    .catch(error => console.error(error));
}

// async/await
async function getData() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts(user.id);
    return await fetchComments(posts[0].id);
  } catch (error) {
    console.error(error);
  }
}
```

| 구분 | Promise | async/await |
|------|---------|-------------|
| 가독성 | 체이닝이 길면 복잡 | 동기 코드처럼 읽힘 |
| 에러 처리 | .catch() | try-catch |
| 디버깅 | 스택 추적 어려움 | 동기 코드처럼 디버깅 |
| 조건부 로직 | 체이닝 안에서 복잡 | if문 자연스럽게 사용 |

### async/await가 좋은 이유

1. **가독성**: 위에서 아래로 순차적으로 읽힘
2. **디버깅**: 브레이크포인트 설정, 스택 추적이 쉬움
3. **조건부 로직**: then 체인 안에서 if문 쓰기 어려웠는데 자연스러워짐
4. **익숙한 에러 처리**: try-catch 패턴

---

## 주의사항

### 1. await의 순차 실행 문제 (가장 중요!)

await를 연속으로 쓰면 **순차적으로 실행**됩니다.

```javascript
// ❌ 순차 실행 - 총 2초
const a = await fetchA();  // 1초
const b = await fetchB();  // 1초

// ✅ 병렬 실행 - 총 1초
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

두 작업이 **서로 의존하지 않으면** Promise.all로 병렬 처리하세요.

### 2. forEach에서 await 문제

```javascript
// ❌ 의도대로 동작 안 함
items.forEach(async (item) => {
  await processItem(item);
});
console.log('완료');  // 처리 완료 전에 실행됨!
```

forEach는 콜백의 Promise를 기다리지 않습니다.

```javascript
// ✅ 순차 처리
for (const item of items) {
  await processItem(item);
}

// ✅ 병렬 처리
await Promise.all(items.map(item => processItem(item)));
```

### 3. Top-level await

ES2022부터 모듈의 최상위에서 await 사용 가능합니다.

```javascript
// ES2022+ 모듈에서
const data = await fetchData();
export { data };
```

---

## 이벤트 루프와의 관계

Promise와 async/await는 **마이크로태스크 큐**에서 처리됩니다. 마이크로태스크는 일반 태스크(setTimeout 등)보다 **우선순위가 높습니다**.

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');

// 출력: 1, 4, 3, 2
```

1. 동기 코드 실행 (1, 4)
2. 마이크로태스크 실행 (3) - Promise
3. 태스크 실행 (2) - setTimeout

---

## 면접 예상 질문

**Q. Promise와 async/await의 차이는?**

async/await는 Promise를 더 읽기 쉽게 작성하는 문법적 설탕입니다. 내부적으로 동일하게 동작합니다. async 함수는 항상 Promise를 반환하고, await는 Promise가 완료될 때까지 기다립니다. async/await는 동기 코드처럼 작성되어 가독성이 좋고, try-catch로 에러 처리가 직관적입니다.

**Q. Promise.all과 Promise.allSettled의 차이?**

Promise.all은 모든 Promise가 성공해야 성공하고, 하나라도 실패하면 즉시 실패합니다. Promise.allSettled는 모든 Promise가 완료될 때까지 기다리며, 각각의 성공/실패 결과를 배열로 반환합니다. 일부 실패해도 나머지 결과가 필요할 때 allSettled를 사용합니다.

**Q. async/await에서 병렬 처리는 어떻게 하나요?**

await를 연속으로 쓰면 순차 실행됩니다. 병렬 처리하려면 Promise.all과 함께 사용합니다. `const [a, b] = await Promise.all([fetchA(), fetchB()])`처럼 작성하면 두 작업이 동시에 시작됩니다.

**Q. forEach 안에서 await가 제대로 동작하지 않는 이유?**

forEach는 콜백 함수가 반환하는 Promise를 기다리지 않습니다. forEach가 끝나도 내부의 비동기 작업은 완료되지 않았을 수 있습니다. 순차 처리는 for...of와 await를, 병렬 처리는 map과 Promise.all을 사용해야 합니다.

**Q. 마이크로태스크 큐란?**

JavaScript 이벤트 루프에서 마이크로태스크 큐는 일반 태스크 큐보다 우선순위가 높습니다. Promise의 then/catch 콜백은 마이크로태스크로 등록됩니다. 현재 코드가 끝나면 setTimeout 같은 태스크보다 먼저 마이크로태스크가 모두 실행됩니다.