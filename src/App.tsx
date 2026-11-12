import { Link, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CartBadge } from './features/cart/CartBadge';
import { MenuPage } from './features/menu/MenuPage';
import { OrderCompletePage } from './features/order/OrderCompletePage';

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          🍽️ 簡易點餐
        </Link>
        <CartBadge />
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/orders/:id" element={<OrderCompletePage />} />
        </Routes>
      </main>

      <Toaster position="top-center" richColors />
    </div>
  );
}
