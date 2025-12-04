# 시맨틱 HTML

## 시맨틱 HTML이란?

**의미가 있는 HTML 태그**를 사용하여 콘텐츠의 구조와 의미를 명확하게 표현하는 것

```html
<!-- 시맨틱하지 않음 - 의미 없는 div -->
<div class="header">제목</div>

<!-- 시맨틱함 - 의미가 명확한 태그 -->
<header>제목</header>
```

---

## 왜 중요한가?

### 1. 접근성 (Accessibility)

스크린 리더가 콘텐츠 구조를 이해하고 사용자에게 전달할 수 있습니다.

```html
<!-- 스크린 리더: "네비게이션 영역, 링크 3개" -->
<nav>
  <a href="/">홈</a>
  <a href="/about">소개</a>
  <a href="/contact">연락처</a>
</nav>

<!-- 스크린 리더: "그룹... 링크 홈, 링크 소개..." (구조 파악 어려움) -->
<div class="nav">
  <a href="/">홈</a>
  ...
</div>
```

### 2. SEO 최적화

검색 엔진이 콘텐츠의 구조와 중요도를 파악할 수 있습니다.

```html
<!-- 검색 엔진: "이게 이 페이지의 주요 콘텐츠구나" -->
<main>
  <article>
    <h1>React 완벽 가이드</h1>  <!-- 이게 핵심 제목 -->
    ...
  </article>
</main>
```

### 3. 브라우저 기본 기능

시맨틱 태그는 키보드 네비게이션, 포커스 등 기본 기능을 제공합니다.

```html
<!-- 키보드로 접근 가능, Enter로 클릭 가능, 포커스 표시됨 -->
<button>제출</button>

<!-- 키보드 접근 불가, 직접 구현해야 함 -->
<div class="button">제출</div>
```

---

## 주요 시맨틱 태그

### 페이지 구조 태그

```html
<header>    <!-- 페이지/섹션의 머리말 -->
<nav>       <!-- 네비게이션 링크 그룹 -->
<main>      <!-- 페이지의 주요 콘텐츠 (페이지당 1개) -->
<section>   <!-- 주제별로 구분된 콘텐츠 영역 -->
<article>   <!-- 독립적인 콘텐츠 (블로그 글, 뉴스 기사, 댓글) -->
<aside>     <!-- 부가 정보, 사이드바, 광고 -->
<footer>    <!-- 페이지/섹션의 바닥글 -->
```

### 페이지 구조 예시

```html
<body>
  <header>
    <nav><!-- 메인 네비게이션 --></nav>
  </header>
  
  <main>
    <article>
      <header><!-- 글 제목, 작성일 --></header>
      <section><!-- 본문 섹션 1 --></section>
      <section><!-- 본문 섹션 2 --></section>
      <footer><!-- 글 작성자, 태그 --></footer>
    </article>
  </main>
  
  <aside><!-- 사이드바 --></aside>
  
  <footer><!-- 페이지 푸터 --></footer>
</body>
```

### 콘텐츠 의미 태그

| 태그 | 용도 |
|------|------|
| `<h1>`~`<h6>` | 제목 계층 구조 |
| `<p>` | 문단 |
| `<figure>` | 이미지, 차트 등과 캡션을 묶는 컨테이너 |
| `<figcaption>` | figure의 캡션 |
| `<time>` | 날짜/시간 정보 |
| `<address>` | 연락처 정보 |
| `<mark>` | 하이라이트 텍스트 |
| `<blockquote>` | 인용문 |
| `<code>` | 코드 |

---

## 흔한 실수들

### 1. div로 버튼 만들기

```html
<!-- ❌ 키보드 접근 불가, 스크린 리더가 버튼으로 인식 안 함 -->
<div class="button" onclick="submit()">제출</div>

<!-- ✅ 키보드, 스크린 리더 모두 동작 -->
<button type="submit">제출</button>
```

### 2. 제목 계층 건너뛰기

```html
<!-- ❌ h1 → h3 (h2 건너뜀) -->
<h1>페이지 제목</h1>
<h3>섹션 제목</h3>

<!-- ✅ 순서대로 사용 -->
<h1>페이지 제목</h1>
<h2>섹션 제목</h2>
```

### 3. 이미지 alt 누락

