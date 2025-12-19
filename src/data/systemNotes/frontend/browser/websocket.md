# WebSocket

## WebSocket이란?

**클라이언트와 서버 간 양방향 실시간 통신을 가능하게 하는 프로토콜**입니다. 한 번 연결되면 연결이 유지되어 양쪽에서 자유롭게 메시지를 주고받을 수 있습니다.

```
HTTP (단방향, 요청-응답):
Client ──Request──► Server
Client ◄──Response── Server
(연결 종료)

WebSocket (양방향, 지속 연결):
Client ◄──────────► Server
       양방향 메시지
     (연결 유지)
```

**사용 사례:**
- 실시간 채팅
- 주식/암호화폐 시세
- 멀티플레이어 게임
- 협업 도구 (Google Docs, Figma)
- 알림 시스템
- 라이브 스트리밍 댓글

---

## HTTP vs WebSocket

| 구분 | HTTP | WebSocket |
|------|------|-----------|
| **연결** | 요청마다 새 연결 | 지속적 연결 유지 |
| **방향** | 단방향 (클라이언트 → 서버) | 양방향 |
| **오버헤드** | 매 요청마다 헤더 | 최초 핸드셰이크 후 경량 |
| **서버 푸시** | 불가 (폴링 필요) | 가능 |
| **프로토콜** | http:// / https:// | ws:// / wss:// |

**HTTP 폴링의 한계:**

```
Polling (주기적 요청):
Client: 새 메시지 있어? → Server: 없음
Client: 새 메시지 있어? → Server: 없음
Client: 새 메시지 있어? → Server: 있음!
→ 불필요한 요청, 지연 발생

Long Polling:
Client: 새 메시지 있어? → Server: (대기...) → 있으면 응답
→ 연결 유지 오버헤드, 타임아웃 관리 복잡

WebSocket:
한 번 연결 후 서버가 즉시 푸시
→ 효율적, 실시간
```

---

## WebSocket 핸드셰이크

**HTTP 업그레이드 요청으로 WebSocket 연결을 수립**합니다.

```
1. 클라이언트 요청 (HTTP Upgrade):
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

2. 서버 응답 (101 Switching Protocols):
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

3. 이후 WebSocket 프레임으로 통신
```

---

## 기본 WebSocket API

```javascript
// 연결 생성
const ws = new WebSocket('wss://example.com/socket');

// 연결 성공
ws.onopen = () => {
  console.log('연결됨');
  ws.send('Hello Server!');
};

// 메시지 수신
ws.onmessage = (event) => {
  console.log('받은 메시지:', event.data);
  const data = JSON.parse(event.data);
};

// 연결 종료
ws.onclose = (event) => {
  console.log('연결 종료:', event.code, event.reason);
};

// 에러 발생
ws.onerror = (error) => {
  console.error('에러:', error);
};

// 메시지 전송
ws.send(JSON.stringify({ type: 'chat', message: 'Hello!' }));

// 연결 닫기
ws.close();
```

**readyState:**

| 값 | 상태 | 설명 |
|---|------|------|
| 0 | CONNECTING | 연결 중 |
| 1 | OPEN | 연결됨, 통신 가능 |
| 2 | CLOSING | 닫는 중 |
| 3 | CLOSED | 닫힘 |

---

## React에서 WebSocket 사용

### 기본 사용 (useEffect)

```jsx
function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const wsRef = useRef(null);
  
  useEffect(() => {
    const ws = new WebSocket('wss://example.com/chat');
    wsRef.current = ws;
    
    ws.onopen = () => console.log('연결됨');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };
    
    ws.onclose = () => console.log('연결 종료');
    
    // 클린업: 컴포넌트 언마운트 시 연결 종료
    return () => {
      ws.close();
    };
  }, []);
  
  const sendMessage = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: input }));
      setInput('');
    }
  };
  
  return (
    <div>
      <ul>
        {messages.map((msg, i) => <li key={i}>{msg.text}</li>)}
      </ul>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>전송</button>
    </div>
  );
}
```

---

### Custom Hook으로 추상화

```jsx
function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket 연결됨');
    };
    
    ws.onmessage = (event) => {
      setLastMessage(JSON.parse(event.data));
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      // 자동 재연결 (3초 후)
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket 에러:', error);
      ws.close();
    };
  }, [url]);
  
  useEffect(() => {
    connect();
    
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
  
  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);
  
  return { isConnected, lastMessage, sendMessage };
}
```

**사용:**

```jsx
const { isConnected, lastMessage, sendMessage } = useWebSocket('wss://...');

useEffect(() => {
  if (lastMessage) setMessages(prev => [...prev, lastMessage]);
}, [lastMessage]);
```

