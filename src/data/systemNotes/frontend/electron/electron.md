# Electron

## Electron이란?

**웹 기술(HTML, CSS, JavaScript)로 크로스 플랫폼 데스크톱 애플리케이션을 만들 수 있게 해주는 프레임워크**입니다.

Electron은 Chromium 브라우저 엔진과 Node.js 런타임을 하나의 패키지로 결합합니다. Chromium이 웹 페이지를 렌더링하고, Node.js가 파일 시스템, 네트워크 등 운영체제 기능에 접근합니다. 이 조합 덕분에 웹 개발자가 익숙한 기술로 Windows, macOS, Linux에서 동작하는 네이티브 앱을 만들 수 있습니다.

GitHub에서 Atom 에디터를 만들기 위해 2013년에 개발을 시작했으며, 현재 VS Code, Slack, Discord, Figma, Notion, Obsidian 등 수많은 인기 애플리케이션이 Electron으로 만들어졌습니다.

### 핵심 구성 요소

| 구성 요소 | 역할 |
|----------|------|
| **Chromium** | 웹 페이지 렌더링 (HTML, CSS, JavaScript 실행) |
| **Node.js** | 파일 시스템, 네트워크, OS API 접근 |
| **Native APIs** | 메뉴, 트레이, 알림, 다이얼로그 등 OS 네이티브 기능 |

---

## 왜 Electron을 사용하는가?

### 크로스 플랫폼 개발

전통적으로 데스크톱 앱을 개발하려면 각 OS별로 다른 언어와 도구를 사용해야 했습니다. Windows는 C#과 .NET, macOS는 Swift와 Cocoa, Linux는 C++과 GTK 등을 배워야 했습니다. Electron은 하나의 코드베이스로 세 플랫폼을 모두 지원하여, 개발 비용과 시간을 크게 줄입니다.

### 웹 기술 활용

HTML, CSS, JavaScript는 전 세계에서 가장 많은 개발자가 사용하는 기술입니다. React, Vue, Angular 같은 프레임워크와 npm의 방대한 생태계를 그대로 활용할 수 있습니다. 웹 개발자가 데스크톱 앱 개발에 진입하는 장벽이 매우 낮습니다.

### 빠른 개발 사이클

웹 개발처럼 Hot Reload가 가능하고, Chrome DevTools로 디버깅할 수 있습니다. UI 변경사항을 즉시 확인하며 개발할 수 있어, 네이티브 앱 개발의 긴 빌드-테스트 사이클에 비해 생산성이 높습니다.

### 네이티브 기능 접근

단순히 웹 페이지를 감싸는 것이 아니라, 시스템 트레이, 네이티브 알림, 파일 시스템, 클립보드, 시스템 메뉴 등 OS의 네이티브 기능에 접근할 수 있습니다. Node.js의 네이티브 모듈을 사용하면 C++ 라이브러리도 연동할 수 있습니다.

---

## 아키텍처: 멀티 프로세스 구조

Electron 앱은 **두 종류의 프로세스**로 구성됩니다. 이 구조를 이해하는 것이 Electron 개발의 핵심입니다. 일반적인 웹 앱과 달리 "백엔드"와 "프론트엔드"가 하나의 앱 안에 공존한다고 생각하면 됩니다.

| 프로세스 | 환경 | 역할 | 개수 |
|---------|------|------|------|
| **Main Process** | Node.js | 앱 생명주기, 창 관리, 시스템 API | 앱당 1개 |
| **Renderer Process** | Chromium | UI 렌더링, 사용자 인터랙션 | 창마다 1개 |

### Main Process

Main Process는 **앱의 진입점이자 중앙 관제탑 역할**을 합니다. `package.json`의 `main` 필드에 지정된 스크립트(보통 `main.js`)가 Main Process로 실행됩니다. 앱당 단 하나의 Main Process만 존재합니다.

Main Process는 Node.js 환경에서 실행되므로, `fs`, `path`, `child_process` 등 모든 Node.js API를 사용할 수 있습니다. 파일 읽기/쓰기, 시스템 명령 실행, 네트워크 요청 등 백엔드 작업을 수행합니다.

**Main Process의 역할:**
- 앱 생명주기 관리 (시작, 종료, 활성화)
- BrowserWindow 생성 및 관리
- 시스템 메뉴, 트레이 아이콘, 네이티브 다이얼로그
- Renderer Process와의 IPC 통신 중계
- 자동 업데이트 처리

### Renderer Process

Renderer Process는 **각 창(BrowserWindow)에서 실행되는 웹 페이지**입니다. Chromium 브라우저 환경에서 실행되어, 일반 웹 개발과 동일하게 HTML, CSS, JavaScript로 UI를 구현합니다. React, Vue 같은 프레임워크도 그대로 사용할 수 있습니다.

