import type { MaintenanceItem, MeetingTodo } from '@shared/types.js';

export type EnqueueAction<T = unknown> = {
  /** Dedupe key — no encolar dos veces la misma acción en vuelo. */
  key: string;
  /** Ids de ítems de mantenimiento a quitar optimistamente del cache. */
  itemIds?: string[];
  /** Prospect ids a quitar del listado de personas. */
  prospectIds?: string[];
  /** Person ids a quitar del listado (merge). */
  removePersonIds?: string[];
  /** Movimiento optimista de tarea en tablero/dashboard. */
  todoMove?: { todoId: string; status: MeetingTodo['status']; boardPosition?: number; orgId?: string };
  /** Lote de movimientos optimistas (accept/dismiss batch). */
  todoMoves?: Array<{ todoId: string; status: MeetingTodo['status']; orgId?: string }>;
  todoPatch?: MeetingTodo;
  orgId?: string;
  /** Parche optimista de catálogo en tablero (proyectos/equipos). */
  catalogBoard?: {
    addProject?: Pick<import('@shared/types.js').Project, 'id' | 'name'>;
    removeProjectId?: string;
    addTeam?: Pick<import('@shared/types.js').Team, 'id' | 'name'> & { emails?: string[]; color?: string };
    removeTeamId?: string;
    orgId?: string;
  };
  /** Refetch selectivo post-mutación (tareas/Hoy) en lugar de catálogo completo. */
  entityMutation?: boolean;
  execute: () => Promise<T>;
  /** Recibe el resultado de execute (p. ej. snapshots de undo del servidor). */
  undo?: (result: T) => Promise<void> | void;
  successMessage: string | ((result: T) => string);
  errorMessage?: string;
};

export type ActionQueueState = {
  pendingCount: number;
  isPending: (key: string) => boolean;
  /** Prospect con acción en cola (dismiss / link / promote). */
  isProspectPending: (prospectId: string) => boolean;
  enqueue: <T>(action: EnqueueAction<T>) => void;
};

/** Snapshot guardado al aplicar patch optimista (rollback on error). */
export type MaintenanceOptimisticSnapshot = {
  itemIds: string[];
  removedItems: MaintenanceItem[];
};
