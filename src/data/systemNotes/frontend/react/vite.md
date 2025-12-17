# Vite

## Vite란?

**차세대 프론트엔드 빌드 도구**입니다. 프랑스어로 "빠르다"를 의미하며, 개발 서버 시작과 HMR(Hot Module Replacement)이 매우 빠릅니다.

Evan You(Vue.js 창시자)가 만들었지만, React, Svelte, Vanilla JS 등 프레임워크에 무관하게 사용할 수 있습니다.

```bash
# 프로젝트 생성
npm create vite@latest my-app -- --template react-ts
```

---

## 왜 Vite가 빠른가?

기존 번들러(Webpack 등)의 문제점은 개발 서버 시작 시 **전체 애플리케이션을 번들링**해야 한다는 것입니다. 프로젝트가 커질수록 시작 시간이 길어집니다.

```
[기존 번들러]
소스 코드 전체 → 번들링 → 개발 서버 시작 → 브라우저에 번들 제공
                  ↑
              시간이 오래 걸림

[Vite]
개발 서버 즉시 시작 → 브라우저가 요청한 모듈만 변환 → ESM으로 제공
                              ↑
                      필요한 것만 처리 (빠름)
```

Vite는 두 가지 핵심 기술로 이를 해결합니다.

**1. 네이티브 ESM 활용 (개발 모드)**

브라우저가 ES Modules를 직접 이해하므로, 번들링 없이 소스 파일을 그대로 제공합니다. 브라우저가 `import`를 만나면 해당 모듈만 서버에 요청하고, Vite는 요청받은 파일만 변환합니다.

**2. esbuild로 사전 번들링 (Dependencies)**

`node_modules`의 의존성은 esbuild로 미리 번들링해둡니다. esbuild는 Go로 작성되어 JavaScript 기반 번들러보다 10~100배 빠릅니다.

---

## ES Modules (ESM)

**JavaScript의 공식 모듈 시스템**입니다. `import`/`export` 문법을 사용하며, 모던 브라우저에서 네이티브로 지원됩니다.

```html
<!-- 브라우저에서 직접 ESM 사용 -->
<script type="module" src="/src/main.js"></script>
```

```javascript
// ESM 문법
import { useState } from 'react';
import App from './App.jsx';

export function helper() { }
export default function Main() { }
```

ESM의 특징:
- **정적 분석 가능**: import/export가 파일 최상단에 위치, 빌드 타임에 의존성 파악
- **Tree Shaking**: 사용하지 않는 코드 제거 가능
- **브라우저 네이티브**: 번들링 없이 브라우저가 직접 모듈 로드

CommonJS(`require`)와의 차이:

| 구분 | ESM | CommonJS |
|------|-----|----------|
| 문법 | import/export | require/module.exports |
| 로딩 | 비동기 | 동기 |
| 분석 | 정적 (빌드 타임) | 동적 (런타임) |
| Tree Shaking | 가능 | 어려움 |
| 브라우저 | 네이티브 지원 | 번들러 필요 |

Vite는 개발 모드에서 ESM을 직접 활용하여 번들링 단계를 생략합니다.

---

## esbuild의 역할

**의존성 사전 번들링(Dependency Pre-Bundling)**을 담당합니다.

`node_modules`의 패키지들은 대부분 CommonJS로 작성되어 있고, 수많은 작은 파일로 구성되어 있습니다. 이를 그대로 브라우저에 제공하면 수백 개의 HTTP 요청이 발생합니다.

```
lodash-es: 600개 이상의 파일
→ 600번의 HTTP 요청?
→ esbuild로 하나의 ESM 번들로 변환
→ 1번의 요청
```

esbuild가 하는 일:
- CommonJS → ESM 변환
- 여러 파일을 하나로 번들링
- `.vite` 폴더에 캐싱

esbuild가 빠른 이유:
- Go로 작성 (네이티브 코드)
- 병렬 처리 최적화
- 메모리 효율적 사용

```bash
# 캐시 삭제 후 재빌드
npx vite --force
```

---

## Rollup의 역할

**프로덕션 빌드**를 담당합니다.

개발 모드에서는 ESM을 직접 제공하지만, 프로덕션에서는 여전히 번들링이 필요합니다.
- 오래된 브라우저 지원
- 코드 분할 (Code Splitting)
- Tree Shaking
- 최적화된 청크 생성

Vite는 프로덕션 빌드에 **Rollup**을 사용합니다.

```
[개발 모드]
esbuild (의존성 사전 번들링) + 네이티브 ESM

[프로덕션 빌드]
Rollup (번들링, 최적화, 코드 분할)
```

Rollup을 선택한 이유:
- 성숙한 플러그인 생태계
- 효율적인 Tree Shaking
- 유연한 출력 형식 (ES, CommonJS, UMD 등)
- 코드 분할 기능

Vite 플러그인은 Rollup 플러그인 API를 확장한 것이라 대부분의 Rollup 플러그인이 호환됩니다.

---

## 기본 설정 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // 개발 서버 설정
  server: {
    port: 3000,
    open: true,  // 브라우저 자동 열기
    host: true,  // 네트워크 노출 (0.0.0.0)
  },
  
  // 빌드 설정
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  
  // 경로 별칭
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
    },
  },
});
```

TypeScript에서 경로 별칭을 사용하려면 `tsconfig.json`에도 설정해야 합니다.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

---

## 프록시 설정

개발 중 CORS 문제를 해결하기 위해 API 요청을 프록시합니다.

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // /api/users → http://localhost:8080/api/users
      },
      // 경로 재작성
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // /api/users → http://localhost:8080/users
      },
      // WebSocket
      '/socket.io': { target: 'ws://localhost:8080', ws: true },
    },
  },
});
```

