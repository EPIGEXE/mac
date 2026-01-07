# DNS Deep Dive

## DNS란?

사람은 `www.google.com`을 기억하지만, 컴퓨터는 IP 주소로 통신한다. **DNS(Domain Name System)**는 도메인 이름을 IP 주소로 변환하는 시스템이다.

- 도메인 → IP: `www.google.com` → `142.250.196.110`
- 전화번호부와 유사: 이름으로 번호를 찾음
- 분산 데이터베이스: 전 세계 DNS 서버가 협력

DNS가 없다면 모든 웹사이트의 IP 주소를 외워야 한다.

---

## 도메인 구조

도메인은 **오른쪽에서 왼쪽으로** 계층 구조를 가진다.

```
www.example.com.
│   │       │  │
│   │       │  └─ Root (생략됨)
│   │       └──── TLD (Top-Level Domain)
│   └──────────── SLD (Second-Level Domain)
└──────────────── Subdomain
```

### 계층별 설명

**Root (.)**: 모든 도메인의 최상위. 보통 생략하지만 `www.example.com.`처럼 끝에 점이 있다.

**TLD (Top-Level Domain)**: 최상위 도메인.

- gTLD (Generic): .com, .org, .net, .io, .dev
- ccTLD (Country Code): .kr, .jp, .uk, .de
- New gTLD: .app, .blog, .shop

**SLD (Second-Level Domain)**: 실제로 등록하는 도메인. example, google, naver 등.

**Subdomain**: SLD 앞에 붙는 하위 도메인. www, api, mail, blog 등. 소유자가 자유롭게 생성.

### FQDN (Fully Qualified Domain Name)

전체 도메인 경로를 명시한 것이다.

```
www.example.com.  ← FQDN (끝에 점 포함)
www.example.com   ← 일반적 표기 (점 생략)
```

---

## DNS 동작 과정

브라우저에 `www.example.com`을 입력했을 때 일어나는 일이다.

### 1단계: 로컬 캐시 확인

가장 먼저 캐시를 확인한다.

- 브라우저 DNS 캐시
- OS DNS 캐시
- hosts 파일 (`/etc/hosts`, `C:\Windows\System32\drivers\etc\hosts`)

캐시에 있으면 바로 사용하고 끝.

### 2단계: Recursive Resolver에 질의

캐시에 없으면 **Recursive Resolver(재귀 리졸버)**에게 질의한다.

- ISP가 제공하거나 (기본 설정)
- 직접 설정: Google (8.8.8.8), Cloudflare (1.1.1.1)

Recursive Resolver는 클라이언트 대신 여러 DNS 서버를 돌아다니며 답을 찾아온다.

### 3단계: 계층적 질의 (Resolver가 수행)

Resolver가 캐시에 없으면 Root부터 차례로 질의한다.

```
┌──────────┐      ┌─────────────────┐
│ Client   │─────→│ Recursive       │
│          │←─────│ Resolver        │
└──────────┘      └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Root DNS     │  │  TLD DNS      │  │ Authoritative │
│  (.)          │  │  (.com)       │  │ (example.com) │
└───────────────┘  └───────────────┘  └───────────────┘
```

**Step 1: Root DNS 질의**

```
Q: www.example.com의 IP?
A: 모르겠고, .com TLD 서버 주소는 여기야
```

**Step 2: TLD DNS 질의**

```
Q: www.example.com의 IP?
A: 모르겠고, example.com의 Authoritative 서버 주소는 여기야
```

**Step 3: Authoritative DNS 질의**

```
Q: www.example.com의 IP?
A: 93.184.216.34
```

### 4단계: 응답 반환 및 캐시

Resolver가 결과를 클라이언트에게 반환하고, TTL 동안 캐시한다.

---

## DNS 서버 종류

### Root DNS Server

전 세계에 13개 루트 서버 그룹(A~M)이 있다.

- 실제로는 Anycast로 수백 대가 분산 운영
- Root Zone 파일 관리 (TLD 서버 목록)
- ICANN이 관리

### TLD DNS Server

각 TLD를 관리한다.

- .com, .net: Verisign
- .org: Public Interest Registry
- .kr: KISA (한국인터넷진흥원)

### Authoritative DNS Server

실제 도메인의 레코드를 가지고 있는 서버다.

- example.com의 공식 DNS 정보 보유
- 도메인 소유자가 관리 (또는 호스팅 업체 위임)
- AWS Route 53, Cloudflare DNS 등

### Recursive Resolver

클라이언트 대신 DNS 질의를 수행하는 서버다.

