import { useState } from 'react';
import { mockControls, type MockControls } from './controls';

type Flag = Exclude<keyof MockControls, 'delay'>;

const FLAGS: { key: Flag; label: string }[] = [
  { key: 'menuError', label: '菜單 API 回 500' },
  { key: 'orderError', label: '送出訂單回 500' },
  { key: 'soldOutOnSubmit', label: '下次送出時第一項售完（409）' },
];

/** 開發用：模擬後端錯誤的控制台，和應用程式本身的 state 管理無關 */
export function MockPanel() {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <div className="mock-panel">
      <button type="button" className="btn small" onClick={() => setOpen((o) => !o)}>
        🧪 Mock 控制台
      </button>
      {open && (
        <div className="mock-body">
          {FLAGS.map(({ key, label }) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={mockControls[key]}
                onChange={(e) => {
                  mockControls[key] = e.target.checked;
                  force((n) => n + 1);
                }}
              />
              {label}
            </label>
          ))}
          <label>
            延遲 {mockControls.delay}ms
            <input
              type="range"
              min={0}
              max={3000}
              step={100}
              value={mockControls.delay}
              onChange={(e) => {
                mockControls.delay = Number(e.target.value);
                force((n) => n + 1);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
