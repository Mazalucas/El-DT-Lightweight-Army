export interface Team {
  id: string;
  name: string;
  color: string;
  tags?: string[];
}

export type EmailSource =
  | 'invite'
  | 'mention'
  | 'drive'
  | 'transcript'
  | 'owner'
  | 'participant';

export interface EmailMetaEntry {
  sources: EmailSource[];
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export interface Person {
  id: string;
  displayName: string;
  aliases: string[];
  teamIds: string[];
  projectIds: string[];
  emails: string[];
  emailMeta?: Record<string, EmailMetaEntry>;
  notes?: string;
}

/** Nombre visto en reuniones sin email — no es contacto hasta asignar mail. */
export interface PersonProspect {
  id: string;
  displayName: string;
  aliases: string[];
  meetingIds: string[];
  sources: EmailSource[];
  linkedPersonId?: string;
  lastSeenAt?: string;
}

export interface Project {
  id: string;
  name: string;
  tags: string[];
}

export interface Meeting {
  id: string;
  docId?: string;
  sourceFile: string;
  mirrorPath?: string;
  title: string;
  startedAt?: string;
  timezone?: string;
  summary?: string;
  participants: string[];
  /** Emails detectados en invitados / Drive / owner (para vincular contactos). */
  participantEmails?: string[];
  personIds: string[];
  prospectIds: string[];
  teamIds: string[];
  projectIds: string[];
  syncStatus: string;
  analysisStatus: string;
  actionItems?: string[];
  bodyPreview?: string;
  updatedAt: string;
}

export type TodoSourceSection = 'proximos_pasos' | 'sugerencias' | 'analysis';

export type MeetingTodoSource = 'extracted' | 'manual' | 'cursor-chat';

export type MeetingTodoStatus = 'suggested' | 'open' | 'done' | 'dismissed';

/** Todo de reunión (extraído), recordatorio o creado en la app. */
export interface MeetingTodo {
  id: string;
  text: string;
  meetingId: string;
  meetingTitle?: string;
  meetingStartedAt?: string;
  assigneeLabel?: string;
  /** Contactos resueltos del asignatario (subset de personIds). */
  assigneePersonIds?: string[];
  personIds: string[];
  teamIds: string[];
  projectIds: string[];
  status: MeetingTodoStatus;
  source?: MeetingTodoSource;
  /** Sección del mirror de donde se extrajo (Próximos pasos vs Sugerencias). */
  sourceSection?: TodoSourceSection;
  /** Si tiene fecha, aparece en vista Recordatorios. */
  dueAt?: string;
  tags?: string[];
  notes?: string;
  categoryId?: string;
  extractedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface SearchFilters {
  teamId?: string;
  projectId?: string;
  personId?: string;
  q?: string;
}
