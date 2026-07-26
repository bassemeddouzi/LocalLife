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

  if (!queue) return <p style={ui.muted}>Loading moderation queue…</p>;

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Moderation</h1>
          <p className="ll-page-sub">
            Approve or reject pending places, tips, guide applications, claims,
            and reports.
          </p>
        </div>
      </div>
      {msg ? <div style={ui.alert}>{msg}</div> : null}

      <Section title="Places" count={queue.places.length}>
        <QueueTable
          empty="No pending places"
          headers={['Name', 'Created', '']}
          rows={queue.places.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.name}</strong>
              </td>
              <td style={ui.muted}>{new Date(p.createdAt).toLocaleString()}</td>
              <td>
                <div className="ll-actions">
                  <button
                    type="button"
                    style={{ ...ui.btn, ...ui.btnSm }}
                    onClick={() => void decide('place', p.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    style={{ ...ui.btnDanger, ...ui.btnSm }}
                    onClick={() => void decide('place', p.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Section>

      <Section title="Tips" count={queue.tips.length}>
        <QueueTable
          empty="No pending tips"
          headers={['Title', '']}
          rows={queue.tips.map((t) => (
            <tr key={t.id}>
              <td>
                <strong>{t.title}</strong>
              </td>
              <td>
                <div className="ll-actions">
                  <button
                    type="button"
                    style={{ ...ui.btn, ...ui.btnSm }}
                    onClick={() => void decide('tip', t.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    style={{ ...ui.btnDanger, ...ui.btnSm }}
                    onClick={() => void decide('tip', t.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Section>

      <Section title="Guide applications" count={queue.guideApps.length}>
        <QueueTable
          empty="No guide applications"
          headers={['Applicant', 'Email', 'Status', '']}
          rows={queue.guideApps.map((g) => (
            <tr key={g.id}>
              <td>
                <strong>{g.user?.displayName ?? g.id.slice(0, 8)}</strong>
              </td>
              <td style={ui.muted}>{g.user?.email ?? '—'}</td>
              <td>
                <span className="ll-badge ll-badge--warn">{g.status}</span>
              </td>
              <td>
                <div className="ll-actions">
                  <button
                    type="button"
                    style={{ ...ui.btn, ...ui.btnSm }}
                    onClick={() => void decide('guide', g.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    style={{ ...ui.btnDanger, ...ui.btnSm }}
                    onClick={() => void decide('guide', g.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Section>

      <Section title="Business claims" count={queue.claims.length}>
        <QueueTable
          empty="No pending claims"
          headers={['Claim', 'Place', 'Business', '']}
          rows={queue.claims.map((c) => (
            <tr key={c.id}>
              <td>
                <code>{c.id.slice(0, 8)}</code>
              </td>
              <td>
                <code>{c.placeId.slice(0, 8)}</code>
              </td>
              <td>
                <code>{c.businessId.slice(0, 8)}</code>
              </td>
              <td>
                <div className="ll-actions">
                  <button
                    type="button"
                    style={{ ...ui.btn, ...ui.btnSm }}
                    onClick={() => void decide('claim', c.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    style={{ ...ui.btnDanger, ...ui.btnSm }}
                    onClick={() => void decide('claim', c.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Section>

      <Section title="Reports" count={queue.reports.length}>
        <QueueTable
          empty="No open reports"
          headers={['Target', 'Reason', '']}
          rows={queue.reports.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.targetType}</strong>
                <div style={{ ...ui.muted, fontSize: '0.8rem' }}>
                  {r.targetId.slice(0, 8)}
                </div>
              </td>
              <td>{r.reason}</td>
              <td>
                <div className="ll-actions">
                  <button
                    type="button"
                    style={{ ...ui.btn, ...ui.btnSm }}
                    onClick={() => void resolveReport(r.id, 'RESOLVED')}
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    style={{ ...ui.btnGhost, ...ui.btnSm }}
                    onClick={() => void resolveReport(r.id, 'DISMISSED')}
                  >
                    Dismiss
                  </button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section style={{ ...ui.panel, paddingTop: '1rem' }}>
      <div className="ll-page-head" style={{ marginBottom: '0.85rem' }}>
        <h2 style={{ margin: 0 }}>
          {title}{' '}
          <span style={{ ...ui.muted, fontFamily: 'var(--ll-font)', fontSize: '0.95rem' }}>
            ({count})
          </span>
        </h2>
      </div>
      {children}
    </section>
  );
}

function QueueTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: ReactNode[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="ll-empty">{empty}</p>;
  }
  return (
    <div className="ll-table-wrap" style={{ boxShadow: 'none' }}>
      <table className="ll-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h || 'actions'}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
