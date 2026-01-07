# 실시간 통신

## HTTP의 한계: 왜 실시간 통신이 필요한가?

HTTP는 **요청-응답(Request-Response)** 모델이다. 클라이언트가 요청해야만 서버가 응답할 수 있고, 서버가 먼저 데이터를 보낼 방법이 없다. 웹 초기에는 이것으로 충분했다. 사용자가 링크를 클릭하면 새 페이지를 받아오면 됐다.

하지만 현대 웹 애플리케이션은 다르다. 채팅에서 상대방이 메시지를 보내면 즉시 화면에 나타나야 하고, 주식 시세가 바뀌면 새로고침 없이 반영되어야 한다. 서버에서 이벤트가 발생했을 때 클라이언트에 즉시 전달해야 하는 상황이 늘어났다.

- 채팅: 상대방 메시지를 즉시 수신
- 주식/암호화폐: 시세 변동을 실시간 반영
- 알림: 서버 이벤트를 클라이언트에 푸시
- 협업 도구: 다른 사용자의 편집을 실시간 동기화
- 온라인 게임: 수십 ms 단위의 상태 동기화

HTTP의 요청-응답 모델로는 이를 해결할 수 없다. 클라이언트가 "새 데이터 있어?"라고 계속 물어봐야 하는데, 이는 명백히 비효율적이다. 이 문제를 해결하기 위한 여러 기법이 발전해왔다.

---

## Polling: 가장 단순한 해결책

HTTP의 한계를 우회하는 가장 직관적인 방법은 **주기적으로 요청하는 것**이다. 클라이언트가 일정 간격으로 서버에 "새 데이터 있어?"라고 묻는다.

```
Client                          Server
  │                               │
  │──── GET /messages ──────────→│
  │←─── [] (없음) ─────────────────│
  │    (5초 대기)                  │
  │──── GET /messages ──────────→│
  │←─── [] (없음) ─────────────────│
  │    (5초 대기)                  │
  │──── GET /messages ──────────→│
  │←─── [{msg: "Hello"}] ─────────│
```

구현이 단순하고 기존 HTTP 인프라를 그대로 사용할 수 있다는 장점이 있다.

- 구현 단순: 일반 HTTP 요청을 setInterval로 반복
- 인프라 호환: 기존 서버, 프록시, 방화벽 그대로 사용
- 상태 비저장: 서버가 연결 상태를 유지할 필요 없음

```javascript
setInterval(async () => {
  const res = await fetch('/api/messages');
  const data = await res.json();
  if (data.length > 0) updateUI(data);
}, 5000);
```

### Polling의 근본적 문제

하지만 Polling은 심각한 비효율을 초래한다. 새 데이터가 없어도 계속 요청하므로 서버 부하가 클라이언트 수에 비례해서 증가한다. 1만 명이 5초마다 요청하면 초당 2,000 요청이 발생한다.

또한 폴링 주기만큼 지연이 발생한다. 5초 주기면 최대 5초 늦게 데이터를 받는다. 주기를 줄이면 실시간성은 높아지지만 서버 부하가 급증한다.

- 낭비: 변경 없어도 요청 → 서버 리소스 낭비
- 지연: 폴링 주기만큼 실시간성 저하
- 트레이드오프: 주기↓ = 실시간성↑ + 부하↑

이 문제를 해결하기 위해 **Long Polling**이 등장했다.

---

## Long Polling: 서버가 응답을 지연한다

Polling의 핵심 문제는 "데이터가 없어도 즉시 응답한다"는 것이다. Long Polling은 이를 뒤집는다. 서버가 새 데이터가 생길 때까지 응답을 보류하고 기다린다.

```
Client                          Server
  │                               │
  │──── GET /messages ──────────→│
  │         (서버가 대기...)       │
  │         (30초간 새 데이터 없음) │
  │         (새 메시지 도착!)      │
  │←─── [{msg: "Hello"}] ─────────│
  │                               │
  │──── GET /messages ──────────→│  ← 즉시 다시 요청
  │         (서버가 대기...)       │
```

클라이언트가 요청하면 서버는 새 데이터가 있을 때까지 응답하지 않고 연결을 유지한다. 데이터가 생기면 그때 응답하고, 클라이언트는 응답을 받자마자 즉시 다시 요청한다. 타임아웃(보통 30초)이 되면 빈 응답을 보내고 클라이언트가 재요청한다.

- 즉시 전달: 데이터 발생 시 대기 중인 요청에 즉시 응답
- 불필요한 요청 감소: 데이터 없으면 연결만 유지
- HTTP 호환: 특별한 프로토콜 없이 HTTP로 구현

