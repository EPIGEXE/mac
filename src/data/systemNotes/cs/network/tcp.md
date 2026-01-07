# TCP

## TCP란?

**TCP(Transmission Control Protocol)**는 IP 위에서 동작하는 전송 계층 프로토콜이다. IP는 패킷을 목적지까지 배달하지만, 도착 여부, 순서, 중복 여부를 보장하지 않는 "최선형(Best-effort)" 프로토콜이다. TCP는 이 불안정한 IP 위에서 **신뢰성 있는 바이트 스트림**을 제공한다.

- 연결 지향: 데이터 전송 전 연결 수립 (3-way handshake)
- 신뢰성: 손실된 세그먼트 재전송, 중복 제거
- 순서 보장: Sequence Number로 순서 재정렬
- 흐름 제어: 수신자가 처리할 수 있는 속도로 전송
- 혼잡 제어: 네트워크 상황에 맞춰 전송량 조절

HTTP, HTTPS, SSH, FTP, SMTP 등 데이터가 정확히 도착해야 하는 대부분의 애플리케이션이 TCP를 사용한다.

---

## TCP 헤더 구조

TCP 세그먼트는 헤더와 데이터(페이로드)로 구성된다. 헤더는 기본 **20바이트**이며, 옵션이 있으면 최대 **60바이트**까지 늘어난다.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┤
│          Source Port          │       Destination Port        │
├───────────────────────────────┴───────────────────────────────┤
│                        Sequence Number                        │
├───────────────────────────────────────────────────────────────┤
│                    Acknowledgment Number                      │
├───────┬───────┬─┬─┬─┬─┬─┬─┬───────────────────────────────────┤
│  Data │       │U│A│P│R│S│F│                                   │
│ Offset│ Rsrvd │R│C│S│S│Y│I│            Window Size            │
│       │       │G│K│H│T│N│N│                                   │
├───────┴───────┴─┴─┴─┴─┴─┴─┴───────────────────────────────────┤
│           Checksum            │         Urgent Pointer        │
├───────────────────────────────┴───────────────────────────────┤
│                    Options (if any)                           │
├───────────────────────────────────────────────────────────────┤
│                             Data                              │
└───────────────────────────────────────────────────────────────┘
```

### 주요 필드 상세

**Source Port / Destination Port (각 16비트)**

송신/수신 프로세스를 식별한다. IP 주소가 호스트를 식별하고, 포트 번호가 프로세스를 식별한다. 0~65535 범위.

**Sequence Number (32비트)**

TCP는 **바이트 스트림** 프로토콜이다. 전송하는 모든 바이트에 번호가 붙는다. Sequence Number는 이 세그먼트의 첫 번째 바이트 번호다.

- 연결 수립 시 **ISN(Initial Sequence Number)**에서 시작
- 이후 전송한 바이트 수만큼 증가
- 예: ISN=1000이고 100바이트 전송 → 다음 Seq=1100

32비트이므로 0~4,294,967,295 범위. 최대값 넘으면 0으로 순환(wrap around).

**Acknowledgment Number (32비트)**

"여기까지 잘 받았고, 다음에 이 번호를 기대한다"는 의미다. **누적 확인(Cumulative ACK)** 방식이다.

- ACK=1001이면 "1000번 바이트까지 받았고, 1001번을 보내달라"
- ACK 플래그가 설정되어 있을 때만 유효
- 중간에 빠진 것이 있으면 그 이전까지만 ACK

**Data Offset (4비트)**

헤더 길이를 **32비트(4바이트) 워드** 단위로 표시한다.

- 최소 5 = 20바이트 (옵션 없음)
- 최대 15 = 60바이트 (옵션 40바이트)

**Control Flags (6비트)**

| 플래그 | 의미 | 용도 |
|--------|------|------|
| URG | Urgent | Urgent Pointer 유효, 긴급 데이터 있음 |
| ACK | Acknowledgment | ACK Number 유효 (연결 후 거의 항상 1) |
| PSH | Push | 버퍼링 없이 즉시 애플리케이션에 전달 |
| RST | Reset | 연결 강제 종료, 비정상 상황 |
| SYN | Synchronize | 연결 수립 요청, Seq Number 동기화 |
| FIN | Finish | 연결 종료 요청, 더 보낼 데이터 없음 |

**Window Size (16비트)**

수신 버퍼의 여유 공간을 바이트 단위로 알려준다. 송신자는 ACK 없이 이 크기까지만 전송할 수 있다. **흐름 제어**의 핵심.

- 16비트 = 최대 65,535바이트
- Window Scale 옵션으로 확장 가능 (최대 1GB)

**Checksum (16비트)**

헤더와 데이터의 무결성을 검증한다. **의사 헤더(Pseudo Header)**를 포함하여 계산한다.

```
Pseudo Header:
┌─────────────────────────────────┐
│ Source IP Address (32비트)      │
├─────────────────────────────────┤
│ Destination IP Address (32비트) │
├─────────┬───────────────────────┤
│ Zero(8) │ Protocol(8) │ TCP Len │
└─────────┴───────────────────────┘
```

IP 주소까지 포함하여 계산하므로, IP 헤더가 변조되어도 검출 가능.

**Urgent Pointer (16비트)**

URG 플래그가 설정되었을 때, 긴급 데이터의 끝 위치를 나타낸다. 현재는 거의 사용하지 않는다.

### 주요 TCP 옵션

옵션은 헤더 뒤에 붙으며, 총 헤더가 60바이트를 넘지 않는 범위에서 추가된다.

| 옵션 | 크기 | 설명 |
|------|------|------|
| MSS | 4B | Maximum Segment Size, 수신 가능한 최대 세그먼트 크기 |
| Window Scale | 3B | Window Size를 왼쪽으로 시프트할 비트 수 |
| SACK Permitted | 2B | Selective ACK 지원 여부 |
| SACK | 가변 | 수신한 블록 범위들 |
| Timestamps | 10B | RTT 측정, PAWS(오래된 세그먼트 방지) |

**MSS(Maximum Segment Size)**는 TCP 페이로드의 최대 크기다. Ethernet MTU 1500에서 IP 헤더 20 + TCP 헤더 20을 빼면 **MSS = 1460바이트**가 일반적이다.

---

## 3-way Handshake: 연결 수립

TCP는 데이터 전송 전에 연결을 수립한다. 양쪽이 **Sequence Number를 교환**하고 통신 준비가 되었음을 확인하는 과정이다.

```
    Client                                     Server
      │                                          │
      │ ──────── SYN (seq=x) ──────────────────→ │
      │          SYN=1, ACK=0                    │
      │                                          │
      │ ←─────── SYN+ACK (seq=y, ack=x+1) ────── │
      │          SYN=1, ACK=1                    │
      │                                          │
      │ ──────── ACK (seq=x+1, ack=y+1) ───────→ │
      │          SYN=0, ACK=1                    │
      │                                          │
      │          [연결 수립 완료]                  │
