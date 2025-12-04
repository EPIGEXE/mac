# CSS 반응형 디자인

## 반응형 디자인이란?

화면 크기에 따라 레이아웃이 자동으로 조정되는 디자인

```
데스크톱              태블릿              모바일
┌──────────────┐    ┌──────────┐       ┌─────┐
│ ■■■  ■■■■■■ │    │ ■■■■■■■■ │       │ ■■■ │
│ ■■■  ■■■■■■ │    │ ■■■■■■■■ │       │ ■■■ │
│ ■■■  ■■■■■■ │    │ ■■■  ■■■ │       │ ■■■ │
└──────────────┘    └──────────┘       └─────┘
```
## 미디어 쿼리 (Media Query)

### 기본 문법

```css
@media (조건) {
  /* 조건이 참일 때 적용될 스타일 */
}
```

```css
/* 화면 너비가 768px 이하일 때 */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

/* 화면 너비가 768px 이상일 때 */
@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}
```

### 조건 조합

```css
/* AND */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 768px ~ 1023px */
}

/* OR (쉼표) */
@media (max-width: 767px), (orientation: portrait) {
  /* 767px 이하 또는 세로 모드 */
}

/* NOT */
@media not print {
  /* 프린트가 아닐 때 */
}
```

## 모바일 퍼스트 vs 데스크톱 퍼스트

### 모바일 퍼스트 (권장)

**기본 스타일 = 모바일**, 화면이 커지면 스타일 추가

```css
/* 기본: 모바일 스타일 */
.container {
  flex-direction: column;
}

/* 태블릿 이상 */
@media (min-width: 768px) {
  .container {
    flex-direction: row;
  }
}

/* 데스크톱 이상 */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }
}
```

### 데스크톱 퍼스트

**기본 스타일 = 데스크톱**, 화면이 작아지면 스타일 변경

```css
/* 기본: 데스크톱 스타일 */
.container {
  flex-direction: row;
  max-width: 1200px;
}

/* 태블릿 이하 */
@media (max-width: 1023px) {
  .container {
    max-width: 100%;
  }
}

/* 모바일 이하 */
@media (max-width: 767px) {
  .container {
    flex-direction: column;
  }
}
```

### 비교

| 구분 | 모바일 퍼스트 | 데스크톱 퍼스트 |
|------|--------------|----------------|
| 기본 스타일 | 모바일 | 데스크톱 |
| 미디어 쿼리 | `min-width` | `max-width` |
| 장점 | 성능 좋음, 점진적 향상 | 기존 사이트 수정 시 편함 |
| 권장 | ✅ 신규 프로젝트 | 레거시 유지보수 |

**모바일 퍼스트 권장 이유:**
- 모바일 트래픽이 더 많음
- 모바일에서 불필요한 CSS 로드 방지
- 점진적 향상 (Progressive Enhancement)

## 브레이크포인트

### 일반적인 브레이크포인트

| 기기 | 너비 |
|------|------|
| 모바일 | < 768px |
| 태블릿 | 768px ~ 1023px |
| 데스크톱 | 1024px ~ 1439px |
| 대형 화면 | ≥ 1440px |

### 모바일 퍼스트 예시

```css
/* 모바일 (기본) */
.container { }

/* 태블릿 */
@media (min-width: 768px) { }

/* 데스크톱 */
@media (min-width: 1024px) { }

/* 대형 화면 */
@media (min-width: 1440px) { }
```

### Tailwind CSS 브레이크포인트

| 접두사 | 최소 너비 |
|--------|-----------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

## 뷰포트 단위

### 기본 단위

| 단위 | 기준 |
|------|------|
| vw | 뷰포트 너비의 1% |
| vh | 뷰포트 높이의 1% |
| vmin | vw, vh 중 작은 값 |
| vmax | vw, vh 중 큰 값 |

```css
.full-screen {
  width: 100vw;
  height: 100vh;
}

.half-width {
  width: 50vw;  /* 화면 너비의 50% */
}

.responsive-text {
  font-size: 5vw;  /* 화면 너비에 비례 */
}
```

### 모바일 100vh 문제

모바일 브라우저에서 주소창 때문에 100vh가 실제 화면보다 큼

```
예상:                 실제:
┌─────────────┐      ┌─────────────┐ ← 주소창
│             │      ├─────────────┤
│   100vh     │      │             │
│             │      │   100vh     │ ← 주소창 포함 높이
│             │      │             │
└─────────────┘      │─────────────│ ← 화면 밖으로 넘침
                     └─────────────┘
```

### 해결: 새로운 뷰포트 단위

```css
.full-height {
  /* svh: Small - 주소창이 보일 때 (가장 작은 뷰포트) */
  height: 100svh;
  
  /* lvh: Large - 주소창이 숨겨질 때 (가장 큰 뷰포트) */
  height: 100lvh;
  
  /* dvh: Dynamic - 현재 상태에 맞게 동적 변경 (권장) */
  height: 100dvh;
}
```

```css
/* 실무 패턴 */
.full-screen {
  height: 100vh;           /* 폴백 */
  height: 100dvh;          /* 지원되면 덮어씀 */
}
```

## 반응형 타이포그래피

### clamp() 함수

**최소값, 선호값, 최대값 설정**

```css
.title {
  /* clamp(최소, 선호, 최대) */
  font-size: clamp(1rem, 5vw, 3rem);
  
  /* 최소 1rem, 최대 3rem
     그 사이에서 뷰포트 너비의 5% */
}
```

