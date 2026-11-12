export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { menuItemId?: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * fetch 遇到 4xx/5xx 不會拋錯，但 TanStack Query 只看 queryFn 有沒有 throw。
 * 這層包裝把 HTTP 錯誤轉成 ApiError，之後所有 query / mutation 的錯誤型別都一致。
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.code ?? 'UNKNOWN', body.message ?? '請求失敗', body.details);
  }
  return res.json() as Promise<T>;
}
