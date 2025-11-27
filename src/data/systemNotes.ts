import type { SystemNote } from '../lib/db';

// ============================================================================
// 카테고리 목록
// ============================================================================

export const categories = [
    'HTML',
    'CSS',
    'JavaScript',
    'React',
    'TypeScript',
    'CS',
    'Performance',
    'Security',
] as const;

export type Category = (typeof categories)[number];

// ============================================================================
// 시스템 노트 데이터 (제공 문서)
// - version: 패치 시 버전 비교용
// - order: 카테고리 내 정렬 순서
// ============================================================================

export const systemNotesData: SystemNote[] = [
    // ========================================================================
    // HTML
    // ========================================================================
    {
        id: 'sys-html-semantic',
        version: 1,
        title: 'Semantic HTML',
        category: 'HTML',
        tags: ['기초', 'SEO'],
        order: 1,
        content: `시맨틱 HTML은 의미를 가진 태그를 사용하여 문서 구조를 명확하게 표현하는 방법입니다.

## 주요 시맨틱 태그

- header: 페이지나 섹션의 헤더
- nav: 네비게이션 링크 그룹
- main: 문서의 주요 콘텐츠
- article: 독립적인 콘텐츠
- section: 주제별 콘텐츠 그룹
- aside: 부가 콘텐츠
- footer: 페이지나 섹션의 푸터

## 장점

- 접근성 향상
- SEO 최적화
- 코드 가독성 증가
- 유지보수 용이`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-html-html5',
        version: 1,
        title: 'HTML5 주요 기능',
        category: 'HTML',
        tags: ['HTML5', '기초'],
        order: 2,
        content: `HTML5는 웹 표준의 최신 버전으로 다양한 멀티미디어 기능을 제공합니다.

## 새로운 기능

- video, audio 태그로 플러그인 없이 미디어 재생
- canvas를 통한 2D 그래픽 그리기
- localStorage, sessionStorage로 클라이언트 저장소 사용
- Geolocation API로 위치 정보 사용
- Web Worker로 백그라운드 스레드 실행

## 입력 타입 추가

- email, url, tel, number, date, color 등`,
        createdAt: Date.now(),
    },

    // ========================================================================
    // CSS
    // ========================================================================
    {
        id: 'sys-css-boxmodel',
        version: 1,
        title: 'CSS Box Model',
        category: 'CSS',
        tags: ['기초', '레이아웃'],
        order: 1,
        content: `Box Model은 모든 HTML 요소를 박스로 취급하는 CSS의 기본 개념입니다.

## 구성 요소

- **Content**: 실제 내용이 표시되는 영역
- **Padding**: 내용과 테두리 사이의 여백
- **Border**: 테두리
- **Margin**: 요소 외부의 여백

## box-sizing 속성

- \`content-box\` (기본값): width/height가 content만 포함
- \`border-box\`: width/height가 padding과 border까지 포함

## 실무 팁

보통 \`* { box-sizing: border-box; }\`를 사용하여 크기 계산을 단순화합니다.`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-css-flexbox',
        version: 1,
        title: 'Flexbox',
        category: 'CSS',
        tags: ['레이아웃', '중급'],
        order: 2,
        content: `Flexbox는 1차원 레이아웃을 위한 강력한 CSS 모듈입니다.

## 주요 속성 (컨테이너)

- \`display: flex\`
- \`flex-direction\`: row | column
- \`justify-content\`: 주축 정렬
- \`align-items\`: 교차축 정렬
- \`gap\`: 아이템 간 간격

## 주요 속성 (아이템)

- \`flex\`: flex-grow flex-shrink flex-basis의 단축 속성
- \`flex-grow\`: 여유 공간 분배 비율
- \`flex-shrink\`: 공간 부족 시 축소 비율
- \`align-self\`: 개별 아이템 정렬

## 사용 예시

가운데 정렬: \`display: flex; justify-content: center; align-items: center;\``,
        createdAt: Date.now(),
    },

    // ========================================================================
    // JavaScript
    // ========================================================================
    {
        id: 'sys-js-closure',
        version: 1,
        title: '클로저 (Closure)',
        category: 'JavaScript',
        tags: ['핵심개념', '중급'],
        order: 1,
        content: `클로저는 함수와 그 함수가 선언된 렉시컬 환경의 조합입니다.

## 핵심 개념

- 내부 함수가 외부 함수의 변수에 접근할 수 있습니다
- 외부 함수 실행이 끝나도 내부 함수는 외부 변수를 기억합니다

## 활용

- 데이터 은닉화 (private 변수 구현)
- 모듈 패턴
- 이벤트 핸들러
- 콜백 함수

## 주의사항

메모리 누수를 방지하기 위해 불필요한 클로저는 정리해야 합니다.`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-eventloop',
        version: 1,
        title: '이벤트 루프',
        category: 'JavaScript',
        tags: ['핵심개념', '비동기'],
        order: 2,
        content: `이벤트 루프는 JavaScript의 비동기 처리 메커니즘입니다.

## 구성 요소

- **Call Stack**: 실행 중인 함수 추적
- **Task Queue** (Macro): setTimeout, setInterval 등
- **Microtask Queue**: Promise, queueMicrotask 등
- **Web APIs**: DOM, Timer, Fetch 등

## 실행 순서

1. Call Stack의 모든 작업 실행
2. Microtask Queue 전체 비우기
3. Task Queue에서 하나 실행
4. 렌더링 (필요시)
5. 반복

## 중요

Microtask는 Task보다 우선순위가 높습니다. Promise는 Microtask, setTimeout은 Task입니다.`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-js-promise',
        version: 1,
        title: 'Promise와 async/await',
        category: 'JavaScript',
        tags: ['비동기', '중급'],
        order: 3,
        content: `Promise는 비동기 작업의 완료 또는 실패를 나타내는 객체입니다.

## Promise 상태

- **Pending**: 초기 상태
- **Fulfilled**: 성공
- **Rejected**: 실패

## 주요 메서드

- \`then()\`: 성공 시 실행
- \`catch()\`: 실패 시 실행
- \`finally()\`: 항상 실행
- \`Promise.all()\`: 모든 Promise 완료 대기
- \`Promise.race()\`: 가장 먼저 완료되는 것 사용

## async/await

- async 함수는 항상 Promise 반환
- await는 Promise가 처리될 때까지 대기
- try-catch로 에러 처리`,
        createdAt: Date.now(),
    },

    // ========================================================================
    // React
    // ========================================================================
    {
        id: 'sys-react-usestate',
        version: 1,
        title: 'React Hooks - useState',
        category: 'React',
        tags: ['Hooks', '기초'],
        order: 1,
        content: `useState는 함수 컴포넌트에서 상태를 관리하는 Hook입니다.

## 기본 사용법

\`const [state, setState] = useState(initialValue);\`

## 특징

- **state**: 현재 상태 값
- **setState**: 상태 업데이트 함수
- 초기값은 첫 렌더링에서만 사용

## 함수형 업데이트

\`setState(prev => prev + 1)\` - 이전 상태를 기반으로 업데이트할 때 사용합니다.

## 주의사항

- 상태는 불변성을 유지해야 합니다
- 객체/배열 업데이트 시 새로운 참조를 생성해야 합니다`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-react-virtualdom',
        version: 1,
        title: 'Virtual DOM',
        category: 'React',
        tags: ['핵심개념', '중급'],
        order: 2,
        content: `Virtual DOM은 React의 핵심 개념으로 성능 최적화를 위한 메커니즘입니다.

## 동작 원리

1. 상태 변경 발생
2. 새로운 Virtual DOM 트리 생성
3. 이전 트리와 비교 (Diffing)
4. 변경된 부분만 실제 DOM에 반영 (Reconciliation)

## 장점

- 최소한의 DOM 조작으로 성능 향상
- 선언적 프로그래밍 가능
- 크로스 플랫폼 지원 (React Native)

## Reconciliation 알고리즘

- 서로 다른 타입의 엘리먼트는 완전히 새로 렌더링
- key prop을 통해 리스트 최적화`,
        createdAt: Date.now(),
    },

    // ========================================================================
    // TypeScript
    // ========================================================================
    {
        id: 'sys-ts-basics',
        version: 1,
        title: 'TypeScript 기본 타입',
        category: 'TypeScript',
        tags: ['기초', '타입'],
        order: 1,
        content: `TypeScript의 기본 타입 시스템입니다.

## 원시 타입

- string, number, boolean
- null, undefined
- symbol, bigint

## 특수 타입

- **any**: 모든 타입 허용 (지양해야 함)
- **unknown**: 타입 안전한 any
- **void**: 반환값 없음
- **never**: 절대 발생하지 않는 값

## 배열과 튜플

- \`number[]\`, \`Array<number>\`
- \`[string, number]\`: 고정된 길이와 타입`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-ts-generics',
        version: 1,
        title: 'TypeScript 제네릭',
        category: 'TypeScript',
        tags: ['중급', '타입'],
        order: 2,
        content: `제네릭은 재사용 가능한 컴포넌트를 만들기 위한 도구입니다.

## 기본 문법

\`function identity<T>(arg: T): T { return arg; }\`

## 사용 이유

- 타입 안정성 유지하면서 재사용성 증가
- any 사용을 피하면서 유연한 함수 작성

## 제약 조건

\`<T extends SomeType>\`으로 타입 제한 가능

## 활용

- 유틸리티 함수
- 커스텀 Hook
- API 응답 타입
- 컬렉션 자료구조`,
        createdAt: Date.now(),
    },

    // ========================================================================
    // CS
    // ========================================================================
    {
        id: 'sys-cs-bigo',
        version: 1,
        title: 'Big O 표기법',
        category: 'CS',
        tags: ['알고리즘', '기초'],
        order: 1,
        content: `Big O는 알고리즘의 시간/공간 복잡도를 나타내는 표기법입니다.

## 주요 복잡도 (빠른 순)

- **O(1)**: 상수 시간
- **O(log n)**: 로그 시간 (이진 탐색)
- **O(n)**: 선형 시간 (배열 순회)
- **O(n log n)**: 선형 로그 시간 (병합 정렬)
- **O(n²)**: 이차 시간 (중첩 반복문)
- **O(2ⁿ)**: 지수 시간 (피보나치 재귀)

## 평가 기준

- 최악의 경우를 기준으로 평가
- 상수와 낮은 차수 항은 무시
- 가장 큰 차수만 고려`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-cs-http',
        version: 1,
        title: 'HTTP와 HTTPS',
        category: 'CS',
        tags: ['네트워크', '기초'],
        order: 2,
        content: `HTTP와 HTTPS는 웹 통신의 기본 프로토콜입니다.

## HTTP (HyperText Transfer Protocol)

- 클라이언트-서버 통신 프로토콜
- Stateless: 각 요청은 독립적
- 포트: 80

## 주요 메서드

- **GET**: 데이터 조회
- **POST**: 데이터 생성
- **PUT**: 데이터 전체 수정
- **PATCH**: 데이터 부분 수정
- **DELETE**: 데이터 삭제

## HTTPS

- HTTP + SSL/TLS 암호화
- 포트: 443
- 데이터 암호화로 보안 강화`,
        createdAt: Date.now(),
    },

    // ========================================================================
    // Performance
    // ========================================================================
    {
        id: 'sys-perf-webvitals',
        version: 1,
        title: 'Web Vitals',
        category: 'Performance',
        tags: ['최적화', '측정'],
        order: 1,
        content: `Core Web Vitals는 Google의 핵심 성능 지표입니다.

## LCP (Largest Contentful Paint)

- 가장 큰 콘텐츠 로딩 시간
- 목표: **2.5초 이하**

## FID (First Input Delay)

- 첫 입력 응답 시간
- 목표: **100ms 이하**

## CLS (Cumulative Layout Shift)

- 레이아웃 변화 누적
- 목표: **0.1 이하**

## 개선 방법

- 이미지 최적화
- 폰트 최적화
- JavaScript 최소화
- 크기 명시로 CLS 방지`,
        createdAt: Date.now(),
    },

    // ========================================================================
    // Security
    // ========================================================================
    {
        id: 'sys-sec-xss',
        version: 1,
        title: 'XSS (Cross-Site Scripting)',
        category: 'Security',
        tags: ['보안', '중요'],
        order: 1,
        content: `XSS는 악성 스크립트를 삽입하는 공격입니다.

## Stored XSS

- 서버에 저장된 스크립트 실행
- 게시판, 댓글 등

## Reflected XSS

- URL 파라미터를 통한 즉시 실행
- 피싱에 활용

## DOM-based XSS

- 클라이언트 측에서만 발생

## 방어 방법

- 입력 값 검증 및 이스케이프
- Content Security Policy (CSP)
- HTTP-only 쿠키
- React의 자동 이스케이프 활용

> 주의: \`dangerouslySetInnerHTML\` 사용 시 주의 필요`,
        createdAt: Date.now(),
    },
    {
        id: 'sys-sec-cors',
        version: 1,
        title: 'CORS (Cross-Origin Resource Sharing)',
        category: 'Security',
        tags: ['보안', '네트워크'],
        order: 2,
        content: `CORS는 다른 출처의 리소스 접근을 제어하는 보안 메커니즘입니다.

## 동일 출처 정책

- 프로토콜, 도메인, 포트가 모두 같아야 함
- 보안을 위한 브라우저 정책

## CORS 헤더

- \`Access-Control-Allow-Origin\`: 허용할 출처 지정
- \`Access-Control-Allow-Methods\`: 허용할 HTTP 메서드

## Preflight Request

- OPTIONS 메서드로 사전 확인
- PUT, DELETE 등에서 발생

## 해결 방법

- 서버에서 CORS 헤더 설정
- 프록시 서버 사용`,
        createdAt: Date.now(),
    },
];
