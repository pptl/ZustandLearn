import type { MenuItem } from '../types';

/** 用 SVG data URL 當餐點圖片，不依賴外部網路 */
const img = (emoji: string, bg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="54%" font-size="96" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`,
  )}`;

export const seedMenu: MenuItem[] = [
  { id: 'm-001', name: '經典牛肉堡', description: '100% 牛肉排、切達起司、生菜番茄', price: 160, category: 'main', imageUrl: img('🍔', '#fde68a'), available: true },
  { id: 'm-002', name: '照燒雞腿堡', description: '去骨雞腿排佐日式照燒醬', price: 140, category: 'main', imageUrl: img('🍗', '#fed7aa'), available: true },
  { id: 'm-003', name: '番茄肉醬麵', description: '慢燉肉醬、帕瑪森起司', price: 180, category: 'main', imageUrl: img('🍝', '#fecaca'), available: true },
  { id: 'm-004', name: '鮭魚丼', description: '炙燒鮭魚、溫泉蛋、醋飯', price: 220, category: 'main', imageUrl: img('🍣', '#bfdbfe'), available: false },
  { id: 's-001', name: '黃金薯條', description: '外酥內軟，附番茄醬', price: 60, category: 'side', imageUrl: img('🍟', '#fef08a'), available: true },
  { id: 's-002', name: '雞塊（6 塊）', description: '附蜂蜜芥末醬', price: 75, category: 'side', imageUrl: img('🍤', '#fde68a'), available: true },
  { id: 's-003', name: '凱薩沙拉', description: '蘿蔓生菜、麵包丁、凱薩醬', price: 90, category: 'side', imageUrl: img('🥗', '#bbf7d0'), available: true },
  { id: 'd-001', name: '可樂', description: '中杯，冰塊正常', price: 40, category: 'drink', imageUrl: img('🥤', '#e9d5ff'), available: true },
  { id: 'd-002', name: '冰美式', description: '每日現磨咖啡豆', price: 70, category: 'drink', imageUrl: img('☕', '#e7e5e4'), available: true },
  { id: 'd-003', name: '珍珠奶茶', description: '黑糖珍珠、鮮奶', price: 65, category: 'drink', imageUrl: img('🧋', '#fed7aa'), available: false },
];
