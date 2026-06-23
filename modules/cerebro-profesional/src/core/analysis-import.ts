import { slugId } from './parse-mirror-md';
import { db } from './db';
import type { Person, Project } from './models';
import { type ExtractedTodoDto, upsertExtractedTodo } from './meeting-todos';

export interface AnalysisInboxRow {
  analysisVersion: number;
  id: string;
  meetingId: string;
  people?: { displayName: string; teamIds?: string[] }[];
  summary?: string;
  themes?: string[];
  objectives?: string[];
  actionItems?: string[];
  projects?: string[];
  confidence?: string;
  needsReview?: boolean;
}

export async function importAnalysisRows(rows: AnalysisInboxRow[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    if (row.analysisVersion !== 1 || !row.meetingId) continue;
    const meeting = await db.meetings.get(row.meetingId);
    if (!meeting) continue;

    const personIds = [...meeting.personIds];
    for (const p of row.people ?? []) {
      if (!p.displayName?.trim()) continue;
      continue;
    }

    const projectIds = [...meeting.projectIds];
    for (const name of row.projects ?? []) {
      const id = slugId(name);
      projectIds.push(id);
      if (!(await db.projects.get(id))) {
        await db.projects.put({ id, name, tags: row.themes ?? [] });
      }
    }

    await db.meetings.put({
      ...meeting,
      summary: row.summary ?? meeting.summary,
      participants: meeting.participants,
      personIds: [...new Set(personIds)],
      projectIds: [...new Set(projectIds)],
      actionItems: row.actionItems?.length ? row.actionItems : meeting.actionItems,
      analysisStatus: row.needsReview ? 'needs_review' : 'analyzed',
      updatedAt: new Date().toISOString(),
    });

    if (row.actionItems?.length) {
      const people = await db.people.toArray();
      for (const line of row.actionItems) {
        const dto: ExtractedTodoDto = {
          meetingId: row.meetingId,
          text: line,
          meetingTitle: meeting.title,
          startedAt: meeting.startedAt,
          teamIds: meeting.teamIds,
          projectIds: [...new Set(projectIds)],
          sourceSection: 'analysis',
        };
        await upsertExtractedTodo(dto, people, meeting);
      }
    }
    count++;
  }
  return count;
}
