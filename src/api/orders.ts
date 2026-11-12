import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../features/cart/cartStore';
import type { Order, OrderRequest } from '../types';
import { ApiError, apiFetch } from './client';
import { menuKeys } from './menu';

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, id] as const,
};

export const useOrder = (id: string) =>
  useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiFetch<Order>(`/api/orders/${id}`),
    // 預設 staleTime 是 0：setQueryData 寫入的資料在完成頁掛載時已經「過期」，
    // 會立刻在背景再打一次 API。給 30 秒的新鮮期，送出後導頁才真的不必重打。
    staleTime: 30 * 1000,
  });

/**
 * hook 內的 callback 處理「資料」（快取、購物車），
 * 元件呼叫 mutate 時傳的 callback 只處理「畫面」（導頁）。
 */
export function useSubmitOrder() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clear);

  return useMutation({
    mutationFn: (body: OrderRequest) =>
      apiFetch<Order>('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (order) => {
      // 把回應直接放進訂單快取，完成頁不必再打一次 API
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      clearCart();
    },
    onError: (error) => {
      // 409 售完：讓菜單失效 → 重新載入 → useCartLines 重算並標示售完
      if (error instanceof ApiError && error.status === 409) {
        queryClient.invalidateQueries({ queryKey: menuKeys.all });
      }
    },
  });
}
