# PRD：簡易點餐系統（React + TanStack Query + Zustand）

Nov 12, 2026 · @Alen

## 產品概述

本系統的畫面、功能與 mock API 和 PRD：簡易點餐系統（React + Redux Toolkit + RTK Query） 完全相同，只替換內部的狀態管理：server state 交給 TanStack Query，client state（購物車）交給 Zustand。

目的是用同一份需求做對照練習，實際體會「不用 Redux」時哪些東西變簡單、哪些要自己補上，並能在面試中說出兩種架構的取捨。

**範圍內**

- 菜單瀏覽（含分類篩選）
- 購物車：加入、調整數量、移除、即時計算總額
- 送出訂單、顯示訂單完成頁
- 載入中、錯誤、售完等狀態處理

**範圍外（非目標）**

- 會員登入、付款、優惠券
- 後台管理、庫存管理
- 真實後端與資料庫
- 多語系、手機版版面（只做桌面版）

## 使用者流程與功能需求

畫面只有兩頁：菜單頁 `/`（含購物車側欄）和訂單完成頁 `/orders/:id`。

1. 進入菜單頁，載入菜單。
2. 點選分類標籤（主餐、點心、飲料）篩選餐點。
3. 點擊「加入」，購物車和徽章即時更新。
4. 在購物車調整數量、移除餐點、填寫備註。
5. 點擊「送出訂單」。
   - 成功：清空購物車，導向訂單完成頁。
   - 失敗：跳出錯誤提示，購物車保留。
6. 在訂單完成頁查看訂單，可回到菜單繼續點餐。

### F1 菜單頁

- [ ] 進入頁面時取得菜單，載入中顯示骨架畫面
- [ ] 餐點卡片顯示名稱、描述、價格、圖片
- [ ] 分類篩選在前端進行，切換不重新發出請求
- [ ] 售完餐點顯示「已售完」，加入按鈕停用
- [ ] 載入失敗顯示錯誤訊息與「重新載入」按鈕
- [ ] 5 分鐘內回到菜單頁，直接使用快取，不重新請求

### F2 購物車

- [ ] 加入時不存在則新增（數量 1），已存在則 +1
- [ ] 數量範圍 1～10，減到 0 自動移除
- [ ] 可移除單一餐點、可清空整個購物車
- [ ] 小計與總額依菜單最新價格即時計算，不存在購物車裡
- [ ] 徽章顯示餐點總件數
- [ ] 購物車為空時顯示提示，「送出訂單」停用
- [ ] 備註最多 100 字

### F3 送出訂單

- [ ] 請求中按鈕停用並顯示「送出中…」，防止重複送出
- [ ] 成功：清空購物車與備註，導向 `/orders/:id`
- [ ] 失敗：全域錯誤提示顯示後端的 `message`，購物車保留
- [ ] 售完（409）：重新載入菜單，購物車中該餐點標示為無法購買，移除前不能送出

### F4 訂單完成頁

- [ ] 依網址的 id 取得訂單
- [ ] 顯示編號、狀態、明細、備註、總額、建立時間
- [ ] 訂單不存在（404）顯示「查無此訂單」
- [ ] 「繼續點餐」回到菜單頁

## 資料模型與 Mock API

型別、API 路徑、回應格式和 MSW handler 都與 Redux 版共用，唯一新增的是一個 fetch 包裝。

| 方法 | 路徑 | 成功回應 | 錯誤回應 |
| --- | --- | --- | --- |
| GET | `/api/menu` | 200，`MenuItem[]` | 500 `SERVER_ERROR` |
| POST | `/api/orders` | 201，`Order` | 400 `EMPTY_ORDER`、409 `ITEM_UNAVAILABLE`、500 `SERVER_ERROR` |
| GET | `/api/orders/:id` | 200，`Order` | 404 `ORDER_NOT_FOUND` |

