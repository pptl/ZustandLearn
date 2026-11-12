import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useSubmitOrder } from '../../api/orders';
import { MAX_NOTE, MAX_QTY, useCartStore } from './cartStore';
import { useCartLines } from './useCartLines';

export function CartPanel() {
  const navigate = useNavigate();
  const { lines, total, hasUnavailable } = useCartLines();

  // 一次取多個欄位且回傳物件 → 必須包 useShallow，否則 v5 會無限重渲染
  const { note, setQuantity, removeItem, setNote, clear } = useCartStore(
    useShallow((s) => ({
      note: s.note,
      setQuantity: s.setQuantity,
      removeItem: s.removeItem,
      setNote: s.setNote,
      clear: s.clear,
    })),
  );

  const { mutate, isPending } = useSubmitOrder();
  const isEmpty = lines.length === 0;

  const submit = () =>
    mutate(
      { items: lines.map((l) => ({ menuItemId: l.id, quantity: l.quantity })), note },
      // 元件層的 onSuccess 只處理畫面：導頁
      { onSuccess: (order) => navigate(`/orders/${order.id}`) },
    );

  return (
    <aside className="cart" aria-label="購物車">
      <div className="cart-head">
        <h2>購物車</h2>
        <button type="button" className="btn link" onClick={clear} disabled={isEmpty || isPending}>
          清空
        </button>
      </div>

      {isEmpty ? (
        <p className="empty">購物車是空的，先挑幾樣吧！</p>
      ) : (
        <ul className="lines">
          {lines.map((line) => {
            const name = line.item?.name ?? line.id;
            return (
              <li key={line.id} className={line.unavailable ? 'line unavailable' : 'line'}>
                <div className="line-top">
                  <span className="line-name">{name}</span>
                  <span className="line-subtotal">NT$ {line.subtotal}</span>
                </div>
                {line.unavailable && <p className="line-warn">⚠ 無法購買（已售完），請移除</p>}
                <div className="line-actions">
                  <div className="qty" role="group" aria-label={`${name} 數量`}>
                    <button
                      type="button"
                      aria-label={`減少 ${name}`}
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span aria-live="polite" data-testid={`qty-${line.id}`}>
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`增加 ${name}`}
                      disabled={line.quantity >= MAX_QTY}
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button type="button" className="btn link danger" onClick={() => removeItem(line.id)}>
                    移除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <label className="note">
        <span>
          備註 <small>{note.length}/{MAX_NOTE}</small>
        </span>
        <textarea
          value={note}
          maxLength={MAX_NOTE}
          placeholder="例如：不要洋蔥、飲料少冰"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <div className="total">
        <span>總額</span>
        <strong data-testid="cart-total">NT$ {total}</strong>
      </div>

      <button
        type="button"
        className="btn primary block"
        disabled={isEmpty || hasUnavailable || isPending}
        onClick={submit}
      >
        {isPending ? '送出中…' : '送出訂單'}
      </button>
      {hasUnavailable && <p className="line-warn">購物車中有無法購買的餐點，移除後才能送出</p>}
    </aside>
  );
}