---

### 재연결 로직

```jsx
// Custom Hook에 추가
const connect = useCallback(() => {
  if (reconnectCount.current >= maxReconnectAttempts) {
    setStatus('failed');
    return;
  }
  
  const ws = new WebSocket(url);
  
  ws.onopen = () => {
    setStatus('connected');
    reconnectCount.current = 0;  // 성공 시 리셋
  };
  
  ws.onclose = (event) => {
    // 비정상 종료(코드 !== 1000)면 재연결
    if (event.code !== 1000) {
      reconnectCount.current++;
      setTimeout(connect, reconnectInterval);
    }
  };
  // ...
}, [url]);
```

---

## Socket.IO

**WebSocket을 추상화한 라이브러리**입니다. 자동 재연결, 폴백, 이벤트 기반 통신을 제공합니다.

```jsx
import { io } from 'socket.io-client';

useEffect(() => {
  const socket = io('http://localhost:3001', {
    transports: ['websocket'],
    reconnection: true,
  });
  
  socket.on('connect', () => console.log('연결됨'));
  socket.on('chat:message', (msg) => setMessages(prev => [...prev, msg]));
  
  // 메시지 전송
  socket.emit('chat:send', { text: 'Hello!' });
  
  return () => socket.disconnect();
}, []);
```

**Socket.IO vs 순수 WebSocket:**

| 구분 | WebSocket | Socket.IO |
|------|-----------|-----------|
| 자동 재연결 | 직접 구현 | 내장 |
| 폴백 (HTTP 폴링) | 없음 | 내장 |
| 이벤트 기반 | 직접 구현 | 내장 (emit/on) |
| 서버 호환 | 모든 WebSocket 서버 | Socket.IO 서버 필요 |

---

## Context로 전역 관리

```jsx
const SocketContext = createContext(null);

function SocketProvider({ children, url }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    setSocket(ws);
    return () => ws.close();
  }, [url]);
  
  const send = useCallback((data) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }, [socket]);
  
  return (
    <SocketContext.Provider value={{ socket, isConnected, send }}>
      {children}
    </SocketContext.Provider>
  );
}

// 앱 전체에서 useContext(SocketContext)로 사용
```

---

## 메시지 타입 관리

```jsx
// 타입별 핸들러 등록
ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  
  switch (type) {
    case 'chat':
      handleChat(payload);
      break;
    case 'notification':
      handleNotification(payload);
      break;
  }
};
```

---

## 주의사항

**1. 클린업 필수** - 언마운트 시 `ws.close()` 호출로 메모리 누수 방지

**2. 연결 상태 확인** - `readyState === WebSocket.OPEN` 확인 후 전송

**3. 보안** - 항상 `wss://` 사용, 인증은 쿼리 파라미터 또는 첫 메시지로

```jsx
const ws = new WebSocket(`wss://example.com?token=${accessToken}`);
```

---

## 면접 예상 질문

**Q. WebSocket이란?**

클라이언트와 서버 간 양방향 실시간 통신 프로토콜입니다. HTTP와 달리 한 번 연결되면 지속적으로 유지되어 양쪽에서 자유롭게 메시지를 주고받을 수 있습니다. 채팅, 실시간 시세, 게임 등에 사용됩니다.

**Q. HTTP 폴링과 WebSocket의 차이?**

HTTP 폴링은 클라이언트가 주기적으로 서버에 요청하여 불필요한 요청과 지연이 발생합니다. WebSocket은 연결 유지 후 서버가 즉시 푸시할 수 있어 효율적이고 실시간성이 좋습니다.

**Q. React에서 WebSocket 사용 시 주의점?**

useEffect의 클린업에서 ws.close()로 연결을 정리해야 메모리 누수를 방지합니다. 재연결 로직이 필요하고, readyState 확인 후 메시지를 전송해야 합니다. Custom Hook으로 추상화하면 재사용성이 좋아집니다.

**Q. Socket.IO와 순수 WebSocket의 차이?**

Socket.IO는 자동 재연결, HTTP 폴링 폴백, 이벤트 기반 통신, Room/Namespace를 내장합니다. 순수 WebSocket은 가볍지만 이런 기능을 직접 구현해야 합니다. Socket.IO는 Socket.IO 서버가 필요합니다.

**Q. WebSocket 연결이 끊겼을 때 처리?**

onclose 이벤트에서 재연결 로직을 구현합니다. 지수 백오프로 재연결 간격을 늘리고, 최대 시도 횟수를 제한합니다. 재연결 중 전송할 메시지는 큐에 저장했다가 연결 후 전송합니다.