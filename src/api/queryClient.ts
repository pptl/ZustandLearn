import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from './client';

/** 4xx 是請求本身有問題，重試也沒用；5xx 或網路錯誤最多重試 2 次 */
export const shouldRetry = (failureCount: number, error: unknown) =>
  error instanceof ApiError && error.status < 500 ? false : failureCount < 2;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
    },
    // Redux 版用 middleware 統一跳錯誤提示；這裡改用 MutationCache 的全域 onError
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : '送出失敗，請稍後再試');
      },
    }),
  });
}

export const queryClient = createQueryClient();