```ts
// src/types.ts（與 Redux 版相同）
export type Category = 'main' | 'side' | 'drink';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;       // TWD
  category: Category;
  imageUrl: string;
  available: boolean;
}

export interface OrderRequest {
  items: { menuItemId: string; quantity: number }[];
  note?: string;
}

export interface Order {
  id: string;
  items: { menuItemId: string; name: string; unitPrice: number; quantity: number; subtotal: number }[];
  note: string;
  total: number;
  status: 'received' | 'preparing' | 'ready';
  createdAt: string;
}
```

### fetch 包裝：讓 HTTP 錯誤變成例外

RTK Query 的 `fetchBaseQuery` 會自動把 4xx/5xx 轉成錯誤；TanStack Query 只看 `queryFn` 有沒有拋出例外，而 `fetch` 遇到 404 不會拋錯。所以要自己包一層：

```ts
// src/api/client.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { menuItemId?: string }[],
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.code ?? 'UNKNOWN', body.message ?? '請求失敗', body.details);
  }
  return res.json() as Promise<T>;
}
```

之後所有 query 與 mutation 的錯誤型別都是 `ApiError`，可以依 `status` 決定要不要重試、要不要重新載入菜單。

## 技術架構

狀態分成兩個互不依賴的地方：QueryClient 快取管 server state，Zustand store 管購物車；兩者在元件或自訂 hook 裡組合。

| 層面 | 選用 |
| --- | --- |
| 建置工具 | Vite + React 18 + TypeScript |
| server state | `@tanstack/react-query` v5 + `@tanstack/react-query-devtools` |
| client state | `zustand` v5 |
| 路由 | React Router（`/`、`/orders/:id`） |
| Mock API | MSW 2.x |
| 測試 | Vitest + React Testing Library（搭配 MSW） |

### State 分工

| 資料 | 類型 | 存放位置 |
| --- | --- | --- |
| 菜單 | server state | QueryClient，key `['menu']` |
| 訂單 | server state | QueryClient，key `['orders', id]` |
| 購物車餐點與數量、備註 | client state，跨元件共享 | `useCartStore` |
| 目前選取的分類標籤 | client state，只有菜單頁使用 | 元件內 `useState` |
| 購物車件數 | 衍生資料 | Zustand selector |
| 購物車明細、總額 | 衍生資料，需要菜單價格 | `useCartLines` hook（組合兩邊） |

### 檔案結構

```text
src/
  api/
    client.ts             ← apiFetch、ApiError
    queryClient.ts        ← QueryClient 預設值、全域錯誤提示
    menu.ts               ← menuKeys、menuQueryOptions、useMenu
    orders.ts             ← orderKeys、useOrder、useSubmitOrder
  features/
    menu/
      MenuPage.tsx
      MenuCard.tsx
      CategoryTabs.tsx
    cart/
      cartStore.ts        ← useCartStore
      useCartLines.ts     ← 組合購物車與菜單
      CartPanel.tsx
      CartBadge.tsx
    order/
      OrderCompletePage.tsx
  mocks/                  ← 與 Redux 版相同
  types.ts
  main.tsx                ← 啟動 MSW，render <QueryClientProvider>
```

和 Redux 版相比，沒有 `store.ts`、沒有 middleware，也不需要用 Provider 包住購物車：Zustand 的 store 是模組層級的 hook，直接 import 就能用。

## TanStack Query 設計

每個 API 封裝成一個自訂 hook，元件不直接寫 `useQuery`；query key 用 factory 集中管理。

| Hook | 類型 | Query key | 設定 |
| --- | --- | --- | --- |
| `useMenu` | query | `['menu']` | `staleTime` 5 分鐘 |
| `useOrder(id)` | query | `['orders', id]` | 預設值 |
| `useSubmitOrder` | mutation | 無 | 成功：寫入訂單快取、清空購物車；409：讓 `['menu']` 失效 |

### QueryClient 預設值與全域錯誤提示

Redux 版用 middleware 統一跳錯誤提示；這裡改用 `MutationCache` 的全域 `onError`，效果相同。

