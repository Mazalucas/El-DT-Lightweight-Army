import { useState } from 'react';
import type { PeopleView, Team } from '@shared/types.js';
import { Button, Field } from '../ds.js';
import type { PeopleActions } from './PeopleDirectory.js';
import { useEntityMutation } from '../lib/entity-action/use-entity-mutation.js';

export function TeamEntityInlinePanel({
  team,
  view: _view,
  actions,
  memberNames,
}: {
  team: Team;
  view: PeopleView;
  actions: PeopleActions;
  memberNames: string[];
}) {
  const { useEntityMutate } = useEntityMutation();
  const [name, setName] = useState(team.name);
  const [emails, setEmails] = useState((team.emails ?? []).join(', '));

  const save = useEntityMutate(
    `team-save:${team.id}`,
    () =>
      actions.updateTeam!(team.id, {
        name: name.trim(),
        emails: emails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      }),
    { success: 'Equipo actualizado' },
  );

  if (!actions.updateTeam) return null;

  return (
    <div className="person-entity-inline" data-cerebro-entity={`team:${team.id}`}>
      <Field label="Nombre">
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Emails del equipo" hint="Separados por coma — desaparecen de Personas al guardar">
        <input className="field-input" value={emails} onChange={(e) => setEmails(e.target.value)} />
      </Field>
      {memberNames.length ? (
        <div className="graph-neighbors">
          <p className="graph-neighbors-title">Miembros en el grafo</p>
          <ul className="graph-neighbors-list">
            {memberNames.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="btn-row">
        <Button loading={save.isPending} onClick={save.run}>
          Guardar equipo
        </Button>
      </div>
    </div>
  );
}
