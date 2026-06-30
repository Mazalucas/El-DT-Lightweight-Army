import type { QueryClient } from '@tanstack/react-query';
import { qk } from '../../hooks.js';

let boardTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
let dashboardTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

export function scheduleBoardRefetch(client: QueryClient, orgId?: string, delayMs = 400): void {
  if (boardTimer) globalThis.clearTimeout(boardTimer);
  boardTimer = globalThis.setTimeout(() => {
    if (orgId) void client.invalidateQueries({ queryKey: qk.orgBoard(orgId) });
    else void client.invalidateQueries({ queryKey: qk.board });
    boardTimer = null;
  }, delayMs);
}

export function scheduleDashboardRefetch(client: QueryClient, delayMs = 400): void {
  if (dashboardTimer) globalThis.clearTimeout(dashboardTimer);
  dashboardTimer = globalThis.setTimeout(() => {
    void client.invalidateQueries({ queryKey: qk.dashboard });
    dashboardTimer = null;
  }, delayMs);
}

export function scheduleEntityViewsRefetch(client: QueryClient, orgId?: string): void {
  scheduleBoardRefetch(client, orgId);
  scheduleDashboardRefetch(client);
}
