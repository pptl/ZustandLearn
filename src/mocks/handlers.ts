import { delay, http, HttpResponse } from 'msw';
import type { Order, OrderRequest } from '../types';
import { mockControls } from './controls';
import { db } from './db';

const error = (status: number, code: string, message: string, details?: unknown) =>
  HttpResponse.json({ code, message, details }, { status });

export const handlers = [
  http.get('/api/menu', async () => {
    await delay(mockControls.delay);
    if (mockControls.menuError) return error(500, 'SERVER_ERROR', '伺服器忙碌中，請稍後再試');
    return HttpResponse.json(db.menu);
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(mockControls.delay);
    const body = (await request.json()) as OrderRequest;

    if (mockControls.orderError) return error(500, 'SERVER_ERROR', '系統暫時無法接單，請稍後再試');
    if (!body.items?.length) return error(400, 'EMPTY_ORDER', '訂單沒有任何餐點');

    // 模擬「在你送出前，別人剛好買走最後一份」
    if (mockControls.soldOutOnSubmit) {
      mockControls.soldOutOnSubmit = false;
      const target = db.menu.find((m) => m.id === body.items[0].menuItemId);
      if (target) target.available = false;
    }

    const unavailable = body.items.filter((i) => !db.menu.find((m) => m.id === i.menuItemId)?.available);
    if (unavailable.length) {
      const names = unavailable.map((i) => db.menu.find((m) => m.id === i.menuItemId)?.name ?? i.menuItemId);
      return error(
        409,
        'ITEM_UNAVAILABLE',
        `${names.join('、')} 已售完，請移除後再送出`,
        unavailable.map((i) => ({ menuItemId: i.menuItemId })),
      );
    }

    const items = body.items.map(({ menuItemId, quantity }) => {
      const m = db.menu.find((x) => x.id === menuItemId)!;
      return { menuItemId, name: m.name, unitPrice: m.price, quantity, subtotal: m.price * quantity };
    });
    const order: Order = {
      id: `ord-${Date.now().toString(36)}`,
      items,
      note: body.note ?? '',
      total: items.reduce((s, i) => s + i.subtotal, 0),
      status: 'received',
      createdAt: new Date().toISOString(),
    };
    db.saveOrder(order);
    return HttpResponse.json(order, { status: 201 });
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    await delay(mockControls.delay);
    const order = db.getOrder(params.id as string);
    if (!order) return error(404, 'ORDER_NOT_FOUND', '查無此訂單');
    return HttpResponse.json(order);
  }),
];
