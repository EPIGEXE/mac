import { Routes, Route } from 'react-router-dom';
import { RootLayout } from './components/layouts/RootLayout';
import { MainPage } from './pages/MainPage';
import { NoteDetailWrapper } from './pages/NoteDetailWrapper';
import { TerminalToast } from './features/Toast/components/TerminalToast';

function App() {
    return (
        <>
            <TerminalToast />
            <Routes>
                <Route element={<RootLayout />}>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/note/:noteId" element={<NoteDetailWrapper />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;