중요한 점은 각 창마다 독립적인 Renderer Process가 생성된다는 것입니다. 창 3개를 열면 Renderer Process도 3개가 됩니다. 이 덕분에 하나의 창이 무한 루프나 크래시로 멈춰도 다른 창은 영향받지 않습니다.

### 프로세스 분리 이유

| 이유 | 설명 |
|------|------|
| **보안** | 웹 페이지가 시스템에 직접 접근하면 위험. 권한 분리로 방지 |
| **안정성** | 한 창의 크래시가 전체 앱에 영향 안 줌 |
| **성능** | 멀티코어 활용, 무거운 렌더링이 다른 창에 영향 안 줌 |

---

## IPC (Inter-Process Communication)

Main Process와 Renderer Process는 서로 다른 프로세스이므로 **메모리를 공유하지 않습니다**. 두 프로세스 간에 데이터를 주고받으려면 IPC를 사용해야 합니다.

Electron은 `ipcMain`과 `ipcRenderer` 모듈을 제공합니다. 채널(channel)이라는 문자열로 메시지 종류를 구분하며, 이 문자열이 일종의 이벤트 이름 역할을 합니다.

### 통신 패턴

| 패턴 | 방향 | 사용 사례 | API |
|------|------|----------|-----|
| **단방향** | Renderer → Main | 로그 기록, 분석 전송 | `send()` / `on()` |
| **양방향** | Renderer ↔ Main | 파일 읽기, 시스템 정보 조회 | `invoke()` / `handle()` |
| **푸시** | Main → Renderer | 메뉴 클릭 전달, 백그라운드 알림 | `webContents.send()` |

**양방향 통신 (가장 권장되는 패턴):**

Renderer에서 `ipcRenderer.invoke('채널명', 데이터)`로 요청하고, Main에서 `ipcMain.handle('채널명', 핸들러)`로 처리하여 Promise로 결과를 반환합니다.

```javascript
// main.js
ipcMain.handle('read-file', async (event, path) => {
  return await fs.promises.readFile(path, 'utf-8');
});

// renderer.js (preload를 통해)
const content = await window.electronAPI.readFile('/path/to/file');
```

---

## Preload Script

Preload Script는 **Renderer가 로드되기 전에 실행되는 특별한 스크립트**입니다. Main과 Renderer 사이의 안전한 다리(bridge) 역할을 합니다.

### 왜 Preload가 필요한가?

보안상 Renderer에서는 Node.js API에 직접 접근하지 않는 것이 권장됩니다. 하지만 파일 저장, 시스템 정보 조회 같은 기능이 필요합니다. Preload Script는 이 딜레마를 해결합니다.

