Virtual DOM은 React의 핵심 개념으로 성능 최적화를 위한 메커니즘입니다.

## 동작 원리

1. 상태 변경 발생
2. 새로운 Virtual DOM 트리 생성
3. 이전 트리와 비교 (Diffing)
4. 변경된 부분만 실제 DOM에 반영 (Reconciliation)

## 장점

- 최소한의 DOM 조작으로 성능 향상
- 선언적 프로그래밍 가능
- 크로스 플랫폼 지원 (React Native)

## Reconciliation 알고리즘

- 서로 다른 타입의 엘리먼트는 완전히 새로 렌더링
- key prop을 통해 리스트 최적화
