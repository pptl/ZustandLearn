import { describe, expect, it } from 'vitest';
import { MAX_QTY, selectCartCount, useCartStore } from './cartStore';

// 在 React 外直接操作 store：getState() 取 action 與 state
const store = () => useCartStore.getState();

describe('useCartStore', () => {
  it('addItem：不存在則新增數量 1，已存在則 +1', () => {
    store().addItem('m-001');
    expect(store().items).toEqual({ 'm-001': 1 });
    store().addItem('m-001');
    expect(store().items).toEqual({ 'm-001': 2 });
  });

  it('addItem：數量上限為 10', () => {
    for (let i = 0; i < 15; i++) store().addItem('m-001');
    expect(store().items['m-001']).toBe(MAX_QTY);
  });

  it('setQuantity：減到 0 自動移除，超過上限被夾住', () => {
    store().addItem('m-001');
    store().setQuantity('m-001', 99);
    expect(store().items['m-001']).toBe(MAX_QTY);
    store().setQuantity('m-001', 0);
    expect(store().items).toEqual({});
  });

  it('每次更新都產生新的 items 物件（不可直接修改）', () => {
    store().addItem('m-001');
    const before = store().items;
    store().addItem('m-002');
    expect(store().items).not.toBe(before);
    expect(before).toEqual({ 'm-001': 1 });
  });

  it('removeItem 與 clear', () => {
    store().addItem('m-001');
    store().addItem('d-001');
    store().setNote('少冰');
    store().removeItem('m-001');
    expect(store().items).toEqual({ 'd-001': 1 });
    store().clear();
    expect(store().items).toEqual({});
    expect(store().note).toBe('');
  });

  it('setNote：最多 100 字', () => {
    store().setNote('a'.repeat(150));
    expect(store().note).toHaveLength(100);
  });

  it('selectCartCount 計算總件數', () => {
    store().addItem('m-001');
    store().addItem('m-001');
    store().addItem('d-001');
    expect(selectCartCount(store())).toBe(3);
  });

  it('action 參考永遠不變', () => {
    const addItem = store().addItem;
    store().addItem('m-001');
    expect(store().addItem).toBe(addItem);
  });
});