```ts
// src/api/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx 是請求本身有問題，重試也沒用；5xx 或網路錯誤最多重試 2 次
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : '送出失敗，請稍後再試');
    },
  }),
});
```

### Query key factory 與 queries

```ts
// src/api/menu.ts
export const menuKeys = { all: ['menu'] as const };

export const menuQueryOptions = queryOptions({
  queryKey: menuKeys.all,
  queryFn: () => apiFetch<MenuItem[]>('/api/menu'),
  staleTime: 5 * 60 * 1000,
});

export const useMenu = () => useQuery(menuQueryOptions);

// src/api/orders.ts
export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, id] as const,
};

export const useOrder = (id: string) =>
  useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiFetch<Order>(`/api/orders/${id}`),
  });
```

`queryOptions` 讓同一組設定可以重複使用：元件裡 `useQuery(menuQueryOptions)`、預抓時 `queryClient.prefetchQuery(menuQueryOptions)`、讀快取時 `queryClient.getQueryData(menuKeys.all)`，型別都會自動推導。

### 送出訂單的 mutation

```ts
// src/api/orders.ts
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
      if (error instanceof ApiError && error.status === 409) {
        queryClient.invalidateQueries({ queryKey: menuKeys.all });
      }
    },
  });
}

// CartPanel.tsx
const { mutate, isPending } = useSubmitOrder();
const submit = () =>
  mutate({ items: toOrderItems(items), note }, {
    onSuccess: (order) => navigate(`/orders/${order.id}`),
  });
```

hook 內的 `onSuccess` 處理「資料」（快取、購物車），元件內的 `onSuccess` 只處理「畫面」（導頁）。v5 的 mutation 載入狀態叫 `isPending`。

## Zustand 設計

購物車是一個 store，state 和修改它的函式（action）放在一起；元件用 selector 只訂閱需要的部分。

### Cart store

```ts
// src/features/cart/cartStore.ts
const MAX_QTY = 10;

interface CartStore {
  items: Record<string, number>;   // { [menuItemId]: quantity }
  note: string;
  addItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  setNote: (note: string) => void;
  clear: () => void;
}

const initialState = { items: {}, note: '' };

const omit = (items: Record<string, number>, id: string) => {
  const { [id]: _removed, ...rest } = items;
  return rest;
};

export const useCartStore = create<CartStore>()((set) => ({
  ...initialState,
  addItem: (id) =>
    set((s) => ({ items: { ...s.items, [id]: Math.min((s.items[id] ?? 0) + 1, MAX_QTY) } })),
  setQuantity: (id, quantity) =>
    set((s) => ({
      items: quantity <= 0 ? omit(s.items, id) : { ...s.items, [id]: Math.min(quantity, MAX_QTY) },
    })),
  removeItem: (id) => set((s) => ({ items: omit(s.items, id) })),
  setNote: (note) => set({ note: note.slice(0, 100) }),
  clear: () => set(initialState),
}));
```

兩個要注意的地方：

- `set` 只會**淺層合併第一層**，巢狀的 `items` 要自己展開、產生新物件。Zustand 一樣靠參考比較判斷變化，直接修改 `s.items` 會讓畫面不更新。巢狀很深時可以加上 `immer` middleware。
- action 是 store 的一部分，參考永遠不變，只選 action 的元件不會因購物車變動而重渲染。

### Selector 寫法

```ts
// MenuCard：只選 action，購物車變動時不重渲染
const addItem = useCartStore((s) => s.addItem);

// CartBadge：回傳 primitive，件數沒變就不重渲染
const count = useCartStore((s) => Object.values(s.items).reduce((a, b) => a + b, 0));

// 一次取多個欄位：必須用 useShallow
const { items, note } = useCartStore(useShallow((s) => ({ items: s.items, note: s.note })));
```

Zustand v5 的 selector 若每次回傳新物件或新陣列，會造成無限重渲染迴圈。回傳物件時一律包 `useShallow`，或拆成多個 selector。

