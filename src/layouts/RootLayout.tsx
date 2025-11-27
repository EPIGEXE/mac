import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../contexts';

export function RootLayout() {
    return (
        <ThemeProvider>
            <Outlet />
        </ThemeProvider>
    );
}
