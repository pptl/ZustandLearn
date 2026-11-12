import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { useOrder } from '../../api/orders';
import type { Order } from '../../types';

const STATUS_LABEL: Record<Order['status'], string> = {
  received: '已接單',
  preparing: '製作中',
  ready: '可取餐',
};

export function OrderCompletePage() {
  const { id = '' } = useParams();
  // 從送出成功導過來時，快取已被 setQueryData 填好 → 不會出現載入狀態
  const { data: order, isPending, isError, error } = useOrder(id);

  const backLink = (
    <Link to="/" className="btn primary">
      繼續點餐
    </Link>
  );

  if (isPending) {
    return (
      <div className="order-page" aria-busy="true">
        <p>訂單載入中…</p>
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="order-page">
        <div className="error-box" role="alert">
          <h2>{notFound ? '查無此訂單' : '訂單載入失敗'}</h2>
          {!notFound && <p>{error.message}</p>}
        </div>
        {backLink}
      </div>
    );
  }

  return (
    <div className="order-page">
      <h2>✅ 訂單已送出</h2>
      <dl className="order-meta">
        <dt>訂單編號</dt>
        <dd data-testid="order-id">{order.id}</dd>
        <dt>狀態</dt>
        <dd>
          <span className="status">{STATUS_LABEL[order.status]}</span>
        </dd>
        <dt>建立時間</dt>
        <dd>{new Date(order.createdAt).toLocaleString('zh-TW')}</dd>
        <dt>備註</dt>
        <dd>{order.note || '（無）'}</dd>
      </dl>

      <table className="order-table">
        <thead>
          <tr>
            <th>餐點</th>
            <th>單價</th>
            <th>數量</th>
            <th>小計</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.menuItemId}>
              <td>{i.name}</td>
              <td>NT$ {i.unitPrice}</td>
              <td>{i.quantity}</td>
              <td>NT$ {i.subtotal}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>總額</td>
            <td data-testid="order-total">NT$ {order.total}</td>
          </tr>
        </tfoot>
      </table>

      {backLink}
    </div>
  );
}
