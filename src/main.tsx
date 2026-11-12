import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { queryClient } from './api/queryClient';
import { mockControls } from './mocks/controls';
import { db } from './mocks/db';
import { MockPanel } from './mocks/MockPanel';
import './styles.css';

async function enableMocking() {
  // 本專案沒有真實後端，所有環境都用 MSW
  const { worker } = await import('./mocks/browser');
  // 暴露給 DevTools console / Playwright，方便觸發錯誤情境
  Object.assign(window, { __mock: { controls: mockControls, db } });
  return worker.start({ onUnhandledRequest: 'bypass', quiet: true });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {/* 只需要 QueryClientProvider；Zustand store 是模組層級的 hook，不需要 Provider */}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
          {import.meta.env.DEV && <MockPanel />}
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </StrictMode>,
  );
});
