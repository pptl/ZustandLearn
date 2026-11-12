import { useMemo } from 'react';
import { useMenu } from '../../api/menu';
import type { MenuItem } from '../../types';
import { useCartStore } from './cartStore';

// 用模組層級常數當預設值；寫 `= []` 每次渲染都是新陣列，useMemo 會一直重算
const EMPTY_MENU: MenuItem[] = [];

export interface CartLine {
  id: string;
  quantity: number;
  item: MenuItem | undefined;
  subtotal: number;
  unavailable: boolean;
}

/**
 * 組合 client state（Zustand 購物車）與 server state（菜單快取）。
 * 小計、總額不存進 store，永遠依菜單最新價格即時計算。
 */
export function useCartLines() {
  const items = useCartStore((s) => s.items);
  const { data: menu = EMPTY_MENU } = useMenu(); // 同一個 query key，不會重複請求

  return useMemo(() => {
    const lines: CartLine[] = Object.entries(items).map(([id, quantity]) => {
      const item = menu.find((m) => m.id === id);
      return { id, quantity, item, subtotal: (item?.price ?? 0) * quantity, unavailable: !item?.available };
    });
    return {
      lines,
      total: lines.reduce((sum, l) => sum + l.subtotal, 0),
      hasUnavailable: lines.some((l) => l.unavailable),
    };
  }, [items, menu]);
}
