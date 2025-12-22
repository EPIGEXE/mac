# Canvas와 React에서 Canvas 다루기

## Canvas란?

**HTML5에서 제공하는 비트맵 그래픽을 그릴 수 있는 요소**입니다. JavaScript를 통해 픽셀 단위로 그래픽을 그리고, 애니메이션, 게임, 데이터 시각화, 이미지 처리 등에 활용합니다.

```html
<canvas id="myCanvas" width="800" height="600"></canvas>
```

Canvas는 단순한 직사각형 영역입니다. 그 자체로는 아무것도 그리지 않으며, JavaScript로 **렌더링 컨텍스트**를 얻어 그래픽 API를 호출해야 합니다.

### Canvas의 특징

| 특징 | 설명 |
|------|------|
| **비트맵 기반** | 픽셀 단위로 그림. 확대하면 깨짐 |
| **명령형** | 코드로 직접 그리기 명령 호출 |
| **DOM 외부** | 그려진 내용은 DOM 요소가 아님 |
| **고성능** | 수천 개 객체도 빠르게 렌더링 |
| **저수준** | 직접 모든 것을 제어해야 함 |

---

## Canvas API 기본

### 렌더링 컨텍스트

Canvas에 그리려면 먼저 **컨텍스트(Context)**를 얻어야 합니다. 2D 그래픽에는 `2d`, 3D 그래픽에는 `webgl` 또는 `webgl2`를 사용합니다.

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
```

### 좌표 시스템

Canvas의 좌표는 **왼쪽 상단이 (0, 0)**입니다. x는 오른쪽으로, y는 아래쪽으로 증가합니다.

```
(0,0) ────────→ x
  │
  │
  │
  ↓
  y
```

### 기본 도형 그리기

| 메서드 | 설명 |
|--------|------|
| `fillRect(x, y, w, h)` | 채워진 사각형 |
| `strokeRect(x, y, w, h)` | 테두리 사각형 |
| `clearRect(x, y, w, h)` | 영역 지우기 |
| `beginPath()` | 새 경로 시작 |
| `moveTo(x, y)` | 펜 이동 |
| `lineTo(x, y)` | 선 그리기 |
| `arc(x, y, r, start, end)` | 원호 |
| `fill()` | 경로 채우기 |
| `stroke()` | 경로 테두리 |

```javascript
// 사각형
ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 100, 50);

// 원
ctx.beginPath();
ctx.arc(200, 100, 50, 0, Math.PI * 2);
ctx.fillStyle = 'red';
ctx.fill();

// 선
ctx.beginPath();
ctx.moveTo(300, 50);
ctx.lineTo(400, 150);
ctx.strokeStyle = 'green';
ctx.lineWidth = 3;
ctx.stroke();
```

### 스타일 속성

| 속성 | 설명 |
|------|------|
| `fillStyle` | 채우기 색상 |
| `strokeStyle` | 테두리 색상 |
| `lineWidth` | 선 두께 |
| `lineCap` | 선 끝 모양 (butt, round, square) |
| `lineJoin` | 선 연결 모양 (miter, round, bevel) |
| `globalAlpha` | 전역 투명도 |
| `font` | 텍스트 폰트 |

### 텍스트

```javascript
ctx.font = '24px Arial';
ctx.fillStyle = 'black';
ctx.fillText('Hello Canvas', 50, 100);
ctx.strokeText('Outlined', 50, 150);
```

### 이미지 그리기

```javascript
const img = new Image();
img.onload = () => {
  ctx.drawImage(img, 0, 0);                    // 원본 크기
  ctx.drawImage(img, 0, 0, 200, 150);          // 크기 지정
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);  // 잘라서 그리기
};
img.src = 'image.png';
```

### 상태 저장과 복원

`save()`와 `restore()`로 컨텍스트 상태(스타일, 변환 등)를 스택에 저장하고 복원합니다.

```javascript
ctx.save();           // 현재 상태 저장
ctx.fillStyle = 'red';
ctx.translate(100, 100);
ctx.fillRect(0, 0, 50, 50);
ctx.restore();        // 이전 상태 복원
```

---

## Canvas vs SVG

| 구분 | Canvas | SVG |
|------|--------|-----|
| **방식** | 비트맵 (픽셀) | 벡터 (수학적 도형) |
| **확대** | 깨짐 | 선명함 유지 |
| **DOM** | 단일 요소 | 각 도형이 DOM 요소 |
| **이벤트** | 직접 구현 (좌표 계산) | 요소별 이벤트 가능 |
| **성능 (많은 객체)** | 빠름 | 느림 (DOM 부하) |
| **성능 (큰 영역)** | 느림 (픽셀 수 비례) | 빠름 |
| **접근성** | 어려움 | 가능 (aria 등) |
| **적합한 용도** | 게임, 복잡한 시각화, 이미지 처리 | 아이콘, 로고, 간단한 차트 |

### 선택 기준

| 상황 | 권장 |
|------|------|
| 수천 개 이상의 객체 | Canvas |
| 복잡한 애니메이션, 게임 | Canvas |
| 이미지 픽셀 조작 | Canvas |
| 확대/축소가 잦은 그래픽 | SVG |
| 개별 요소 클릭 이벤트 필요 | SVG |
| 접근성 중요 | SVG |
| 간단한 아이콘, 로고 | SVG |

---

## React에서 Canvas 다루기

### 기본 패턴: useRef + useEffect

Canvas는 **DOM을 직접 조작**해야 하므로 React의 선언적 패러다임과 맞지 않습니다. `useRef`로 Canvas 요소에 접근하고, `useEffect`에서 그리기를 수행합니다.

```jsx
function CanvasComponent() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 그리기
    ctx.fillStyle = 'blue';
    ctx.fillRect(10, 10, 100, 100);
  }, []);
  
  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

