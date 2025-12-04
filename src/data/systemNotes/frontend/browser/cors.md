# CORS (Cross-Origin Resource Sharing)

## 개요

브라우저가 다른 출처(Origin)의 리소스를 요청할 때 적용되는 보안 정책입니다.

```
브라우저 기본 동작: 다른 출처 요청 차단 (동일 출처 정책)
CORS: 서버가 "이 출처는 허용해" 라고 명시하면 허용
```

**핵심:** CORS는 브라우저가 차단하는 것이고, 서버가 허용 여부를 결정

## 출처(Origin)란?

세 가지가 모두 같아야 동일 출처입니다.

| 구성 요소 | 예시 |
|-----------|------|
| 프로토콜 | http, https |
| 도메인 | example.com |
| 포트 | 80, 443, 3000 |

```
https://example.com:443/path

→ 출처: https://example.com:443
→ /path는 출처에 포함 안 됨
```

### 동일 출처 판단 예시

기준: `https://example.com`

| URL | 동일 출처? | 이유 |
|-----|-----------|------|
| https://example.com/api | O | 경로만 다름 |
| http://example.com | X | 프로토콜 다름 |
| https://api.example.com | X | 서브도메인도 다른 출처 |
| https://example.com:8080 | X | 포트 다름 |

## CORS 동작 방식

CORS 에러가 나는 상황을 먼저 이해해야 합니다.

```
1. 브라우저가 다른 출처로 요청을 보냄
2. 서버는 정상적으로 응답함 (200 OK)
3. 브라우저가 응답 헤더를 확인함
4. Access-Control-Allow-Origin이 없거나, 내 출처가 아니면?
5. 브라우저가 JavaScript에서 응답에 접근하는 것을 차단 → CORS 에러
```

**핵심:** 서버는 응답을 했는데, 브라우저가 막는 것

### 1. 단순 요청 (Simple Request)

"위험하지 않은" 요청은 바로 보내고, 응답 헤더만 확인합니다.

**단순 요청 조건:**
- 메서드: GET, HEAD, POST 중 하나
- Content-Type: application/x-www-form-urlencoded, multipart/form-data, text/plain 중 하나
- 커스텀 헤더 없음

서버에서 응답 헤더Access-Control-Allow-Origin으로 서버에서 허용된 오리진임으로 표시

```
[프론트: https://frontend.com]          [서버: https://api.com]

        -------- GET /users -------->
        Origin: https://frontend.com
        
        <-------- 200 OK ------------
        Access-Control-Allow-Origin: https://frontend.com
        { "users": [...] }

브라우저: "Origin이 허용됐네, JavaScript에서 응답 써도 돼"
```

**만약 서버가 허용 헤더를 안 보내면?**

```
        <-------- 200 OK ------------
        (Access-Control-Allow-Origin 헤더 없음)
        { "users": [...] }

브라우저: "허용 안 됐네, 차단!" → CORS 에러
```

서버는 정상 응답했지만 브라우저가 차단합니다.

### 2. 사전 요청 (Preflight Request)

"위험할 수 있는" 요청은 진짜 보내기 전에 먼저 물어봅니다.

**Preflight가 필요한 경우:**
- PUT, DELETE, PATCH 메서드 (데이터 변경 가능)
- Content-Type: application/json (API 요청 대부분)
- 커스텀 헤더 사용 (Authorization 등)

**왜 먼저 물어보나?**

DELETE 요청을 바로 보냈다가 **서버에서 데이터가 삭제된 후** CORS 에러가 나면 이미 늦습니다. 그래서 "이 요청 보내도 돼?"라고 먼저 확인하는 겁니다.

```
[프론트: https://frontend.com]          [서버: https://api.com]

1단계: Preflight (사전 확인)

        -------- OPTIONS /users -------->
        Origin: https://frontend.com
        Access-Control-Request-Method: DELETE
        Access-Control-Request-Headers: Authorization
        
        "DELETE 요청 보내도 돼? Authorization 헤더 써도 돼?"
        
        <-------- 204 No Content --------
        Access-Control-Allow-Origin: https://frontend.com
        Access-Control-Allow-Methods: GET, POST, DELETE
        Access-Control-Allow-Headers: Authorization
        
        "응, DELETE도 되고 Authorization도 써도 돼"

2단계: 본 요청

        -------- DELETE /users/1 -------->
        Origin: https://frontend.com
        Authorization: Bearer xxx
        
        <-------- 200 OK ----------------
        Access-Control-Allow-Origin: https://frontend.com
        { "success": true }
```

**Preflight 실패하면?**

```
1단계에서:
        <-------- 403 Forbidden ---------
        (또는 Allow-Origin이 없음)

브라우저: "허용 안 됐네, 본 요청 안 보냄"
→ 2단계 자체가 실행 안 됨
```

## CORS 관련 헤더

### 응답 헤더 (서버 → 브라우저)

| 헤더 | 설명 |
|------|------|
| Access-Control-Allow-Origin | 허용할 출처 (* 또는 특정 도메인) |
| Access-Control-Allow-Methods | 허용할 HTTP 메서드 |
| Access-Control-Allow-Headers | 허용할 요청 헤더 |
| Access-Control-Allow-Credentials | 인증 정보(쿠키) 허용 여부 |
| Access-Control-Max-Age | Preflight 캐시 시간 (초) |