---

## 환경 변수

`.env` 파일로 환경 변수를 관리합니다. `VITE_` 접두사가 있는 변수만 클라이언트에 노출됩니다.

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My App
DATABASE_URL=postgres://...  # 클라이언트에 노출되지 않음
```

```typescript
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.MODE);  // 'development' | 'production'
console.log(import.meta.env.DEV);   // true | false
```

환경별 파일: `.env`, `.env.local`, `.env.development`, `.env.production`

TypeScript 타입 지원은 `src/vite-env.d.ts`에서 `ImportMetaEnv` 인터페이스를 확장합니다.

---

## 플러그인 시스템

Vite 플러그인은 Rollup 플러그인 API를 확장합니다. 대부분의 Rollup 플러그인이 호환됩니다.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),                         // React Fast Refresh, JSX
    legacy({ targets: ['defaults'] }), // 레거시 브라우저 지원
    visualizer({ open: true }),      // 번들 분석 (Rollup 플러그인)
  ],
});
```

주요 공식 플러그인:

| 플러그인 | 용도 |
|---------|------|
| @vitejs/plugin-react | React Fast Refresh, JSX |
| @vitejs/plugin-react-swc | SWC 기반 React (더 빠름) |
| @vitejs/plugin-vue | Vue 3 SFC 지원 |
| @vitejs/plugin-legacy | 레거시 브라우저 지원 |

커스텀 플러그인은 `name`, `config`, `configureServer`, `transform` 등의 훅을 구현합니다.

---

## 빌드 최적화 설정

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // vendor 청크 분리
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',  // 또는 'terser' (더 작지만 느림)
    target: 'es2020',
  },
});
```

동적 import로 자동 코드 분할:

```typescript
// 라우트 기반 코드 분할
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
```

---

## CSS 처리

Vite는 CSS를 기본 지원하며, 전처리기(Sass, Less, Stylus)를 설치만 하면 자동 동작합니다.

```typescript
// CSS Modules
import styles from './Button.module.css';

// 전역 CSS, Sass
import './global.css';
import './styles.scss';
```

```typescript
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
});
```

PostCSS는 `postcss.config.js` 파일을 자동 감지합니다.

---

## 정적 자산 처리

```typescript
import imgUrl from './image.png';       // URL로 가져오기 → /assets/image.abc123.png
import shaderCode from './shader.glsl?raw';  // Raw 문자열로 가져오기
import Worker from './worker.js?worker';     // Worker로 가져오기

// public 폴더는 변환 없이 그대로 복사
// public/favicon.ico → /favicon.ico
```

`build.assetsInlineLimit`으로 작은 자산을 base64로 인라인할 수 있습니다 (기본 4KB).

---

## 개발 vs 프로덕션 비교

| 구분 | 개발 모드 | 프로덕션 빌드 |
|------|----------|--------------|
| 번들러 | 없음 (ESM 직접 제공) | Rollup |
| 의존성 처리 | esbuild 사전 번들링 | Rollup 번들링 |
| HMR | 네이티브 ESM 기반 (빠름) | - |
| 최적화 | 최소한 | Tree Shaking, 압축, 분할 |

---

## 면접 예상 질문

**Q. Vite가 Webpack보다 빠른 이유?**

개발 모드에서 번들링 없이 브라우저의 네이티브 ESM을 활용합니다. 브라우저가 요청한 모듈만 변환하므로 프로젝트 크기와 관계없이 서버 시작이 빠릅니다. 의존성은 esbuild로 사전 번들링하는데, esbuild는 Go로 작성되어 JavaScript 번들러보다 10~100배 빠릅니다.

**Q. 개발 모드와 프로덕션 빌드의 차이?**

개발 모드는 번들링 없이 ESM을 직접 제공하고 esbuild로 의존성만 사전 번들링합니다. 프로덕션 빌드는 Rollup을 사용하여 번들링, Tree Shaking, 코드 분할, 압축 등 최적화를 수행합니다.

**Q. esbuild와 Rollup의 역할 차이?**

esbuild는 개발 모드에서 의존성 사전 번들링과 소스 코드 변환을 담당합니다. Rollup은 프로덕션 빌드를 담당하여 최적화된 번들을 생성합니다. esbuild가 더 빠르지만 Rollup이 코드 분할과 플러그인 생태계가 더 성숙합니다.

**Q. ESM이란?**

JavaScript의 공식 모듈 시스템으로 import/export 문법을 사용합니다. 정적 분석이 가능하여 Tree Shaking이 가능하고, 모던 브라우저에서 네이티브로 지원됩니다. Vite는 이를 활용해 개발 모드에서 번들링을 생략합니다.

**Q. 환경 변수는 어떻게 관리하나요?**

.env 파일을 사용하며, VITE_ 접두사가 있는 변수만 클라이언트에 노출됩니다. import.meta.env로 접근하고, .env.development, .env.production으로 환경별 분리가 가능합니다.

**Q. 코드 분할은 어떻게 하나요?**

동적 import(`import()`)를 사용하면 자동으로 별도 청크가 생성됩니다. React.lazy와 결합하여 라우트 기반 분할이 가능합니다. rollupOptions.output.manualChunks로 수동 청크 분할도 가능합니다.