- ISP 제공 DNS
- Public DNS: Google (8.8.8.8), Cloudflare (1.1.1.1), Quad9 (9.9.9.9)
- 캐싱으로 응답 속도 향상

---

## DNS 레코드 타입

DNS 서버에 저장되는 레코드의 종류다.

### A (Address)

도메인을 **IPv4 주소**로 매핑한다.

```
example.com.    A    93.184.216.34
```

### AAAA (IPv6 Address)

도메인을 **IPv6 주소**로 매핑한다.

```
example.com.    AAAA    2606:2800:220:1:248:1893:25c8:1946
```

### CNAME (Canonical Name)

도메인을 **다른 도메인**으로 매핑한다. 별칭(Alias).

```
www.example.com.    CNAME    example.com.
blog.example.com.   CNAME    example.github.io.
```

- www를 루트 도메인으로 연결
- 서브도메인을 외부 서비스로 연결

주의: CNAME은 다른 레코드와 공존 불가 (루트 도메인에 사용 불가).

### MX (Mail Exchange)

메일 서버를 지정한다.

```
example.com.    MX    10 mail1.example.com.
example.com.    MX    20 mail2.example.com.
```

- 숫자는 우선순위 (낮을수록 높음)
- 10번 서버 실패 시 20번으로

### TXT (Text)

임의의 텍스트를 저장한다.

```
example.com.    TXT    "v=spf1 include:_spf.google.com ~all"
_dmarc.example.com.    TXT    "v=DMARC1; p=reject"
```