### 요청 헤더 (브라우저 → 서버, Preflight 시)

| 헤더 | 설명 |
|------|------|
| Origin | 요청 출처 |
| Access-Control-Request-Method | 본 요청에서 사용할 메서드 |
| Access-Control-Request-Headers | 본 요청에서 사용할 헤더 |

## 인증 정보 포함 요청 (Credentials)

기본적으로 CORS 요청은 **쿠키를 안 보냅니다.**

### 문제 상황

```
[프론트: https://frontend.com]          [서버: https://api.com]

1. 로그인 → 서버가 쿠키 발급 (Set-Cookie: session=abc)
2. /users 요청 → 쿠키가 안 감!
3. 서버: "누구세요?" → 401 Unauthorized
```

다른 출처로 요청할 때 브라우저가 기본적으로 쿠키를 포함하지 않기 때문입니다.

### 해결: credentials 설정

**클라이언트에서 "쿠키 보낼게"라고 명시:**

```javascript
// fetch
fetch('https://api.com/users', {
  credentials: 'include'  // 쿠키 포함해서 보내기
});

// axios
axios.get('https://api.com/users', {
  withCredentials: true
});
```

**서버에서도 "쿠키 받을게"라고 명시:**

```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://frontend.com
```

### 주의: * 와일드카드 사용 불가

```
// ❌ 이렇게 하면 안 됨
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true

// ✅ 정확한 출처를 명시해야 함
Access-Control-Allow-Origin: https://frontend.com
Access-Control-Allow-Credentials: true
```

**왜?**

`*`는 "아무나 다 허용"인데, 거기에 쿠키(인증 정보)까지 허용하면 보안상 위험합니다. 악의적인 사이트가 사용자 쿠키로 API를 마음대로 호출할 수 있게 됩니다.

### credentials 옵션 종류

| 값 | 동작 |
|----|------|
| omit | 쿠키 안 보냄 (기본값 아님, 명시적 제외) |
| same-origin | 같은 출처일 때만 쿠키 보냄 (fetch 기본값) |
| include | 항상 쿠키 보냄 (CORS 요청에도) |

### 전체 흐름 정리

```
[프론트: https://frontend.com]          [서버: https://api.com]

        -------- GET /users ---------->
        Origin: https://frontend.com
        Cookie: session=abc  ← credentials: 'include' 덕분에 포함됨
        
        <-------- 200 OK --------------
        Access-Control-Allow-Origin: https://frontend.com
        Access-Control-Allow-Credentials: true
        { "users": [...] }

브라우저: "Credentials 허용됐네, 응답 써도 돼"
```

양쪽 다 설정해야 동작합니다:
- 클라이언트: `credentials: 'include'`
- 서버: `Access-Control-Allow-Credentials: true` + 정확한 Origin

## CORS 해결 방법

### 1. 서버에서 허용 (근본적 해결)

```javascript
// Express 예시
app.use(cors({
  origin: 'https://frontend.com',
  credentials: true
}));
```

### 2. 개발 환경: 프록시 설정

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true
      }
    }
  }
}
```

프록시를 쓰면 브라우저 → 같은 출처(dev 서버) → 실제 API 서버로 우회하므로 CORS 발생 안 함

### 3. 기타

- 서버리스 함수로 우회 (Vercel, Netlify Functions)
- nginx 리버스 프록시

## 자주 하는 실수

| 실수 | 문제 |
|------|------|
| 서버에서 * + credentials 동시 사용 | 불가능, 특정 도메인 명시 필요 |
| 프론트에서만 해결하려 함 | CORS는 서버가 허용해야 함 |
| Preflight 캐시 안 함 | 매 요청마다 OPTIONS 발생 → 성능 저하 |

## Study

**Q. CORS가 왜 필요한가?**

브라우저의 동일 출처 정책은 악의적인 사이트가 다른 사이트의 API를 무단으로 호출하는 것을 방지합니다. CORS는 서버가 명시적으로 허용한 출처만 접근할 수 있게 하여, 보안을 유지하면서 필요한 교차 출처 요청을 가능하게 합니다.

**Q. Preflight 요청이란?**

단순 요청 조건을 만족하지 않는 경우(PUT, DELETE, Content-Type: application/json 등) 브라우저가 본 요청 전에 OPTIONS 메서드로 서버에 허용 여부를 먼저 확인하는 요청입니다.

**Q. CORS 에러 해결 방법?**

근본적으로는 서버에서 Access-Control-Allow-Origin 헤더로 해당 출처를 허용해야 합니다. 개발 환경에서는 Vite나 Webpack의 프록시 설정으로 우회할 수 있습니다.

**Q. CORS는 누가 차단하는 건가?**

브라우저가 차단합니다. 서버는 정상적으로 응답하지만, 브라우저가 응답 헤더를 확인하고 허용되지 않은 출처면 JavaScript에서 응답에 접근하지 못하게 막습니다. 그래서 Postman이나 curl에서는 CORS 에러가 발생하지 않습니다.