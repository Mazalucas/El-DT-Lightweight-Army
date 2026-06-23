const PREFILL_KEY = 'cerebro.assistant.prefill';

export function stashAssistantPrompt(prompt: string): void {
  try {
    sessionStorage.setItem(PREFILL_KEY, prompt);
  } catch {
    /* ignore */
  }
}

export function consumeAssistantPrefill(): string | null {
  try {
    const v = sessionStorage.getItem(PREFILL_KEY);
    if (v) sessionStorage.removeItem(PREFILL_KEY);
    return v;
  } catch {
    return null;
  }
}

export function parseAssistantQuery(): { prompt?: string } {
  const qs = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const prompt = qs.get('prompt')?.trim();
  return prompt ? { prompt: decodeURIComponent(prompt) } : {};
}

export function navigateToAssistant(opts?: { prompt?: string }): void {
  if (opts?.prompt) {
    stashAssistantPrompt(opts.prompt);
    location.hash = '#/assistant';
  } else {
    location.hash = '#/assistant';
  }
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
