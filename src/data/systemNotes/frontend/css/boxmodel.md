# CSS 박스 모델 (Box Model)

## 박스 모델이란?

모든 HTML 요소는 **사각형 박스**로 렌더링됩니다. 박스 모델은 이 박스의 구조를 정의합니다.

```
┌─────────────────────────────────────────┐
│                 margin                  │
│   ┌─────────────────────────────────┐   │
│   │             border              │   │
│   │   ┌─────────────────────────┐   │   │
│   │   │         padding         │   │   │
│   │   │   ┌─────────────────┐   │   │   │
│   │   │   │     content     │   │   │   │
│   │   │   │                 │   │   │   │
│   │   │   └─────────────────┘   │   │   │
│   │   └─────────────────────────┘   │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 구성 요소

| 영역 | 설명 | 속성 |
|------|------|------|
| Content | 실제 내용 (텍스트, 이미지) | width, height |
| Padding | 콘텐츠와 테두리 사이 내부 여백 | padding |
| Border | 테두리 | border |
| Margin | 요소 바깥 외부 여백 | margin |

```css
.box {
  width: 200px;
  height: 100px;
  padding: 20px;
  border: 5px solid black;
  margin: 10px;
}
```

---

## box-sizing

### content-box (기본값)

**width/height = 콘텐츠 영역만**

```css
.box {
  box-sizing: content-box;  /* 기본값 */
  width: 200px;
  padding: 20px;
  border: 10px solid black;
}

/* 실제 전체 너비: 200 + 40 + 20 = 260px */
```

```
         200px (width)
    ├─────────────────────┤
┌───┬─────────────────────┬───┐
│10 │  20  │ content │  20  │10 │
│   │      │  200px  │      │   │
└───┴─────────────────────┴───┘
 ↑     ↑                    ↑    ↑
border padding         padding border

전체: 10 + 20 + 200 + 20 + 10 = 260px
```

### border-box (실무 표준)

**width/height = 콘텐츠 + 패딩 + 보더 포함**

```css
.box {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 10px solid black;
}

/* 실제 전체 너비: 200px (지정한 그대로) */
/* 콘텐츠 영역: 200 - 40 - 20 = 140px */
```

```
              200px (width)
├─────────────────────────────────────┤
┌───┬──────┬───────────────┬──────┬───┐
│10 │  20  │   content     │  20  │10 │
│   │      │    140px      │      │   │
└───┴──────┴───────────────┴──────┴───┘

전체: 200px (패딩, 보더 포함)
```

### 비교

| 구분 | content-box | border-box |
|------|-------------|------------|
| width 의미 | 콘텐츠만 | 콘텐츠 + 패딩 + 보더 |
| 계산 | 복잡 (더해야 함) | 직관적 |
| 실무 | 거의 안 씀 | **표준** |

### 전역 설정 (필수)

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

**모든 프로젝트에서 이 설정 권장**

---

## Margin vs Padding

### 언제 무엇을 쓸까?

| 상황 | 선택 |
|------|------|
| 요소 내부 여백 | padding |
| 요소 간 간격 | margin |
| 배경색이 채워져야 함 | padding |
| 배경색 밖의 공간 | margin |
| 클릭 영역 확장 | padding |

```css
/* padding: 배경색 포함 */
.button {
  background: blue;
  padding: 10px 20px;  /* 클릭 영역 확장 */
}

/* margin: 배경색 밖 */
.card {
  background: white;
  margin: 20px;  /* 카드 간 간격 */
}
```

---

## 마진 병합 (Margin Collapsing)

**수직 방향 마진은 병합됩니다** (면접 단골!)

### 인접 형제 요소

```css
.box1 { margin-bottom: 30px; }
.box2 { margin-top: 20px; }

/* 예상: 50px 간격 */
/* 실제: 30px 간격 (큰 값으로 병합) */
```

```
┌─────────┐
│  box1   │
└─────────┘
     ↕ 30px (50px 아님!)
┌─────────┐
│  box2   │
└─────────┘
```

### 부모-자식 요소

```css
.parent { margin-top: 0; }
.child { margin-top: 20px; }

/* child의 margin이 parent 밖으로 빠져나감! */
```

```
예상:                    실제:
┌─────────────────┐     ↕ 20px (부모 밖으로!)
│ parent          │     ┌─────────────────┐
│   ↕ 20px        │     │ parent          │
│   ┌──────────┐  │     │ ┌──────────┐    │
│   │  child   │  │     │ │  child   │    │
```

### 마진 병합 방지

```css
/* 방법 1: overflow */
.parent {
  overflow: hidden;  /* 또는 auto */
}

/* 방법 2: display: flow-root */
.parent {
  display: flow-root;
}

/* 방법 3: padding 사용 */
.parent {
  padding-top: 1px;  /* padding이 있으면 병합 안 됨 */
}