```

### Step 1: SYN

클라이언트가 서버에게 연결을 요청한다.

- SYN 플래그 = 1
- Sequence Number = x (클라이언트의 ISN, 랜덤)
- ACK 플래그 = 0 (아직 받은 것 없음)

```
클라이언트 상태: CLOSED → SYN_SENT
서버 상태: LISTEN
```

### Step 2: SYN+ACK

서버가 연결 요청을 수락하고, 자신도 연결을 요청한다.

- SYN 플래그 = 1 (서버도 연결 요청)
- ACK 플래그 = 1 (클라이언트 SYN 확인)
- Sequence Number = y (서버의 ISN, 랜덤)
- Acknowledgment Number = x+1 (클라이언트 SYN에 대한 ACK)

```
서버 상태: LISTEN → SYN_RECEIVED
```

SYN은 1바이트를 소비하므로 ACK가 x+1이다. (데이터 없어도 Seq가 1 증가)

### Step 3: ACK

클라이언트가 서버의 연결 요청을 확인한다.

- SYN 플래그 = 0 (연결 요청 아님)
- ACK 플래그 = 1
- Sequence Number = x+1
- Acknowledgment Number = y+1 (서버 SYN에 대한 ACK)

```
클라이언트 상태: SYN_SENT → ESTABLISHED
서버 상태: SYN_RECEIVED → ESTABLISHED (ACK 수신 후)
```

이 ACK 패킷에 데이터를 포함시킬 수 있다 (Piggybacking).

### 왜 3-way인가?

**2-way로는 부족하다:**

- 클라이언트 → 서버: SYN
- 서버 → 클라이언트: SYN+ACK
- 이 시점에서 서버는 "클라이언트가 내 SYN+ACK를 받았는지" 모름

양쪽 모두 자신의 ISN을 상대방에게 알리고, **확인받아야** 한다.

- 클라이언트 ISN(x)를 서버가 확인 → SYN+ACK의 ack=x+1
- 서버 ISN(y)를 클라이언트가 확인 → 마지막 ACK의 ack=y+1

**4-way는 불필요하다:**

서버가 SYN과 ACK를 별도로 보낼 수도 있지만, 하나의 패킷에 합칠 수 있으므로 3-way로 충분하다.

### ISN이 랜덤인 이유

ISN을 0이나 고정값으로 시작하면 보안/안정성 문제가 생긴다.

**보안**: 공격자가 Sequence Number를 예측하여 세션 하이재킹을 시도할 수 있다. 랜덤 ISN은 예측을 어렵게 만든다.

**안정성**: 이전 연결의 지연된 세그먼트가 네트워크에 남아 있을 수 있다. 같은 4-tuple(IP+Port 조합)로 새 연결이 생기면, 지연된 세그먼트가 새 연결에서 유효한 것으로 오인될 수 있다. 랜덤 ISN은 이 확률을 극도로 낮춘다.

실제로는 시간 기반 + 암호학적 해시로 ISN을 생성한다.

### SYN Flood 공격

악의적 클라이언트가 대량의 SYN을 보내고 마지막 ACK를 보내지 않으면, 서버는 SYN_RECEIVED 상태의 반쯤 열린 연결(Half-open connection)을 유지해야 한다. 이 큐가 가득 차면 정상적인 연결도 거부된다.

**방어:**

- SYN Cookie: 서버가 상태를 저장하지 않고, SYN+ACK의 Seq에 클라이언트 정보를 인코딩
- SYN Proxy: 방화벽이 대신 handshake 완료 후 전달
- Rate Limiting: IP당 SYN 수 제한

---

## 4-way Handshake: 연결 종료

TCP 연결은 **양방향(Full-duplex)**이다. 각 방향을 독립적으로 종료해야 하므로 **4단계**가 필요하다.

```
    Client                                     Server
      │                                          │
      │ ──────── FIN (seq=u) ────────────────→   │
      │          FIN=1, ACK=1                    │
      │                                          │
      │ ←─────── ACK (ack=u+1) ─────────────────│
      │                                          │
      │          [서버가 남은 데이터 전송]         │
      │                                          │
      │ ←─────── FIN (seq=v) ───────────────────│
      │          FIN=1, ACK=1                    │
      │                                          │
      │ ──────── ACK (ack=v+1) ────────────────→ │
      │                                          │
      │          [연결 종료 완료]                  │
