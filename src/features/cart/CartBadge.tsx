import { selectCartCount, useCartStore } from './cartStore';

export function CartBadge() {
  // selector 回傳 primitive：件數沒變就不重渲染
  const count = useCartStore(selectCartCount);

  return (
    <span className="badge-wrap" aria-label={`購物車 ${count} 件`}>
      🛒 購物車
      <span className="badge" data-testid="cart-badge">
        {count}
      </span>
    </span>
  );
}
