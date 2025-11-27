import { Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts';
import { MainPage, NoteDetailWrapper } from './pages';

function App() {
    return (
        <Routes>
            <Route element={<RootLayout />}>
                <Route path="/" element={<MainPage />} />
                <Route path="/note/:noteId" element={<NoteDetailWrapper />} />
            </Route>
        </Routes>
    );
}

export default App;
