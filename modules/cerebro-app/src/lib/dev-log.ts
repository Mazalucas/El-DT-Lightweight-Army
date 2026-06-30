/** Logs de diagnóstico solo en `vite dev` — prefijo uniforme para filtrar en consola. */
const PREFIX = '[cerebro-dev]';

export function devLog(area: string, message: string, data?: unknown): void {
  if (!import.meta.env.DEV) return;
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    console.log(`${PREFIX} ${ts} [${area}] ${message}`, data);
  } else {
    console.log(`${PREFIX} ${ts} [${area}] ${message}`);
  }
}

export function devWarn(area: string, message: string, data?: unknown): void {
  if (!import.meta.env.DEV) return;
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    console.warn(`${PREFIX} ${ts} [${area}] ${message}`, data);
  } else {
    console.warn(`${PREFIX} ${ts} [${area}] ${message}`);
  }
}
