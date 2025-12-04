# CSS 레이아웃 시스템

## Flexbox vs Grid 한눈에

| 구분 | Flexbox | Grid |
|------|---------|------|
| 차원 | 1차원 (행 또는 열) | 2차원 (행과 열 동시) |
| 기준 | 콘텐츠 기반 | 레이아웃 기반 |
| 용도 | 네비게이션, 버튼 그룹, 정렬 | 페이지 레이아웃, 카드 그리드 |

# Flexbox (1차원 레이아웃)

## 기본 구조

```css
.container {
  display: flex;
  /* 자식들이 가로로 배치됨 */
}
```

```
┌─────────────────────────────────────────┐
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │  1  │  │  2  │  │  3  │  │  4  │    │
│  └─────┘  └─────┘  └─────┘  └─────┘    │
└─────────────────────────────────────────┘
     ←──────── 주축 (main axis) ────────→
```

## 축 이해하기

```
flex-direction: row (기본값)
┌────────────────────────┐
│ ■ ■ ■ → 주축 (가로)    │ ↓ 교차축 (세로)
└────────────────────────┘

flex-direction: column
┌────────────────────────┐
│ ■                      │
│ ■  ↓ 주축 (세로)       │ → 교차축 (가로)
│ ■                      │
└────────────────────────┘
```

## 컨테이너 속성

### flex-direction

```css
.container {
  flex-direction: row;            /* → 가로 (기본값) */
  flex-direction: row-reverse;    /* ← 가로 역순 */
  flex-direction: column;         /* ↓ 세로 */
  flex-direction: column-reverse; /* ↑ 세로 역순 */
}
```

### justify-content (주축 정렬)

```css
.container {
  justify-content: flex-start;    /* 시작점 정렬 (기본값) */
  justify-content: flex-end;      /* 끝점 정렬 */
  justify-content: center;        /* 가운데 정렬 */
  justify-content: space-between; /* 양끝 배치, 균등 간격 */
  justify-content: space-around;  /* 균등 간격 (양끝 절반) */
  justify-content: space-evenly;  /* 완전 균등 간격 */
}
```

```
flex-start:     [■ ■ ■          ]
flex-end:       [          ■ ■ ■]
center:         [     ■ ■ ■     ]
space-between:  [■      ■      ■]
space-around:   [  ■    ■    ■  ]
space-evenly:   [   ■   ■   ■   ]
```

### align-items (교차축 정렬)

```css
.container {
  align-items: stretch;     /* 늘림 (기본값) */
  align-items: flex-start;  /* 시작점 */
  align-items: flex-end;    /* 끝점 */
  align-items: center;      /* 가운데 */
  align-items: baseline;    /* 텍스트 기준선 */
}
```

```
stretch:        flex-start:     center:         flex-end:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│■■■■■■■■■■│    │■■ ■ ■■■  │    │          │    │          │
│■■■■■■■■■■│    │          │    │■■ ■ ■■■  │    │          │
│■■■■■■■■■■│    │          │    │          │    │■■ ■ ■■■  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### flex-wrap (줄바꿈)

```css
.container {
  flex-wrap: nowrap;   /* 줄바꿈 안 함 (기본값) - 넘쳐도 한 줄 */
  flex-wrap: wrap;     /* 줄바꿈 */
  flex-wrap: wrap-reverse; /* 역순 줄바꿈 */
}
```

### gap (간격)

```css
.container {
  gap: 20px;              /* 행과 열 모두 20px */
  gap: 20px 10px;         /* 행 20px, 열 10px */
  row-gap: 20px;          /* 행 간격만 */
  column-gap: 10px;       /* 열 간격만 */
}
```

### align-content (여러 줄 정렬)

`flex-wrap: wrap`일 때 줄 간 정렬

```css
.container {
  flex-wrap: wrap;
  align-content: flex-start;
  align-content: center;
  align-content: space-between;
  /* ... justify-content와 동일한 값들 */
}
```

## 아이템 속성

### flex-grow (늘어나는 비율)

```css
.item {
  flex-grow: 0;  /* 늘어나지 않음 (기본값) */
  flex-grow: 1;  /* 남은 공간 채움 */
}
```

```css
/* 예시 */
.item1 { flex-grow: 1; }  /* 1/3 */
.item2 { flex-grow: 2; }  /* 2/3 */