```javascript
// 클라이언트
async function longPoll() {
  try {
    const res = await fetch('/api/messages?timeout=30000');
    const data = await res.json();
    if (data.length > 0) updateUI(data);
  } catch (e) {
    await sleep(1000); // 에러 시 잠시 대기
  }
  longPoll(); // 즉시 다시 요청
}
```

```javascript
// 서버 (Express)
app.get('/api/messages', async (req, res) => {
  const timeout = parseInt(req.query.timeout) || 30000;
  const message = await waitForMessageOrTimeout(timeout);
  res.json(message ? [message] : []);
});
```

### Long Polling의 한계

Long Polling은 Polling보다 효율적이지만, 여전히 HTTP 요청-응답의 틀 안에 있다. 데이터를 받을 때마다 연결이 끊기고 새 요청을 보내야 한다. 이 과정에서 HTTP 헤더(수백 바이트~수 KB)가 매번 전송된다.

또한 서버는 대기 중인 연결을 모두 유지해야 한다. 1만 명이 접속하면 1만 개의 연결이 열려 있다. 데이터가 자주 발생하면 연결 생성/종료 오버헤드가 커진다.

- 연결 재수립: 응답마다 새 요청 필요 → HTTP 헤더 오버헤드
- 서버 리소스: 대기 중인 연결을 모두 유지해야 함
- 단방향: 여전히 클라이언트가 요청해야 응답 가능

서버에서 클라이언트로 지속적으로 데이터를 보내야 한다면, 매번 연결을 다시 맺는 것보다 **하나의 연결을 유지하면서 계속 보내는 것**이 효율적이다. 이것이 **Server-Sent Events**다.

---

## Server-Sent Events (SSE): 서버에서 클라이언트로 스트리밍

SSE는 HTTP 연결을 끊지 않고 서버가 클라이언트에게 **지속적으로 데이터를 푸시**하는 표준이다. Long Polling처럼 매번 연결을 다시 맺을 필요가 없다.

```
Client                          Server
  │                               │
  │──── GET /events ────────────→│
  │←─── HTTP 200 (스트림 시작) ────│
  │←─── data: {"price": 100} ─────│
  │←─── data: {"price": 101} ─────│
  │←─── data: {"price": 99} ──────│
  │         (연결 유지, 계속 수신)  │
```

클라이언트가 한 번 요청하면 서버는 `Content-Type: text/event-stream`으로 응답하고, 연결을 끊지 않은 채 데이터가 생길 때마다 전송한다. HTTP 기반이므로 프록시, 방화벽을 쉽게 통과한다.

- 단일 연결: 한 번 연결로 지속적 수신
- 자동 재연결: 브라우저가 끊김 감지 시 자동 재연결
- 간단한 API: EventSource 객체로 쉽게 사용
- HTTP 호환: 기존 인프라와 호환

### SSE 프로토콜 형식

SSE는 단순한 텍스트 기반 프로토콜이다.

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"message": "Hello"}

data: {"message": "World"}

event: notification
data: {"type": "alert"}

id: 12345
data: {"message": "With ID"}
```

각 메시지는 빈 줄로 구분된다. `data:`는 실제 데이터, `event:`는 이벤트 타입, `id:`는 재연결 시 이어받기 위한 식별자다.

- `data:` 전송할 데이터 (필수)
- `event:` 이벤트 타입 (기본값: message)
- `id:` 이벤트 ID, 재연결 시 Last-Event-ID 헤더로 전송
- `retry:` 재연결 대기 시간 (ms)

```javascript
// 클라이언트
const es = new EventSource('/api/events');

es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  updatePrice(data.price);
};

es.addEventListener('notification', (e) => {
  showNotification(JSON.parse(e.data));
});

