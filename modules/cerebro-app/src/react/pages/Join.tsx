import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Button, PageHeader, Section, toast } from '../ds.js';
import { qk } from '../hooks.js';
import { OrgPrivacyNotice } from '../components/OrgPrivacyNotice.js';

export default function Join() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();

  const join = useMutation({
    mutationFn: () => api.joinOrg(token),
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: qk.orgs });
      toast('Te uniste a la empresa');
      navigate(`/org/${result.orgId}`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error al unirse', 'error'),
  });

  return (
    <div>
      <PageHeader
        title="Unirte a una empresa"
        desc="Aceptá la invitación para acceder al espacio compartido."
      />
      <Section title="Invitación">
        <OrgPrivacyNotice variant="full" />
        <Button loading={join.isPending} onClick={() => join.mutate()}>
          Aceptar invitación
        </Button>
      </Section>
    </div>
  );
}
