# CSS 선택자 우선순위 (Specificity)

## 우선순위란?

같은 요소에 여러 CSS 규칙이 적용될 때, **어떤 스타일이 이기는지** 결정하는 규칙

```css
p { color: blue; }
.text { color: red; }
#intro { color: green; }

/* <p class="text" id="intro">무슨 색?</p> */
/* 답: green (ID가 가장 높음) */
```

## 우선순위 점수

| 점수 | 선택자 | 예시 |
|------|--------|------|
| ∞ | !important | `color: red !important` |
| 1000 | 인라인 스타일 | `style="color: red"` |
| 100 | ID | `#header` |
| 10 | 클래스, 속성, 가상클래스 | `.box`, `[type="text"]`, `:hover` |
| 1 | 태그, 가상요소 | `div`, `p`, `::before` |
| 0 | 전체, 결합자 | `*`, `>`, `+`, `~`, ` ` |

## 계산 예시

```css
/* 1점: 태그 1개 */
p { }

/* 10점: 클래스 1개 */
.box { }

/* 11점: 클래스(10) + 태그(1) */
p.box { }

/* 100점: ID 1개 */
#header { }

/* 110점: ID(100) + 클래스(10) */
#header .nav { }

/* 21점: 클래스(10) + 클래스(10) + 태그(1) */
.container .box p { }

/* 30점: 가상클래스도 10점 */
.button:hover:active { }
```

### 퀴즈

```css
/* 어떤 스타일이 적용될까? */

div.box { color: blue; }        /* 11점 */
.container .box { color: red; } /* 20점 */

/* <div class="container"><div class="box">?</div></div> */
/* 답: red (20 > 11) */
```

## 같은 점수면?

**나중에 선언된 스타일이 적용**

```css
.box { color: blue; }  /* 10점 */
.text { color: red; }  /* 10점 */

/* <div class="box text">?</div> */
/* 답: red (나중에 선언됨) */
```

HTML의 class 순서는 상관없음:

```html
<!-- 둘 다 red -->
<div class="box text">?</div>
<div class="text box">?</div>
```

---

## !important

**모든 우선순위를 무시하고 최우선 적용**

```css
.box {
  color: red !important;
}

#header .box {
  color: blue;  /* 110점이지만 무시됨 */
}

/* 답: red (!important가 이김) */
```

### !important끼리 만나면?

다시 점수 계산으로 돌아감

```css
.box { color: red !important; }      /* !important + 10점 */
#header { color: blue !important; }  /* !important + 100점 */

/* 답: blue (둘 다 !important면 점수 비교) */
```

### !important 피해야 하는 이유

```css
/* 처음엔 괜찮아 보임 */
.button {
  background: blue !important;
}

/* 나중에 변경하고 싶은데... */
.button.primary {
  background: green;  /* 안 먹힘 */
}

/* 결국 이렇게 됨 */
.button.primary {
  background: green !important;  /* !important 전쟁 시작 */
}

/* 그 다음은... */
#main .button.primary {
  background: red !important;  /* 지옥 */
}
```

### !important 써도 되는 경우

```css
/* 1. 유틸리티 클래스 */
.hidden { display: none !important; }
.sr-only { /* 스크린리더 전용 */ }

/* 2. 서드파티 라이브러리 오버라이드 */
.some-library-class {
  margin: 0 !important;  /* 라이브러리 CSS를 수정할 수 없을 때 */
}
```

## 인라인 스타일

```html
<div style="color: red" class="box">텍스트</div>
```

```css
.box { color: blue; }
#header .box { color: green; }

/* 답: red (인라인이 가장 높음, !important 제외) */
```

### 인라인을 이기려면?

```css
.box {
  color: blue !important;  /* 인라인보다 !important가 우선 */
}
```

## 실무 권장 사항

### 1. ID 선택자 피하기

```css
/* ❌ ID는 우선순위가 너무 높음 */
#header { }
#nav { }

/* ✅ 클래스 사용 */
.header { }
.nav { }
```

### 2. 선택자 깊이 최소화

```css
/* ❌ 너무 구체적 - 재사용 어려움 */
.page .content .article .text p { }

/* ✅ 단순하게 */
.article-text { }
```

### 3. 우선순위 올리는 트릭 (꼭 필요할 때만)

```css
/* 클래스 반복으로 점수 올리기 */
.button.button { }  /* 20점 */

/* :where()로 점수 0으로 만들기 */
:where(.box) { }  /* 0점 - 쉽게 오버라이드 가능 */

/* :is()는 내부 최고 점수 적용 */
:is(#header, .nav) { }  /* 100점 (#header 기준) */
```

## 우선순위 체크 순서

```
1. !important 있나? → 있으면 최우선
2. 인라인 스타일인가? → 1000점
3. ID 개수 세기 → 각 100점
4. 클래스/속성/가상클래스 개수 → 각 10점
5. 태그/가상요소 개수 → 각 1점
6. 점수 같으면 → 나중에 선언된 게 이김
```

## Study

**Q. CSS 우선순위(Specificity)가 뭔가요?**

같은 요소에 여러 스타일이 적용될 때 어떤 스타일이 우선하는지 결정하는 규칙입니다. 인라인 스타일이 가장 높고, 그다음 ID, 클래스, 태그 순입니다. 같은 우선순위면 나중에 선언된 스타일이 적용됩니다.

**Q. !important는 언제 써야 하나요?**

가급적 피해야 합니다. 한 번 쓰면 오버라이드하기 위해 또 !important를 써야 하고, CSS가 관리하기 어려워집니다. 유틸리티 클래스나 서드파티 라이브러리를 오버라이드할 때만 제한적으로 사용합니다.

**Q. ID 선택자를 피하는 이유?**

ID는 우선순위가 100점으로 너무 높아서 나중에 스타일을 오버라이드하기 어렵습니다. 클래스(10점)를 사용하면 우선순위 관리가 쉽고 재사용성도 좋습니다.