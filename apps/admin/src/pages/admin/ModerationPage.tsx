import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type Queue = {
  places: Array<{ id: string; name: string; createdAt: string }>;
  tips: Array<{ id: string; title: string }>;
  reports: Array<{
    id: string;
    reason: string;
    targetType: string;
    targetId: string;
  }>;
  guideApps: Array<{
    id: string;
    status: string;
    user?: { email: string; displayName: string };
  }>;
  claims: Array<{ id: string; placeId: string; businessId: string }>;
};

export function ModerationPage() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setQueue(await api<Queue>('/v1/admin/moderation/queue'));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(type: string, id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') {
        await api(`/v1/admin/content/${type}/${id}/approve`, { method: 'POST' });
      } else {
        const reason = window.prompt('Reject reason') ?? 'Rejected by admin';
        await api(`/v1/admin/content/${type}/${id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
      }
      setMsg(`${action} ${type} ok`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function resolveReport(id: string, status: 'RESOLVED' | 'DISMISSED') {
    await api(`/v1/admin/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, resolutionNotes: status }),
    });
    await load();
  }

  if (!queue) return <p>Loading…</p>;

  return (
    <div style={ui.page}>
      <h1>Moderation</h1>
      {msg ? <p style={ui.muted}>{msg}</p> : null}

      <Section title={`Places (${queue.places.length})`}>
        {queue.places.map((p) => (
          <Row
            key={p.id}
            title={p.name}
            onApprove={() => void decide('place', p.id, 'approve')}
            onReject={() => void decide('place', p.id, 'reject')}
          />
        ))}
      </Section>

      <Section title={`Tips (${queue.tips.length})`}>
        {queue.tips.map((t) => (
          <Row
            key={t.id}
            title={t.title}
            onApprove={() => void decide('tip', t.id, 'approve')}
            onReject={() => void decide('tip', t.id, 'reject')}
          />
        ))}
      </Section>

      <Section title={`Guide applications (${queue.guideApps.length})`}>
        {queue.guideApps.map((g) => (
          <Row
            key={g.id}
            title={`${g.user?.displayName ?? g.id} · ${g.user?.email ?? ''} · ${g.status}`}
            onApprove={() => void decide('guide', g.id, 'approve')}
            onReject={() => void decide('guide', g.id, 'reject')}
          />
        ))}
      </Section>

      <Section title={`Business claims (${queue.claims.length})`}>
        {queue.claims.map((c) => (
          <Row
            key={c.id}
            title={`Claim ${c.id.slice(0, 8)} · place ${c.placeId.slice(0, 8)}`}
            onApprove={() => void decide('claim', c.id, 'approve')}
            onReject={() => void decide('claim', c.id, 'reject')}
          />
        ))}
      </Section>

      <Section title={`Reports (${queue.reports.length})`}>
        {queue.reports.map((r) => (
          <div key={r.id} style={ui.card}>
            <strong>
              {r.targetType} · {r.reason}
            </strong>
            <div style={ui.row}>
              <button
                type="button"
                style={ui.btn}
                onClick={() => void resolveReport(r.id, 'RESOLVED')}
              >
                Resolve
              </button>
              <button
                type="button"
                style={ui.btnGhost}
                onClick={() => void resolveReport(r.id, 'DISMISSED')}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Row({
  title,
  onApprove,
  onReject,
}: {
  title: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div style={ui.card}>
      <div style={{ marginBottom: 8 }}>{title}</div>
      <div style={ui.row}>
        <button type="button" style={ui.btn} onClick={onApprove}>
          Approve
        </button>
        <button type="button" style={ui.btnDanger} onClick={onReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
