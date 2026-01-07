import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootLayout } from './components/layouts/RootLayout';
import { TerminalToast } from './features/Toast/components/TerminalToast';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { AppCrashFallback } from './components/ErrorBoundary/ErrorFallback';

// Lazy loaded pages
const MainPage = lazy(() => import('./pages/MainPage').then(m => ({ default: m.MainPage })));
const NoteDetailPage = lazy(() => import('./pages/NoteDetailPage').then(m => ({ default: m.NoteDetailPage })));
const StudySetupPage = lazy(() => import('./pages/StudySetupPage').then(m => ({ default: m.StudySetupPage })));
const StudyModePage = lazy(() => import('./pages/StudyModePage').then(m => ({ default: m.StudyModePage })));
const StudyFinalResultPage = lazy(() => import('./pages/StudyFinalResultPage').then(m => ({ default: m.StudyFinalResultPage })));
const StatisticsDashboardPage = lazy(() => import('./pages/StatisticsDashboardPage').then(m => ({ default: m.StatisticsDashboardPage })));
const WeakPointsPage = lazy(() => import('./pages/WeakPointsPage').then(m => ({ default: m.WeakPointsPage })));
const SessionHistoryPage = lazy(() => import('./pages/SessionHistoryPage').then(m => ({ default: m.SessionHistoryPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

function App() {
    return (
        <ErrorBoundary fallback={(error) => <AppCrashFallback error={error} />}>
            <TerminalToast />
            <Suspense fallback={null}>
                <Routes>
                    <Route element={<RootLayout />}>
                        <Route path="/" element={<MainPage />} />
                        <Route path="/note/:noteId" element={<NoteDetailPage />} />
                        <Route path="/study/setup" element={<StudySetupPage />} />
                        <Route path="/study" element={<StudyModePage />} />
                        <Route path="/study/result" element={<StudyFinalResultPage />} />
                        <Route path="/statistics" element={<StatisticsDashboardPage />} />
                        <Route path="/study/weak-points" element={<WeakPointsPage />} />
                        <Route path="/study/sessions" element={<SessionHistoryPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
