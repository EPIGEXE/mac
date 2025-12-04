# CSS Position

## Position 종류

| 값 | 기준점 | 문서 흐름 |
|----|--------|-----------|
| static | 없음 (기본값) | 유지 |
| relative | 자기 원래 위치 | 유지 |
| absolute | positioned 조상 | **이탈** |
| fixed | 뷰포트 | **이탈** |
| sticky | 스크롤 위치 | 유지 |

## static (기본값)

```css
.box {
  position: static;
  /* top, left 등 무시됨 */
}
```

- 문서 흐름대로 배치
- `top`, `right`, `bottom`, `left` 적용 안 됨
- `z-index` 적용 안 됨

## relative

**자기 원래 위치 기준으로 이동**

```css
.box {
  position: relative;
  top: 20px;
  left: 30px;
}
```

```
원래 위치        이동 후
┌─────┐         ┌─────┐
│     │         │     │  (원래 공간 유지)
└─────┘         └─────┘
                    ↘
                  ┌─────┐
                  │ box │  (시각적으로만 이동)
                  └─────┘
```

**특징:**
- 원래 공간은 그대로 유지됨
- 시각적으로만 이동
- 주로 `absolute`의 기준점으로 사용

## absolute

**가장 가까운 positioned 조상 기준으로 배치**

```css
.parent {
  position: relative;  /* 기준점 */
}

.child {
  position: absolute;
  top: 0;
  right: 0;
}
```

```
┌─────────────────────┐
│ parent (relative)   ┌─────┐
│                     │child│ ← 오른쪽 위
│                     └─────┘
│                             │
└─────────────────────────────┘
```

**특징:**
- 문서 흐름에서 **완전히 이탈**
- positioned 조상이 없으면 `<html>` 기준
- 다른 요소들이 이 공간을 무시함

### positioned 조상이란?

`position`이 `static`이 아닌 조상

```html
<div class="grandparent">              <!-- static -->
  <div class="parent">                 <!-- relative ← 기준점! -->
    <div class="child"></div>          <!-- absolute -->
  </div>
</div>
```

```css
/* grandparent가 static이면 건너뜀 */
.parent { position: relative; }
.child { position: absolute; top: 0; }  /* parent 기준 */
```

## fixed

**뷰포트(화면) 기준으로 고정**

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
```

```
┌─────────────────────┐ ← 뷰포트
│ ████ header ████████│ ← 스크롤해도 고정
├─────────────────────┤
│                     │
│    (스크롤 영역)     │
│                     │
└─────────────────────┘
```

**특징:**
- 스크롤해도 항상 같은 위치
- 문서 흐름에서 **이탈**
- 고정 헤더, 플로팅 버튼에 사용

### fixed 주의사항

```css
/* ⚠️ 부모에 transform이 있으면 뷰포트가 아닌 부모 기준 */
.parent {
  transform: translateZ(0);  /* 또는 filter, perspective 등 */
}

.child {
  position: fixed;  /* 뷰포트가 아닌 parent 기준! */
}
```

---

## sticky

**스크롤 위치에 따라 relative ↔ fixed 전환**

```css
.header {
  position: sticky;
  top: 0;  /* 이 위치에 도달하면 고정 */
}
```

```
스크롤 전:                스크롤 후:
┌─────────────────┐      ┌─────────────────┐
│     콘텐츠      │      │ ███ header ████ │ ← 고정됨
├─────────────────┤      ├─────────────────┤
│ ███ header ████ │      │                 │
├─────────────────┤      │     콘텐츠      │
│                 │      │                 │
│     콘텐츠      │      │                 │
└─────────────────┘      └─────────────────┘
```

**특징:**
- `top: 0` 위치에 도달하면 고정
- 부모 영역을 벗어나면 고정 해제
- 문서 흐름 유지

### sticky 동작 조건

```css
/* ✅ 동작함 */
.sticky {
  position: sticky;
  top: 0;  /* top/bottom/left/right 중 하나 필수 */
}

/* ❌ 동작 안 함 - 부모에 overflow */
.parent {
  overflow: hidden;  /* 또는 auto, scroll */
}
.child {
  position: sticky;  /* 동작 안 함! */
}

/* ❌ 동작 안 함 - 부모 높이가 자식과 같음 */
.parent {
  /* 높이 지정 없음 - 자식만큼만 높아짐 */
}
.child {
  position: sticky;  /* 고정될 공간이 없음 */
}
```

### sticky 실전 예시

```css
/* 섹션별 고정 헤더 */
.section-header {
  position: sticky;
  top: 0;
  background: white;
}
```

```html
<section>
  <h2 class="section-header">섹션 A</h2>
  <p>내용...</p>
  <p>내용...</p>
</section>
<section>
  <h2 class="section-header">섹션 B</h2>  <!-- A가 지나가면 B가 고정 -->
  <p>내용...</p>
</section>
```

## 문서 흐름 이탈 비교

```css
/* 흐름 유지 */
.relative { position: relative; }
.sticky { position: sticky; }

