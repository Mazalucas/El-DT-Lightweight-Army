import Dexie, { type Table } from 'dexie';
import type { Meeting, MeetingTodo, Person, PersonProspect, Project, Team } from './models';

export class CerebroDb extends Dexie {
  meetings!: Table<Meeting, string>;
  people!: Table<Person, string>;
  prospects!: Table<PersonProspect, string>;
  teams!: Table<Team, string>;
  projects!: Table<Project, string>;
  todos!: Table<MeetingTodo, string>;

  constructor() {
    super('cerebro-profesional-v1');
    this.version(1).stores({
      meetings: 'id, startedAt, title',
      people: 'id, displayName',
      teams: 'id, name',
      projects: 'id, name',
    });
    this.version(2).stores({
      meetings: 'id, startedAt, title',
      people: 'id, displayName',
      prospects: 'id, displayName, linkedPersonId',
      teams: 'id, name',
      projects: 'id, name',
    });
    this.version(3).stores({
      meetings: 'id, startedAt, title',
      people: 'id, displayName',
      prospects: 'id, displayName, linkedPersonId',
      teams: 'id, name',
      projects: 'id, name',
      todos: 'id, meetingId, status, updatedAt',
    });
    this.version(4).stores({
      meetings: 'id, startedAt, title',
      people: 'id, displayName',
      prospects: 'id, displayName, linkedPersonId',
      teams: 'id, name',
      projects: 'id, name',
      todos: 'id, meetingId, status, updatedAt, dueAt',
    });
  }
}

export const db = new CerebroDb();
