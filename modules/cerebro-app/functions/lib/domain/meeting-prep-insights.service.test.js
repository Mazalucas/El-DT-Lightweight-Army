import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFactChip, buildMeetingPrepFacts, buildTemplateMeetingPrepInsights, normalizeCalendarTitle, } from './meeting-prep-insights.service.js';
function emptyStore(overrides = {}) {
    return {
        version: 1,
        savedAt: '2026-06-26T12:00:00.000Z',
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: [],
        todos: [],
        ...overrides,
    };
}
function calendarWithEvent(event) {
    return {
        date: '2026-06-26',
        timezone: 'America/Argentina/Buenos_Aires',
        hasCalendarAccess: true,
        events: [event],
        eventCount: 1,
    };
}
describe('normalizeCalendarTitle', () => {
    it('strips Re: prefix and normalizes case', () => {
        assert.equal(normalizeCalendarTitle('Re: Daily Standup'), 'daily standup');
    });
});
describe('buildMeetingPrepFacts', () => {
    it('detects same_people when attendee was in a past meeting', () => {
        const store = emptyStore({
            people: [
                {
                    id: 'p-maria',
                    displayName: 'María',
                    aliases: [],
                    teamIds: [],
                    projectIds: [],
                    emails: ['maria@test.com'],
                },
            ],
            meetings: [
                {
                    id: 'm-prev',
                    sourceFile: 'prev.md',
                    title: 'Sync NitroFlow',
                    startedAt: '2026-06-20T15:00:00.000Z',
                    participants: ['María'],
                    personIds: ['p-maria'],
                    prospectIds: [],
                    teamIds: [],
                    projectIds: [],
                    syncStatus: 'synced',
                    analysisStatus: 'analyzed',
                    updatedAt: '2026-06-20T16:00:00.000Z',
                },
            ],
        });
        const calendar = calendarWithEvent({
            id: 'cal-1',
            title: 'Sync NitroFlow',
            startAt: '2026-06-26T15:00:00.000Z',
            endAt: '2026-06-26T16:00:00.000Z',
            status: 'upcoming',
            attendeeEmails: ['maria@test.com'],
        });
        const facts = buildMeetingPrepFacts(calendar, store, 'lucas@test.com');
        assert.ok(facts.some((f) => f.kind === 'same_people'));
        const samePeople = facts.find((f) => f.kind === 'same_people');
        assert.equal(samePeople.relatedMeetingIds?.[0], 'm-prev');
        assert.ok(samePeople.relatedPersonIds?.includes('p-maria'));
    });
    it('detects recurring_series for repeated standup titles', () => {
        const store = emptyStore({
            meetings: [
                {
                    id: 'm-w1',
                    sourceFile: 'w1.md',
                    title: 'Daily Standup',
                    startedAt: '2026-06-19T14:00:00.000Z',
                    participants: [],
                    personIds: [],
                    prospectIds: [],
                    teamIds: [],
                    projectIds: [],
                    syncStatus: 'synced',
                    analysisStatus: 'analyzed',
                    updatedAt: '2026-06-19T15:00:00.000Z',
                },
                {
                    id: 'm-w2',
                    sourceFile: 'w2.md',
                    title: 'Daily Standup',
                    startedAt: '2026-06-12T14:00:00.000Z',
                    participants: [],
                    personIds: [],
                    prospectIds: [],
                    teamIds: [],
                    projectIds: [],
                    syncStatus: 'synced',
                    analysisStatus: 'analyzed',
                    updatedAt: '2026-06-12T15:00:00.000Z',
                },
            ],
        });
        const calendar = calendarWithEvent({
            id: 'cal-standup',
            title: 'Daily Standup',
            startAt: '2026-06-26T14:00:00.000Z',
            endAt: '2026-06-26T14:30:00.000Z',
            status: 'upcoming',
            isRecurring: true,
            recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=TH'],
        });
        const facts = buildMeetingPrepFacts(calendar, store, 'lucas@test.com');
        assert.ok(facts.some((f) => f.kind === 'recurring_series'));
    });
    it('detects open_commitment for todos assigned to invitees', () => {
        const todo = {
            id: 't-1',
            text: 'Enviar presupuesto actualizado',
            meetingId: 'm-prev',
            assigneePersonIds: ['p-juan'],
            status: 'open',
            personIds: ['p-juan'],
            teamIds: [],
            projectIds: [],
            createdAt: '2026-06-20T16:00:00.000Z',
            updatedAt: '2026-06-20T16:00:00.000Z',
        };
        const store = emptyStore({
            people: [
                {
                    id: 'p-juan',
                    displayName: 'Juan',
                    aliases: [],
                    teamIds: [],
                    projectIds: [],
                    emails: ['juan@test.com'],
                },
            ],
            meetings: [
                {
                    id: 'm-prev',
                    sourceFile: 'prev.md',
                    title: 'Revisión presupuesto',
                    startedAt: '2026-06-18T10:00:00.000Z',
                    participants: ['Juan'],
                    personIds: ['p-juan'],
                    prospectIds: [],
                    teamIds: [],
                    projectIds: [],
                    syncStatus: 'synced',
                    analysisStatus: 'analyzed',
                    updatedAt: '2026-06-18T11:00:00.000Z',
                },
            ],
            todos: [todo],
        });
        const calendar = calendarWithEvent({
            id: 'cal-budget',
            title: 'Follow-up presupuesto',
            startAt: '2026-06-26T11:00:00.000Z',
            endAt: '2026-06-26T12:00:00.000Z',
            status: 'upcoming',
            attendeeEmails: ['juan@test.com'],
        });
        const facts = buildMeetingPrepFacts(calendar, store, 'lucas@test.com');
        assert.ok(facts.some((f) => f.kind === 'open_commitment'));
        const commitment = facts.find((f) => f.kind === 'open_commitment');
        assert.ok(commitment.relatedTodoIds?.includes('t-1'));
    });
});
describe('buildTemplateMeetingPrepInsights', () => {
    it('builds one factChip per fact without mixing kinds', () => {
        const store = emptyStore({
            people: [
                {
                    id: 'p-maria',
                    displayName: 'María',
                    aliases: [],
                    teamIds: [],
                    projectIds: ['proj-1'],
                    emails: ['maria@test.com'],
                },
            ],
            projects: [
                {
                    id: 'proj-1',
                    name: 'Milø',
                    tags: [],
                },
            ],
            meetings: [
                {
                    id: 'm-prev',
                    sourceFile: 'prev.md',
                    title: 'Sync',
                    startedAt: '2026-06-20T15:00:00.000Z',
                    participants: ['María'],
                    personIds: ['p-maria'],
                    prospectIds: [],
                    teamIds: [],
                    projectIds: ['proj-1'],
                    syncStatus: 'synced',
                    analysisStatus: 'analyzed',
                    updatedAt: '2026-06-20T16:00:00.000Z',
                },
            ],
        });
        const event = {
            id: 'cal-1',
            title: 'Sync semanal',
            startAt: '2026-06-26T15:00:00.000Z',
            endAt: '2026-06-26T16:00:00.000Z',
            status: 'upcoming',
            attendeeEmails: ['maria@test.com'],
        };
        const calendar = calendarWithEvent(event);
        const facts = buildMeetingPrepFacts(calendar, store, 'lucas@test.com');
        const insights = buildTemplateMeetingPrepInsights(facts, [event], store);
        assert.equal(insights.length, 1);
        assert.equal(insights[0].calendarEventId, 'cal-1');
        assert.ok(insights[0].factChips?.length);
        assert.ok(insights[0].evidence.length > 0);
        for (const chip of insights[0].factChips ?? []) {
            assert.ok(chip.label.length > 0);
            assert.ok(chip.evidence.length > 0);
        }
    });
    it('orders open_commitment before same_project in factChips', () => {
        const todo = {
            id: 't-1',
            text: 'Enviar presupuesto',
            meetingId: 'm-prev',
            assigneePersonIds: ['p-juan'],
            status: 'open',
            personIds: ['p-juan'],
            teamIds: [],
            projectIds: ['proj-1'],
            createdAt: '2026-06-20T16:00:00.000Z',
            updatedAt: '2026-06-20T16:00:00.000Z',
        };
        const store = emptyStore({
            people: [
                {
                    id: 'p-juan',
                    displayName: 'Juan',
                    aliases: [],
                    teamIds: [],
                    projectIds: ['proj-1'],
                    emails: ['juan@test.com'],
                },
            ],
            projects: [
                {
                    id: 'proj-1',
                    name: 'PX',
                    tags: [],
                },
            ],
            meetings: [
                {
                    id: 'm-prev',
                    sourceFile: 'prev.md',
                    title: 'Revisión PX',
                    startedAt: '2026-06-18T10:00:00.000Z',
                    participants: ['Juan'],
                    personIds: ['p-juan'],
                    prospectIds: [],
                    teamIds: [],
                    projectIds: ['proj-1'],
                    syncStatus: 'synced',
                    analysisStatus: 'analyzed',
                    updatedAt: '2026-06-18T11:00:00.000Z',
                },
            ],
            todos: [todo],
        });
        const event = {
            id: 'cal-px',
            title: 'Daily PX',
            startAt: '2026-06-26T11:00:00.000Z',
            endAt: '2026-06-26T12:00:00.000Z',
            status: 'upcoming',
            attendeeEmails: ['juan@test.com'],
        };
        const calendar = calendarWithEvent(event);
        const facts = buildMeetingPrepFacts(calendar, store, 'lucas@test.com');
        const insights = buildTemplateMeetingPrepInsights(facts, [event], store);
        const kinds = (insights[0]?.factChips ?? []).map((c) => c.kind);
        const commitmentIdx = kinds.indexOf('open_commitment');
        const projectIdx = kinds.indexOf('same_project');
        if (commitmentIdx >= 0 && projectIdx >= 0) {
            assert.ok(commitmentIdx < projectIdx);
        }
    });
});
describe('buildFactChip', () => {
    it('labels same_people with participant names and last meeting', () => {
        const store = emptyStore({
            people: [
                {
                    id: 'p-maria',
                    displayName: 'María',
                    aliases: [],
                    teamIds: [],
                    projectIds: [],
                    emails: ['maria@test.com'],
                },
            ],
            meetings: [
                {
                    id: 'm-prev',
                    sourceFile: 'prev.md',
                    title: 'Weekly Milø',
                    startedAt: '2026-06-29T15:00:00.000Z',
                    participants: ['María'],
                    personIds: ['p-maria'],
                    prospectIds: [],
                    teamIds: [],
                    projectIds: [],
                    syncStatus: 'synced',
                    analysisStatus: 'analyzed',
                    updatedAt: '2026-06-29T16:00:00.000Z',
                },
            ],
        });
        const chip = buildFactChip({
            kind: 'same_people',
            calendarEventId: 'cal-1',
            relatedMeetingIds: ['m-prev'],
            relatedPersonIds: ['p-maria'],
            summaryHint: '',
        }, store);
        assert.ok(chip);
        assert.match(chip.label, /María/);
        assert.match(chip.label, /Weekly Milø/);
    });
});