```

### Step 1: FIN (능동적 종료자 → 수동적 종료자)

클라이언트가 "더 이상 보낼 데이터가 없다"고 알린다.

- FIN 플래그 = 1
- 클라이언트 상태: ESTABLISHED → **FIN_WAIT_1**

클라이언트는 이제 데이터를 보낼 수 없지만, 받을 수는 있다.

### Step 2: ACK

서버가 FIN을 확인한다. 하지만 서버는 아직 보낼 데이터가 있을 수 있다.

- ACK 플래그 = 1
- 서버 상태: ESTABLISHED → **CLOSE_WAIT**
- 클라이언트 상태: FIN_WAIT_1 → **FIN_WAIT_2**

이 상태에서 서버는 여전히 데이터를 보낼 수 있다 (**Half-Close**).

### Step 3: FIN (수동적 종료자 → 능동적 종료자)

서버가 남은 데이터를 모두 전송한 후, "나도 더 보낼 것 없다"고 알린다.

- FIN 플래그 = 1
- 서버 상태: CLOSE_WAIT → **LAST_ACK**

### Step 4: ACK

클라이언트가 서버의 FIN을 확인한다.

- ACK 플래그 = 1
- 클라이언트 상태: FIN_WAIT_2 → **TIME_WAIT**
- 서버 상태: LAST_ACK → **CLOSED** (ACK 수신 후)

### 왜 4-way인가?

연결 수립 시에는 서버가 SYN과 ACK를 하나의 패킷(SYN+ACK)으로 보낼 수 있다. 하지만 종료는 다르다.

- 클라이언트가 FIN을 보내도 서버는 아직 전송 중인 데이터가 있을 수 있음
- 서버는 우선 ACK만 보내고, 데이터 전송 완료 후 FIN을 별도로 보냄
- ACK와 FIN을 합칠 수 없는 경우가 많음

실제로 서버가 즉시 종료할 준비가 되어 있으면 FIN+ACK로 합쳐서 **3-way 종료**가 될 수도 있다.

### 동시 종료 (Simultaneous Close)

양쪽이 동시에 FIN을 보내는 경우도 있다.

```
    Client                                     Server
      │                                          │
      │ ──────── FIN ──────────────────────────→ │
      │ ←─────── FIN ──────────────────────────  │
      │                                          │
      │ ──────── ACK ──────────────────────────→ │
      │ ←─────── ACK ──────────────────────────  │
      │                                          │
