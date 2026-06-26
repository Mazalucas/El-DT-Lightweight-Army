import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isDevEmulatorMode, loginDev, loginWithGoogle } from '../../lib/firebase.js';
import { checkEmulatorsReady } from '../../lib/emulator-status.js';
import { useAuth } from '../auth.js';
import { Badge, Button, Icon, toast } from '../ds.js';

export default function Login() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const devMode = isDevEmulatorMode();
  const [emulators, setEmulators] = useState<{ ok: boolean; message?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (devMode) void checkEmulatorsReady().then(setEmulators);
  }, [devMode]);

  if (ready && user) return <Navigate to="/" replace />;

  async function handleLogin() {
    setBusy(true);
    try {
      if (devMode) {
        const check = await checkEmulatorsReady();
        if (!check.ok) {
          toast(check.message ?? 'Arrancá ./scripts/dev-cerebro-local.sh', 'error');
          return;
        }
        await loginDev();
      } else {
        await loginWithGoogle();
      }
      navigate('/', { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al iniciar sesión';
      toast(
        msg.includes('network-request-failed')
          ? 'Auth emulator no responde. Ejecutá: ./scripts/dev-cerebro-local.sh'
          : msg,
        'error',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="app-brand">
          <div className="app-brand-mark">
            <Icon name="brain" />
          </div>
          <span className="app-brand-text">Cerebro</span>
        </div>
        <h1>Tu segundo cerebro profesional</h1>
        <p className="login-panel-desc">Reuniones, contactos y más — en la nube.</p>
        {devMode ? (
          <p className="login-status muted">
            {emulators === null ? (
              'Comprobando emuladores…'
            ) : emulators.ok ? (
              <>
                <Badge tone="success">Emuladores OK</Badge> Listo para entrar
              </>
            ) : (
              <>
                <Badge tone="warn">Emuladores OFF</Badge> {emulators.message ?? ''}
              </>
            )}
          </p>
        ) : null}
        <div className="btn-row" style={{ flexDirection: 'column' }}>
          <Button
            block
            loading={busy}
            disabled={devMode && emulators !== null && !emulators.ok}
            onClick={() => void handleLogin()}
          >
            {devMode ? 'Entrar (dev local)' : 'Entrar con Google'}
          </Button>
        </div>
        {devMode ? (
          <p className="login-footnote">
            Dev local usa emuladores — <strong>no</strong> hace falta proyecto Firebase en la nube.
            Arrancá <code>./scripts/dev-cerebro-local.sh</code>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
