import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  guideProfile?: { id: string; status: string; languages?: string[] } | null;
  businessProfile?: {
    id: string;
    displayName: string;
    verificationStatus: string;
  } | null;
};

type Tab = 'CLIENT' | 'GUIDE' | 'BUSINESS';

type GuideDetail = {
  user: UserRow & { guideProfile?: unknown };
  historic: {
    placeCount: number;
    tipCount: number;
    recentPlaces: Array<{
      id: string;
      name: string;
      verificationStatus: string;
      createdAt: string;
    }>;
  };
};

type BusinessDetail = {
  user: UserRow & { businessProfile?: unknown };
  historic: {
    claimCount: number;
    ownedPlaceCount: number;
    recentClaims: Array<{
      id: string;
      status: string;
      place: { id: string; name: string };
    }>;
    ownedPlaces: Array<{ id: string; name: string; verificationStatus: string }>;
  };
};

export function UsersPage() {
  const [tab, setTab] = useState<Tab>('CLIENT');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [guideEmail, setGuideEmail] = useState('');
  const [guideName, setGuideName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizName, setBizName] = useState('');

  const [detailGuide, setDetailGuide] = useState<GuideDetail | null>(null);
  const [detailBiz, setDetailBiz] = useState<BusinessDetail | null>(null);

  const load = useCallback(async () => {
    const rows = await api<UserRow[]>(`/v1/admin/users?role=${tab}`);
    setUsers(rows);
  }, [tab]);

  useEffect(() => {
    setDetailGuide(null);
    setDetailBiz(null);
    void load().catch((e) =>
      setMsg(e instanceof Error ? e.message : String(e)),
    );
  }, [load]);

  async function setBlocked(id: string, block: boolean) {
    try {
      await api(
        `/v1/admin/users/${id}/${block ? 'suspend' : 'reactivate'}`,
        { method: 'POST' },
      );
      setMsg(block ? 'User suspended' : 'User reactivated');
      await load();
      if (detailGuide?.user.id === id) setDetailGuide(null);
      if (detailBiz?.user.id === id) setDetailBiz(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function addGuide(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{
        user: UserRow;
        temporaryPassword: string;
      }>('/v1/admin/guides', {
        method: 'POST',
        body: JSON.stringify({
          email: guideEmail,
          displayName: guideName,
          languages: ['en', 'fr', 'ar'],
        }),
      });
      setTempPassword(res.temporaryPassword);
      setGuideEmail('');
      setGuideName('');
      setMsg(`Guide created: ${res.user.email}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function addBusiness(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{
        user: UserRow;
        temporaryPassword: string;
      }>('/v1/admin/businesses', {
        method: 'POST',
        body: JSON.stringify({
          email: bizEmail,
          displayName: bizName,
        }),
      });
      setTempPassword(res.temporaryPassword);
      setBizEmail('');
      setBizName('');
      setMsg(`Business created: ${res.user.email}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function openGuide(id: string) {
    try {
      const d = await api<GuideDetail>(`/v1/admin/guides/${id}`);
      setDetailGuide(d);
      setDetailBiz(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function openBusiness(id: string) {
    try {
      const d = await api<BusinessDetail>(`/v1/admin/businesses/${id}`);
      setDetailBiz(d);
      setDetailGuide(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div style={ui.page}>
      <h1>Users</h1>
      {msg ? <p style={ui.muted}>{msg}</p> : null}
      {tempPassword ? (
        <div style={{ ...ui.card, border: '2px solid #0f766e' }}>
          <strong>Temporary password (copy now — shown once)</strong>
          <pre style={{ margin: '8px 0', userSelect: 'all' }}>{tempPassword}</pre>
          <button type="button" style={ui.btnGhost} onClick={() => setTempPassword(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div style={ui.row}>
        {(['CLIENT', 'GUIDE', 'BUSINESS'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            style={tab === t ? ui.btn : ui.btnGhost}
            onClick={() => setTab(t)}
          >
            {t === 'CLIENT' ? 'Clients' : t === 'GUIDE' ? 'Guides' : 'Business'}
          </button>
        ))}
      </div>

      {tab === 'GUIDE' ? (
        <form onSubmit={addGuide} style={ui.card}>
          <h3 style={{ marginTop: 0 }}>Add Guide</h3>
          <label>
            Email
            <input
              required
              type="email"
              style={ui.input}
              value={guideEmail}
              onChange={(e) => setGuideEmail(e.target.value)}
            />
          </label>
          <label>
            Display name
            <input
              required
              style={ui.input}
              value={guideName}
              onChange={(e) => setGuideName(e.target.value)}
            />
          </label>
          <button type="submit" style={ui.btn}>
            Create Guide
          </button>
        </form>
      ) : null}

      {tab === 'BUSINESS' ? (
        <form onSubmit={addBusiness} style={ui.card}>
          <h3 style={{ marginTop: 0 }}>Add Business</h3>
          <label>
            Email
            <input
              required
              type="email"
              style={ui.input}
              value={bizEmail}
              onChange={(e) => setBizEmail(e.target.value)}
            />
          </label>
          <label>
            Display name
            <input
              required
              style={ui.input}
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
            />
          </label>
          <button type="submit" style={ui.btn}>
            Create Business
          </button>
        </form>
      ) : null}

      {users.map((u) => (
        <div key={u.id} style={ui.card}>
          <strong>
            {u.displayName} · {u.role} · {u.status}
          </strong>
          <div style={ui.muted}>
            {u.email}
            {u.lastLoginAt
              ? ` · last login ${new Date(u.lastLoginAt).toLocaleString()}`
              : ''}
          </div>
          <div style={{ ...ui.row, marginTop: 8 }}>
            {tab === 'GUIDE' ? (
              <button type="button" style={ui.btnGhost} onClick={() => void openGuide(u.id)}>
                Historic
              </button>
            ) : null}
            {tab === 'BUSINESS' ? (
              <button
                type="button"
                style={ui.btnGhost}
                onClick={() => void openBusiness(u.id)}
              >
                Historic
              </button>
            ) : null}
            {u.status === 'ACTIVE' ? (
              <button type="button" style={ui.btn} onClick={() => void setBlocked(u.id, true)}>
                Block
              </button>
            ) : (
              <button
                type="button"
                style={ui.btnGhost}
                onClick={() => void setBlocked(u.id, false)}
              >
                Reactivate
              </button>
            )}
          </div>
        </div>
      ))}

      {detailGuide ? (
        <div style={ui.card}>
          <h3>Guide historic — {detailGuide.user.displayName}</h3>
          <p style={ui.muted}>
            Places submitted: {detailGuide.historic.placeCount} · Tips:{' '}
            {detailGuide.historic.tipCount}
          </p>
          <ul>
            {detailGuide.historic.recentPlaces.map((p) => (
              <li key={p.id}>
                {p.name} · {p.verificationStatus}
              </li>
            ))}
          </ul>
          <button type="button" style={ui.btnGhost} onClick={() => setDetailGuide(null)}>
            Close
          </button>
        </div>
      ) : null}

      {detailBiz ? (
        <div style={ui.card}>
          <h3>Business historic — {detailBiz.user.displayName}</h3>
          <p style={ui.muted}>
            Claims: {detailBiz.historic.claimCount} · Owned places:{' '}
            {detailBiz.historic.ownedPlaceCount}
          </p>
          <ul>
            {detailBiz.historic.recentClaims.map((c) => (
              <li key={c.id}>
                {c.place.name} · {c.status}
              </li>
            ))}
          </ul>
          <button type="button" style={ui.btnGhost} onClick={() => setDetailBiz(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