```

양쪽 모두 FIN_WAIT_1 → CLOSING → TIME_WAIT 순서로 전이한다.

---

## TIME_WAIT 상태

클라이언트가 마지막 ACK를 보낸 후 바로 CLOSED가 아니라 **TIME_WAIT** 상태로 대기한다. 대기 시간은 **2MSL(Maximum Segment Lifetime)**로, 일반적으로 **60초~120초**다.

### 왜 TIME_WAIT가 필요한가?

**이유 1: 마지막 ACK 유실 대비**

클라이언트가 보낸 마지막 ACK가 유실되면, 서버는 FIN을 재전송한다.

- 클라이언트가 이미 CLOSED 상태: RST로 응답 → 서버가 비정상 종료로 판단
- 클라이언트가 TIME_WAIT 상태: ACK 재전송 → 정상 종료

**이유 2: 지연 세그먼트 폐기**

이전 연결의 세그먼트가 네트워크에 남아 있을 수 있다. 같은 4-tuple로 새 연결이 즉시 생기면, 지연된 세그먼트가 새 연결의 유효한 데이터로 오인될 수 있다.

2MSL 동안 기다리면:
- MSL: 세그먼트가 네트워크에서 살아있을 수 있는 최대 시간
- 2MSL: 왕복을 고려 (요청 + 응답)
- 이 시간이 지나면 모든 지연 세그먼트가 폐기됨

### TIME_WAIT가 문제가 될 때

**서버가 먼저 종료하는 경우** (HTTP 서버 등), 서버 측에 TIME_WAIT 소켓이 쌓인다. 각 소켓이 포트를 점유하므로, 동시 연결이 많으면 **포트 고갈**이나 **메모리 부족**이 발생할 수 있다.

```bash
# TIME_WAIT 소켓 수 확인
netstat -an | grep TIME_WAIT | wc -l
ss -s
```

### TIME_WAIT 해결 방법

**SO_REUSEADDR 소켓 옵션**

TIME_WAIT 상태의 포트를 재사용할 수 있게 한다. 서버 재시작 시 "Address already in use" 에러 방지.

```python
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
```

**tcp_tw_reuse (Linux)**

클라이언트 측에서 TIME_WAIT 소켓을 새 연결에 재사용. Timestamp 옵션이 활성화되어 있어야 안전하게 동작.

```bash
sysctl -w net.ipv4.tcp_tw_reuse=1
```

**tcp_tw_recycle (비권장)**

TIME_WAIT 소켓을 빠르게 회수. NAT 환경에서 문제 발생. Linux 4.12에서 제거됨.

**Keep-Alive / Connection Pooling**

연결을 재사용하여 종료 횟수 자체를 줄인다. HTTP/1.1의 Keep-Alive, 커넥션 풀링이 이 방식.

**클라이언트가 먼저 종료하게 유도**

서버가 `Connection: close` 헤더를 보내면 클라이언트가 먼저 FIN을 보내게 된다. TIME_WAIT가 클라이언트 측에 생김.

---

## TCP 상태 전이도

TCP 연결은 여러 상태를 거친다. 상태를 이해하면 네트워크 문제 진단에 도움이 된다.

```
                              ┌───────────────────────────────────┐
                              │                                   │
                              ▼                                   │
                         ┌────────┐                               │
            ┌───────────→│ CLOSED │←──────────────────┐           │
            │            └────────┘                   │           │
            │                 │                       │           │
            │    passive open │         active open   │           │
            │    (listen)     │         (connect)     │           │
            │                 ▼                       │           │
            │            ┌────────┐              send SYN         │
            │            │ LISTEN │                   │           │
            │            └────────┘                   │           │
            │                 │                       ▼           │
            │         recv SYN│               ┌──────────┐        │
            │         send SYN+ACK            │ SYN_SENT │        │
            │                 │               └──────────┘        │
            │                 ▼                       │           │
            │         ┌──────────────┐       recv SYN+ACK         │
            │         │ SYN_RECEIVED │        send ACK            │
            │         └──────────────┘                │           │
            │                 │                       │           │
            │          recv ACK                       │           │
            │                 │                       │           │
            │                 ▼                       ▼           │
            │            ┌─────────────────────────────┐          │
            │            │        ESTABLISHED         │          │
            │            └─────────────────────────────┘          │
            │                        │                            │
            │              close     │     recv FIN               │
            │              send FIN  │     send ACK               │
            │                        │                            │
            │         ┌──────────────┴──────────────┐             │
            │         ▼                             ▼             │
            │   ┌────────────┐               ┌────────────┐       │
            │   │ FIN_WAIT_1 │               │ CLOSE_WAIT │       │
            │   └────────────┘               └────────────┘       │
            │         │                             │             │
            │  recv ACK                      close  │             │
            │         │                      send FIN             │
            │         ▼                             │             │
            │   ┌────────────┐                      ▼             │
            │   │ FIN_WAIT_2 │               ┌──────────┐         │
            │   └────────────┘               │ LAST_ACK │         │
            │         │                      └──────────┘         │
            │  recv FIN                             │             │
            │  send ACK                      recv ACK             │
            │         │                             │             │
            │         ▼                             │             │
            │   ┌────────────┐                      │             │
            └───│ TIME_WAIT  │                      │             │
                └────────────┘                      │             │
                      │                             │             │
                   2MSL timeout                     │             │
                      │                             │             │
                      └─────────────────────────────┴─────────────┘
