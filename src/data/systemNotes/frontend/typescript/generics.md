제네릭은 재사용 가능한 컴포넌트를 만들기 위한 도구입니다.

## 기본 문법

`function identity<T>(arg: T): T { return arg; }`

## 사용 이유

- 타입 안정성 유지하면서 재사용성 증가
- any 사용을 피하면서 유연한 함수 작성

## 제약 조건

`<T extends SomeType>`으로 타입 제한 가능

## 활용

- 유틸리티 함수
- 커스텀 Hook
- API 응답 타입
- 컬렉션 자료구조
