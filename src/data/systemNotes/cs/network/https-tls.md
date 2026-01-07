# HTTPS와 TLS Deep Dive

## 왜 HTTPS가 필요한가?

HTTP는 평문(Plain Text)으로 통신한다. 중간에서 누군가 패킷을 가로채면 내용이 그대로 노출된다.

- 도청(Eavesdropping): 로그인 정보, 개인정보가 그대로 보임
- 변조(Tampering): 중간에서 응답을 수정할 수 있음
- 위장(Impersonation): 가짜 서버가 진짜인 척 할 수 있음

**HTTPS**는 HTTP에 **TLS(Transport Layer Security)** 암호화를 추가하여 이 문제를 해결한다.

---

## TLS가 제공하는 세 가지

TLS는 다음 세 가지를 보장한다.

- **기밀성(Confidentiality)**: 암호화로 제3자가 내용을 볼 수 없음
- **무결성(Integrity)**: 데이터가 중간에 변조되면 감지됨
- **인증(Authentication)**: 통신 상대방이 진짜인지 확인 (인증서)

```
HTTP:
클라이언트 ──[평문]──→ 서버
           (도청 가능)

HTTPS:
클라이언트 ──[암호화]──→ 서버
           (해독 불가)
```

---

## 대칭키 vs 비대칭키 암호화

TLS는 두 가지 암호화 방식을 조합해서 사용한다.

### 대칭키 암호화 (Symmetric)

하나의 키로 암호화와 복호화를 모두 수행한다.

- 장점: 빠름, 대용량 데이터 처리에 적합
- 단점: 키를 안전하게 공유하는 방법이 문제
- 예시: AES, ChaCha20

```
암호화: 평문 + 키 → 암호문
복호화: 암호문 + 키 → 평문
```

문제는 처음에 이 키를 어떻게 상대방에게 전달하느냐다. 키를 평문으로 보내면 도청당한다.

### 비대칭키 암호화 (Asymmetric)

공개키(Public Key)와 개인키(Private Key) 쌍을 사용한다.

- 공개키로 암호화 → 개인키로만 복호화
- 개인키로 서명 → 공개키로 검증
- 장점: 키 공유 문제 해결
- 단점: 대칭키보다 1000배 이상 느림
- 예시: RSA, ECDSA, Ed25519

```
A → B 전송:
1. B가 공개키를 공개
2. A가 B의 공개키로 암호화
3. B만 개인키로 복호화 가능
```

### TLS의 조합

TLS는 두 방식의 장점을 조합한다.

- 비대칭키: 처음에 대칭키를 안전하게 교환
- 대칭키: 이후 실제 데이터 암호화 (빠름)

이렇게 교환된 대칭키를 **세션 키(Session Key)**라고 한다.

---

## 인증서 (Certificate)

### 왜 인증서가 필요한가?

비대칭키 암호화로 키 교환 문제는 해결했다. 하지만 새로운 문제가 있다.

- 서버가 공개키를 보냄
- 클라이언트가 이 공개키로 데이터를 암호화
- 그런데 이 공개키가 **진짜 서버의 것**인지 어떻게 아는가?

공격자가 중간에서 자기 공개키를 전달하면, 클라이언트는 공격자에게 데이터를 보내게 된다 (MITM 공격).

**인증서**는 "이 공개키가 이 도메인의 것이 맞다"를 **신뢰할 수 있는 제3자(CA)**가 보증하는 문서다.

### 인증서 구조

인증서에는 다음 정보가 포함된다.

- 도메인 이름 (Subject)
- 서버의 공개키
- 발급자 (Issuer, CA 이름)
- 유효 기간
- CA의 디지털 서명

```
┌─────────────────────────────────────┐
│ Subject: www.example.com           │
│ Public Key: 30 82 01 0a 02 82...   │
│ Issuer: Let's Encrypt Authority X3 │
│ Valid: 2024-01-01 ~ 2024-03-31     │
│ Signature: 4a 7b 2c 8d 9e...       │ ← CA가 개인키로 서명
└─────────────────────────────────────┘
```

### 인증서 검증 과정

클라이언트(브라우저)가 인증서를 검증하는 과정이다.

1. 서버가 인증서 전송
2. 인증서의 도메인이 접속한 도메인과 일치하는지 확인
3. 유효 기간이 지나지 않았는지 확인
4. CA의 공개키로 서명 검증 (CA가 진짜 서명했는지)
5. CA가 신뢰할 수 있는 CA인지 확인 (브라우저/OS에 내장된 Root CA 목록)

### 인증서 체인 (Chain of Trust)

Root CA가 직접 모든 인증서를 발급하면 보안 위험이 크다. 대신 계층 구조를 사용한다.

```
Root CA (브라우저에 내장)
    │
    └── Intermediate CA (Root가 서명)
            │
            └── 서버 인증서 (Intermediate가 서명)
```

