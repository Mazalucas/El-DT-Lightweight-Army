import Fuse from 'fuse.js';
import { api } from '../lib/api.js';
import { navigateToAssistant } from '../lib/assistant-nav.js';
import { navigate } from '../lib/router.js';
import { icon } from '../ui/icons.js';
import { renderHubGrid, type HubCardData } from '../ui/hub-cards.js';
import { button, pageHeader, section } from '../ui/primitives.js';

const TOOLS = [
  {
    id: 'assistant',
    iconName: 'brain',
    title: 'Asistente IA',
    desc: 'Preguntá y actuá sobre reuniones, contactos, inbox y salud del cerebro.',
    route: 'assistant' as const,
    featured: true,
  },
  {
    id: 'profesional',
    iconName: 'briefcase',
    title: 'Cerebro profesional',
    desc: 'Inbox, reuniones, contactos, equipos y red de relaciones.',
    route: 'profesional' as const,
    featured: false,
  },
  {
    id: 'empresa',
    iconName: 'building',
    title: 'Empresa',
    desc: 'Espacios compartidos, invitaciones y catálogo federado.',
    route: 'empresa' as const,
    featured: false,
  },
  {
    id: 'facturas',
    iconName: 'receipt',
    title: 'Facturas autónomo',
    desc: 'Crear, emitir y exportar facturas a Google Drive.',
    route: 'facturas' as const,
    featured: false,
  },
  {
    id: 'settings',
    iconName: 'settings',
    title: 'Ajustes',
    desc: 'Google Meet, sync automática, API keys IA y apariencia.',
    route: 'settings' as const,
    featured: false,
  },
];

export async function renderHome(container: HTMLElement): Promise<void> {
  container.replaceChildren(pageHeader('Inicio', 'Tu centro de comando — datos, IA y herramientas.'));

  const hero = document.createElement('section');
  hero.className = 'home-hero';
  hero.innerHTML = `
    <div class="home-hero-copy">
      <h2 class="home-hero-title">Hablá con tu cerebro</h2>
      <p class="home-hero-desc">El asistente consulta tus reuniones y contactos reales. Podés preguntar, buscar o iniciar sync y reparación.</p>
    </div>
  `;
  const heroActions = document.createElement('div');
  heroActions.className = 'home-hero-actions';
  heroActions.appendChild(
    button('Abrir asistente', {
      onClick: () => navigateToAssistant(),
    }),
  );
  heroActions.appendChild(
    button('Ver profesional', {
      variant: 'secondary',
      onClick: () => navigate('profesional'),
    }),
  );
  hero.appendChild(heroActions);
  container.appendChild(hero);

  const statusSec = section('Estado de tu cerebro', 'Resumen rápido antes de profundizar.');
  const statusHost = document.createElement('div');
  statusHost.className = 'home-status-host';
  const sk = document.createElement('div');
  sk.className = 'skeleton skeleton-line';
  statusHost.appendChild(sk);
  statusSec.body.appendChild(statusHost);
  container.appendChild(statusSec.el);

  void loadStatusCards(statusHost);

  const toolsSec = section('Herramientas', 'Accesos directos a cada módulo.');
  const searchWrap = document.createElement('div');
  searchWrap.className = 'field search-field';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Buscar herramientas…';
  search.setAttribute('aria-label', 'Buscar herramientas');
  searchWrap.appendChild(search);
  toolsSec.body.appendChild(searchWrap);

  const list = document.createElement('div');
  list.className = 'tool-list';
  toolsSec.body.appendChild(list);
  container.appendChild(toolsSec.el);

  const fuse = new Fuse(TOOLS, { keys: ['title', 'desc'], threshold: 0.4 });

  function paintTools(items: typeof TOOLS): void {
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'Sin resultados.';
      list.appendChild(empty);
      return;
    }
    items.forEach((t) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `tool-row${t.featured ? ' tool-row--featured' : ''}`;
      row.innerHTML = `
        <span class="tool-row-icon">${icon(t.iconName)}</span>
        <span class="tool-row-body">
          <div class="tool-row-title">${t.title}</div>
          <div class="tool-row-desc">${t.desc}</div>
        </span>
        <span class="tool-row-arrow">${icon('chevron')}</span>
      `;
      row.addEventListener('click', () => navigate(t.route));
      list.appendChild(row);
    });
  }

  paintTools(TOOLS);
  search.addEventListener('input', () => {
    const q = search.value.trim();
    paintTools(q ? fuse.search(q).map((r) => r.item) : TOOLS);
  });
}

async function loadStatusCards(host: HTMLElement): Promise<void> {
  const cards: HubCardData[] = [];

  try {
    const [syncStatus, summary, assistant] = await Promise.all([
      api.syncStatus(),
      api.getStoreSummary().catch(() => null),
      api.assistantStatus().catch(() => ({ llmConfigured: false })),
    ]);

    const health = summary?.health;
    const meetings = health?.meetingsTotal ?? syncStatus.meetingCount ?? 0;
    const contacts = health?.contactsCount ?? 0;
    const needsRepair = health?.needsRepair ?? false;
    const needsMigration = summary?.needsMigration ?? false;

    cards.push({
      id: 'cerebro',
      iconName: 'briefcase',
      title: 'Cerebro',
      value: `${meetings} reuniones`,
      detail: `${contacts} contactos${needsRepair ? ' · reparación recomendada' : ''}`,
      tone: contacts > 0 ? 'success' : needsRepair ? 'warn' : 'default',
      actionLabel: 'Abrir tablero',
      onAction: () => navigate('profesional'),
    });

    cards.push({
      id: 'ia',
      iconName: 'brain',
      title: 'Asistente IA',
      value: assistant.llmConfigured ? 'Listo' : 'Sin API key',
      detail: assistant.llmConfigured ? 'Tu key en Ajustes alimenta el chat' : 'Configurá en Ajustes → IA',
      tone: assistant.llmConfigured ? 'success' : 'warn',
      actionLabel: assistant.llmConfigured ? 'Chatear' : 'Configurar',
      onAction: () =>
        assistant.llmConfigured
          ? navigateToAssistant()
          : void (location.hash = '#/settings?section=ia'),
    });

    cards.push({
      id: 'sync',
      iconName: 'calendar',
      title: 'Sincronización',
      value: syncStatus.syncRunning ? 'En curso' : syncStatus.syncSchedule?.enabled ? 'Automática' : 'Manual',
      detail: syncStatus.hasGoogleIntegration ? 'Google conectado' : 'Falta conectar Google',
      tone: syncStatus.syncRunning ? 'accent' : syncStatus.hasGoogleIntegration ? 'default' : 'warn',
      href: '#/settings?section=profesional',
      actionLabel: 'Ajustes sync',
    });

    if (needsMigration) {
      cards.push({
        id: 'migrate',
        iconName: 'folder',
        title: 'Catálogo',
        value: 'Actualizar formato',
        detail: 'Migrá a store v2 para mejor rendimiento',
        tone: 'warn',
        actionLabel: 'Ir al tablero',
        onAction: () => navigate('profesional'),
      });
    }
  } catch {
    cards.push({
      id: 'error',
      iconName: 'help',
      title: 'Estado',
      value: 'No disponible',
      detail: 'Iniciá sesión o revisá la conexión',
      tone: 'default',
    });
  }

  host.replaceChildren(renderHubGrid(cards));
}
