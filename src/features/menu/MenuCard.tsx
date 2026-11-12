import { memo } from 'react';
import type { MenuItem } from '../../types';
import { useCartStore } from '../cart/cartStore';

interface Props {
  item: MenuItem;
}

/**
 * 只選 action：action 的參考永遠不變，所以購物車怎麼變，這張卡片都不會重渲染。
 * （可用 React DevTools Profiler 驗證）
 */
export const MenuCard = memo(function MenuCard({ item }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <article className={item.available ? 'card' : 'card soldout'} aria-label={item.name}>
      <img src={item.imageUrl} alt={item.name} className="card-img" />
      <div className="card-body">
        <h3>{item.name}</h3>
        <p className="desc">{item.description}</p>
        <div className="card-footer">
          <span className="price">NT$ {item.price}</span>
          {item.available ? (
            <button type="button" className="btn primary" onClick={() => addItem(item.id)}>
              加入
            </button>
          ) : (
            <button type="button" className="btn" disabled>
              已售完
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