서버는 자신의 인증서 + Intermediate 인증서를 함께 보낸다. 클라이언트는 체인을 따라 올라가며 Root CA까지 검증한다.

### 인증서 종류

**DV (Domain Validation)**: 도메인 소유만 확인. 가장 저렴하고 빠름. Let's Encrypt 무료 발급.

**OV (Organization Validation)**: 조직 실체 확인. 사업자등록증 등 서류 검토.

**EV (Extended Validation)**: 가장 엄격한 검증. 예전에는 주소창이 녹색으로 표시되었으나 현재는 대부분 폐지.

---

## TLS Handshake

TLS 연결을 수립하는 과정이다. TCP 3-way handshake 이후에 진행된다.

### TLS 1.2 Handshake

```
Client                                         Server
   │                                              │
   │──── ClientHello ───────────────────────────→│
   │     (지원하는 암호 스위트, 랜덤값)              │
   │                                              │
   │←─── ServerHello ─────────────────────────────│
   │     (선택한 암호 스위트, 랜덤값)               │
   │←─── Certificate ─────────────────────────────│
   │     (서버 인증서)                             │
   │←─── ServerKeyExchange ───────────────────────│
   │     (키 교환 파라미터, DH인 경우)              │
   │←─── ServerHelloDone ─────────────────────────│
   │                                              │
   │──── ClientKeyExchange ─────────────────────→│
   │     (Pre-master secret)                     │
   │──── ChangeCipherSpec ──────────────────────→│
   │──── Finished ──────────────────────────────→│
   │                                              │
   │←─── ChangeCipherSpec ────────────────────────│
   │←─── Finished ────────────────────────────────│
   │                                              │
   │         [암호화된 통신 시작]                   │
```

총 **2 RTT**가 필요하다 (TCP handshake 제외).

### TLS 1.3 Handshake

TLS 1.3은 handshake를 **1 RTT**로 단축했다.

```
Client                                         Server
   │                                              │
   │──── ClientHello ───────────────────────────→│
   │     (지원 암호, 랜덤값, 키 공유)               │
   │                                              │
   │←─── ServerHello ─────────────────────────────│
   │←─── EncryptedExtensions ─────────────────────│
   │←─── Certificate ─────────────────────────────│
   │←─── CertificateVerify ───────────────────────│
   │←─── Finished ────────────────────────────────│
   │                                              │
   │──── Finished ──────────────────────────────→│
   │                                              │
   │         [암호화된 통신 시작]                   │
```

주요 개선점:

- 1 RTT로 단축 (0-RTT도 가능)
- 취약한 암호 스위트 제거 (RSA 키 교환, CBC 모드 등)
- Handshake 메시지도 암호화 (Certificate부터)
- 모든 연결에 Forward Secrecy 필수

### 0-RTT Resumption

이전에 연결한 적 있는 서버라면, 첫 메시지부터 암호화된 데이터를 보낼 수 있다.

- 이전 세션의 PSK(Pre-Shared Key) 사용
- 첫 패킷에 애플리케이션 데이터 포함

단점: Replay Attack에 취약할 수 있어 멱등한 요청에만 사용 권장.

---

## 암호 스위트 (Cipher Suite)

TLS에서 사용할 알고리즘 조합을 정의한다.

### TLS 1.2 형식

```
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
│   │     │        │   │   │    │
│   │     │        │   │   │    └─ MAC/PRF 해시
│   │     │        │   │   └────── 블록 암호 모드
│   │     │        │   └────────── 키 길이
│   │     │        └────────────── 대칭 암호
│   │     └─────────────────────── 인증 알고리즘
│   └───────────────────────────── 키 교환 알고리즘
└───────────────────────────────── 프로토콜
```

- ECDHE: 키 교환 (Elliptic Curve Diffie-Hellman Ephemeral)
- RSA: 서버 인증 (인증서 서명 검증)
- AES_256_GCM: 대칭 암호화 (256비트 AES, GCM 모드)
- SHA384: 해시 함수

### TLS 1.3 형식

TLS 1.3은 형식이 간소화되었다.

```
TLS_AES_256_GCM_SHA384
```

키 교환은 ECDHE 또는 DHE로 고정, 인증은 별도 협상.

### 권장 설정

2024년 기준 권장 암호 스위트:

- TLS_AES_256_GCM_SHA384 (TLS 1.3)
- TLS_CHACHA20_POLY1305_SHA256 (TLS 1.3, 모바일에 효율적)
- TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 (TLS 1.2)

피해야 할 것:

- RC4, DES, 3DES (취약)
- MD5, SHA1 (취약)
- RSA 키 교환 (Forward Secrecy 없음)
- CBC 모드 (BEAST, POODLE 공격)

---

## Forward Secrecy (전방 비밀성)

### 문제 상황

RSA 키 교환 방식에서 서버의 개인키가 유출되면 어떻게 될까?