/* 결과 */
┌────────────────────────────────┐
│ ■■■■■■■■■■ │ ■■■■■■■■■■■■■■■■■■ │
│   item1    │       item2        │
└────────────────────────────────┘
```

### flex-shrink (줄어드는 비율)

```css
.item {
  flex-shrink: 1;  /* 줄어듦 (기본값) */
  flex-shrink: 0;  /* 줄어들지 않음 */
}
```

### flex-basis (기본 크기)

```css
.item {
  flex-basis: auto;   /* 콘텐츠 크기 (기본값) */
  flex-basis: 200px;  /* 고정 크기 */
  flex-basis: 30%;    /* 비율 */
}
```

### flex 단축 속성

```css
.item {
  /* flex: grow shrink basis */
  flex: 0 1 auto;     /* 기본값 */
  flex: 1;            /* flex: 1 1 0% (균등 분배) */
  flex: auto;         /* flex: 1 1 auto */
  flex: none;         /* flex: 0 0 auto (고정) */
  flex: 0 0 200px;    /* 고정 200px */
}
```

### align-self (개별 정렬)

```css
.item {
  align-self: auto;       /* 부모의 align-items 따름 */
  align-self: flex-start;
  align-self: center;
  align-self: flex-end;
}
```

### order (순서)

```css
.item1 { order: 2; }
.item2 { order: 1; }
.item3 { order: 3; }

/* 결과: item2 → item1 → item3 */
```

---

## Flexbox 실전 패턴

### 1. 가운데 정렬 (가장 많이 씀)

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### 2. 네비게이션 (양쪽 정렬)

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

```
┌─────────────────────────────────┐
│ Logo              Menu  Menu  ● │
└─────────────────────────────────┘
```

### 3. 푸터 하단 고정

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;  /* 남은 공간 모두 차지 */
}

footer {
  /* 자동으로 하단에 위치 */
}
```

### 4. 균등 분배 버튼

```css
.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  flex: 1;  /* 균등하게 늘어남 */
}
```

# Grid (2차원 레이아웃)

## 기본 구조

```css
.container {
  display: grid;
  grid-template-columns: 200px 200px 200px;  /* 3열 */
  grid-template-rows: 100px 100px;           /* 2행 */
  gap: 10px;
}
```

```
     1       2       3       4    ← 라인 번호
     ↓       ↓       ↓       ↓
   ┌───────┬───────┬───────┐
1→ │   1   │   2   │   3   │
   ├───────┼───────┼───────┤
2→ │   4   │   5   │   6   │
   └───────┴───────┴───────┘
3→
```

## 컨테이너 속성

### grid-template-columns / rows

```css
.container {
  /* 고정 크기 */
  grid-template-columns: 200px 200px 200px;
  
  /* fr 단위 (비율) */
  grid-template-columns: 1fr 2fr 1fr;  /* 1:2:1 비율 */
  
  /* 혼합 */
  grid-template-columns: 200px 1fr 1fr;  /* 고정 + 비율 */
}
```

### fr 단위

**남은 공간을 비율로 나눔**

```css
grid-template-columns: 1fr 1fr 1fr;  /* 1:1:1 균등 */
grid-template-columns: 1fr 2fr;      /* 1:2 비율 */
grid-template-columns: 200px 1fr;    /* 200px 고정 + 나머지 */
```

### repeat()

```css
/* 반복 패턴 */
grid-template-columns: repeat(3, 1fr);      /* 1fr 1fr 1fr */
grid-template-columns: repeat(4, 100px);    /* 100px × 4 */
grid-template-columns: repeat(3, 1fr 2fr);  /* 1fr 2fr 1fr 2fr 1fr 2fr */
```

### minmax()

```css
/* 최소 200px, 최대 1fr */
grid-template-columns: repeat(3, minmax(200px, 1fr));
```

### auto-fill vs auto-fit

```css
/* 컨테이너 너비: 800px, 아이템 3개 */

/* auto-fill: 빈 트랙도 공간 차지 */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
/* [■■■][■■■][■■■][   ] ← 4칸 생성, 1칸 비어있음 */

/* auto-fit: 빈 트랙은 0으로 축소 */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
/* [■■■■][■■■■][■■■■] ← 3칸만, 남은 공간 분배 */
```

**실무:** 반응형 카드 그리드에는 `auto-fit`이 더 유용

### gap

