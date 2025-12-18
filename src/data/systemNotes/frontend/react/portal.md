# React Portal

## Portal이란?

**부모 컴포넌트의 DOM 계층 구조 외부에 자식을 렌더링하는 방법**입니다. 컴포넌트가 시각적으로 부모 밖에 나타나야 할 때 사용합니다.

```
일반 렌더링:                    Portal 사용:

<div id="root">               <div id="root">
  <App>                         <App>
    <Parent>                      <Parent>
      <Modal />  ← 여기 렌더링       (Portal)
    </Parent>                     </Parent>
  </App>                        </App>
</div>                        </div>
                              <div id="modal-root">
                                <Modal />  ← 여기 렌더링
                              </div>
```

---

## 왜 필요한가?

**CSS 제약 탈출:**

부모에 `overflow: hidden`, `z-index`, `position` 등이 설정되어 있으면 자식 요소가 부모 영역을 벗어나기 어렵습니다.

```jsx
// 문제 상황
function Parent() {
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <Modal />  {/* overflow: hidden에 갇힘! */}
    </div>
  );
}
```

```jsx
// Portal로 해결
function Parent() {
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <ModalWithPortal />  {/* DOM은 밖에 렌더링, CSS 제약 탈출 */}
    </div>
  );
}
```

**주요 사용 사례:**
- 모달 (Modal)
- 드롭다운 메뉴 (Dropdown)
- 툴팁 (Tooltip)
- 토스트/알림 (Toast/Notification)
- 전체 화면 오버레이

---

## 기본 사용법

**1. Portal 컨테이너 준비 (index.html):**

```html
<body>
  <div id="root"></div>
  <div id="portal-root"></div>  <!-- Portal 대상 -->
</body>
```

**2. createPortal 사용:**

```jsx
import { createPortal } from 'react-dom';

function Modal({ children, isOpen }) {
  if (!isOpen) return null;
  
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>,
    document.getElementById('portal-root')
  );
}
```

**createPortal 시그니처:**

```jsx
createPortal(children, domNode, key?)

// children: 렌더링할 React 요소
// domNode: 렌더링 대상 DOM 노드
// key: (선택) Portal의 고유 키
```

---

## 실전 Modal 구현

```jsx
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

function Modal({ isOpen, onClose, children }) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';  // 스크롤 방지
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="modal-overlay"
      onClick={onClose}  // 배경 클릭으로 닫기
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}  // 내부 클릭은 닫히지 않음
      >
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>,
    document.getElementById('portal-root')
  );
}
```

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
```

**사용:**

```jsx
const [isOpen, setIsOpen] = useState(false);

<button onClick={() => setIsOpen(true)}>모달 열기</button>
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <h2>모달 제목</h2>
  <p>모달 내용입니다.</p>
</Modal>
```

---

## 이벤트 버블링

**Portal의 핵심 특징: DOM 위치와 상관없이 이벤트는 React 트리를 따라 버블링됩니다.**

```jsx
function Parent() {
  const handleClick = () => console.log('Parent clicked!');
  
  return (
    <div onClick={handleClick}>
      <Modal>
        <button>Click me</button>  {/* 클릭하면 Parent clicked! 출력 */}
      </Modal>
    </div>
  );
}
```

```
DOM 트리:                    React 트리 (이벤트 버블링):

<div id="root">              <Parent>
  <div> (Parent)               ↑ 이벤트 버블링
  </div>                       <Modal>
</div>                           <button />
<div id="portal-root">         </Modal>
  <Modal />                  </Parent>
</div>
```

Modal이 DOM에서는 `#portal-root`에 있지만, React 이벤트는 Parent까지 버블링됩니다. Context도 마찬가지로 React 트리를 따릅니다.

---

## Portal 컨테이너 동적 생성

매번 HTML에 추가하지 않고 동적으로 생성할 수 있습니다.

```jsx
function Portal({ children, containerId = 'portal-root' }) {
  const [container, setContainer] = useState(null);
  
  useEffect(() => {
    let element = document.getElementById(containerId);
    let created = false;
    
    if (!element) {
      element = document.createElement('div');
      element.id = containerId;
      document.body.appendChild(element);
      created = true;
    }
    setContainer(element);
    
    return () => {
      if (created) element.remove();
    };
  }, [containerId]);
  
  return container ? createPortal(children, container) : null;
}
```

**사용:**

```jsx
function Modal({ isOpen, children }) {
  if (!isOpen) return null;
  
  return (
    <Portal containerId="modal-root">
      <div className="modal-overlay">
        {children}
      </div>
    </Portal>
  );
}
```

---

## Tooltip 구현 예시

```jsx
function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  
  const showTooltip = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setIsVisible(true);
  };
  
  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </span>
      
      {isVisible && createPortal(
        <div
          className="tooltip"
          style={{ position: 'fixed', left: coords.x, top: coords.y }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
```

---

## 접근성 (Accessibility)

모달 사용 시 접근성을 고려해야 합니다.

```jsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) modalRef.current?.focus();
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose}>닫기</button>
    </div>,
    document.getElementById('portal-root')
  );
}
```

**접근성 체크리스트:**
- `role="dialog"`, `aria-modal="true"` 설정
- `aria-labelledby`로 제목 연결
- 열릴 때 모달로 포커스 이동
- ESC 키로 닫기
- 포커스 트랩 (모달 밖으로 탭 이동 방지)
- 닫힐 때 트리거 요소로 포커스 복귀

---

## 주의사항

**1. SSR 환경:**

서버에서는 `document`가 없으므로 클라이언트에서만 렌더링해야 합니다.

```jsx
function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return createPortal(children, document.body);
}
```

**2. 스타일 격리:**

Portal은 DOM 위치가 다르므로 부모의 CSS가 적용되지 않을 수 있습니다. 전역 스타일이나 CSS-in-JS를 사용하세요.

**3. 정리 (Cleanup):**

동적으로 생성한 컨테이너는 컴포넌트 언마운트 시 제거해야 합니다.

---

## 면접 예상 질문

**Q. React Portal이란?**

부모 컴포넌트의 DOM 계층 구조 외부에 자식을 렌더링하는 방법입니다. `createPortal(children, domNode)`로 사용하며, 부모의 CSS 제약(overflow, z-index)을 벗어나야 하는 모달, 툴팁, 드롭다운에 사용됩니다.

**Q. Portal을 사용하는 이유?**

부모에 `overflow: hidden`이나 `z-index` 스태킹 컨텍스트가 있으면 자식이 부모 영역을 벗어나기 어렵습니다. Portal로 DOM 트리 최상단에 렌더링하면 이런 CSS 제약을 피할 수 있습니다.

**Q. Portal에서 이벤트 버블링은 어떻게 동작하나요?**

DOM 위치와 상관없이 React 트리를 따라 버블링됩니다. Portal 내부에서 발생한 이벤트는 React 트리상의 부모로 전파됩니다. Context도 마찬가지로 React 트리를 따릅니다.

**Q. 모달 구현 시 접근성 고려사항?**

`role="dialog"`, `aria-modal="true"` 설정, 열릴 때 모달로 포커스 이동, ESC로 닫기, 포커스 트랩(모달 내부에서만 탭 이동), 닫힐 때 트리거로 포커스 복귀가 필요합니다.

**Q. SSR에서 Portal 사용 시 주의점?**

서버에서는 `document`가 없으므로 `useEffect`로 마운트 후에만 Portal을 렌더링해야 합니다. `useState`로 마운트 상태를 관리하고 클라이언트에서만 `createPortal`을 호출합니다.