용도:
- SPF: 메일 발송 서버 인증
- DKIM: 메일 서명 검증
- DMARC: 메일 정책
- 도메인 소유권 확인 (Google, Let's Encrypt 등)

### NS (Name Server)

해당 도메인의 Authoritative DNS 서버를 지정한다.

```
example.com.    NS    ns1.example.com.
example.com.    NS    ns2.example.com.
```

### SOA (Start of Authority)

도메인의 권한 시작점과 관리 정보를 담는다.

```
example.com.    SOA    ns1.example.com. admin.example.com. (
                       2024010101 ; Serial
                       7200       ; Refresh
                       3600       ; Retry
                       1209600    ; Expire
                       86400 )    ; Minimum TTL
```

### PTR (Pointer)

IP 주소를 도메인으로 **역방향 조회**한다.

```
34.216.184.93.in-addr.arpa.    PTR    example.com.
```

메일 서버 검증, 로그 분석 등에 사용.

### 레코드 요약

| 타입 | 용도 | 예시 값 |
|------|------|--------|
| A | 도메인 → IPv4 | 93.184.216.34 |
| AAAA | 도메인 → IPv6 | 2606:2800:... |
| CNAME | 도메인 → 도메인 (별칭) | example.com |
| MX | 메일 서버 | 10 mail.example.com |
| TXT | 텍스트 (SPF, 인증) | "v=spf1 ..." |
| NS | 네임서버 | ns1.example.com |
| PTR | IP → 도메인 (역방향) | example.com |

---

## TTL (Time To Live)

DNS 레코드가 캐시에 유지되는 시간(초)이다.

```
example.com.    300    A    93.184.216.34
                 └─ TTL: 300초 (5분)
```

### TTL 설정 전략

**짧은 TTL (60~300초)**:
- 장점: 변경 사항 빠르게 반영
- 단점: DNS 쿼리 증가, 응답 지연
- 용도: 서버 마이그레이션 준비, 장애 대응

**긴 TTL (3600~86400초)**:
- 장점: 캐시 히트율 증가, 빠른 응답
- 단점: 변경 반영 느림
- 용도: 안정적인 서비스, 정적 자원

### 마이그레이션 전략

서버 IP를 변경할 때:

1. 며칠 전 TTL을 60초로 낮춤
2. 기존 TTL 만료 대기
3. IP 변경
4. 안정화 후 TTL 원복

---

## DNS 캐싱

DNS 응답은 여러 단계에서 캐싱된다.

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Browser   │ → │    OS      │ → │  Resolver  │ → │    DNS     │
│   Cache    │    │   Cache    │    │   Cache    │    │   Server   │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
```

### 캐시 확인/삭제

**브라우저:**
- Chrome: `chrome://net-internals/#dns`
- Clear: 브라우저 캐시 삭제

**OS:**

```bash
# Windows
ipconfig /displaydns
ipconfig /flushdns

# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
```

### DNS 조회 명령어

```bash
# nslookup
nslookup example.com
nslookup -type=MX example.com

# dig (더 상세)
dig example.com
dig example.com MX
dig +trace example.com  # 전체 경로 추적
dig @8.8.8.8 example.com  # 특정 DNS 서버로 질의
```

---

## DNS 보안

### DNS Spoofing / Cache Poisoning

공격자가 가짜 DNS 응답을 주입하여 캐시를 오염시킨다.

- 사용자가 정상 도메인 접속 시도
- 가짜 IP로 연결됨 (피싱 사이트)

### DNSSEC (DNS Security Extensions)

DNS 응답에 디지털 서명을 추가하여 위변조를 방지한다.

- 레코드에 서명 추가 (RRSIG)
- 공개키로 서명 검증 (DNSKEY)
- 체인 형태로 Root까지 검증

```
example.com.    A       93.184.216.34
example.com.    RRSIG   A 8 2 86400 20240201...  ← 서명
```

### DoH (DNS over HTTPS)

DNS 쿼리를 HTTPS로 암호화한다.

- 기존 DNS: UDP 53, 평문 → ISP가 조회 내용 볼 수 있음
- DoH: HTTPS 443 → 암호화되어 프라이버시 보호

```
https://dns.google/dns-query
https://cloudflare-dns.com/dns-query
```

### DoT (DNS over TLS)

DNS 쿼리를 TLS로 암호화한다.

- 포트 853 사용
- DoH보다 약간 빠름 (HTTP 오버헤드 없음)

---

## 실무 패턴

### 로드밸런싱

하나의 도메인에 여러 IP를 등록하여 부하 분산.

```
example.com.    A    1.2.3.4
example.com.    A    1.2.3.5
example.com.    A    1.2.3.6
```

DNS가 라운드로빈으로 응답하거나, 가중치 기반으로 분산.

### 지역 기반 라우팅 (GeoDNS)

사용자 위치에 따라 가장 가까운 서버 IP 반환.

- 한국 사용자 → 한국 서버 IP
- 미국 사용자 → 미국 서버 IP

AWS Route 53, Cloudflare에서 지원.

### Failover

Primary 서버 장애 시 Backup으로 전환.

- Health Check로 서버 상태 모니터링
- Primary 다운 → Backup IP 응답

### 서브도메인 위임

서브도메인의 DNS 관리를 다른 서버에 위임.

```
example.com.        NS    ns1.example.com.
dev.example.com.    NS    ns1.dev-dns.com.  ← 별도 관리
```

---

## 면접 예상 질문

**Q. DNS 동작 과정을 설명하시오.**

브라우저가 도메인을 입력하면 먼저 로컬 캐시를 확인한다. 없으면 Recursive Resolver에 질의한다. Resolver는 캐시가 없으면 Root DNS에서 TLD 서버 주소를, TLD DNS에서 Authoritative 서버 주소를 얻어 최종적으로 IP를 받아온다. 결과는 TTL 동안 캐싱된다.

**Q. A 레코드와 CNAME의 차이점은?**

A 레코드는 도메인을 IP 주소로 직접 매핑한다. CNAME은 도메인을 다른 도메인으로 매핑하는 별칭이다. CNAME은 최종적으로 A 레코드를 따라가야 IP를 얻는다. CNAME은 루트 도메인에 사용할 수 없고, 다른 레코드와 공존할 수 없다.

**Q. TTL이란 무엇이고 어떻게 설정해야 하나?**

TTL은 DNS 레코드가 캐시에 유지되는 시간(초)이다. 짧으면 변경이 빠르게 반영되지만 DNS 쿼리가 증가하고, 길면 캐시 히트율이 높지만 변경 반영이 느리다. 평소에는 3600초 정도로 설정하고, 서버 마이그레이션 전에는 60초로 낮춰 변경 후 빠르게 반영되도록 한다.

**Q. DNS가 UDP를 사용하는 이유는?**

DNS 요청/응답은 보통 512바이트 이하로 작고, 연결 수립 오버헤드가 부담이다. 손실 시 애플리케이션이 단순 재시도하면 된다. DNS 서버는 수많은 클라이언트를 처리해야 해서 연결 상태 유지도 부담이다. 다만 응답이 크거나 Zone Transfer 시에는 TCP를 사용한다.

**Q. DNSSEC이란 무엇인가?**

DNS 응답에 디지털 서명을 추가하여 위변조를 방지하는 보안 확장이다. 공격자가 가짜 DNS 응답을 주입하는 DNS Spoofing/Cache Poisoning을 방어한다. 각 레코드에 서명(RRSIG)이 추가되고, 공개키(DNSKEY)로 검증하며, Root까지 체인 형태로 신뢰를 확인한다.