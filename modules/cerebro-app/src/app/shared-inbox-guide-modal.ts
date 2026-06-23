import { APPS_SCRIPT_SOURCE } from './profesional-setup.js';
import { toast } from '../lib/ui.js';
import { openModal } from '../ui/modal.js';
import { btnRow, button } from '../ui/primitives.js';

export function openSharedInboxGuideModal(): void {
  const body = document.createElement('div');
  body.className = 'shared-inbox-modal-body';

  const intro = document.createElement('p');
  intro.className = 'muted';
  intro.textContent =
    'Si recibís Notas de Gemini que no están en tus carpetas de Meet Recordings, creá una carpeta inbox en Drive, añadila como fuente arriba y usá este script para copiar automáticamente los documentos compartidos.';
  body.appendChild(intro);

  const ol = document.createElement('ol');
  ol.className = 'setup-guide-list';
  ol.innerHTML = `
    <li>Copiá el script y reemplazá <code>INBOX_FOLDER_ID</code> por el Folder ID de tu carpeta inbox.</li>
    <li>En <a href="https://script.google.com" target="_blank" rel="noopener">script.google.com</a> → Nuevo proyecto → pegar → autorizar → trigger diario.</li>
    <li>Tras la primera ejecución, probá las fuentes en el paso 3 del wizard.</li>
  `;
  body.appendChild(ol);

  const scriptPre = document.createElement('pre');
  scriptPre.className = 'setup-guide';
  scriptPre.textContent = APPS_SCRIPT_SOURCE;
  body.appendChild(scriptPre);

  const footer = btnRow(
    button('Copiar script', {
      variant: 'secondary',
      onClick: async () => {
        await navigator.clipboard.writeText(APPS_SCRIPT_SOURCE);
        toast('Script copiado');
      },
    }),
  );

  const closeModal = openModal({
    title: 'Notas de Gemini compartidas',
    body,
    footer,
  });

  footer.appendChild(
    button('Cerrar', {
      variant: 'primary',
      onClick: () => closeModal(),
    }),
  );
}