```

### 상태별 설명

| 상태 | 설명 | 누가 |
|------|------|------|
| CLOSED | 연결 없음 | - |
| LISTEN | 연결 요청 대기 중 | 서버 |
| SYN_SENT | SYN 보내고 SYN+ACK 대기 | 클라이언트 |
| SYN_RECEIVED | SYN 받고 SYN+ACK 보냄, ACK 대기 | 서버 |
| ESTABLISHED | 연결 수립 완료, 데이터 전송 가능 | 양쪽 |
| FIN_WAIT_1 | FIN 보내고 ACK 대기 | 능동 종료자 |
| FIN_WAIT_2 | FIN에 대한 ACK 받음, 상대방 FIN 대기 | 능동 종료자 |
| CLOSE_WAIT | FIN 받고 ACK 보냄, 애플리케이션 close 대기 | 수동 종료자 |
| LAST_ACK | FIN 보내고 마지막 ACK 대기 | 수동 종료자 |
| TIME_WAIT | 마지막 ACK 보냄, 2MSL 대기 | 능동 종료자 |
| CLOSING | 동시 종료 시 | 양쪽 |

### 문제 진단

**SYN_SENT가 많다**: 서버가 응답하지 않음, 방화벽 차단, 서버 다운

**SYN_RECEIVED가 많다**: SYN Flood 공격 가능성, 또는 마지막 ACK 유실

**CLOSE_WAIT가 많다**: 애플리케이션이 소켓을 close()하지 않음. **애플리케이션 버그**.

**FIN_WAIT_2가 많다**: 상대방이 FIN을 보내지 않음. 상대방 애플리케이션 문제.

**TIME_WAIT가 많다**: 정상적이지만, 너무 많으면 포트 고갈. Keep-Alive, Connection Pooling 고려.

### 상태 확인 명령어

```bash
# Linux
netstat -an | grep tcp
ss -tan
ss -s  # 상태별 요약

