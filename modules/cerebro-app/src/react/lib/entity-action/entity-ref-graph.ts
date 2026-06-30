import type { EntityRef } from '@shared/cerebro-elements.js';

/** Mapea EntityRef de dominio al id de nodo del grafo (Red / OrgRed). */
export function entityRefToGraphNodeId(ref: EntityRef): string | null {
  switch (ref.kind) {
    case 'person':
      return `person:${ref.id}`;
    case 'prospect':
      return `prospect:${ref.id}`;
    case 'meeting':
      return `meeting:${ref.id}`;
    case 'project':
      return `project:${ref.id}`;
    case 'team':
      return `team:${ref.id}`;
    default:
      return null;
  }
}