es.onerror = () => {
  console.log('연결 끊김, 자동 재연결 중...');
};
```

```javascript
// 서버 (Express)
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  
  const interval = setInterval(() => {
    send({ price: getLatestPrice() });
  }, 1000);
  
  req.on('close', () => clearInterval(interval));
});
```

### SSE의 한계: 단방향만 가능

SSE는 **서버 → 클라이언트** 단방향만 지원한다. 클라이언트가 서버에 데이터를 보내려면 별도의 HTTP 요청을 해야 한다. 주식 시세처럼 "서버가 푸시만 하면 되는" 경우에는 적합하지만, 채팅처럼 양방향 통신이 필요한 경우에는 한계가 있다.

또한 텍스트 기반이라 바이너리 데이터 전송이 비효율적이고, HTTP/1.1에서는 브라우저당 동일 도메인 연결이 6개로 제한되어 여러 SSE 연결을 열기 어렵다.

- 단방향: 클라이언트 → 서버는 별도 요청 필요
- 텍스트 전용: 바이너리는 Base64 인코딩 필요 (오버헤드)
- 연결 수 제한: HTTP/1.1에서 도메인당 6개

양방향 통신이 필요하다면, HTTP의 요청-응답 모델을 완전히 벗어난 새로운 프로토콜이 필요하다. 이것이 **WebSocket**이다.

---

## WebSocket: 진정한 양방향 통신

WebSocket은 HTTP와 다른 **독립적인 프로토콜**이다. 하나의 TCP 연결 위에서 클라이언트와 서버가 **언제든 자유롭게** 메시지를 주고받을 수 있다. 요청-응답 개념이 없고, 양쪽 모두 먼저 보낼 수 있다.

```
Client                          Server
  │                               │
  │──── HTTP Upgrade 요청 ───────→│
  │←─── 101 Switching Protocols ──│
  │                               │
  │     [WebSocket 연결 수립]      │
  │                               │
  │←─── {"msg": "Welcome"} ───────│  서버가 먼저 전송
  │──── {"msg": "Hello"} ────────→│  클라이언트 전송
  │←─── {"msg": "Hi there"} ──────│  서버 응답
  │──── {"action": "typing"} ────→│  클라이언트 전송
  │         (양방향 자유롭게)       │
```

### WebSocket Handshake

WebSocket은 HTTP Upgrade 메커니즘으로 연결을 수립한다. 처음에는 HTTP로 시작하지만, 핸드셰이크가 완료되면 WebSocket 프로토콜로 전환된다.

```
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

`Sec-WebSocket-Key`와 `Sec-WebSocket-Accept`는 프록시가 캐시한 응답을 잘못 전달하는 것을 방지하기 위한 검증 값이다. 서버는 클라이언트의 Key에 고정 GUID를 붙여 SHA-1 해시 후 Base64 인코딩한 값을 Accept로 반환한다.

- HTTP 101: 프로토콜 전환 성공
- 이후 통신: HTTP가 아닌 WebSocket 프레임
- ws:// 또는 wss:// (TLS 암호화)

### WebSocket 프레임

핸드셰이크 이후에는 HTTP가 아닌 WebSocket 프레임으로 통신한다. 프레임 헤더는 **2~14바이트**로, HTTP 헤더(수백 바이트)에 비해 극도로 가볍다.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤
│F│R│R│R│ opcode│M│ Payload len │    Extended payload length    │
│I│S│S│S│       │A│             │             (16/64)           │
│N│V│V│V│       │S│             │                               │
│ │1│2│3│       │K│             │                               │
├─┴─┴─┴─┴───────┴─┴─────────────┴───────────────────────────────┤
│                     Masking-key (if MASK)                     │
├───────────────────────────────────────────────────────────────┤
│                          Payload Data                         │
└───────────────────────────────────────────────────────────────┘
```

- FIN: 메시지의 마지막 프레임 여부
- opcode: 텍스트(0x1), 바이너리(0x2), close(0x8), ping(0x9), pong(0xA)
- MASK: 클라이언트 → 서버는 반드시 마스킹
- Payload len: 데이터 길이

### 구현 예시

```javascript
// 클라이언트
const ws = new WebSocket('wss://example.com/chat');

