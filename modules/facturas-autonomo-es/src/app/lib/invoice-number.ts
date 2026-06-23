/** Último nº ya emitido registrado (settings, historial o ambos). */
export function resolveLastInvoiceNumber(settingsLast: number, historyMax: number): number {
  return Math.max(settingsLast, historyMax, 0);
}

/** Siguiente nº sugerido a partir del último emitido. */
export function nextInvoiceNumberFromLast(last: number): number {
  return resolveLastInvoiceNumber(last, 0) + 1;
}
