# 브라우저 저장소 (LocalStorage / SessionStorage / Cookie)

## 개요

| 저장소 | 용량 | 수명 | 서버 전송 |
|--------|------|------|-----------|
| Cookie | 4KB | 만료일 설정 가능 | 자동 전송 |
| localStorage | 5~10MB | 영구 (직접 삭제 전까지) | X |
| sessionStorage | 5~10MB | 탭 종료 시 삭제 | X |

## Web Storage (localStorage / sessionStorage)

HTML5에서 도입된 클라이언트 전용 저장소입니다. 쿠키의 용량 제한(4KB)과 매 요청마다 서버로 전송되는 문제를 해결하기 위해 등장했습니다.

### localStorage

```javascript
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');  // 'dark'
localStorage.removeItem('theme');
localStorage.clear();  // 전체 삭제
```

- 브라우저를 꺼도 유지됨 (영구 저장)
- 같은 출처의 모든 탭/창에서 공유
- 직접 삭제하기 전까지 유지

**용도:** 다크모드 설정, 최근 본 상품, 사용자 환경설정

### sessionStorage

```javascript
sessionStorage.setItem('formData', JSON.stringify(data));
sessionStorage.getItem('formData');
```

- 탭/창 종료 시 삭제
- 탭마다 독립적 (다른 탭과 공유 안 됨)
- 같은 탭에서 새로고침해도 유지

**용도:** 폼 임시 저장, 탭별로 달라야 하는 상태, 일회성 데이터

### localStorage vs sessionStorage

| 항목 | localStorage | sessionStorage |
|------|--------------|----------------|
| 수명 | 영구 | 탭 종료 시 삭제 |
| 탭 간 공유 | O (같은 출처) | X (탭마다 독립) |
| 새로고침 | 유지 | 유지 |

## Cookie

HTTP의 무상태성을 극복하기 위해 설계된 메커니즘입니다.

```javascript
// 설정
document.cookie = "user=john; max-age=3600; path=/";

// 읽기 (문자열로 반환)
document.cookie;  // "user=john; theme=dark"
```

### 쿠키 속성

| 속성 | 설명 |
|------|------|
| max-age / expires | 만료 시간 (없으면 세션 쿠키) |
| path | 쿠키가 전송될 경로 |
| domain | 쿠키가 전송될 도메인 |
| secure | HTTPS에서만 전송 |
| httpOnly | JavaScript 접근 차단 |
| sameSite | CSRF 방어 (Strict / Lax / None) |

### 보안 속성 상세

**HttpOnly**
```
Set-Cookie: session=abc; HttpOnly
```
- JavaScript에서 `document.cookie`로 접근 불가
- XSS 공격으로 쿠키 탈취 방지
- 서버에서만 설정 가능

**Secure**
```
Set-Cookie: session=abc; Secure
```
- HTTPS 연결에서만 쿠키 전송
- HTTP에서는 전송 안 됨

**SameSite**
```
Set-Cookie: session=abc; SameSite=Strict
```
- CSRF 공격 방어
- Strict: 같은 사이트 요청에만 쿠키 전송
- Lax: 일부 cross-site 요청 허용 (링크 클릭 등)
- None: 모든 요청에 전송 (Secure 필수)

## Cookie vs Web Storage

| 항목 | Cookie | Web Storage |
|------|--------|-------------|
| 용량 | 4KB | 5~10MB |
| 서버 전송 | 매 요청마다 자동 | 전송 안 됨 |
| 만료 | 설정 가능 | localStorage: 영구 / sessionStorage: 탭 종료 |
| 보안 | HttpOnly로 JS 차단 가능 | JS에서 항상 접근 가능 |
| 용도 | 인증, 서버와 공유할 데이터 | 클라이언트 전용 데이터 |

## 보안 취약점

### XSS (Cross-Site Scripting)

악성 스크립트가 삽입되어 JavaScript로 저장소에 접근하는 공격

| 저장소 | 취약 여부 |
|--------|-----------|
| localStorage | 취약 (JS로 접근 가능) |
| sessionStorage | 취약 (JS로 접근 가능) |
| Cookie | HttpOnly 설정 시 안전 |

### CSRF (Cross-Site Request Forgery)

사용자 모르게 요청을 위조하는 공격 (쿠키가 자동 전송되는 점 악용)

| 저장소 | 취약 여부 |
|--------|-----------|
| localStorage | 안전 (자동 전송 안 됨) |
| sessionStorage | 안전 (자동 전송 안 됨) |
| Cookie | 취약 (SameSite로 방어) |

---

## JWT 토큰 저장 위치 논쟁

### 선택지

| 위치 | 장점 | 단점 |
|------|------|------|
| localStorage | CSRF 안전, 구현 쉬움 | XSS에 취약 |
| Cookie (HttpOnly) | XSS 안전 | CSRF 취약, SameSite 설정 필요 |
| 메모리 (변수) | XSS/CSRF 안전 | 새로고침 시 사라짐 |

### 실무 권장

**Access Token:** 메모리 또는 짧은 만료의 Cookie (HttpOnly)
**Refresh Token:** Cookie (HttpOnly, Secure, SameSite=Strict)

또는 BFF(Backend for Frontend) 패턴으로 서버에서 토큰 관리

### 논의

> "정답은 없지만, XSS와 CSRF 중 어떤 위협이 더 큰지에 따라 다릅니다. 
> XSS는 CSP와 입력 검증으로 어느 정도 방어 가능하므로 localStorage를 쓰기도 하고,
> 보안이 중요하면 HttpOnly 쿠키에 저장하고 CSRF는 SameSite와 토큰으로 방어합니다.
> 가장 안전한 건 Refresh Token만 HttpOnly 쿠키에 저장하고 Access Token은 메모리에 두는 방식입니다."

## 용도별 선택 가이드

| 용도 | 추천 저장소 |
|------|-------------|
| 로그인 세션/인증 | Cookie (HttpOnly) |
| 다크모드, 언어 설정 | localStorage |
| 폼 임시 저장 | sessionStorage |
| 장바구니 (비로그인) | localStorage |
| JWT Access Token | 메모리 또는 Cookie |
| JWT Refresh Token | Cookie (HttpOnly, Secure) |

## Study

**Q. localStorage와 sessionStorage 차이?**

둘 다 5~10MB 용량의 클라이언트 저장소입니다. localStorage는 브라우저를 꺼도 유지되고 탭 간 공유되지만, sessionStorage는 탭 종료 시 삭제되고 탭마다 독립적입니다.

**Q. 쿠키와 Web Storage 차이?**

쿠키는 4KB 제한이 있고 매 HTTP 요청마다 서버로 자동 전송됩니다. Web Storage는 5~10MB로 크고 서버로 전송되지 않아 클라이언트 전용 데이터에 적합합니다. 쿠키는 HttpOnly로 XSS를 방어할 수 있지만, Web Storage는 항상 JavaScript로 접근 가능합니다.

**Q. JWT 토큰을 어디에 저장해야 하나?**

localStorage는 XSS에 취약하고, Cookie는 CSRF에 취약합니다. 보안이 중요하면 Refresh Token은 HttpOnly 쿠키에, Access Token은 메모리에 저장하고 짧은 만료 시간을 설정하는 방식을 권장합니다.