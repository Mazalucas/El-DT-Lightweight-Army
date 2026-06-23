import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { Button, toast } from '../ds.js';
import { useInvalidateViews, useSyncProgress } from '../hooks.js';

/**
 * Botón único de sincronización (pipeline completo) con progreso inline.
 * Mientras corre, muestra fase y avance; al terminar invalida las vistas.
 */
export function SyncButton({ running: serverRunning }: { running?: boolean }) {
  const [active, setActive] = useState(Boolean(serverRunning));
  const invalidate = useInvalidateViews();
  const progress = useSyncProgress(active);
  const wasRunning = useRef(false);

  useEffect(() => {
    if (serverRunning) setActive(true);
  }, [serverRunning]);

  const running = active && (progress.data ? progress.data.running === true : true);

  useEffect(() => {
    if (running) {
      wasRunning.current = true;
    } else if (wasRunning.current) {
      wasRunning.current = false;
      setActive(false);
      invalidate();
      const error = progress.data?.error;
      toast(error ? `Sync con errores: ${error}` : 'Sincronización completada', error ? 'error' : 'info');
    }
  }, [running, invalidate, progress.data?.error]);

  async function start() {
    try {
      setActive(true);
      await api.syncPipeline();
    } catch (e) {
      setActive(false);
      toast(e instanceof Error ? e.message : 'Error al iniciar sync', 'error');
    }
  }

  if (running) {
    const p = progress.data;
    const label = p && p.total > 0 ? `${p.phase} ${p.current}/${p.total}` : 'Sincronizando…';
    return (
      <Button variant="secondary" size="sm" loading>
        {label}
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => void start()}>
      Sincronizar ahora
    </Button>
  );
}
