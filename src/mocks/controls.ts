/**
 * 模擬後端狀態的開關，方便手動或用 Playwright 觸發各種錯誤情境。
 * 只用於開發與測試，和應用程式的 state 管理無關。
 */
export interface MockControls {
  /** 菜單 API 回 500 */
  menuError: boolean;
  /** 送出訂單回 500 */
  orderError: boolean;
  /** 送出訂單時，讓購物車中第一個餐點「剛好售完」→ 回 409 */
  soldOutOnSubmit: boolean;
  /** 每個請求的延遲（毫秒），讓載入狀態看得到 */
  delay: number;
}

export const mockControls: MockControls = {
  menuError: false,
  orderError: false,
  soldOutOnSubmit: false,
  delay: 600,
};

export function resetMockControls() {
  Object.assign(mockControls, { menuError: false, orderError: false, soldOutOnSubmit: false, delay: 600 });
}
