# HTTP Deep Dive

## HTTP란?

**HTTP(HyperText Transfer Protocol)**는 웹에서 클라이언트와 서버가 통신하는 애플리케이션 계층 프로토콜이다. 1991년 Tim Berners-Lee가 HTML, URL과 함께 발명했다.

HTTP의 특징:

- **요청-응답 모델**: 클라이언트가 요청하고 서버가 응답
- **Stateless**: 각 요청은 독립적, 서버가 이전 요청을 기억하지 않음
- **텍스트 기반**: 사람이 읽을 수 있는 형식 (HTTP/2부터 바이너리)
- **확장 가능**: 헤더로 기능 확장

```
┌──────────┐                      ┌──────────┐
│  Client  │ ──── Request ──────→ │  Server  │
│ (브라우저) │ ←─── Response ────── │ (웹서버)  │
└──────────┘                      └──────────┘
```

---

## HTTP 메시지 구조

### 요청 (Request)

```
GET /api/users?page=1 HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: application/json
Authorization: Bearer eyJhbG...
Content-Type: application/json

{"name": "John"}
```

구조:

- **Request Line**: `메서드 URI HTTP버전`
- **Headers**: `이름: 값` 형태로 여러 줄
- **빈 줄**: 헤더와 바디 구분
- **Body**: 요청 데이터 (선택적)

### 응답 (Response)

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 256
Cache-Control: max-age=3600
Set-Cookie: session=abc123; HttpOnly

{"users": [...]}
```

구조:

- **Status Line**: `HTTP버전 상태코드 상태메시지`
- **Headers**: 응답 메타데이터
- **빈 줄**
- **Body**: 응답 데이터

---

## HTTP 메서드

### 주요 메서드

| 메서드 | 용도 | 멱등성 | 안전 | Body |
|--------|------|--------|------|------|
| GET | 리소스 조회 | O | O | X |
| POST | 리소스 생성, 처리 | X | X | O |
| PUT | 리소스 전체 수정/생성 | O | X | O |
| PATCH | 리소스 부분 수정 | X | X | O |
| DELETE | 리소스 삭제 | O | X | X |
| HEAD | GET과 동일하나 Body 없음 | O | O | X |
| OPTIONS | 지원 메서드 확인 (CORS) | O | O | X |

### 멱등성 (Idempotency)

같은 요청을 여러 번 보내도 결과가 동일한 성질이다.

- **GET**: 여러 번 조회해도 결과 동일 → 멱등
- **DELETE**: 여러 번 삭제해도 "없는 상태"로 동일 → 멱등
- **POST**: 여러 번 생성하면 여러 개 생성됨 → 비멱등

멱등성이 중요한 이유:

- 네트워크 오류로 응답을 못 받았을 때 재시도 가능 여부 결정
- GET, PUT, DELETE는 안전하게 재시도 가능
- POST는 중복 생성 위험 → 별도 처리 필요 (Idempotency Key)

### 안전 (Safe)

서버 상태를 변경하지 않는 메서드다. GET, HEAD, OPTIONS가 안전하다.

- 캐싱 가능
- 프리페칭 가능
- 로그 분석 시 부작용 없음

### GET vs POST

| 구분 | GET | POST |
|------|-----|------|
| 데이터 위치 | URL 쿼리스트링 | Body |
| 길이 제한 | URL 길이 제한 (브라우저별 다름) | 거의 무제한 |
| 캐싱 | 가능 | 불가 |
| 북마크 | 가능 | 불가 |
| 히스토리 | 남음 | 안 남음 |
| 보안 | URL에 노출 | Body에 숨김 (암호화 필요) |

```
GET /search?q=hello&page=1 HTTP/1.1

POST /login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=john&password=secret
```

### PUT vs PATCH

**PUT**: 리소스 전체를 교체한다.

```
PUT /users/1
{"name": "John", "email": "john@example.com", "age": 30}

→ 기존 데이터를 완전히 덮어씀
   일부 필드 누락 시 null/기본값으로 설정됨
```

**PATCH**: 리소스 일부만 수정한다.

```
PATCH /users/1
{"age": 31}