```html
<!-- ❌ 스크린 리더가 읽을 수 없음 -->
<img src="logo.png">

<!-- ✅ 이미지 설명 제공 -->
<img src="logo.png" alt="회사 로고">

<!-- ✅ 장식용 이미지는 빈 alt -->
<img src="decoration.png" alt="">
```

### 4. a 태그 남용

```html
<!-- ❌ 페이지 이동 없이 동작만 수행 -->
<a href="#" onclick="doSomething()">클릭</a>

<!-- ✅ 동작은 button, 이동은 a -->
<button onclick="doSomething()">클릭</button>
<a href="/other-page">다른 페이지로</a>
```

---

## 좋은 예시 vs 나쁜 예시

### 나쁜 예시

```html
<div class="header">
  <div class="title">React 18의 새로운 기능들</div>
  <div class="date">2024년 3월 15일</div>
</div>

<div class="content">
  <div class="subtitle">Concurrent Features</div>
  <div class="text">React 18에서 도입된 동시성 기능들...</div>
</div>

<div class="footer">
  <div class="author">작성자: 김개발</div>
</div>
```

### 좋은 예시

```html
<article>
  <header>
    <h1>React 18의 새로운 기능들</h1>
    <time datetime="2024-03-15">2024년 3월 15일</time>
  </header>
  
  <section>
    <h2>Concurrent Features</h2>
    <p>React 18에서 도입된 동시성 기능들...</p>
  </section>
  
  <footer>
    <address>작성자: 김개발</address>
  </footer>
</article>
```

---

## button vs div 상세 비교

| 기능 | `<button>` | `<div>` |
|------|------------|---------|
| 키보드 포커스 | 자동 | tabindex 필요 |
| Enter 키 클릭 | 자동 | onkeydown 필요 |
| 스크린 리더 | "버튼"으로 인식 | role="button" 필요 |
| 기본 스타일 | 있음 | 없음 |

div로 버튼을 만들려면:

```html
<div 
  class="button"
  role="button"
  tabindex="0"
  onclick="submit()"
  onkeydown="if(event.key === 'Enter') submit()"
>
  제출
</div>

<!-- 그냥 button 쓰면 됨 -->
<button onclick="submit()">제출</button>
```

---

## ARIA 속성

시맨틱 태그만으로 부족할 때 접근성 정보를 추가합니다.

```html
<!-- 로딩 상태 전달 -->
<button aria-busy="true" aria-label="로딩 중">
  <span class="spinner"></span>
</button>

<!-- 모달 설명 -->
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">확인</h2>
  <p>정말 삭제하시겠습니까?</p>
</div>

<!-- 에러 메시지 연결 -->
<input id="email" aria-describedby="email-error" aria-invalid="true">
<span id="email-error">유효한 이메일을 입력하세요</span>
```

**원칙:** 시맨틱 태그로 해결되면 ARIA 불필요. 불가능할 때만 사용.

---

## Study

**Q. 시맨틱 HTML이 왜 중요한가요?**

세 가지 이유가 있습니다. 첫째, 접근성입니다. 스크린 리더가 페이지 구조를 이해하고 시각장애인에게 전달할 수 있습니다. 둘째, SEO입니다. 검색 엔진이 콘텐츠의 구조와 중요도를 파악해서 검색 순위에 반영합니다. 셋째, 브라우저 기본 기능입니다. button 태그는 키보드 포커스, Enter 클릭이 자동으로 동작하지만 div는 직접 구현해야 합니다.

**Q. div와 button의 차이는?**

button은 키보드 포커스, Enter 키 클릭, 스크린 리더 인식이 기본 제공됩니다. div로 같은 기능을 만들려면 tabindex, onkeydown, role="button"을 모두 추가해야 합니다. 클릭 가능한 요소는 button을 사용하는 게 접근성과 유지보수 측면에서 좋습니다.

**Q. article과 section의 차이는?**

article은 독립적으로 의미가 있는 콘텐츠입니다. RSS 피드에 들어갈 수 있는, 그 자체로 완결된 콘텐츠(블로그 글, 뉴스 기사, 댓글)에 사용합니다. section은 주제별로 구분된 영역으로, 보통 제목(h2~h6)과 함께 사용합니다. article 안에 여러 section이 있을 수 있습니다.