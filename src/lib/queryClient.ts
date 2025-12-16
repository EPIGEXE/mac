/**
 * TanStack Query Client 설정
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5분
            gcTime: 30 * 60 * 1000, // 30분 (garbage collection)
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
})
