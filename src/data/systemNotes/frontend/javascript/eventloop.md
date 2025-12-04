이벤트 루프는 JavaScript의 비동기 처리 메커니즘입니다.

## 구성 요소

- **Call Stack**: 실행 중인 함수 추적
- **Task Queue** (Macro): setTimeout, setInterval 등
- **Microtask Queue**: Promise, queueMicrotask 등
- **Web APIs**: DOM, Timer, Fetch 등

## 실행 순서

1. Call Stack의 모든 작업 실행
2. Microtask Queue 전체 비우기
3. Task Queue에서 하나 실행
4. 렌더링 (필요시)
5. 반복

## 중요

Microtask는 Task보다 우선순위가 높습니다. Promise는 Microtask, setTimeout은 Task입니다.