```css
.container {
  gap: 20px;           /* 행과 열 모두 */
  gap: 20px 10px;      /* 행 열 */
  row-gap: 20px;
  column-gap: 10px;
}
```

## 아이템 배치

### grid-column / grid-row

```css
.item {
  grid-column: 1 / 3;     /* 1번 라인 ~ 3번 라인 (2칸 차지) */
  grid-row: 1 / 2;        /* 1번 라인 ~ 2번 라인 (1칸 차지) */
}
```

```
     1       2       3       4
   ┌───────────────┬───────┐
   │     item      │       │  ← grid-column: 1 / 3
   ├───────┬───────┼───────┤
   │       │       │       │
   └───────┴───────┴───────┘
```

### span 키워드

```css
.item {
  grid-column: span 2;    /* 2칸 차지 */
  grid-row: span 3;       /* 3칸 차지 */
}
```

### grid-area (단축)

```css
.item {
  /* grid-area: row-start / column-start / row-end / column-end */
  grid-area: 1 / 1 / 3 / 3;  /* 2×2 영역 */
}
```

## Grid 실전 패턴

### 1. 반응형 카드 그리드

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

화면이 좁아지면 자동으로 열 개수 줄어듦

### 2. Holy Grail 레이아웃

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.nav    { grid-area: nav; }
.main   { grid-area: main; }
.aside  { grid-area: aside; }
.footer { grid-area: footer; }
```

```
┌─────────────────────────────────┐
│            header               │
├────────┬──────────────┬─────────┤
│  nav   │     main     │  aside  │
│        │              │         │
├────────┴──────────────┴─────────┤
│            footer               │
└─────────────────────────────────┘
```

### 3. 12컬럼 그리드

```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.col-6 { grid-column: span 6; }  /* 절반 */
.col-4 { grid-column: span 4; }  /* 1/3 */
.col-3 { grid-column: span 3; }  /* 1/4 */
```

# Flexbox vs Grid 선택 가이드

| 상황 | 선택 |
|------|------|
| 한 줄 정렬 (네비게이션) | Flexbox |
| 버튼 그룹 | Flexbox |
| 가운데 정렬 | Flexbox |
| 콘텐츠 크기에 따른 유동 배치 | Flexbox |
| 카드 그리드 | Grid |
| 페이지 전체 레이아웃 | Grid |
| 행과 열 동시 제어 | Grid |
| 복잡한 겹침 레이아웃 | Grid |

### 같이 쓰기

```css
/* Grid로 전체 레이아웃 */
.page {
  display: grid;
  grid-template-columns: 250px 1fr;
}

/* Flexbox로 내부 정렬 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

## Study
**Q. Flexbox와 Grid의 차이?**

Flexbox는 1차원 레이아웃으로 한 방향(행 또는 열)으로 아이템을 배치합니다. Grid는 2차원 레이아웃으로 행과 열을 동시에 제어합니다. Flexbox는 콘텐츠 크기에 따라 유동적으로 배치되고, Grid는 미리 정의한 레이아웃에 아이템을 배치합니다.

**Q. justify-content와 align-items의 차이?**

justify-content는 주축(main axis) 방향 정렬이고, align-items는 교차축(cross axis) 방향 정렬입니다. flex-direction이 row면 justify-content는 가로, align-items는 세로 정렬입니다. column이면 반대가 됩니다.

**Q. flex: 1이 의미하는 것?**

`flex: 1`은 `flex-grow: 1, flex-shrink: 1, flex-basis: 0%`의 단축입니다. 남은 공간을 균등하게 나눠 차지하고, 필요하면 줄어들 수 있으며, 기본 크기는 0이라 순수하게 비율로만 크기가 결정됩니다.

**Q. auto-fill과 auto-fit의 차이?**

둘 다 반응형 그리드에서 열 개수를 자동으로 결정합니다. auto-fill은 빈 트랙도 공간을 차지하고, auto-fit은 빈 트랙을 0으로 축소해서 기존 아이템들이 남은 공간을 채웁니다. 아이템이 적을 때 차이가 나며, 보통 auto-fit이 더 유용합니다.

**Q. 반응형 카드 그리드는 어떻게 만드나요?**

Grid의 `repeat(auto-fit, minmax(최소값, 1fr))`을 사용합니다. 아이템이 최소값보다 작아지면 자동으로 열 개수가 줄어들어 미디어 쿼리 없이도 반응형이 됩니다.