/** Cerebro Elements — entity refs, lifecycle, and mutation effects (SPA + Functions). */

export type EntityKind =
  | 'todo'
  | 'person'
  | 'prospect'
  | 'project'
  | 'team'
  | 'suggestion'
  | 'maintenance_item'
  | 'smart_suggestion'
  | 'meeting';

export interface EntityRef {
  kind: EntityKind;
  id: string;
  orgId?: string;
}

export type ElementLifecycle =
  | 'idle'
  | 'dragging'
  | 'pending'
  | 'ai_acting'
  | 'entering'
  | 'exiting'
  | 'error';

export type EntityEffectOp = 'create' | 'update' | 'move' | 'delete' | 'highlight';

export type EntityAnimationHint = 'fly_to_column' | 'pulse' | 'fade_out' | 'slide_in';

export interface EntityEffect {
  ref: EntityRef;
  op: EntityEffectOp;
  patch?: Record<string, unknown>;
  animation?: EntityAnimationHint;
  source: 'user' | 'cerebro';
  toolName?: string;
}

export function entityDomId(ref: EntityRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function parseEntityDomId(value: string): EntityRef | null {
  const idx = value.indexOf(':');
  if (idx <= 0) return null;
  const kind = value.slice(0, idx) as EntityKind;
  const id = value.slice(idx + 1);
  if (!id) return null;
  return { kind, id };
}
