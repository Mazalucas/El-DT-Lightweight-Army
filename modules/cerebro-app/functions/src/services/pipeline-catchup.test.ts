import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { CerebroStore, ManifestEntry } from '../shared/types.js';
import { resolveAnalysisMeetingIds, resolveImportMeetingIds } from './pipeline-catchup.js';

const baseManifest = (overrides: Partial<ManifestEntry>): ManifestEntry => ({
  meetingId: 'm1',
  title: 'Reunión',
  sourceFile: '2026-06-29 10:00 - Test',
  startedAt: '2026-06-29T10:00:00+00:00',
  syncStatus: 'synced',
  analysisStatus: 'pending',
  ...overrides,
});

function emptyStore(overrides: Partial<CerebroStore> = {}): CerebroStore {
  return {
    version: 1,
    savedAt: '2026-06-29T12:00:00.000Z',
    meetings: [],
    people: [],
    prospects: [],
    projects: [],
    teams: [],
    todos: [],
    ...overrides,
  };
}

describe('resolveImportMeetingIds', () => {
  it('incluye synced en ventana que faltan en el store', () => {
    const manifest = [baseManifest({ meetingId: 'a' }), baseManifest({ meetingId: 'b' })];
    const ids = resolveImportMeetingIds(manifest, emptyStore(), [], 7);
    assert.deepEqual(new Set(ids), new Set(['a', 'b']));
  });

  it('incluye pending IA aunque ya estén en store', () => {
    const manifest = [baseManifest({ meetingId: 'a', analysisStatus: 'pending' })];
    const store = emptyStore({
      meetings: [
        {
          id: 'a',
          title: 'Reunión',
          startedAt: '2026-06-29T10:00:00+00:00',
          analysisStatus: 'pending',
          syncStatus: 'synced',
          sourceFile: '',
          participants: [],
          personIds: [],
          prospectIds: [],
          teamIds: [],
          projectIds: [],
          updatedAt: '2026-06-29T12:00:00.000Z',
        },
      ],
    });
    const ids = resolveImportMeetingIds(manifest, store, [], 7);
    assert.deepEqual(ids, ['a']);
  });

  it('une IDs recién sincronizadas', () => {
    const ids = resolveImportMeetingIds([], emptyStore(), ['new1'], 7);
    assert.deepEqual(ids, ['new1']);
  });
});

describe('resolveAnalysisMeetingIds', () => {
  it('incluye pending en ventana además de las nuevas', () => {
    const manifest = [
      baseManifest({ meetingId: 'old', analysisStatus: 'pending' }),
      baseManifest({ meetingId: 'done', analysisStatus: 'analyzed' }),
    ];
    const ids = resolveAnalysisMeetingIds(manifest, ['fresh'], 7);
    assert.deepEqual(new Set(ids), new Set(['fresh', 'old']));
  });
});
