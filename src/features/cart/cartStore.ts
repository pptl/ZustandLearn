import { create } from 'zustand';

export const MAX_QTY = 10;
export const MAX_NOTE = 100;

interface CartState {
  items: Record<string, number>; // { [menuItemId]: quantity }
  note: string;
}

interface CartActions {
  addItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  setNote: (note: string) => void;
  clear: () => void;
}

export type CartStore = CartState & CartActions;

export const initialCartState: CartState = { items: {}, note: '' };

const omit = (items: Record<string, number>, id: string) => {
  const { [id]: _removed, ...rest } = items;
  return rest;
};

/**
 * 注意：set 只會「淺層合併第一層」。
 * items 是巢狀物件，必須自己展開產生新物件；直接改 s.items 會因參考沒變而不重渲染。
 */
export const useCartStore = create<CartStore>()((set) => ({
  ...initialCartState,
  addItem: (id) =>
    set((s) => ({ items: { ...s.items, [id]: Math.min((s.items[id] ?? 0) + 1, MAX_QTY) } })),
  setQuantity: (id, quantity) =>
    set((s) => ({
      items: quantity <= 0 ? omit(s.items, id) : { ...s.items, [id]: Math.min(quantity, MAX_QTY) },
    })),
  removeItem: (id) => set((s) => ({ items: omit(s.items, id) })),
  setNote: (note) => set({ note: note.slice(0, MAX_NOTE) }),
  clear: () => set(initialCartState),
}));

/** 衍生資料：件數。回傳 primitive，件數沒變就不重渲染 */
export const selectCartCount = (s: CartStore) =>
  Object.values(s.items).reduce((a, b) => a + b, 0);
