import { Link } from 'react-router-dom';
import type { MeetingPrepEvidence, MeetingPrepFactChip, MeetingPrepInsight } from '@shared/types.js';
import { legacyBulletsToChips } from '../../../lib/meeting-prep-cerebro.js';
import { useCerebroUi } from '../cerebro/CerebroProvider.js';
import { Icon } from '../../ds.js';

function evidenceLink(ev: MeetingPrepEvidence): string | null {
  switch (ev.type) {
    case 'meeting':
      return `/reuniones/${ev.id}`;
    case 'person':
      return `/personas?person=${ev.id}`;
    case 'todo':
      return '/tablero';
    case 'project':
      return '/proyectos-equipos';
    default:
      return null;
  }
}

function MeetingPrepFactChipRow({
  insight,
  chip,
  compact,
}: {
  insight: MeetingPrepInsight;
  chip: MeetingPrepFactChip;
  compact?: boolean;
}) {
  const { askAboutMeetingPrepChip } = useCerebroUi();

  return (
    <div className={`hoy-meeting-prep-chip${compact ? ' hoy-meeting-prep-chip--compact' : ''}`}>
      <span className="hoy-meeting-prep-chip__label">{chip.label}</span>
      {!compact && chip.evidence.length ? (
        <div className="hoy-meeting-prep-chip__evidence">
          {chip.evidence.slice(0, 3).map((ev) => {
            const href = evidenceLink(ev);
            return href ? (
              <Link key={`${ev.type}-${ev.id}`} to={href} className="hoy-event-insight-tag">
                {ev.label}
              </Link>
            ) : (
              <span key={`${ev.type}-${ev.id}`} className="hoy-event-insight-tag">
                {ev.label}
              </span>
            );
          })}
        </div>
      ) : null}
      <button
        type="button"
        className="hoy-meeting-prep-chip__cerebro"
        onClick={() => askAboutMeetingPrepChip({ insight, chip })}
        aria-label={`Preguntar a Cerebro sobre ${chip.label}`}
      >
        <Icon name="brain" />
        <span>Cerebro</span>
      </button>
    </div>
  );
}

export function HoyEventInsight({ insight, compact }: { insight: MeetingPrepInsight; compact?: boolean }) {
  const chips = legacyBulletsToChips(insight);
  if (!chips.length) return null;

  return (
    <div className={`hoy-event-insight${compact ? ' hoy-event-insight--compact' : ''}`}>
      <div className="hoy-meeting-prep-chips">
        {chips.map((chip, i) => (
          <MeetingPrepFactChipRow key={`${chip.kind}-${i}`} insight={insight} chip={chip} compact={compact} />
        ))}
      </div>
    </div>
  );
}
