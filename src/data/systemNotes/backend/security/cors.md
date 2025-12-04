CORS는 다른 출처의 리소스 접근을 제어하는 보안 메커니즘입니다.

## 동일 출처 정책

- 프로토콜, 도메인, 포트가 모두 같아야 함
- 보안을 위한 브라우저 정책

## CORS 헤더

- `Access-Control-Allow-Origin`: 허용할 출처 지정
- `Access-Control-Allow-Methods`: 허용할 HTTP 메서드

## Preflight Request

- OPTIONS 메서드로 사전 확인
- PUT, DELETE 등에서 발생

## 해결 방법

- 서버에서 CORS 헤더 설정
- 프록시 서버 사용