### 왜 useRef를 사용하는가?

React에서 DOM에 직접 접근하려면 `useRef`를 사용합니다. Canvas API는 명령형이므로 `ctx.fillRect()` 같은 메서드를 직접 호출해야 합니다. JSX로는 Canvas 내부를 그릴 수 없습니다.

### 의존성에 따른 다시 그리기

props나 state가 변경되면 Canvas를 다시 그려야 합니다. `useEffect`의 의존성 배열에 해당 값을 넣습니다.

```jsx
function Circle({ radius, color }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 이전 내용 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 새로 그리기
    ctx.beginPath();
    ctx.arc(100, 100, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [radius, color]);  // radius나 color 변경 시 다시 그림
  
  return <canvas ref={canvasRef} width={200} height={200} />;
}
```

**중요**: Canvas는 자동으로 지워지지 않습니다. 다시 그리기 전에 `clearRect()`로 명시적으로 지워야 합니다.

### Canvas 크기 주의사항

Canvas의 `width`, `height` 속성과 CSS 크기는 다릅니다.

| 구분 | 역할 |
|------|------|
| `width`, `height` 속성 | 실제 픽셀 해상도 (그리기 영역) |
| CSS `width`, `height` | 화면에 표시되는 크기 |

```jsx
// ❌ CSS로만 크기 지정 - 흐릿해짐
<canvas style={{ width: 800, height: 600 }} />

// ✅ 속성으로 크기 지정
<canvas width={800} height={600} />
```

CSS만으로 크기를 지정하면 기본 해상도(300x150)가 늘어나 흐릿해집니다.

### 고해상도 (Retina) 대응

고밀도 디스플레이에서 선명하게 그리려면 `devicePixelRatio`를 고려해야 합니다.

```jsx
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // 실제 픽셀 크기 설정
  canvas.width = 800 * dpr;
  canvas.height = 600 * dpr;
  
  // CSS 크기는 원래대로
  canvas.style.width = '800px';
  canvas.style.height = '600px';
  
  // 스케일 조정
  ctx.scale(dpr, dpr);
}, []);
```

---

## 이벤트 처리

Canvas는 단일 DOM 요소이므로 내부 도형에 직접 이벤트를 붙일 수 없습니다. Canvas 전체의 이벤트를 받아 **좌표를 계산**해 어떤 도형이 클릭되었는지 판단해야 합니다.

### 마우스 좌표 얻기

```jsx
const handleClick = (e) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  
  // Canvas 내 좌표
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  console.log(`Clicked at (${x}, ${y})`);
};

<canvas ref={canvasRef} onClick={handleClick} />
```

### 도형 클릭 감지 (Hit Testing)

클릭 좌표가 도형 영역 내에 있는지 직접 계산합니다. 사각형은 `x >= shape.x && x <= shape.x + width`, 원은 거리 공식 `Math.sqrt((x - cx)² + (y - cy)²) <= radius`로 판단합니다.

---

## 애니메이션

### requestAnimationFrame

부드러운 애니메이션을 위해 `requestAnimationFrame`을 사용합니다. 브라우저의 리페인트 주기(보통 60fps)에 맞춰 호출됩니다.

```jsx
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  let animationId;
  let x = 0;
  
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(x++, 100, 50, 50);
    if (x > canvas.width) x = 0;
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  return () => cancelAnimationFrame(animationId);
}, []);
```