→ age만 변경, 나머지는 유지
```

---

## HTTP 상태 코드

### 1xx: 정보

요청을 받았고 처리 중이라는 의미. 거의 사용하지 않음.

- **100 Continue**: Body 전송해도 됨
- **101 Switching Protocols**: 프로토콜 전환 (WebSocket 업그레이드)

### 2xx: 성공

요청이 성공적으로 처리됨.

- **200 OK**: 일반적인 성공
- **201 Created**: 리소스 생성 성공 (POST)
- **204 No Content**: 성공했지만 응답 Body 없음 (DELETE)

### 3xx: 리다이렉션

추가 작업이 필요함.

- **301 Moved Permanently**: 영구 이동, 캐시됨, GET으로 변경될 수 있음
- **302 Found**: 임시 이동, GET으로 변경될 수 있음
- **304 Not Modified**: 캐시 사용 (조건부 요청 응답)
- **307 Temporary Redirect**: 임시 이동, 메서드 유지
- **308 Permanent Redirect**: 영구 이동, 메서드 유지

```
301/302: POST → GET으로 바뀔 수 있음 (브라우저 구현)
307/308: POST → POST 유지 보장
```

### 4xx: 클라이언트 오류

클라이언트의 잘못된 요청.

- **400 Bad Request**: 잘못된 문법, 유효하지 않은 요청
- **401 Unauthorized**: 인증 필요 (로그인 안 됨)
- **403 Forbidden**: 권한 없음 (로그인은 됐지만 접근 불가)
- **404 Not Found**: 리소스 없음
- **405 Method Not Allowed**: 허용되지 않는 메서드
- **409 Conflict**: 충돌 (동시 수정 등)
- **422 Unprocessable Entity**: 문법은 맞지만 의미상 오류 (유효성 검증 실패)
- **429 Too Many Requests**: 요청 횟수 초과 (Rate Limiting)

```
401 vs 403:
401: "누구세요?" → 로그인 필요
403: "알겠는데 안 돼요" → 권한 없음
```

### 5xx: 서버 오류

서버 측 문제.

- **500 Internal Server Error**: 서버 내부 오류 (예외 발생 등)
- **502 Bad Gateway**: 게이트웨이/프록시가 잘못된 응답 받음
- **503 Service Unavailable**: 서버 과부하 또는 점검 중
- **504 Gateway Timeout**: 게이트웨이/프록시 타임아웃

---

## HTTP 헤더

### 요청 헤더

**Host**: 요청 대상 서버 (HTTP/1.1 필수)

```
Host: www.example.com
```

하나의 IP에 여러 도메인이 있을 수 있어서 필요 (가상 호스팅).

**User-Agent**: 클라이언트 정보

```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0
```

**Accept**: 원하는 응답 형식

```
Accept: text/html, application/json;q=0.9, */*;q=0.8
```

q는 우선순위 (0~1, 기본 1).

**Authorization**: 인증 정보

```
Authorization: Basic dXNlcjpwYXNz
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Cookie**: 저장된 쿠키 전송

```
Cookie: session=abc123; theme=dark
```

### 응답 헤더

**Content-Type**: 응답 Body의 미디어 타입

```
Content-Type: application/json; charset=utf-8
Content-Type: text/html; charset=utf-8
Content-Type: image/png
```

**Content-Length**: Body 크기 (바이트)

```
Content-Length: 1234
```

**Set-Cookie**: 쿠키 설정

```
Set-Cookie: session=abc123; Path=/; HttpOnly; Secure; SameSite=Strict
```

**Cache-Control**: 캐싱 정책

```
Cache-Control: max-age=3600, public
Cache-Control: no-cache, no-store, must-revalidate
```

**Location**: 리다이렉트 목적지

```
HTTP/1.1 301 Moved Permanently
Location: https://new-domain.com/page
```

### CORS 관련 헤더

브라우저의 Same-Origin Policy를 우회하기 위한 헤더들.

**요청:**

```
Origin: https://frontend.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

**응답:**

```
Access-Control-Allow-Origin: https://frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

---

## HTTP 캐싱

### 왜 캐싱이 필요한가?

- 네트워크 트래픽 감소
- 서버 부하 감소
- 응답 속도 향상

### Cache-Control

가장 중요한 캐싱 헤더다.

```
Cache-Control: max-age=3600        # 3600초 동안 캐시 유효
Cache-Control: no-cache            # 캐시 저장하지만 매번 검증
Cache-Control: no-store            # 캐시 저장 금지
Cache-Control: private             # 브라우저만 캐시 (프록시 X)
Cache-Control: public              # 프록시도 캐시 가능
Cache-Control: must-revalidate     # 만료 후 반드시 검증
```

조합 예시:

```
Cache-Control: public, max-age=31536000     # 정적 자원 (1년)
Cache-Control: private, no-cache            # 개인화된 동적 콘텐츠
Cache-Control: no-store                     # 민감한 데이터
```

### 조건부 요청 (Conditional Request)

캐시가 만료되었을 때, 실제로 변경되었는지 확인하고 변경 없으면 캐시를 재사용한다.

**ETag 기반:**

```
# 최초 응답
HTTP/1.1 200 OK
ETag: "abc123"
Content: ...

# 캐시 만료 후 재요청
GET /resource HTTP/1.1
If-None-Match: "abc123"

# 변경 없으면
HTTP/1.1 304 Not Modified
(Body 없음 → 기존 캐시 사용)

# 변경되었으면
HTTP/1.1 200 OK
ETag: "def456"
Content: (새 데이터)
```

**Last-Modified 기반:**

```
# 최초 응답
HTTP/1.1 200 OK
Last-Modified: Wed, 21 Oct 2023 07:28:00 GMT

# 재요청
GET /resource HTTP/1.1
If-Modified-Since: Wed, 21 Oct 2023 07:28:00 GMT

# 변경 없으면 304
```

ETag가 더 정확하다. Last-Modified는 1초 단위라 그 안에 변경되면 못 잡는다.

### 캐시 전략

**정적 자원 (JS, CSS, 이미지):**

```
Cache-Control: public, max-age=31536000, immutable
파일명: app.a1b2c3.js (해시 포함)
```

파일명에 해시를 포함하고 1년 캐시. 내용 변경 시 파일명이 바뀌므로 새로 요청.

**API 응답:**

```
Cache-Control: private, no-cache
ETag: "..."
```

매번 검증하되, 변경 없으면 304.

**민감한 데이터:**

```
Cache-Control: no-store
```

절대 캐시하지 않음.

---

## HTTP/1.0 → HTTP/1.1 → HTTP/2 → HTTP/3

### HTTP/1.0 (1996)

- 요청마다 새 TCP 연결 (비효율)
- 연결당 하나의 요청/응답

```
연결 → 요청 → 응답 → 연결 종료
연결 → 요청 → 응답 → 연결 종료
연결 → 요청 → 응답 → 연결 종료
```

### HTTP/1.1 (1997)

**Keep-Alive (Persistent Connection)**

하나의 TCP 연결에서 여러 요청/응답을 처리.

```
연결 → 요청1 → 응답1 → 요청2 → 응답2 → 요청3 → 응답3 → 연결 종료
```

기본적으로 활성화 (`Connection: keep-alive`).

**Pipelining**

응답을 기다리지 않고 여러 요청을 연속으로 전송.

```
연결 → 요청1 → 요청2 → 요청3 → 응답1 → 응답2 → 응답3
```

하지만 **Head-of-Line Blocking** 문제가 있다. 응답은 요청 순서대로 와야 해서, 응답1이 느리면 응답2, 3도 대기해야 한다. 실제로 대부분의 브라우저가 비활성화.

**Host 헤더 필수화**

하나의 IP에 여러 도메인 (가상 호스팅) 가능.

**Chunked Transfer Encoding**

Content-Length 없이 스트리밍 응답 가능.

### HTTP/2 (2015)

**바이너리 프로토콜**

텍스트가 아닌 바이너리로 파싱 효율 향상.

**멀티플렉싱**

하나의 TCP 연결에서 여러 요청/응답을 **병렬로** 처리. 스트림 단위로 분리되어 Head-of-Line Blocking 해결 (HTTP 레벨에서).

```
HTTP/1.1:
요청1 ────────→
              응답1 ←────────
요청2 ────────→
              응답2 ←────────

HTTP/2:
요청1 ──→
요청2 ──→
요청3 ──→
       ←── 응답2
       ←── 응답1
       ←── 응답3
```

**헤더 압축 (HPACK)**

반복되는 헤더를 압축. 헤더 테이블을 유지하여 인덱스로 참조.

```
첫 요청: Host: example.com (전체 전송)
다음 요청: 62 (인덱스만 전송)
```

**서버 푸시**

클라이언트가 요청하기 전에 서버가 필요한 리소스를 미리 푸시.

```
클라이언트: GET /index.html
서버: 
  - index.html 응답
  - style.css 푸시
  - script.js 푸시
```

**우선순위**

중요한 리소스 먼저 전송하도록 힌트.

### HTTP/3 (2022)

**QUIC 기반 (UDP)**

TCP 대신 UDP 위의 QUIC 프로토콜 사용.

TCP의 문제:

- TCP 레벨 Head-of-Line Blocking: 하나의 패킷 손실 시 뒤의 모든 패킷 대기
- 연결 수립 지연: TCP 3-way + TLS 1.5 RTT = 최소 2~3 RTT

QUIC의 장점:

- 독립적 스트림: 한 스트림의 손실이 다른 스트림에 영향 없음
- 0-RTT 연결: 이전 연결 정보로 첫 요청부터 데이터 전송
- 연결 마이그레이션: IP가 바뀌어도 연결 유지 (Connection ID 기반)
- 내장 암호화: TLS 1.3 필수

```
HTTP/2 over TCP:
TCP 연결 (1 RTT) → TLS 핸드셰이크 (1-2 RTT) → 요청

HTTP/3 over QUIC:
QUIC 연결 + TLS (1 RTT) → 요청
또는 0-RTT로 즉시 요청
```

### 버전별 비교

| 특성 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|------|----------|--------|--------|
| 프로토콜 | 텍스트 | 바이너리 | 바이너리 |
| 전송 | TCP | TCP | QUIC (UDP) |
| 멀티플렉싱 | X | O | O |
| 헤더 압축 | X | HPACK | QPACK |
| 서버 푸시 | X | O | O |
| HOL Blocking | TCP + HTTP | TCP만 | 없음 |

---

## Keep-Alive와 Connection Pooling

### Keep-Alive

HTTP/1.1에서 기본 활성화. 하나의 TCP 연결을 재사용.

```
Connection: keep-alive
Keep-Alive: timeout=5, max=100
```

- timeout: 유휴 상태 유지 시간 (초)
- max: 최대 요청 수

### Connection Pooling

여러 요청을 위해 미리 연결을 만들어 두고 재사용.

```
┌─────────────┐        ┌─────────────────┐
│   Client    │        │  Connection     │        ┌────────┐
│             │──req──→│     Pool        │───────→│ Server │
│             │←─res───│  [conn1]        │←───────│        │
│             │        │  [conn2]        │        │        │
│             │──req──→│  [conn3]        │───────→│        │
└─────────────┘        └─────────────────┘        └────────┘
```

장점:

- TCP 연결 수립 오버헤드 제거
- TIME_WAIT 소켓 감소
- 서버 부하 감소

Node.js, Java HttpClient 등 HTTP 클라이언트 라이브러리가 내부적으로 관리.

---

## 면접 예상 질문

**Q. HTTP 메서드 중 멱등성이 있는 것과 없는 것은?**

멱등성은 같은 요청을 여러 번 보내도 결과가 동일한 성질이다. GET, PUT, DELETE, HEAD, OPTIONS는 멱등성이 있다. POST, PATCH는 멱등성이 없다. POST는 여러 번 호출하면 여러 리소스가 생성되고, PATCH도 구현에 따라 누적될 수 있다. 멱등성이 있으면 네트워크 오류 시 안전하게 재시도할 수 있다.

**Q. 401과 403의 차이점은?**

401 Unauthorized는 인증이 필요하다는 의미로, 로그인하지 않은 상태다. WWW-Authenticate 헤더로 인증 방법을 안내한다. 403 Forbidden은 인증은 되었지만 권한이 없다는 의미다. 로그인한 사용자가 관리자 페이지에 접근하면 403이 반환된다.

**Q. HTTP/1.1과 HTTP/2의 차이점은?**

HTTP/1.1은 텍스트 기반이고 하나의 연결에서 요청/응답이 순차적이라 Head-of-Line Blocking이 있다. HTTP/2는 바이너리 기반이고 멀티플렉싱으로 하나의 연결에서 여러 요청/응답을 병렬 처리한다. 또한 HPACK 헤더 압축, 서버 푸시, 스트림 우선순위 기능이 있다.

**Q. HTTP 캐싱에서 ETag의 역할은?**

ETag는 리소스의 버전 식별자다. 서버가 응답에 ETag를 포함하면, 클라이언트는 캐시 만료 후 If-None-Match 헤더에 ETag를 담아 조건부 요청을 보낸다. 서버는 ETag가 같으면 304 Not Modified로 응답하여 Body 없이 캐시 재사용을 허용한다. Last-Modified보다 정확하다.

**Q. HTTP/3가 UDP를 사용하는 이유는?**

TCP는 패킷 손실 시 뒤의 모든 패킷이 대기하는 Head-of-Line Blocking이 있고, 연결 수립에 1 RTT가 필요하다. HTTP/3의 QUIC은 UDP 위에서 독립적인 스트림을 제공하여 한 스트림의 손실이 다른 스트림에 영향을 주지 않는다. 또한 0-RTT 연결이 가능하고, Connection ID 기반으로 IP가 바뀌어도 연결이 유지된다.