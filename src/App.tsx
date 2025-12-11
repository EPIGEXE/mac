import { Routes, Route } from 'react-router-dom';
import { RootLayout } from './components/layouts/RootLayout';
import { MainPage } from './pages/MainPage';
import { NoteDetailWrapper } from './pages/NoteDetailWrapper';
import { StudyModePage } from './pages/StudyModePage';
import { StudySetupPage } from './pages/StudySetupPage';
import { StudyFinalResultPage } from './pages/StudyFinalResultPage';
import { StatisticsDashboardPage } from './pages/StatisticsDashboardPage';
import { WeakPointsPage } from './pages/WeakPointsPage';
import { SessionHistoryPage } from './pages/SessionHistoryPage';
import { TerminalToast } from './features/Toast/components/TerminalToast';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { AppCrashFallback } from './components/ErrorBoundary/ErrorFallback';

function App() {
    return (
        <ErrorBoundary fallback={(error) => <AppCrashFallback error={error} />}>
            <TerminalToast />
            <Routes>
                <Route element={<RootLayout />}>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/note/:noteId" element={<NoteDetailWrapper />} />
                    <Route path="/study/setup" element={<StudySetupPage />} />
                    <Route path="/study" element={<StudyModePage />} />
                    <Route path="/study/result" element={<StudyFinalResultPage />} />
                    <Route path="/statistics" element={<StatisticsDashboardPage />} />
                    <Route path="/study/weak-points" element={<WeakPointsPage />} />
                    <Route path="/study/sessions" element={<SessionHistoryPage />} />
                </Route>
            </Routes>
        </ErrorBoundary>
    );
}

export default App;
