import type { MenuItem, Order } from '../types';
import { seedMenu } from './data';

const ORDERS_KEY = 'mock-orders';

/** 假資料庫：菜單放記憶體；訂單放 sessionStorage，重新整理完成頁也查得到 */
export const db = {
  menu: structuredClone(seedMenu) as MenuItem[],

  getOrder(id: string): Order | undefined {
    return readOrders()[id];
  },
  saveOrder(order: Order) {
    const orders = readOrders();
    orders[order.id] = order;
    try {
      sessionStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch {
      memoryOrders = orders;
    }
  },
  reset() {
    db.menu = structuredClone(seedMenu);
    memoryOrders = {};
    try {
      sessionStorage.removeItem(ORDERS_KEY);
    } catch {
      /* ignore */
    }
  },
};

let memoryOrders: Record<string, Order> = {};

function readOrders(): Record<string, Order> {
  try {
    const raw = sessionStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : memoryOrders;
  } catch {
    return memoryOrders;
  }
}
