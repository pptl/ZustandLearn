export type Category = 'main' | 'side' | 'drink';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // TWD
  category: Category;
  imageUrl: string;
  available: boolean;
}

export interface OrderRequest {
  items: { menuItemId: string; quantity: number }[];
  note?: string;
}

export interface Order {
  id: string;
  items: { menuItemId: string; name: string; unitPrice: number; quantity: number; subtotal: number }[];
  note: string;
  total: number;
  status: 'received' | 'preparing' | 'ready';
  createdAt: string;
}