### 애니메이션에서 state 사용 주의

애니메이션 루프에서 `setState`를 호출하면 매 프레임 리렌더링이 발생합니다. **성능 문제**가 생길 수 있습니다.

```jsx
// ❌ 매 프레임 리렌더링
const [x, setX] = useState(0);
const animate = () => {
  setX(prev => prev + 1);  // 60fps로 리렌더링 발생!
};

// ✅ ref로 값 관리, Canvas만 업데이트
const xRef = useRef(0);
const animate = () => {
  xRef.current += 1;
  // Canvas에 직접 그리기
};
```

애니메이션 값은 `useRef`로 관리하고, Canvas에 직접 그리는 것이 효율적입니다. React 리렌더링 없이 Canvas만 업데이트됩니다.

---

## 성능 최적화

### 오프스크린 Canvas

복잡한 정적 요소는 **오프스크린 Canvas에 미리 그려두고** 메인 Canvas에 `drawImage()`로 복사합니다. 매 프레임 복잡한 배경을 다시 그리는 대신 이미지 복사만 하면 됩니다.

### 더티 영역만 다시 그리기

전체를 지우고 다시 그리는 대신, **변경된 영역만 업데이트**합니다.

```jsx
// ❌ 전체 다시 그리기
ctx.clearRect(0, 0, canvas.width, canvas.height);
drawAllShapes();

// ✅ 변경된 부분만
ctx.clearRect(oldX, oldY, width, height);  // 이전 위치 지우기
ctx.fillRect(newX, newY, width, height);   // 새 위치 그리기
```

### 최적화 요약

| 기법 | 설명 |
|------|------|
| 오프스크린 Canvas | 정적 요소 미리 렌더링 |
| 더티 영역 | 변경된 부분만 다시 그리기 |
| requestAnimationFrame | setTimeout/setInterval 대신 사용 |
| ref로 값 관리 | state로 인한 리렌더링 방지 |
| 경로 재사용 | `beginPath()` 최소화 |
| 이미지 캐싱 | 같은 이미지 반복 로드 방지 |

---

## 실전 패턴: Canvas 컴포넌트 구조

게임이나 복잡한 Canvas 앱은 다음 구조를 따릅니다:
- `useRef`로 Canvas 요소와 게임 상태 관리
- `useEffect`에서 게임 루프 시작/정리
- `useCallback`으로 그리기 함수 메모이제이션
- 게임 상태는 ref로, UI 상태만 state로 관리

---

## 면접 예상 질문

**Q. Canvas란?**

HTML5에서 제공하는 비트맵 그래픽 요소입니다. JavaScript로 렌더링 컨텍스트를 얻어 픽셀 단위로 그래픽을 그립니다. 게임, 데이터 시각화, 이미지 처리 등에 사용합니다. 그려진 내용은 DOM 요소가 아니라 픽셀 데이터입니다.

**Q. Canvas와 SVG의 차이?**

Canvas는 비트맵 기반으로 확대하면 깨지고, SVG는 벡터 기반으로 확대해도 선명합니다. Canvas는 단일 DOM 요소로 수천 개 객체도 빠르게 렌더링하고, SVG는 각 도형이 DOM 요소라 많으면 느려집니다. 게임이나 복잡한 시각화는 Canvas, 아이콘이나 확대가 필요한 그래픽은 SVG가 적합합니다.

**Q. React에서 Canvas를 어떻게 다루나요?**

useRef로 Canvas 요소에 접근하고, useEffect에서 그리기를 수행합니다. Canvas API는 명령형이라 JSX로 표현할 수 없으므로 DOM을 직접 조작해야 합니다. props나 state가 변경되면 useEffect 의존성으로 다시 그리고, 그 전에 clearRect로 지워야 합니다.

**Q. Canvas 애니메이션에서 state 대신 ref를 사용하는 이유?**

state를 변경하면 컴포넌트가 리렌더링됩니다. 60fps 애니메이션에서 매 프레임 setState를 호출하면 초당 60번 리렌더링이 발생해 성능 문제가 생깁니다. ref로 값을 관리하면 리렌더링 없이 Canvas만 업데이트할 수 있습니다.

**Q. Canvas 성능 최적화 방법?**

오프스크린 Canvas에 정적 요소를 미리 그려두고 복사합니다. 전체를 지우는 대신 변경된 영역만 다시 그립니다. setTimeout 대신 requestAnimationFrame을 사용합니다. 애니메이션 값은 state 대신 ref로 관리하여 리렌더링을 방지합니다.