Preload는 Node.js 환경에서 실행되지만, `contextBridge`를 통해 Renderer에 노출할 API를 **선별적으로** 정의합니다. 전체 Node.js를 노출하는 대신, 앱에 필요한 기능만 안전하게 래핑하여 제공합니다.

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  onMenuClick: (callback) => ipcRenderer.on('menu-click', callback),
});
```

Renderer에서는 `window.electronAPI.saveFile(content)`처럼 접근합니다. Renderer 코드가 `require('fs')`를 직접 호출할 수 없으므로, 악성 스크립트가 파일 시스템을 마음대로 조작할 수 없습니다.

---

## 주요 모듈

### 앱 생명주기 (app)

`app` 모듈은 앱의 생명주기를 관리합니다. 앱이 시작되면 `ready` 이벤트가 발생하고, 이때부터 창을 생성할 수 있습니다.

| 이벤트 | 발생 시점 | 용도 |
|--------|----------|------|
| `ready` | 앱 초기화 완료 | 창 생성 시작 |
| `window-all-closed` | 모든 창 닫힘 | 앱 종료 처리 (Windows/Linux) |
| `activate` | macOS 독 클릭 | 창 없으면 새 창 생성 |
| `before-quit` | 앱 종료 직전 | 정리 작업 |

macOS에서는 모든 창이 닫혀도 앱이 종료되지 않는 것이 관례입니다. 이런 플랫폼별 동작을 `app` 모듈의 이벤트로 처리합니다.

### 창 관리 (BrowserWindow)

`BrowserWindow`는 앱의 창을 생성하고 관리하는 클래스입니다. 창 크기, 위치, 프레임 스타일, 투명도 등을 설정하고, `loadURL()` 또는 `loadFile()`로 콘텐츠를 로드합니다.

| 주요 옵션 | 설명 |
|----------|------|
| `width`, `height` | 창 크기 |
| `webPreferences.preload` | Preload Script 경로 |
| `webPreferences.contextIsolation` | 컨텍스트 격리 (true 권장) |
| `webPreferences.nodeIntegration` | Node.js 통합 (false 권장) |
| `frame` | 기본 프레임 사용 여부 |
| `transparent` | 투명 창 |

### 네이티브 UI

| 모듈 | 기능 |
|------|------|
| `dialog` | 파일 열기/저장 다이얼로그, 메시지 박스 |
| `Menu` | 앱 메뉴바, 컨텍스트 메뉴 (우클릭) |
| `Tray` | 시스템 트레이 아이콘 (백그라운드 앱) |
| `Notification` | OS 네이티브 알림 |
| `shell` | 외부 URL 열기, 파일 탐색기에서 보기 |
| `clipboard` | 클립보드 읽기/쓰기 |
| `autoUpdater` | 앱 자동 업데이트 |

---

## 보안 고려사항

Electron 앱은 웹 콘텐츠를 실행하면서 동시에 시스템에 접근할 수 있어, **보안에 특히 주의**해야 합니다. 잘못된 설정은 앱을 악성 코드의 실행 환경으로 만들 수 있습니다.

### 핵심 보안 설정

| 설정 | 권장값 | 설명 |
|------|--------|------|
| `contextIsolation` | `true` (기본값) | Preload와 Renderer 컨텍스트 분리 |
| `nodeIntegration` | `false` (기본값) | Renderer에서 Node.js 접근 차단 |
| `sandbox` | `true` (기본값) | OS 수준 샌드박싱 |

### 피해야 할 패턴

- 신뢰할 수 없는 외부 URL을 BrowserWindow에 로드
- `nodeIntegration: true` 설정
- Preload에서 필요 이상의 API 노출
- `eval()` 또는 동적 코드 실행
- 사용자 입력을 그대로 HTML에 삽입 (XSS)

---

## 빌드 및 배포

### electron-builder

가장 많이 사용되는 Electron 빌드 도구입니다. 각 OS별 설치 파일을 생성합니다.

| OS | 지원 포맷 |
|----|----------|
| Windows | `.exe` (NSIS), `.msi` |
| macOS | `.dmg`, `.pkg` |
| Linux | `.deb`, `.rpm`, `.AppImage` |

**주요 기능:**
- 코드 서명 (Code Signing): 앱이 신뢰할 수 있는 개발자가 만들었음을 인증
- 자동 업데이트 지원
- 아이콘 및 메타데이터 설정

### 앱 크기 문제

Electron 앱의 가장 큰 단점은 **크기**입니다. Chromium과 Node.js를 포함하므로 빈 앱도 최소 50-100MB입니다.

| 최적화 방법 | 효과 |
|------------|------|
| 불필요한 node_modules 제거 | 중간 |
| 프로덕션 빌드 (minify, tree-shaking) | 중간 |
| ASAR 아카이브 | 낮음 |
| Chromium 크기 | 줄일 수 없음 (근본적 한계) |

---

## 장단점 정리

| 장점 | 단점 |
|------|------|
| 크로스 플랫폼 (Win/Mac/Linux) | 큰 앱 크기 (50MB+) |
| 웹 기술 사용 (낮은 진입 장벽) | 높은 메모리 사용량 |
| npm 생태계 활용 | 느린 시작 시간 |
| Hot Reload, DevTools | 네이티브 성능 한계 |
| 네이티브 기능 접근 | 보안 주의 필요 |
| VS Code, Slack 등 검증된 사례 | |

### Electron이 적합한 경우

- **크로스 플랫폼** 데스크톱 앱 필요
- **웹 개발팀**이 데스크톱 앱 개발
- **빠른 개발**과 반복이 중요
- 앱 크기/성능보다 **개발 생산성** 우선
- **복잡한 UI**가 필요한 도구 (에디터, 대시보드)

### Electron이 부적합한 경우

- **가벼운 유틸리티** 앱 (크기 부담)
- **고성능** 필요 (게임, 영상 편집)
- **리소스 제한** 환경
- **단일 플랫폼**만 타겟

---

## Electron 대안: Tauri

Tauri는 **Rust 기반의 경량 데스크톱 앱 프레임워크**로, Electron의 대안으로 주목받고 있습니다.

가장 큰 차이는 렌더링 방식입니다. Electron은 Chromium을 앱에 포함하지만, Tauri는 각 OS에 내장된 WebView를 사용합니다. 이 덕분에 앱 크기가 매우 작습니다.

| 구분 | Electron | Tauri |
|------|----------|-------|
| **백엔드** | Node.js (JavaScript) | Rust |
| **렌더링** | Chromium (앱 내장) | OS WebView (시스템 사용) |
| **앱 크기** | 50-150MB | 2-10MB |
| **메모리** | 높음 | 낮음 |
| **성능** | 보통 | 빠름 |
| **생태계** | 풍부, 성숙 | 성장 중 |
| **학습 비용** | 낮음 | Rust 필요 시 높음 |
| **WebView 일관성** | 항상 동일 (Chromium) | OS별 다름 |

### 선택 기준

| 상황 | 권장 |
|------|------|
| 웹 개발팀, 빠른 개발 | Electron |
| 앱 크기/성능 중요 | Tauri |
| Rust 경험 있음 | Tauri |
| 검증된 안정성 필요 | Electron |
| 복잡한 Node.js 생태계 활용 | Electron |

---

## React와 Electron 통합

React 앱을 Electron에서 실행하는 것은 매우 일반적인 조합입니다.

### 개발 환경

React 개발 서버(보통 `localhost:3000`)를 BrowserWindow에서 로드합니다. React의 Hot Reload가 그대로 작동하여 빠르게 UI를 개발할 수 있습니다.

### 프로덕션 환경

React를 빌드하여 생성된 정적 파일(index.html, bundle.js 등)을 로드합니다. `file://` 프로토콜로 로컬 파일을 로드하거나, 커스텀 프로토콜을 정의합니다.