/* 방법 4: border 사용 */
.parent {
  border-top: 1px solid transparent;
}
```

### 마진 병합이 안 되는 경우

- Flexbox/Grid 컨테이너 내부
- `position: absolute/fixed` 요소
- `float` 요소
- `overflow: hidden/auto/scroll` 요소
- 루트 요소(html)

---

## Display에 따른 박스 모델

### block vs inline

```css
/* block: 모든 박스 모델 속성 적용 */
.block {
  display: block;
  width: 200px;    /* ✅ 적용 */
  height: 100px;   /* ✅ 적용 */
  margin: 20px;    /* ✅ 상하좌우 모두 */
  padding: 20px;   /* ✅ 상하좌우 모두 */
}

/* inline: 제한적 적용 */
.inline {
  display: inline;
  width: 200px;    /* ❌ 무시 */
  height: 100px;   /* ❌ 무시 */
  margin: 20px;    /* ⚠️ 좌우만 적용 */
  padding: 20px;   /* ⚠️ 적용되지만 상하는 레이아웃에 영향 없음 */
}
```

### inline 요소의 padding 문제

```css
span {
  padding: 20px;
  background: yellow;
}
```

```
텍스트 ████████████ 다음 줄
       ████span████
████████████████████ 겹침 발생!
```

padding은 적용되지만 **다른 요소와 겹침**

### 해결: inline-block

```css
span {
  display: inline-block;
  padding: 20px;
  /* 이제 레이아웃에 영향 줌 */
}
```

---

## outline vs border

| 구분 | border | outline |
|------|--------|---------|
| 박스 모델 | **포함** | 포함 안 됨 |
| 공간 차지 | O | X |
| 개별 방향 | 가능 | 불가능 |
| 둥근 모서리 | border-radius | outline-offset |
| 용도 | 디자인 | 포커스 표시, 디버깅 |

```css
.box {
  border: 2px solid blue;    /* 공간 차지 */
  outline: 2px solid red;    /* 공간 차지 안 함 */
}
```

```
        ┌─────────────┐ ← outline (밖에 그려짐)
        │┌───────────┐│
        ││  border   ││
        ││ ┌───────┐ ││
        ││ │content│ ││
        ││ └───────┘ ││
        │└───────────┘│
        └─────────────┘
```

### 디버깅에 outline 활용

```css
/* 레이아웃 디버깅 */
* {
  outline: 1px solid red;  /* 레이아웃에 영향 없이 박스 확인 */
}
```

---

## 단축 속성

### padding / margin

```css
/* 1개: 모든 방향 */
padding: 10px;

/* 2개: 상하 / 좌우 */
padding: 10px 20px;

/* 3개: 상 / 좌우 / 하 */
padding: 10px 20px 30px;

/* 4개: 상 / 우 / 하 / 좌 (시계방향) */
padding: 10px 20px 30px 40px;
```

### border

```css
/* 단축 */
border: 1px solid black;

/* 개별 */
border-width: 1px;
border-style: solid;
border-color: black;

/* 방향별 */
border-top: 2px dashed red;
border-left: none;
```

---

## 실전 팁

### 1. 전역 border-box 설정

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

### 2. margin: auto로 가운데 정렬

```css
.container {
  width: 800px;
  margin: 0 auto;  /* 좌우 auto = 가운데 */
}
```

### 3. 음수 마진

```css
.overlap {
  margin-top: -20px;  /* 위 요소와 겹침 */
}
```

### 4. % 단위 주의

```css
.box {
  /* padding/margin의 %는 부모의 "너비" 기준 */
  padding: 10%;      /* 부모 너비의 10% */
  margin-top: 10%;   /* 부모 너비의 10% (높이 아님!) */
}
```

---

## Study

**Q. box-sizing: border-box가 뭔가요?**

기본값인 content-box는 width가 콘텐츠 영역만 의미해서 padding과 border를 더하면 실제 크기가 커집니다. border-box는 width에 padding과 border가 포함되어 계산이 직관적입니다. 실무에서는 전역으로 border-box를 설정하는 게 표준입니다.

**Q. 마진 병합(Margin Collapsing)이 뭔가요?**

수직 방향으로 인접한 마진이 합쳐지지 않고 큰 값 하나로 병합되는 현상입니다. 예를 들어 margin-bottom: 30px과 margin-top: 20px이 만나면 50px이 아닌 30px이 됩니다. 부모-자식 간에도 발생할 수 있습니다. Flexbox, Grid, overflow: hidden 등을 사용하면 병합을 방지할 수 있습니다.

**Q. inline 요소에 width, height가 안 먹히는 이유?**

inline 요소는 콘텐츠 크기만큼만 공간을 차지하도록 설계되어 있어서 width, height가 무시됩니다. margin도 좌우만 적용됩니다. inline-block으로 바꾸면 inline처럼 배치되면서 width, height, margin이 모두 적용됩니다.

**Q. padding과 margin의 차이?**

padding은 콘텐츠와 테두리 사이의 내부 여백으로 배경색이 채워집니다. margin은 테두리 바깥의 외부 여백으로 배경색이 없습니다. 클릭 영역을 늘리려면 padding, 요소 간 간격을 주려면 margin을 사용합니다.