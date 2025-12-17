# 컴포넌트 설계 원칙

## 좋은 컴포넌트란?

**재사용 가능하고, 테스트하기 쉽고, 유지보수가 용이한 컴포넌트**입니다. 하나의 역할에 집중하고, 명확한 인터페이스(props)를 가지며, 다양한 상황에서 유연하게 사용할 수 있습니다.

---

## 단일 책임 원칙 (Single Responsibility)

**하나의 컴포넌트는 하나의 역할만 담당**해야 합니다. 여러 역할이 섞이면 재사용이 어렵고 변경에 취약해집니다.

```jsx
// ❌ 너무 많은 책임: 데이터 페칭 + 필터링 + 정렬 + 렌더링
function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  useEffect(() => { fetchUsers().then(setUsers); }, []);
  
  const filteredUsers = users.filter(u => u.name.includes(filter));
  const sortedUsers = [...filteredUsers].sort((a, b) => /* ... */);
  
  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <select value={sortBy} onChange={e => setSortBy(e.target.value)}>...</select>
      <table>...</table>
    </div>
  );
}

// ✅ 책임 분리
function UserDashboard() {
  const { users, loading } = useUsers();  // 데이터 페칭은 Hook으로
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const displayUsers = useMemo(() => 
    sortUsers(filterUsers(users, filter), sortBy),
    [users, filter, sortBy]
  );
  
  return (
    <div>
      <SearchInput value={filter} onChange={setFilter} />
      <SortSelect value={sortBy} onChange={setSortBy} />
      <UserTable users={displayUsers} loading={loading} />
    </div>
  );
}
```

**분리 기준:**
- UI 렌더링과 비즈니스 로직 분리
- 데이터 페칭은 Custom Hook으로
- 각 UI 요소를 독립 컴포넌트로

---

## 컴포넌트 분류

| 유형 | 역할 | 특징 |
|------|------|------|
| **Presentational** | UI 렌더링 | props로 데이터 받음, 상태 거의 없음, 재사용성 높음 |
| **Container** | 데이터/로직 관리 | API 호출, 상태 관리, Presentational에 데이터 전달 |

```jsx
// Presentational: UI만
function UserCard({ user, onEdit, onDelete }) {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
}

// Container: 로직
function UserCardContainer({ userId }) {
  const { user, loading } = useUser(userId);
  const { editUser, deleteUser } = useUserActions();
  if (loading) return <Skeleton />;
  return <UserCard user={user} onEdit={editUser} onDelete={deleteUser} />;
}
```

Hooks로 로직을 분리하면서 이 구분이 덜 엄격해졌지만, 개념적으로 여전히 유용합니다.

---

## 합성 (Composition)

**상속보다 합성을 선호**합니다. 컴포넌트를 조합하여 복잡한 UI를 구성합니다.

**children을 활용한 합성:**

```jsx
// 범용적인 Card 컴포넌트
function Card({ children, className }) {
  return <div className={`card ${className}`}>{children}</div>;
}

// 합성으로 다양한 카드 생성
<Card>
  <UserProfile user={user} />
</Card>

<Card className="highlighted">
  <ProductInfo product={product} />
  <PurchaseButton />
</Card>
```

**슬롯 패턴 (Compound Components):**

```jsx
// 여러 슬롯을 가진 컴포넌트
function Dialog({ children }) {
  return <div className="dialog">{children}</div>;
}

Dialog.Header = ({ children }) => <header className="dialog-header">{children}</header>;
Dialog.Body = ({ children }) => <main className="dialog-body">{children}</main>;
Dialog.Footer = ({ children }) => <footer className="dialog-footer">{children}</footer>;

// 사용: 구조가 명확하고 유연함
<Dialog>
  <Dialog.Header>제목</Dialog.Header>
  <Dialog.Body>내용</Dialog.Body>
  <Dialog.Footer>
    <Button onClick={onClose}>닫기</Button>
  </Dialog.Footer>
</Dialog>
```

**Render Props:**

```jsx
// 렌더링 로직을 외부에서 주입
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  
  return render(position);
}

// 사용
<MouseTracker render={({ x, y }) => <div>마우스 위치: {x}, {y}</div>} />
```

---

## Props 설계

**명확하고 일관된 인터페이스**가 재사용성의 핵심입니다.

**기본값 제공:**

```jsx
function Button({ 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  ...rest 
}) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
```

**Props 네이밍 컨벤션:**

| 유형 | 패턴 | 예시 |
|------|------|------|
| 불리언 | is/has/can/should | isOpen, hasError, canEdit |
| 이벤트 핸들러 | on + 동사 | onClick, onChange, onSubmit |
| 렌더 함수 | render + 명사 | renderItem, renderHeader |
| 컴포넌트 주입 | as, component | as="a", component={Link} |

**다형성 컴포넌트 (as prop):**

```jsx
function Button({ as: Component = 'button', children, ...props }) {
  return <Component {...props}>{children}</Component>;
}

// 버튼으로 사용
<Button onClick={handleClick}>클릭</Button>

// 링크로 사용
<Button as="a" href="/home">홈으로</Button>

// React Router Link로 사용
<Button as={Link} to="/about">소개</Button>
```

**Props 확장 (스프레드):**

