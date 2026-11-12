import { useMemo, useState } from 'react';
import { useMenu } from '../../api/menu';
import { CartPanel } from '../cart/CartPanel';
import { CategoryTabs, type CategoryFilter } from './CategoryTabs';
import { MenuCard } from './MenuCard';

export function MenuPage() {
  // 只有菜單頁用到的 client state → 元件內 useState 就好，不必放進 Zustand
  const [category, setCategory] = useState<CategoryFilter>('all');
  const { data: menu, isPending, isError, error, refetch, isFetching } = useMenu();

  // 分類篩選在前端進行，切換不重新發出請求
  const visible = useMemo(
    () => (category === 'all' ? menu : menu?.filter((m) => m.category === category)) ?? [],
    [menu, category],
  );

  return (
    <div className="menu-layout">
      <section className="menu-main">
        <div className="menu-toolbar">
          <CategoryTabs value={category} onChange={setCategory} />
          {/* 背景重新載入：isFetching 為 true 但 data 仍在，繼續顯示舊菜單 */}
          {isFetching && !isPending && <span className="hint">更新菜單中…</span>}
        </div>

        {isPending ? (
          <div className="grid" aria-busy="true" aria-label="菜單載入中">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="card skeleton" data-testid="menu-skeleton">
                <div className="sk-img" />
                <div className="card-body">
                  <div className="sk-line w60" />
                  <div className="sk-line w90" />
                  <div className="sk-line w40" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="error-box" role="alert">
            <p>菜單載入失敗：{error.message}</p>
            <button type="button" className="btn primary" onClick={() => refetch()}>
              重新載入
            </button>
          </div>
        ) : (
          <div className="grid">
            {visible.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <CartPanel />
    </div>
  );
}
