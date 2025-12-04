XSS는 악성 스크립트를 삽입하는 공격입니다.

## Stored XSS

- 서버에 저장된 스크립트 실행
- 게시판, 댓글 등

## Reflected XSS

- URL 파라미터를 통한 즉시 실행
- 피싱에 활용

## DOM-based XSS

- 클라이언트 측에서만 발생

## 방어 방법

- 입력 값 검증 및 이스케이프
- Content Security Policy (CSP)
- HTTP-only 쿠키
- React의 자동 이스케이프 활용

> 주의: `dangerouslySetInnerHTML` 사용 시 주의 필요
