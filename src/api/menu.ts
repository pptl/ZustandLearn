import { queryOptions, useQuery } from '@tanstack/react-query';
import type { MenuItem } from '../types';
import { apiFetch } from './client';

export const menuKeys = { all: ['menu'] as const };

/** 同一組設定可用在 useQuery、prefetchQuery、ensureQueryData，型別自動推導 */
export const menuQueryOptions = queryOptions({
  queryKey: menuKeys.all,
  queryFn: () => apiFetch<MenuItem[]>('/api/menu'),
  staleTime: 5 * 60 * 1000, // 5 分鐘內視為 fresh，回到菜單頁直接用快取
});

export const useMenu = () => useQuery(menuQueryOptions);