ws.onopen = () => {
  console.log('연결됨');
  ws.send(JSON.stringify({ type: 'join', room: 'general' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data);
};

ws.onclose = (event) => {
  console.log('연결 종료:', event.code, event.reason);
  // 재연결 로직 필요 (자동 재연결 없음)
  setTimeout(reconnect, 1000);
};

// 메시지 전송
function sendMessage(text) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'message', text }));
  }
}
```

```javascript
// 서버 (ws 라이브러리)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    const data = JSON.parse(raw);
    
    if (data.type === 'join') {
      ws.room = data.room;
      if (!rooms.has(data.room)) rooms.set(data.room, new Set());
      rooms.get(data.room).add(ws);
    }
    
    if (data.type === 'message') {
      // 같은 room에 브로드캐스트
      rooms.get(ws.room)?.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });
  
  ws.on('close', () => {
    rooms.get(ws.room)?.delete(ws);
  });
});
```

### Ping/Pong: 연결 상태 확인

TCP 연결은 데이터가 오가지 않으면 중간 장비(NAT, 방화벽)가 끊어버릴 수 있다. 또한 상대방이 비정상 종료되면 감지가 어렵다. WebSocket은 **Ping/Pong** 프레임으로 연결 상태를 확인한다.

- 서버가 주기적으로 Ping 프레임 전송
- 클라이언트가 Pong 프레임으로 응답
- 일정 시간 내 Pong이 없으면 연결 종료로 판단

```javascript
// 서버에서 heartbeat
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});
```

### WebSocket의 주의점

WebSocket은 강력하지만 SSE와 달리 **자동 재연결이 없다**. 연결이 끊기면 애플리케이션이 직접 재연결 로직을 구현해야 한다. 또한 일부 기업 프록시나 방화벽이 WebSocket을 차단하는 경우가 있다.

- 자동 재연결 없음: 직접 구현 필요 (지수 백오프 권장)
- 프록시/방화벽: 일부 환경에서 차단될 수 있음
- 상태 관리: 서버가 모든 연결을 메모리에 유지
- 프로토콜 비호환: HTTP와 다른 프로토콜이므로 HTTP 도구 사용 불가

---

## SSE vs WebSocket: 선택 기준

두 기술은 상호 배타적이지 않다. 요구사항에 따라 선택한다.

| 특성 | SSE | WebSocket |
|------|-----|-----------|
| 방향 | 단방향 (서버→클라) | 양방향 |
| 프로토콜 | HTTP | WebSocket (ws://) |
| 데이터 형식 | 텍스트 | 텍스트 + 바이너리 |
| 재연결 | 자동 | 수동 구현 |
| 헤더 오버헤드 | 없음 (스트리밍) | 없음 (프레임) |
| 프록시 통과 | 쉬움 | 어려울 수 있음 |
| 구현 복잡도 | 낮음 | 중간 |

**SSE를 선택할 때:**
서버에서 클라이언트로 단방향 푸시만 필요한 경우다. 주식 시세, 뉴스 피드, 알림, 로그 스트리밍 등. 구현이 간단하고 자동 재연결이 내장되어 있다.

**WebSocket을 선택할 때:**
양방향 통신이 필요한 경우다. 채팅, 온라인 게임, 협업 도구, 실시간 편집 등. 또는 바이너리 데이터를 효율적으로 전송해야 할 때.

---

## 스케일링: 여러 서버로 확장

단일 서버에서는 WebSocket이나 SSE가 잘 동작한다. 하지만 트래픽이 증가하면 여러 서버로 확장해야 하고, 이때 문제가 생긴다.

### 문제: 서버 간 메시지 전달

클라이언트 A가 서버1에, 클라이언트 B가 서버2에 연결되어 있다. A가 B에게 메시지를 보내면, 서버1은 B의 연결을 모르므로 전달할 수 없다.

```
┌────────────┐                    ┌────────────┐
│  Server 1  │       ???          │  Server 2  │
│ (Client A) │ ─────────────────→ │ (Client B) │
└────────────┘                    └────────────┘
```

### 해결: Pub/Sub 브로커

서버 간 통신을 중재하는 메시지 브로커를 도입한다. Redis Pub/Sub, Apache Kafka, RabbitMQ 등이 사용된다.

```
┌────────────┐     ┌───────────┐     ┌────────────┐
│  Server 1  │────→│   Redis   │←────│  Server 2  │
│ (Client A) │←────│  Pub/Sub  │────→│ (Client B) │
└────────────┘     └───────────┘     └────────────┘
```

- A가 메시지 전송 → 서버1이 Redis에 Publish
- 서버2가 Subscribe하고 있다가 메시지 수신
- 서버2가 B에게 전달

```javascript
// 서버 (Redis Pub/Sub 연동)
const Redis = require('ioredis');
const pub = new Redis();
const sub = new Redis();

sub.subscribe('chat:general');

sub.on('message', (channel, message) => {
  // 이 서버에 연결된 클라이언트들에게 전달
  broadcastToLocalClients(channel, message);
});

