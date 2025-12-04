# DOCTYPE

## DOCTYPE이란?

HTML 문서의 첫 줄에 위치하여 **브라우저에게 렌더링 모드를 알려주는 선언문**

```html
<!DOCTYPE html>
```

---

## 왜 필요한가?

### 과거의 문제

2000년대 초반, 브라우저마다 렌더링 규칙이 달랐습니다.

```
IE: width = content + padding + border
Netscape: width = content만

→ 같은 CSS를 써도 브라우저마다 다르게 보임
```

### DOCTYPE의 역할

브라우저가 DOCTYPE을 보고 렌더링 모드를 결정합니다.

```
DOCTYPE 있음 → Standards Mode (표준 모드)
DOCTYPE 없음 → Quirks Mode (호환 모드)
```

---

## 렌더링 모드

| 모드 | 동작 |
|------|------|
| Standards Mode | W3C 표준대로 렌더링 |
| Quirks Mode | 옛날 IE5 방식으로 렌더링 |

### Quirks Mode의 문제점

```css
.box {
  width: 200px;
  padding: 20px;
  border: 10px solid black;
}
```

| 모드 | 실제 너비 | 계산 |
|------|-----------|------|
| Standards | 260px | 200 + 20×2 + 10×2 |
| Quirks | 200px | padding, border가 width 안에 포함 |

Quirks Mode는 `box-sizing: border-box`처럼 동작합니다. 의도치 않게 레이아웃이 깨질 수 있습니다.

---

## HTML5 DOCTYPE

### 과거 vs 현재

```html
<!-- HTML 4.01 - 복잡하고 외우기 불가능 -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" 
  "http://www.w3.org/TR/html4/strict.dtd">

<!-- XHTML 1.0 -->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<!-- HTML5 - 단순화 -->
<!DOCTYPE html>
```

### 왜 단순해졌나?

과거에는 DOCTYPE이 DTD(Document Type Definition) 파일을 참조해서 문법을 검증했습니다.

HTML5부터는:
- DTD 기반 검증을 폐기
- DOCTYPE은 **표준 모드 스위치** 역할만 수행
- 문법 검증은 브라우저 파서 또는 별도 도구가 담당

---

## DOCTYPE이 없으면?

```html
<!-- DOCTYPE 없음 -->
<html>
<head>...</head>
<body>...</body>
</html>
```

- 브라우저가 **Quirks Mode**로 렌더링
- Box Model 계산이 달라짐
- 일부 CSS 속성이 다르게 동작
- 레이아웃이 의도와 다르게 표시될 수 있음

---

## 요약

| 항목 | 설명 |
|------|------|
| DOCTYPE 역할 | 브라우저 렌더링 모드 결정 (Standards vs Quirks) |
| HTML5 DOCTYPE | `<!DOCTYPE html>` - 표준 모드 스위치 |
| 없으면? | Quirks Mode로 동작, 레이아웃 문제 발생 가능 |

---

## Study

**Q. DOCTYPE이 뭔가요?**

DOCTYPE은 HTML 문서 첫 줄에 있는 선언문으로, 브라우저에게 렌더링 모드를 알려줍니다. DOCTYPE이 있으면 표준 모드로, 없으면 Quirks Mode로 렌더링됩니다. HTML5에서는 `<!DOCTYPE html>` 한 줄로 단순화되었고, 표준 모드로 렌더링하라는 스위치 역할을 합니다.

**Q. DOCTYPE이 없으면 어떻게 되나요?**

브라우저가 Quirks Mode로 동작합니다. Quirks Mode에서는 Box Model 계산이 달라지는 등 표준과 다르게 렌더링되어 레이아웃이 깨질 수 있습니다. 예를 들어 width 계산에 padding과 border가 포함되는 등의 차이가 있습니다.