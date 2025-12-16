import { useTerminalLogStore } from "./toaststore";

// 터미널 스타일 토스트 헬퍼
export const terminalToast = {
    success: (message: string) => useTerminalLogStore.getState().addLog('success', message),
    error: (message: string) => useTerminalLogStore.getState().addLog('error', message),
    info: (message: string) => useTerminalLogStore.getState().addLog('info', message),
    warning: (message: string) => useTerminalLogStore.getState().addLog('warning', message),
};
