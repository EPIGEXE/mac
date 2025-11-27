import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeProvider';

export function RootLayout() {
    return (
        <ThemeProvider>
            <Outlet />
        </ThemeProvider>
    );
}
