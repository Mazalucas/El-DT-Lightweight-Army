import { useMatch } from 'react-router-dom';
import { Icon } from '../../ds.js';
import { useCerebroUi } from './CerebroProvider.js';
import { CerebroPanel } from './CerebroPanel.js';

export function CerebroShell() {
  const { panelOpen, setPanelOpen, expandedRoute } = useCerebroUi();
  const cerebroMatch = useMatch('/cerebro');
  const asistenteMatch = useMatch('/asistente');
  const onCerebroPage = Boolean(cerebroMatch ?? asistenteMatch);

  if (onCerebroPage || expandedRoute) return null;

  return (
    <div className="cerebro-shell-root">
      <button
        type="button"
        className={`cerebro-shell-trigger${panelOpen ? ' cerebro-shell-trigger--active' : ''}`}
        aria-expanded={panelOpen}
        aria-label="Abrir Cerebro"
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <Icon name="brain" />
      </button>

      <div className={`cerebro-shell-panel${panelOpen ? '' : ' cerebro-shell-panel--hidden'}`} hidden={!panelOpen}>
        <CerebroPanel compact />
      </div>
    </div>
  );
}