/* 흐름 이탈 - 다른 요소가 이 공간 무시 */
.absolute { position: absolute; }
.fixed { position: fixed; }
```

```
흐름 유지:                    흐름 이탈:
┌─────┐                      ┌─────┐
│  A  │                      │  A  │
├─────┤                      ├─────┤
│  B  │ (relative)           │  C  │ ← B 공간 무시
├─────┤                      └─────┘
│  C  │                          ┌─────┐
└─────┘                          │  B  │ (absolute)
                                 └─────┘
```

## top/right/bottom/left

### 방향 의미

```css
.box {
  position: absolute;
  top: 20px;     /* 기준점 위에서 20px 아래로 */
  right: 10px;   /* 기준점 오른쪽에서 10px 왼쪽으로 */
  bottom: 20px;  /* 기준점 아래에서 20px 위로 */
  left: 10px;    /* 기준점 왼쪽에서 10px 오른쪽으로 */
}
```

### 꽉 채우기

```css
/* 부모 전체를 채움 */
.overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  /* 또는 */
  inset: 0;  /* 단축 속성 */
}
```

### 가운데 배치

```css
/* 방법 1: transform */
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 방법 2: inset + margin auto */
.center {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 200px;
  height: 100px;
}
```

## z-index와 쌓임 맥락

### z-index 기본

```css
.box {
  position: relative;  /* position 필요 (static 제외) */
  z-index: 10;
}
```

**z-index가 높을수록 위에 표시**

```css
.back { z-index: 1; }
.front { z-index: 10; }  /* 위에 표시 */
```

### z-index가 안 먹히는 이유

**쌓임 맥락(Stacking Context)** 때문

```css
.parent {
  position: relative;
  z-index: 1;  /* 새 쌓임 맥락 생성 */
}

.child {
  position: absolute;
  z-index: 9999;  /* parent 밖으로 못 나감! */
}

.other {
  position: relative;
  z-index: 2;  /* child보다 위에 표시됨 */
}
```

```
z-index는 같은 쌓임 맥락 안에서만 비교됨

[parent z:1] 안의 [child z:9999]
    vs
[other z:2]

→ parent(1) < other(2) 이므로 other가 위
→ child의 9999는 parent 밖에서 의미 없음
```

### 쌓임 맥락 생성 조건

```css
.creates-stacking-context {
  /* 아래 중 하나라도 해당되면 새 쌓임 맥락 */
  position: relative; z-index: 1;  /* position + z-index */
  position: fixed;                  /* fixed는 자동 */
  position: sticky;                 /* sticky는 자동 */
  opacity: 0.99;                    /* opacity < 1 */
  transform: translateZ(0);         /* transform */
  filter: blur(0);                  /* filter */
  isolation: isolate;               /* 명시적 생성 */
}
```

## 실전 패턴

### 1. 모달 오버레이

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
}
```

### 2. 뱃지 (아이콘 위 숫자)

```css
.icon-wrapper {
  position: relative;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
}
```

### 3. 툴팁

```css
.tooltip-wrapper {
  position: relative;
}

.tooltip {
  position: absolute;
  bottom: 100%;  /* 위에 표시 */
  left: 50%;
  transform: translateX(-50%);
}
```

### 4. 고정 헤더 + 콘텐츠 여백

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
}

.content {
  padding-top: 60px;  /* 헤더 높이만큼 여백 */
}
```

## Study

**Q. position: absolute의 기준점은?**

가장 가까운 positioned 조상, 즉 position이 static이 아닌 조상을 기준으로 배치됩니다. 그런 조상이 없으면 html 요소가 기준이 됩니다. 보통 부모에 `position: relative`를 주어 기준점으로 만듭니다.

**Q. relative와 absolute의 차이?**

relative는 원래 위치를 기준으로 이동하고 원래 공간은 유지됩니다. absolute는 positioned 조상을 기준으로 배치되고 문서 흐름에서 완전히 이탈해서 다른 요소들이 이 공간을 무시합니다.

**Q. fixed와 sticky의 차이?**

fixed는 항상 뷰포트 기준으로 고정됩니다. sticky는 스크롤하다가 지정한 위치(예: top: 0)에 도달하면 그때부터 고정되고, 부모 영역을 벗어나면 고정이 해제됩니다. 또한 fixed는 문서 흐름에서 이탈하지만 sticky는 유지합니다.

**Q. z-index가 안 먹히는 이유?**

z-index는 같은 쌓임 맥락(stacking context) 안에서만 비교됩니다. 부모에 z-index가 설정되어 새 쌓임 맥락이 생기면, 자식의 z-index가 아무리 높아도 부모 밖으로 나갈 수 없습니다. 또한 position이 static이면 z-index가 적용되지 않습니다.

**Q. sticky가 동작 안 하는 경우?**

부모에 `overflow: hidden/auto/scroll`이 있으면 동작하지 않습니다. 또한 top, bottom, left, right 중 하나는 반드시 지정해야 하고, 부모의 높이가 자식과 같으면 고정될 공간이 없어서 동작하지 않습니다.