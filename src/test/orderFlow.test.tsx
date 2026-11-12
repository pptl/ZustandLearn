import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { createQueryClient } from '../api/queryClient';
import { useCartStore } from '../features/cart/cartStore';
import { mockControls } from '../mocks/controls';

function renderApp(route = '/') {
  // 每個測試建立新的 QueryClient 並關閉重試，避免快取互相污染、錯誤測試等太久
  const client: QueryClient = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { client, user: userEvent.setup() };
}

const cart = () => screen.getByRole('complementary', { name: '購物車' });

describe('點餐流程', () => {
  it('載入菜單 → 篩選 → 加入 → 送出 → 完成頁', async () => {
    const { user } = renderApp();

    expect(screen.getAllByTestId('menu-skeleton').length).toBeGreaterThan(0);
    await screen.findByRole('article', { name: '經典牛肉堡' });

    // 分類篩選
    await user.click(screen.getByRole('tab', { name: '飲料' }));
    expect(screen.queryByRole('article', { name: '經典牛肉堡' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: '可樂' })).toBeInTheDocument();

    // 售完餐點按鈕停用
    expect(within(screen.getByRole('article', { name: '珍珠奶茶' })).getByRole('button')).toBeDisabled();

    // 加入購物車
    await user.click(within(screen.getByRole('article', { name: '可樂' })).getByRole('button', { name: '加入' }));
    await user.click(within(screen.getByRole('article', { name: '可樂' })).getByRole('button', { name: '加入' }));
    await user.click(screen.getByRole('tab', { name: '主餐' }));
    await user.click(within(screen.getByRole('article', { name: '經典牛肉堡' })).getByRole('button', { name: '加入' }));

    expect(screen.getByTestId('cart-badge')).toHaveTextContent('3');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('NT$ 240');

    await user.type(within(cart()).getByRole('textbox'), '不要洋蔥');
    await user.click(within(cart()).getByRole('button', { name: '送出訂單' }));

    await screen.findByText('✅ 訂單已送出');
    expect(screen.getByTestId('order-total')).toHaveTextContent('NT$ 240');
    expect(screen.getByText('不要洋蔥')).toBeInTheDocument();
    expect(useCartStore.getState().items).toEqual({});
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('0');
  });

  it('購物車為空時「送出訂單」停用', async () => {
    renderApp();
    await screen.findByRole('article', { name: '經典牛肉堡' });
    expect(within(cart()).getByText('購物車是空的，先挑幾樣吧！')).toBeInTheDocument();
    expect(within(cart()).getByRole('button', { name: '送出訂單' })).toBeDisabled();
  });

  it('菜單載入失敗 → 顯示錯誤與重新載入', async () => {
    mockControls.menuError = true;
    const { user } = renderApp();
    await screen.findByText(/菜單載入失敗/);
    mockControls.menuError = false;
    await user.click(screen.getByRole('button', { name: '重新載入' }));
    await screen.findByRole('article', { name: '經典牛肉堡' });
  });

  it('送出 500 → 顯示後端訊息，購物車保留', async () => {
    const { user } = renderApp();
    await screen.findByRole('article', { name: '經典牛肉堡' });
    await user.click(within(screen.getByRole('article', { name: '經典牛肉堡' })).getByRole('button', { name: '加入' }));

    mockControls.orderError = true;
    await user.click(within(cart()).getByRole('button', { name: '送出訂單' }));
    await screen.findByText('系統暫時無法接單，請稍後再試');
    expect(useCartStore.getState().items).toEqual({ 'm-001': 1 });
  });

  it('送出 409 → 重新載入菜單，購物車標示無法購買，移除前不能送出', async () => {
    const { user } = renderApp();
    await screen.findByRole('article', { name: '經典牛肉堡' });
    await user.click(within(screen.getByRole('article', { name: '經典牛肉堡' })).getByRole('button', { name: '加入' }));
    await user.click(within(screen.getByRole('article', { name: '黃金薯條' })).getByRole('button', { name: '加入' }));

    mockControls.soldOutOnSubmit = true;
    await user.click(within(cart()).getByRole('button', { name: '送出訂單' }));

    await screen.findByText(/經典牛肉堡 已售完/);
    await within(cart()).findByText('⚠ 無法購買（已售完），請移除');
    expect(within(cart()).getByRole('button', { name: '送出訂單' })).toBeDisabled();
    expect(within(screen.getByRole('article', { name: '經典牛肉堡' })).getByRole('button')).toHaveTextContent('已售完');

    const line = within(cart()).getByText('經典牛肉堡').closest('li')!;
    await user.click(within(line as HTMLElement).getByRole('button', { name: '移除' }));
    await waitFor(() => expect(within(cart()).getByRole('button', { name: '送出訂單' })).toBeEnabled());
  });

  it('不存在的訂單 → 查無此訂單（4xx 不重試）', async () => {
    renderApp('/orders/not-exist');
    await screen.findByText('查無此訂單');
    expect(screen.getByRole('link', { name: '繼續點餐' })).toHaveAttribute('href', '/');
  });
});