// 메시지 수신 시
ws.on('message', (data) => {
  pub.publish('chat:general', data);
});
```

### Sticky Session

같은 클라이언트가 항상 같은 서버에 연결되도록 로드밸런서를 설정하는 방법이다. IP 해싱이나 쿠키 기반으로 구현한다.

- 장점: 서버 간 통신 복잡도 감소
- 단점: 특정 서버 과부하, 서버 장애 시 세션 유실

Socket.IO 같은 라이브러리에서 Long Polling fallback을 사용할 때 필요할 수 있다.

### 연결 수 한계

단일 서버가 유지할 수 있는 동시 연결에는 한계가 있다.

- 파일 디스크립터: 리눅스 기본 1024, `ulimit -n`으로 조정
- 메모리: 연결당 수 KB ~ 수십 KB
- CPU: heartbeat, 메시지 직렬화/역직렬화

수십만 연결을 유지하려면 커널 튜닝, epoll/kqueue 기반 이벤트 루프, 메모리 최적화가 필요하다.

---

## Socket.IO: WebSocket + 추가 기능

Socket.IO는 WebSocket을 기반으로 실시간 통신에 필요한 추가 기능을 제공하는 라이브러리다.

- 자동 재연결: 끊김 시 지수 백오프로 재연결
- Fallback: WebSocket 불가 시 Long Polling으로 대체
- Room/Namespace: 논리적 채널 분리
- 브로드캐스트: 전체 또는 특정 그룹에 전송
- ACK: 메시지 수신 확인

```javascript
// 서버
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
    socket.to(room).emit('user_joined', socket.id);
  });
  
  socket.on('message', (data, callback) => {
    socket.to(data.room).emit('message', data);
    callback({ status: 'ok' }); // ACK
  });
});

// 클라이언트
const socket = io('https://example.com');

socket.emit('join', 'general');

socket.emit('message', { room: 'general', text: 'Hello' }, (response) => {
  console.log('서버 확인:', response.status);
});

socket.on('message', (data) => {
  displayMessage(data);
});
```

**주의**: Socket.IO는 순수 WebSocket과 호환되지 않는다. 클라이언트와 서버 모두 Socket.IO를 사용해야 한다. 프로토콜 위에 자체 레이어를 추가하기 때문이다.

---

## 면접 예상 질문

**Q. Polling, Long Polling, SSE, WebSocket의 차이점을 설명하시오.**

Polling은 클라이언트가 주기적으로 서버에 요청하여 비효율적이다. Long Polling은 서버가 데이터가 생길 때까지 응답을 지연하여 즉시 전달하지만, 매번 연결을 다시 맺는다. SSE는 HTTP 연결을 유지하며 서버가 단방향으로 스트리밍하고 자동 재연결을 지원한다. WebSocket은 HTTP와 별개의 프로토콜로 양방향 통신을 지원하며 헤더 오버헤드가 거의 없다.

**Q. WebSocket 연결 과정을 설명하시오.**

HTTP Upgrade 메커니즘을 사용한다. 클라이언트가 `Upgrade: websocket` 헤더와 `Sec-WebSocket-Key`를 포함하여 요청하면, 서버가 101 Switching Protocols로 응답하고 `Sec-WebSocket-Accept`로 검증한다. 이후 HTTP가 아닌 WebSocket 프레임으로 양방향 통신한다. 프레임 헤더는 2~14바이트로 HTTP 헤더보다 훨씬 가볍다.

**Q. SSE와 WebSocket 중 어떤 것을 선택해야 하나?**

서버에서 클라이언트로 단방향 푸시만 필요하면 SSE가 적합하다. 자동 재연결이 내장되어 있고 구현이 간단하다. 주식 시세, 알림, 피드 업데이트 등. 양방향 통신이 필요하면 WebSocket을 선택한다. 채팅, 게임, 협업 도구 등. 바이너리 데이터를 효율적으로 전송해야 할 때도 WebSocket이 적합하다.

**Q. 실시간 서비스를 수평 확장할 때 고려할 점은?**

여러 서버에 클라이언트가 분산되면 서버 간 메시지 전달이 필요하다. Redis Pub/Sub이나 Kafka 같은 메시지 브로커로 서버 간 통신을 중재한다. 서버1의 클라이언트가 보낸 메시지를 브로커에 Publish하면, 서버2가 Subscribe하여 자신의 클라이언트에게 전달한다. Sticky Session으로 같은 클라이언트가 같은 서버에 연결되게 할 수도 있지만 장애 대응이 어려워진다.

**Q. WebSocket에서 연결 끊김을 어떻게 감지하고 처리하나?**

WebSocket은 자동 재연결이 없어서 직접 구현해야 한다. Ping/Pong 프레임으로 연결 상태를 주기적으로 확인하고, Pong이 없으면 연결 종료로 판단한다. 클라이언트는 onclose 이벤트에서 지수 백오프로 재연결을 시도한다. 연결 중 전송 못한 메시지는 큐에 저장했다가 재연결 후 전송한다.