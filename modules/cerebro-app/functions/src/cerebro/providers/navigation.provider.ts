import { v4 as uuidv4 } from 'uuid';
import type { UiCue } from '../../shared/cerebro-chat.js';
import { getUiTarget, listUiTargetsForRoute, searchUiTargets } from '../../shared/cerebro-ui-registry.js';
import type { CerebroToolProvider } from './types.js';

export const navigationProvider: CerebroToolProvider = {
  id: 'navigation',
  toolNames: ['list_ui_targets', 'guide_user'],
  declarations: [
    {
      name: 'list_ui_targets',
      description: 'Lista targets de UI disponibles para guide_user (catálogo cerrado).',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Búsqueda opcional por keyword' } },
      },
    },
    {
      name: 'guide_user',
      description: 'Resalta un elemento de la UI (spotlight/pulse) o navega. Solo targetId del catálogo.',
      parameters: {
        type: 'object',
        properties: {
          targetId: { type: 'string' },
          action: {
            type: 'string',
            enum: ['spotlight', 'pulse', 'navigate', 'navigate_and_spotlight', 'clear'],
          },
          message: { type: 'string', description: 'Tooltip corto para el usuario' },
        },
        required: ['targetId'],
      },
    },
  ],
  async execute(ctx, name, args) {
    if (name === 'list_ui_targets') {
      const route = ctx.cerebro?.route ?? '*';
      const q = String(args.query ?? '').trim();
      const targets = q ? searchUiTargets(q, route === '*' ? undefined : route) : listUiTargetsForRoute(route);
      return targets.map((t) => ({ id: t.id, label: t.label, description: t.description }));
    }
    if (name === 'guide_user') {
      const targetId = String(args.targetId ?? '');
      const target = getUiTarget(targetId);
      if (!target) {
        return { error: `Target desconocido: ${targetId}. Usá list_ui_targets.` };
      }
      const action = (args.action as UiCue['action']) ?? 'spotlight';
      const cue: UiCue = {
        id: uuidv4(),
        targetId,
        action,
        message: args.message ? String(args.message) : target.label,
        navigateTo: target.navigate?.hash,
        settingsSection: target.navigate?.settingsSection,
      };
      ctx.cerebro?.emitUiCue?.(cue);
      return { ok: true, cue, target: target.label };
    }
    throw new Error(`navigation provider: ${name}`);
  },
};