### 組合 server state 與 client state

Redux 版兩種 state 在同一個 store，用一個 `createSelector` 就能組合。這裡它們在不同地方，改用自訂 hook 加 `useMemo`：

```ts
// src/features/cart/useCartLines.ts
const EMPTY_MENU: MenuItem[] = [];

export function useCartLines() {
  const items = useCartStore((s) => s.items);
  const { data: menu = EMPTY_MENU } = useMenu();   // 同一個 query key，不會重複請求

  return useMemo(() => {
    const lines = Object.entries(items).map(([id, quantity]) => {
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
```

預設值用模組層級的 `EMPTY_MENU`，不寫 `= []`：後者每次渲染都產生新陣列，`useMemo` 會在菜單載入前不斷重算。

Zustand store 也能在 React 外使用，例如 `useCartStore.getState().clear()`，這點和 Redux 的 `store.dispatch` 一樣。

## 資料流

購物車與 server 資料走兩條互不相干的路，唯一的交會點是送出成功後清空購物車。

&#91;embedded content: 資料流 · Zustand store 與 QueryClient 各自獨立\]

**載入菜單**

1. `MenuPage` 掛載，`useMenu()` 在 QueryClient 建立 `['menu']` 的 observer。
2. 快取沒有資料 → `isPending: true` → 呼叫 `apiFetch('/api/menu')`。
3. 回應後寫入快取，QueryClient 通知所有 `['menu']` 的 observer → `MenuPage` 重渲染。
4. 5 分鐘內再次掛載，資料仍是 fresh，直接使用快取。

**加入購物車**

1. `MenuCard` 呼叫 `addItem('m-001')`，沒有 action 物件、沒有 middleware。
2. `set` 產生新的 `items`，Zustand 通知所有訂閱者。
3. 各元件的 selector 重新執行並比較：`CartBadge` 的件數變了 → 重渲染；`MenuCard` 只選 `addItem` → 不重渲染。

**送出訂單**

1. `mutate({ items, note })` → `isPending: true` → 按鈕停用。
2. POST `/api/orders`。
3. 成功：hook 的 `onSuccess` 先 `setQueryData(['orders', id])`、再 `clear()` 購物車；元件的 `onSuccess` 導向完成頁，完成頁直接從快取顯示。
4. 失敗：`MutationCache.onError` 跳出提示；若為 409，hook 的 `onError` 讓 `['menu']` 失效 → 重新載入菜單 → `useCartLines` 重算，標示售完餐點。

## 邊界情況與非功能需求

預期行為和 Redux 版一致，只有實現方式不同。

| 情況 | 預期行為 | 實現方式 |
| --- | --- | --- |
| 菜單第一次載入 | 顯示骨架畫面 | `isPending` |
| 菜單背景重新載入 | 繼續顯示舊菜單 | `isFetching` 為 true 但 `data` 仍在 |
| 菜單載入失敗 | 錯誤訊息 + 重新載入按鈕 | `isError` + `refetch()`；5xx 先自動重試 2 次 |
| 連點「送出訂單」 | 只送出一次 | mutation 的 `isPending` 停用按鈕 |
| 送出時餐點已售完（409） | 提示訊息；菜單重新載入；購物車標示無法購買 | `MutationCache.onError` 提示 → `invalidateQueries(['menu'])` → `useCartLines` 重算 |
| 菜單價格改變 | 購物車總額自動更新 | `useCartLines` 的 `useMemo` 依賴菜單資料 |
| 重新整理頁面 | 購物車清空（本版可接受） | 視為延伸練習 |
| 開啟不存在的訂單網址 | 顯示「查無此訂單」 | `ApiError.status === 404`，且 4xx 不重試 |
| 從送出成功導向完成頁 | 立即顯示，不出現載入狀態 | `onSuccess` 先 `setQueryData` |

**效能要求**

