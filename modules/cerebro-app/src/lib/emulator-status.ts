/** Comprueba que los emuladores Firebase estén accesibles antes de login. */
export async function checkEmulatorsReady(): Promise<{ ok: boolean; auth: boolean; api: boolean; message?: string }> {
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-cerebro';
  const [authOk, apiOk] = await Promise.all([
    fetch('http://127.0.0.1:9099/', { mode: 'no-cors' })
      .then(() => true)
      .catch(() => false),
    fetch(`/api/health`)
      .then((r) => r.ok)
      .catch(() => false),
  ]);

  // no-cors always opaque — also try auth emulator identity endpoint
  let authReachable = authOk;
  if (!authReachable) {
    try {
      await fetch(
        `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:lookup?key=fake`,
        { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } },
      );
      authReachable = true;
    } catch {
      authReachable = false;
    }
  }

  const ok = authReachable && apiOk;
  if (ok) return { ok: true, auth: authReachable, api: apiOk };

  let message = 'Emuladores Firebase no detectados.';
  if (!authReachable) message += ' Auth (:9099) apagado.';
  if (!apiOk) message += ' API Functions apagada.';
  message += ' Ejecutá: ./scripts/dev-cerebro-local.sh';

  return { ok: false, auth: authReachable, api: apiOk, message };
}