- 공격자가 과거 트래픽을 저장해두었다면
- 유출된 개인키로 세션 키를 복호화
- 과거의 모든 통신 내용이 노출됨

### Forward Secrecy란?

개인키가 유출되어도 **과거 세션의 데이터는 안전**한 성질이다.

DHE(Diffie-Hellman Ephemeral)와 ECDHE는 매 연결마다 임시 키 쌍을 생성한다.

- 세션 키가 서버 개인키와 무관하게 생성됨
- 서버 개인키 유출 → 과거 세션 키 복구 불가
- 각 세션의 임시 키는 세션 종료 후 폐기

TLS 1.3은 모든 키 교환에 Forward Secrecy를 필수로 요구한다.

---

## HTTPS 적용 시 고려사항

### Mixed Content

HTTPS 페이지에서 HTTP 리소스를 로드하면 브라우저가 차단하거나 경고한다.

- 이미지, 스크립트, 스타일시트 등 모든 리소스가 HTTPS여야 함
- Content-Security-Policy로 강제 가능

```
Content-Security-Policy: upgrade-insecure-requests
```

### HSTS (HTTP Strict Transport Security)

브라우저가 해당 도메인에 항상 HTTPS로만 접속하도록 강제한다.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- max-age: HSTS 유효 기간 (초)
- includeSubDomains: 서브도메인에도 적용
- preload: 브라우저에 미리 등록 (hstspreload.org)

HSTS가 없으면 첫 HTTP 요청 시 MITM으로 다운그레이드 공격 가능.

### 인증서 관리

- 유효 기간 만료 전 갱신 필수 (Let's Encrypt는 90일)
- 자동 갱신 설정 (certbot 등)
- 인증서 체인 올바르게 구성

### 성능

TLS handshake는 추가 RTT가 필요하다.

- TLS 1.3 사용 (1 RTT)
- Session Resumption 활용
- OCSP Stapling (인증서 유효성 확인 최적화)
- HTTP/2, HTTP/3 사용 (멀티플렉싱)

---

## 인증서 발급 방법

### Let's Encrypt (무료)

무료로 DV 인증서를 발급하는 CA다.

```bash
# certbot 설치 후
sudo certbot --nginx -d example.com -d www.example.com

# 자동 갱신
sudo certbot renew --dry-run
```

ACME 프로토콜로 자동화된 도메인 검증:

- HTTP-01: 특정 경로에 토큰 파일 배치
- DNS-01: DNS TXT 레코드에 토큰 추가

### 유료 CA

DigiCert, Comodo, GlobalSign 등. OV/EV 인증서나 와일드카드 인증서 필요 시 사용.

---

## 면접 예상 질문

**Q. HTTPS가 HTTP보다 안전한 이유는?**

HTTPS는 TLS로 암호화되어 세 가지를 보장한다. 기밀성은 암호화로 제3자가 내용을 볼 수 없게 한다. 무결성은 데이터 변조 시 감지할 수 있다. 인증은 인증서로 서버가 진짜인지 확인한다. HTTP는 평문이라 도청, 변조, 위장 공격에 취약하다.

**Q. 대칭키와 비대칭키 암호화의 차이점은?**

대칭키는 하나의 키로 암호화/복호화하여 빠르지만 키 공유가 문제다. 비대칭키는 공개키/개인키 쌍을 사용하여 키 공유 문제를 해결하지만 느리다. TLS는 비대칭키로 대칭키(세션 키)를 안전하게 교환하고, 이후 대칭키로 데이터를 암호화하여 두 방식의 장점을 조합한다.

**Q. TLS Handshake 과정을 설명하시오.**

클라이언트가 지원하는 암호 스위트와 랜덤값을 보내면, 서버가 암호 스위트를 선택하고 인증서를 보낸다. 클라이언트는 인증서를 검증하고 키 교환을 수행하여 양쪽이 세션 키를 생성한다. 이후 암호화된 통신이 시작된다. TLS 1.2는 2 RTT, TLS 1.3은 1 RTT가 필요하다.

**Q. 인증서의 역할은 무엇인가?**

인증서는 서버의 공개키가 해당 도메인의 것임을 신뢰할 수 있는 제3자(CA)가 보증하는 문서다. CA가 서버의 도메인 소유를 확인하고 자신의 개인키로 서명한다. 클라이언트는 CA의 공개키(브라우저에 내장)로 서명을 검증하여 서버가 진짜인지 확인한다.

**Q. Forward Secrecy란 무엇인가?**

서버의 개인키가 유출되어도 과거 세션의 데이터가 안전한 성질이다. DHE/ECDHE 키 교환은 매 연결마다 임시 키를 생성하여 세션 키가 서버 개인키와 무관하다. 세션 종료 후 임시 키가 폐기되므로 과거 트래픽을 복호화할 수 없다. TLS 1.3은 이를 필수로 요구한다.