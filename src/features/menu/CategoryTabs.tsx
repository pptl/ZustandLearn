import type { Category } from '../../types';

export type CategoryFilter = Category | 'all';

const TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'main', label: '主餐' },
  { value: 'side', label: '點心' },
  { value: 'drink', label: '飲料' },
];

interface Props {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

export function CategoryTabs({ value, onChange }: Props) {
  return (
    <div className="tabs" role="tablist" aria-label="餐點分類">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={value === tab.value ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
