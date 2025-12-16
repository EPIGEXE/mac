import { create } from 'zustand';

export type LogType = 'success' | 'error' | 'info' | 'warning';

export interface LogEntry {
    id: string;
    type: LogType;
    text: string;
    timestamp: string;
}

interface TerminalLogState {
    logs: LogEntry[];
    isVisible: boolean;
    addLog: (type: LogType, text: string) => void;
    clearLogs: () => void;
    setVisible: (visible: boolean) => void;
}

// 현재 시간 포맷 (HH:MM:SS)
function getTimestamp(): string {
    const now = new Date();
    return [
        now.getHours().toString().padStart(2, '0'),
        now.getMinutes().toString().padStart(2, '0'),
        now.getSeconds().toString().padStart(2, '0'),
    ].join(':');
}

let logIdCounter = 0;

export const useTerminalLogStore = create<TerminalLogState>((set) => ({
    logs: [],
    isVisible: false,
    addLog: (type, text) => set((state) => {
        const newLog: LogEntry = {
            id: `log-${++logIdCounter}`,
            type,
            text,
            timestamp: getTimestamp(),
        };
        return {
            logs: [...state.logs, newLog],
            isVisible: true,
        };
    }),
    clearLogs: () => set({ logs: [], isVisible: false }),
    setVisible: (visible) => set({ isVisible: visible }),
}));