```jsx
// HTML 속성을 모두 받을 수 있게
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} ${className || ''}`}
      {...rest}  // onClick, disabled, type 등 모든 버튼 속성
    />
  );
}
```

---

## 제어 컴포넌트 vs 비제어 컴포넌트

**제어 컴포넌트 (Controlled):** 부모가 상태를 완전히 제어

```jsx
function ControlledInput({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

// 사용: 부모가 상태 관리
const [text, setText] = useState('');
<ControlledInput value={text} onChange={setText} />
```

**비제어 컴포넌트 (Uncontrolled):** 컴포넌트 내부에서 상태 관리

```jsx
function UncontrolledInput({ defaultValue, onBlur }) {
  const inputRef = useRef(null);
  return <input ref={inputRef} defaultValue={defaultValue} onBlur={onBlur} />;
}
```

**하이브리드 패턴:** 제어/비제어 모두 지원

```jsx
function Input({ value, defaultValue, onChange }) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  
  // value prop이 있으면 제어 모드, 없으면 비제어 모드
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  const handleChange = (e) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e.target.value);
  };
  
  return <input value={currentValue} onChange={handleChange} />;
}

// 제어 모드
<Input value={text} onChange={setText} />

// 비제어 모드
<Input defaultValue="초기값" onChange={handleChange} />
```

---

## 재사용 가능한 컴포넌트 패턴

**범용 UI 컴포넌트** - 특정 도메인에 종속되지 않는 기본 요소

```jsx
function List({ items, renderItem, keyExtractor, emptyMessage = '항목이 없습니다' }) {
  if (items.length === 0) return <p>{emptyMessage}</p>;
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor?.(item, index) ?? index}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// 다양한 상황에서 재사용
<List items={users} renderItem={(user) => <UserCard user={user} />} keyExtractor={(u) => u.id} />
```

**도메인 특화 컴포넌트** - 범용 컴포넌트를 조합하여 특정 도메인에 맞게 구성

```jsx
function UserList({ users, onSelect }) {
  return (
    <List
      items={users}
      keyExtractor={(user) => user.id}
      renderItem={(user) => <UserCard user={user} onClick={() => onSelect(user)} />}
    />
  );
}
```

**HOC (Higher-Order Component)** - 공통 기능 추가. Hooks 등장 후 사용이 줄었지만 여전히 유용한 경우 있음

```jsx
function withLoading(Component) {
  return function WithLoading({ isLoading, ...props }) {
    if (isLoading) return <Spinner />;
    return <Component {...props} />;
  };
}
```

---

## 컴포넌트 분리 기준

**분리해야 할 때:** 같은 UI 반복, 컴포넌트가 너무 큼(200줄+), 독립적 테스트 필요, 렌더링 최적화 필요

**분리하지 말아야 할 때:** 한 곳에서만 사용, 과도한 추상화, Props Drilling 심화

```
src/components/
  ui/          # 범용 UI (Button, Input, Modal)
  features/    # 도메인 특화 (user/, product/)
  layout/      # 레이아웃 (Header, Sidebar)
```

---

## 스타일링과 접근성

**className 합성** - clsx/classnames로 조건부 클래스 조합, 외부 className도 받아서 확장 가능하게

```jsx
function Button({ variant, className, ...props }) {
  const classes = clsx('btn', `btn-${variant}`, className);
  return <button className={classes} {...props} />;
}
```

**접근성 기본 제공** - 재사용 컴포넌트는 aria 속성을 기본으로 갖춰야 합니다.

```jsx
function IconButton({ icon, label, ...props }) {
  return <button aria-label={label} {...props}>{icon}</button>;
}
```

---

## 면접 예상 질문

**Q. 좋은 컴포넌트 설계 원칙은?**

단일 책임 원칙(하나의 역할), 합성 우선(상속보다 조합), 명확한 Props 인터페이스, 제어/비제어 선택, 접근성 고려입니다. Presentational과 Container 컴포넌트를 구분하여 UI와 로직을 분리하면 재사용성과 테스트가 쉬워집니다.

**Q. 컴포넌트를 언제 분리해야 하나요?**

같은 UI가 반복될 때, 컴포넌트가 너무 클 때(200줄 이상), 독립적 테스트가 필요할 때, 렌더링 최적화가 필요할 때 분리합니다. 반면 한 곳에서만 사용되거나 과도한 추상화가 될 때는 분리하지 않습니다.

**Q. 합성(Composition)이란?**

컴포넌트를 조합하여 복잡한 UI를 구성하는 패턴입니다. children, 슬롯 패턴(Compound Components), Render Props 등을 활용합니다. 상속보다 유연하고 재사용성이 높습니다.

**Q. 제어/비제어 컴포넌트의 차이?**

제어 컴포넌트는 부모가 value와 onChange로 상태를 완전히 제어합니다. 비제어 컴포넌트는 내부에서 상태를 관리하고 ref나 defaultValue를 사용합니다. 폼 유효성 검사가 복잡하면 제어, 간단하면 비제어가 적합합니다.

**Q. Props 설계 시 고려사항?**

기본값 제공, 일관된 네이밍(isOpen, onClick), 다형성 지원(as prop), HTML 속성 확장(스프레드), TypeScript 타입 정의입니다. 외부에서 className이나 style을 추가할 수 있게 하면 확장성이 높아집니다.