- 加入餐點時菜單列表不重新渲染：`MenuCard` 只選 `addItem`，用 React DevTools Profiler 驗證。
- Zustand selector 不回傳未包 `useShallow` 的新物件。
- 開發模式開啟 React Query Devtools，可以看到每個 query 的狀態與快取。

**可用性**

- 按鈕使用 `<button>`，數量調整可用鍵盤操作。
- 只支援桌面瀏覽器，最小寬度 1024px。

## 與 Redux 版本對照

同一個需求，這一版程式碼較少、概念較少，代價是兩種 state 分在不同地方，組合與全域反應要自己接線。

| 需求 | Redux 版 | 本版 |
| --- | --- | --- |
| 建立狀態容器 | `configureStore` + `<Provider>` | `QueryClientProvider`；Zustand 不需要 Provider |
| 定義 API | `createApi` 集中定義，hooks 自動產生 | 每個 API 一個自訂 hook + query key factory |
| HTTP 錯誤轉例外 | `fetchBaseQuery` 自動處理 | 自寫 `apiFetch` |
| 快取新鮮度 | `keepUnusedDataFor`，預設信任快取 | `staleTime`，預設立即過期 |
| 自動重試 | 預設不重試 | 預設 3 次，本版改為 4xx 不重試 |
| 409 時重新載入菜單 | `invalidatesTags` 宣告式 | `onError` 內手動 `invalidateQueries` |
| 送出成功清空購物車 | `cartSlice` 的 `extraReducers` 回應 fulfilled action | mutation 的 `onSuccess` 呼叫 `clear()` |
| 全域錯誤提示 | 自訂 middleware | `MutationCache` 的 `onError` |
| 購物車更新邏輯 | reducer + Immer，可直接「修改」 | `set` 內手動展開物件 |
| 組合菜單與購物車 | 一個 `createSelector` | 自訂 hook + `useMemo` |
| 精準訂閱 | `useSelector` | Zustand selector；回傳物件要 `useShallow` |
| 除錯工具 | Redux DevTools：action 紀錄、time-travel | React Query Devtools；購物車可加 `devtools` middleware |

**面試可以這樣說**：兩版的差別不在能不能做到，而在「誰負責接線」。Redux 版用 action 當共同語言，任何 slice 都能宣告式地回應 API 結果；本版把這些連動寫在 mutation 的 callback 裡，小專案更直觀，但反應同一件事的模組一多，callback 就會變成集中的耦合點。

## 實作里程碑與延伸練習

依序完成 5 個里程碑；若已完成 Redux 版，mock 與畫面元件可以直接沿用。

1. **環境與 mock**：專案初始化、MSW、`apiFetch` 與 `ApiError`。
2. **QueryClient 與菜單**：`queryClient.ts`、`useMenu`、菜單頁；在 React Query Devtools 看得到 `['menu']` 的狀態變化。
3. **購物車**：`useCartStore`、`useCartLines`、購物車側欄與徽章；用 Profiler 確認加入餐點時菜單不重新渲染。
4. **送出訂單**：`useSubmitOrder`、全域錯誤提示、訂單完成頁；覆蓋 409 售完與 500 兩種失敗。
5. **測試**：`useCartStore` 的 action 單元測試（每個測試前重置 store）；用 RTL + MSW 測試完整點餐流程，每個測試建立新的 QueryClient 並關閉重試。

### 延伸練習

- [ ] 用 Zustand 的 `persist` middleware 把購物車存到 localStorage，重新整理後還原
- [ ] 改用 `useSuspenseQuery` + `<Suspense>` + Error Boundary 處理菜單載入與錯誤
- [ ] 在路由 loader 中用 `queryClient.ensureQueryData(menuQueryOptions)` 預抓菜單
- [ ] 訂單完成頁加上 `refetchInterval`，每 5 秒更新狀態，`ready` 後停止
- [ ] 加上離線支援：離線時送出的訂單暫停，連線後自動送出（`setMutationDefaults` + 持久化）
- [ ] 購物車加上 `immer` 與 `devtools` middleware，比較和 Redux 版的開發體驗