# 특정 상태만
netstat -an | grep CLOSE_WAIT
ss -tan state close-wait

# 상태별 카운트
ss -tan | awk '{print $1}' | sort | uniq -c
```

---

## RST (Reset)

**RST** 플래그는 연결을 **즉시 강제 종료**한다. 4-way handshake 없이 바로 끊는다.

### RST가 발생하는 경우

**1. 존재하지 않는 포트로 연결 시도**

서버에서 해당 포트를 리슨하는 프로세스가 없으면 RST 응답.

**2. 비정상적인 세그먼트 수신**

ESTABLISHED가 아닌 상태에서 데이터 수신, 잘못된 Sequence Number 등.

**3. 애플리케이션이 강제 종료**

소켓에 `SO_LINGER` 옵션을 0으로 설정하면, close() 시 RST 전송.

```python
sock.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))
```

**4. 방화벽/IDS가 차단**

의심스러운 연결을 RST로 끊음.

**5. Half-open 연결 감지**

한쪽은 연결되어 있다고 생각하지만 상대방은 연결이 없는 상태. 데이터 전송 시 RST 수신.

### RST와 FIN의 차이

| | FIN | RST |
|---|-----|-----|
| 종료 방식 | 우아한 종료 (Graceful) | 강제 종료 (Abortive) |
| 버퍼 처리 | 남은 데이터 전송 후 종료 | 버퍼 폐기, 즉시 종료 |
| 응답 필요 | ACK 필요 | 응답 없음 |
| TIME_WAIT | 발생 | 발생 안 함 |

---

## 면접 예상 질문

**Q. 3-way handshake를 설명하시오.**

TCP 연결 수립 과정이다. 클라이언트가 SYN(seq=x)을 보내고, 서버가 SYN+ACK(seq=y, ack=x+1)로 응답하며, 클라이언트가 ACK(ack=y+1)를 보내 완료된다. 양쪽이 자신의 ISN을 상대방에게 알리고 확인받는 과정이며, 2-way로는 서버가 자신의 SYN+ACK가 도달했는지 확인할 수 없어 3-way가 필요하다.

**Q. 4-way handshake를 설명하시오.**

TCP 연결 종료 과정이다. TCP는 양방향이므로 각 방향을 독립적으로 종료한다. 능동 종료자가 FIN을 보내고, 상대방이 ACK로 확인한 후 자신의 데이터 전송을 마치고 FIN을 보내면, 능동 종료자가 ACK로 확인한다. 연결 수립과 달리 상대방이 아직 보낼 데이터가 있을 수 있어 ACK와 FIN을 합칠 수 없는 경우가 많다.

**Q. TIME_WAIT 상태는 왜 필요한가?**

두 가지 이유가 있다. 첫째, 마지막 ACK가 유실되면 상대방이 FIN을 재전송하는데, 이미 CLOSED면 RST로 응답하여 비정상 종료가 된다. TIME_WAIT에서 기다리면 ACK를 재전송할 수 있다. 둘째, 이전 연결의 지연된 세그먼트가 새 연결에서 유효한 데이터로 오인되는 것을 방지한다. 2MSL 동안 기다려 모든 지연 세그먼트가 폐기되도록 한다.

**Q. CLOSE_WAIT 상태가 많으면 어떤 문제인가?**

CLOSE_WAIT는 상대방의 FIN을 받고 ACK를 보낸 상태로, 애플리케이션이 close()를 호출하기를 기다리는 상태다. 이 상태가 많다는 것은 애플리케이션이 소켓을 제대로 닫지 않는 버그가 있다는 의미다. 소켓 리소스가 누수되어 결국 파일 디스크립터 고갈로 이어질 수 있다.

**Q. TCP와 UDP의 헤더 크기 차이와 이유는?**

TCP는 20~60바이트, UDP는 8바이트다. TCP는 신뢰성을 위해 Sequence Number, ACK Number, Window Size, 다양한 플래그, 옵션 필드가 필요하다. UDP는 신뢰성 기능이 없으므로 Source/Destination Port, Length, Checksum만 있어 간단하다.