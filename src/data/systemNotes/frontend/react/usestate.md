useState는 함수 컴포넌트에서 상태를 관리하는 Hook입니다.

## 기본 사용법

`const [state, setState] = useState(initialValue);`

## 특징

- **state**: 현재 상태 값
- **setState**: 상태 업데이트 함수
- 초기값은 첫 렌더링에서만 사용

## 함수형 업데이트

`setState(prev => prev + 1)` - 이전 상태를 기반으로 업데이트할 때 사용합니다.

## 주의사항

- 상태는 불변성을 유지해야 합니다
- 객체/배열 업데이트 시 새로운 참조를 생성해야 합니다
