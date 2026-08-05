import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type SubApp = {
  id: string;
  email: string;
  displayName: string;
  formationNote?: string | null;
  status: string;
  borderGeoJson?: unknown;
  mainGuideUser?: { email: string; displayName: string };
  createdAt: string;
};

export function SubGuidesPage() {
  const [rows, setRows] = useState<SubApp[]>([]);
  const [msg, setMsg] = useState('');
  const [tempPw, setTempPw] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await api<SubApp[]>(
      '/v1/admin/subguide-applications?status=PENDING_ADMIN',
    );
    setRows(list);
  }, []);

  useEffect(() => {
    void load().catch((e) => setMsg(String(e)));
  }, [load]);

  async function approve(id: string) {
    try {
      const res = await api<{ temporaryPassword: string }>(
        `/v1/admin/subguide-applications/${id}/approve`,
        { method: 'POST', body: JSON.stringify({ adminNote: 'Formation confirmed' }) },
      );
      setTempPw(res.temporaryPassword);
      setMsg('SubGuide approved');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function reject(id: string) {
    try {
      await api(`/v1/admin/subguide-applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ adminNote: 'Rejected' }),
      });
      setMsg('Rejected');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div style={{ padding: '1.25rem' }}>
      <h1>Confirm SubGuides</h1>
      <p style={ui.muted}>
        Main Guide invites after formation/entretien and draws a border. Approve
        only after you confirm training.
      </p>
      {msg ? <p>{msg}</p> : null}
      {tempPw ? (
        <p style={{ ...ui.panel, color: 'var(--ll-ok)' }}>
          Temporary password (show once): <strong>{tempPw}</strong>
        </p>
      ) : null}
      <table className="ll-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Main Guide</th>
            <th>Formation note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="ll-empty">
                No pending SubGuides
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.displayName}</strong>
                  <div style={ui.muted}>{r.email}</div>
                </td>
                <td>
                  {r.mainGuideUser?.displayName}
                  <div style={ui.muted}>{r.mainGuideUser?.email}</div>
                </td>
                <td style={{ maxWidth: 280 }}>{r.formationNote ?? '—'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={ui.btn} onClick={() => void approve(r.id)}>
                    Approve
                  </button>
                  <button
                    type="button"
                    style={ui.btnGhost}
                    onClick={() => void reject(r.id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
