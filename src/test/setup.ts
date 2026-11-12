import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { initialCartState, useCartStore } from '../features/cart/cartStore';
import { mockControls, resetMockControls } from '../mocks/controls';
import { db } from '../mocks/db';
import { server } from '../mocks/server';

// Node 的 fetch 不會把 '/api/menu' 這種相對路徑解析成 jsdom 的網址，這裡補上
const nodeFetch = globalThis.fetch;
globalThis.fetch = (input, init) =>
  nodeFetch(typeof input === 'string' && input.startsWith('/') ? new URL(input, location.origin) : input, init);

// sonner 會用到 matchMedia，jsdom 沒有
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

beforeEach(() => {
  // Zustand store 是模組層級單例，測試之間會共用 → 每個測試前重置
  // setState 預設是 merge，所以 action 會保留
  useCartStore.setState(initialCartState);
  resetMockControls();
  mockControls.delay = 0;
  db.reset();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