```
화면 작음 ──────────────────────────▶ 화면 큼
   1rem ━━━━━━━━━ 5vw ━━━━━━━━━ 3rem
   (최소)      (비례 증가)      (최대)
```

### min(), max() 함수

```css
.container {
  /* 둘 중 작은 값 */
  width: min(90%, 1200px);
  
  /* 둘 중 큰 값 */
  width: max(300px, 50%);
}
```

```css
/* 실무: 반응형 컨테이너 */
.container {
  width: min(90%, 1200px);  /* 최대 1200px, 작은 화면에선 90% */
  margin: 0 auto;
}
```

## 반응형 이미지

### max-width 패턴

```css
img {
  max-width: 100%;
  height: auto;
}
```

### srcset (HTML)

```html
<img 
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    800px
  "
  alt="반응형 이미지"
>
```

### picture 요소

```html
<picture>
  <source media="(min-width: 1024px)" srcset="desktop.jpg">
  <source media="(min-width: 768px)" srcset="tablet.jpg">
  <img src="mobile.jpg" alt="반응형 이미지">
</picture>
```

### object-fit

```css
.image-container {
  width: 300px;
  height: 200px;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;  /* 비율 유지하며 채움 (잘릴 수 있음) */
  object-fit: contain; /* 비율 유지하며 맞춤 (여백 생김) */
}
```

## 컨테이너 쿼리 (최신)

**부모 컨테이너 크기 기준**으로 스타일 변경

```css
/* 컨테이너 정의 */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 컨테이너 크기에 따른 스타일 */
@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}

@container card (max-width: 399px) {
  .card {
    flex-direction: column;
  }
}
```

### 미디어 쿼리 vs 컨테이너 쿼리

| 구분 | 미디어 쿼리 | 컨테이너 쿼리 |
|------|------------|--------------|
| 기준 | 뷰포트 크기 | 부모 컨테이너 크기 |
| 용도 | 페이지 레이아웃 | 컴포넌트 레이아웃 |
| 재사용성 | 낮음 | 높음 |

```
미디어 쿼리: 화면이 좁아지면 변경
컨테이너 쿼리: 카드가 놓인 공간이 좁아지면 변경

사이드바에 카드가 있으면?
- 미디어 쿼리: 화면 크기가 데스크톱이면 가로 모드 (좁은 공간인데도)
- 컨테이너 쿼리: 카드 공간이 좁으면 세로 모드 ✅
```

## 실전 패턴

### 1. 반응형 네비게이션

```css
.nav {
  display: flex;
  flex-direction: column;
}

.nav-menu {
  display: none;  /* 모바일: 숨김 */
}

.hamburger {
  display: block;  /* 모바일: 햄버거 버튼 */
}

@media (min-width: 768px) {
  .nav {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .nav-menu {
    display: flex;  /* 태블릿+: 메뉴 표시 */
  }
  
  .hamburger {
    display: none;  /* 태블릿+: 햄버거 숨김 */
  }
}
```

### 2. 반응형 그리드

```css
.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;  /* 모바일: 1열 */
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);  /* 태블릿: 2열 */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);  /* 데스크톱: 3열 */
  }
}
```

### 3. 미디어 쿼리 없는 반응형 그리드

```css
.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### 4. 반응형 폰트

```css
html {
  font-size: 16px;
}

h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}

p {
  font-size: clamp(1rem, 2vw, 1.25rem);
}
```

### 5. 반응형 여백

```css
.section {
  padding: clamp(1rem, 5vw, 4rem);
}

.container {
  width: min(90%, 1200px);
  margin: 0 auto;
}
```

## Study

**Q. 모바일 퍼스트가 뭔가요?**

기본 스타일을 모바일용으로 작성하고, 화면이 커질수록 `min-width` 미디어 쿼리로 스타일을 추가하는 방식입니다. 모바일에서 불필요한 CSS를 로드하지 않아 성능이 좋고, 점진적 향상 원칙에 맞습니다.

**Q. min-width와 max-width의 차이?**

`min-width`는 해당 너비 이상일 때 적용되고, `max-width`는 해당 너비 이하일 때 적용됩니다. 모바일 퍼스트는 `min-width`를 사용하고, 데스크톱 퍼스트는 `max-width`를 사용합니다.

**Q. 100vh가 모바일에서 문제되는 이유?**

모바일 브라우저의 주소창이 100vh 계산에 포함되어서 실제 보이는 화면보다 크게 계산됩니다. 콘텐츠가 화면 밖으로 넘치는 문제가 생깁니다. `100dvh`를 사용하면 동적으로 주소창 상태에 맞게 높이가 조정됩니다.

**Q. clamp() 함수가 뭔가요?**

`clamp(최소값, 선호값, 최대값)` 형태로, 값이 최소와 최대 사이에서 선호값에 따라 유동적으로 변합니다. 반응형 타이포그래피에서 미디어 쿼리 없이 폰트 크기를 조절할 때 유용합니다.

**Q. 컨테이너 쿼리가 뭔가요?**

뷰포트가 아닌 부모 컨테이너의 크기를 기준으로 스타일을 변경하는 기능입니다. 같은 컴포넌트가 사이드바나 메인 영역 등 다른 크기의 공간에 배치될 때 각각 적절한 레이아웃을 적용할 수 있어 재사용성이 높아집니다.