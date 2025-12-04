Promise는 비동기 작업의 완료 또는 실패를 나타내는 객체입니다.

## Promise 상태

- **Pending**: 초기 상태
- **Fulfilled**: 성공
- **Rejected**: 실패

## 주요 메서드

- `then()`: 성공 시 실행
- `catch()`: 실패 시 실행
- `finally()`: 항상 실행
- `Promise.all()`: 모든 Promise 완료 대기
- `Promise.race()`: 가장 먼저 완료되는 것 사용

## async/await

- async 함수는 항상 Promise 반환
- await는 Promise가 처리될 때까지 대기
- try-catch로 에러 처리