### IPC 사용

React 컴포넌트에서 IPC를 사용하려면 Preload Script에서 노출한 API를 `window.electronAPI`로 접근합니다. 이를 React Context나 커스텀 Hook으로 래핑하면 더 편리합니다.

### 보일러플레이트

| 도구 | 특징 |
|------|------|
| `electron-vite` | Vite 기반, 빠른 빌드 |
| `electron-react-boilerplate` | 완전한 구성, TypeScript |
| `electron-forge` | 공식 도구, 유연함 |

---

## 면접 예상 질문

**Q. Electron이란?**

웹 기술(HTML, CSS, JavaScript)로 크로스 플랫폼 데스크톱 앱을 만드는 프레임워크입니다. Chromium과 Node.js를 결합하여 웹 개발자가 Windows, macOS, Linux 앱을 하나의 코드베이스로 개발할 수 있게 합니다. VS Code, Slack, Discord 등 많은 앱이 Electron으로 만들어졌습니다.

**Q. Main Process와 Renderer Process의 차이?**

Main Process는 앱당 하나로, Node.js 환경에서 실행되며 앱 생명주기, 창 관리, 네이티브 기능을 담당합니다. Renderer Process는 각 창마다 존재하며, Chromium에서 웹 페이지를 렌더링하고 UI를 담당합니다. 서로 다른 프로세스이므로 메모리를 공유하지 않고 IPC로 통신합니다.

**Q. IPC가 필요한 이유?**

Main과 Renderer는 별도 프로세스로 메모리를 공유하지 않습니다. Renderer에서 파일 저장 같은 시스템 작업이 필요하면, IPC로 Main에 요청을 보내고 Main이 처리합니다. 이 분리가 보안(웹 페이지가 시스템에 직접 접근 못함)과 안정성(한 창 크래시가 전체에 영향 안 줌)을 제공합니다.

**Q. Preload Script의 역할?**

Renderer가 로드되기 전에 실행되어, Main과 Renderer 사이의 안전한 다리 역할을 합니다. `contextBridge`를 통해 Renderer에 필요한 API만 선별적으로 노출합니다. Node.js 전체를 노출하지 않아 악성 스크립트가 파일 시스템 등에 접근하는 것을 방지합니다.

**Q. Electron의 보안 권장사항?**

`contextIsolation: true`로 Preload와 Renderer 컨텍스트를 분리하고, `nodeIntegration: false`로 Renderer에서 Node.js 접근을 차단합니다. Preload에서 필요한 API만 노출하고, 신뢰할 수 없는 외부 콘텐츠 로드를 피해야 합니다. `sandbox: true`로 OS 수준 샌드박싱도 권장됩니다.

**Q. Electron의 단점과 Tauri와의 차이?**

Electron은 Chromium 포함으로 앱 크기가 크고(50MB+), 메모리 사용량이 높습니다. Tauri는 시스템 WebView를 사용하여 앱 크기가 2-10MB로 작고, Rust 백엔드로 성능이 좋습니다. 다만 Tauri는 Rust 학습이 필요하고, 각 OS의 WebView 버전이 달라 호환성 테스트가 필요합니다. 웹 개발팀이 빠르게 개발하려면 Electron, 크기/성능이 중요하면 Tauri가 적합합니다.