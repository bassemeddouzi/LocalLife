import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type Queue = {
  places: Array<{ id: string; name: string; createdAt: string }>;
  tips: Array<{ id: string; title: string }>;
  events: Array<{ id: string; title: string; createdAt: string }>;
  experiences: Array<{ id: string; title: string; createdAt: string }>;
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
  businessApplications: Array<{
    id: string;
    email: string;
    displayName: string;
    note: string | null;
    proposedByGuide?: { email: string; displayName: string };
    baseCity?: { name: string };
    primaryDistrict?: { name: string };
  }>;
};

export function ModerationPage() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [msg, setMsg] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

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

  async function decideBizApp(id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') {
        const res = await api<{ temporaryPassword: string }>(
          `/v1/admin/business-applications/${id}/approve`,
          { method: 'POST' },
        );
        setTempPassword(res.temporaryPassword);
        setMsg('Business application approved — copy temp password');
      } else {
        const reason = window.prompt('Reject reason') ?? 'Rejected by admin';
        await api(`/v1/admin/business-applications/${id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
        setMsg('Business application rejected');
      }
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  if (!queue) return <p style={ui.muted}>Loading moderation queue…</p>;

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Moderation</h1>
          <p className="ll-page-sub">
            Approve or reject pending places, tips, events, experiences, guide
            applications, business applications, claims, and reports.
          </p>
        </div>
      </div>
      {msg ? <div style={ui.alert}>{msg}</div> : null}
      {tempPassword ? (
        <div style={ui.alert}>
          Temporary Business password (copy once): <code>{tempPassword}</code>
        </div>
      ) : null}

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
                <DecideButtons
                  onApprove={() => void decide('place', p.id, 'approve')}
                  onReject={() => void decide('place', p.id, 'reject')}
                />
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
                <DecideButtons
                  onApprove={() => void decide('tip', t.id, 'approve')}
                  onReject={() => void decide('tip', t.id, 'reject')}
                />
              </td>
            </tr>
          ))}
        />
      </Section>

      <Section title="Events" count={(queue.events ?? []).length}>
        <QueueTable
          empty="No pending events"
          headers={['Title', 'Created', '']}
          rows={(queue.events ?? []).map((e) => (
            <tr key={e.id}>
              <td>
                <strong>{e.title}</strong>
              </td>
              <td style={ui.muted}>{new Date(e.createdAt).toLocaleString()}</td>
              <td>
                <DecideButtons
                  onApprove={() => void decide('event', e.id, 'approve')}
                  onReject={() => void decide('event', e.id, 'reject')}
                />
              </td>
            </tr>
          ))}
        />
      </Section>

      <Section title="Experiences" count={(queue.experiences ?? []).length}>
        <QueueTable
          empty="No pending experiences"
          headers={['Title', 'Created', '']}
          rows={(queue.experiences ?? []).map((e) => (
            <tr key={e.id}>
              <td>
                <strong>{e.title}</strong>
              </td>
              <td style={ui.muted}>{new Date(e.createdAt).toLocaleString()}</td>
              <td>
                <DecideButtons
                  onApprove={() => void decide('experience', e.id, 'approve')}
                  onReject={() => void decide('experience', e.id, 'reject')}
                />
              </td>
            </tr>
          ))}
        />
      </Section>

      <Section
        title="Business applications"
        count={(queue.businessApplications ?? []).length}
      >
        <QueueTable
          empty="No pending business applications"
          headers={['Business', 'Proposed by', 'Zone', '']}
          rows={(queue.businessApplications ?? []).map((a) => (
            <tr key={a.id}>
              <td>
                <strong>{a.displayName}</strong>
                <div style={{ ...ui.muted, fontSize: '0.8rem' }}>{a.email}</div>
              </td>
              <td style={ui.muted}>
                {a.proposedByGuide?.displayName ?? '—'}
                <div style={{ fontSize: '0.8rem' }}>
                  {a.proposedByGuide?.email}
                </div>
              </td>
              <td style={ui.muted}>
                {a.primaryDistrict?.name ?? '—'}
                {a.baseCity ? ` · ${a.baseCity.name}` : ''}
              </td>
              <td>
                <DecideButtons
                  onApprove={() => void decideBizApp(a.id, 'approve')}
                  onReject={() => void decideBizApp(a.id, 'reject')}
                />
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
                <DecideButtons
                  onApprove={() => void decide('guide', g.id, 'approve')}
                  onReject={() => void decide('guide', g.id, 'reject')}
                />
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
                <DecideButtons
                  onApprove={() => void decide('claim', c.id, 'approve')}
                  onReject={() => void decide('claim', c.id, 'reject')}
                />
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

function DecideButtons({
  onApprove,
  onReject,
}: {
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="ll-actions">
      <button type="button" style={{ ...ui.btn, ...ui.btnSm }} onClick={onApprove}>
        Approve
      </button>
      <button
        type="button"
        style={{ ...ui.btnDanger, ...ui.btnSm }}
        onClick={onReject}
      >
        Reject
      </button>
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
          <span
            style={{
              ...ui.muted,
              fontFamily: 'var(--ll-font)',
              fontSize: '0.95rem',
            }}
          >
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
