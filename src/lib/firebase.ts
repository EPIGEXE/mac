/**
 * Firebase 클라이언트 설정
 * - Firestore 제거 (미사용, ~700KB 절감)
 * - Functions만 사용
 */
import { initializeApp } from 'firebase/app'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// Firebase 설정 (환경 변수에서 가져옴)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig)

// App Check 초기화 (Cloud Functions 보호)
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
    })
}

// Functions 인스턴스
export const functions = getFunctions(app, 'asia-northeast3') // 서울 리전

// 개발 환경에서 에뮬레이터 연결
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    connectFunctionsEmulator(functions, 'localhost', 5001)
    console.log('Firebase emulators connected')
}

export default app
