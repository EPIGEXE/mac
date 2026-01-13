/**
 * TanStack Query Client 설정
 * - 퀴즈 캐시를 sessionStorage에 저장하여 새로고침 후에도 유지
 */
import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // 10분
            gcTime: 30 * 60 * 1000, // 30분
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
})

// sessionStorage persister (탭 닫으면 삭제, 새로고침은 유지)
// study 관련 쿼리를 보존해, 새로고침하더라도 받은 문제 데이터를 유지하기 위해 사용
export const persister = createAsyncStoragePersister({
    storage: sessionStorage,
    key: 'notree-query-cache',
})

export const persistOptions = {
    persister,
    maxAge: 30 * 60 * 1000, // 30분
    dehydrateOptions: {
        shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => {
            // study 관련 쿼리만 persist
            return query.queryKey[0] === 'study'
        },
    },
}