import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  guideProfile?: {
    id: string;
    status: string;
    languages?: string[];
    baseCityId?: string | null;
    primaryDistrictId?: string | null;
    baseCity?: { id: string; name: string; slug: string } | null;
    primaryDistrict?: { id: string; name: string; slug: string } | null;
  } | null;
  businessProfile?: {
    id: string;
    displayName: string;
    verificationStatus: string;
    baseCityId?: string | null;
    primaryDistrictId?: string | null;
    baseCity?: { id: string; name: string; slug: string } | null;
    primaryDistrict?: { id: string; name: string; slug: string } | null;
  } | null;
};

type Tab = 'CLIENT' | 'GUIDE' | 'BUSINESS';

type District = {
  id: string;
  cityId: string;
  name: string;
  slug: string;
};

type CityOption = {
  id: string;
  name: string;
  slug: string;
};

type GuideDetail = {
  user: UserRow;
  historic: {
    placeCount: number;
    tipCount: number;
    eventCount: number;
    experienceCount: number;
    businessApplicationCount: number;
    recentPlaces: Array<{
      id: string;
      name: string;
      verificationStatus: string;
      createdAt: string;
    }>;
    recentTips: Array<{
      id: string;
      title: string;
      categoryKey: string | null;
      verificationStatus: string;
      createdAt: string;
    }>;
    recentEvents: Array<{
      id: string;
      title: string;
      verificationStatus: string;
      startsAt: string;
      createdAt: string;
    }>;
    recentExperiences: Array<{
      id: string;
      title: string;
      verificationStatus: string;
      createdAt: string;
    }>;
    recentBusinessApplications: Array<{
      id: string;
      email: string;
      displayName: string;
      status: string;
      createdAt: string;
    }>;
  };
};

type BusinessDetail = {
  user: UserRow;
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

const TAB_LABEL: Record<Tab, string> = {
  CLIENT: 'Clients',
  GUIDE: 'Guides',
  BUSINESS: 'Business',
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ACTIVE'
      ? 'll-badge ll-badge--ok'
      : status === 'SUSPENDED'
        ? 'll-badge ll-badge--danger'
        : 'll-badge ll-badge--neutral';
  return <span className={cls}>{status}</span>;
}

export function UsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusUserId = searchParams.get('user');
  const tabParam = searchParams.get('tab');
  const initialTab: Tab =
    tabParam === 'GUIDE' || tabParam === 'BUSINESS' || tabParam === 'CLIENT'
      ? tabParam
      : 'CLIENT';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [guideEmail, setGuideEmail] = useState('');
  const [guideName, setGuideName] = useState('');
  const [guideCityId, setGuideCityId] = useState('');
  const [guideDistrictId, setGuideDistrictId] = useState('');
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [editDistrictId, setEditDistrictId] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizCityId, setBizCityId] = useState('');
  const [bizDistrictId, setBizDistrictId] = useState('');

  const [detailGuide, setDetailGuide] = useState<GuideDetail | null>(null);
  const [detailBiz, setDetailBiz] = useState<BusinessDetail | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const countries = await api<Array<{ id: string; iso2: string }>>(
          '/v1/countries',
          { auth: false },
        );
        const tn = countries.find((c) => c.iso2 === 'TN');
        if (!tn) return;
        const list = await api<CityOption[]>(`/v1/countries/${tn.id}/cities`, {
          auth: false,
        });
        setCities(list);
        const djerba = list.find((c) => c.slug === 'djerba');
        if (djerba) {
          setGuideCityId(djerba.id);
          setBizCityId(djerba.id);
        }
      } catch (e) {
        setMsg(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  useEffect(() => {
    const cityId = tab === 'BUSINESS' ? bizCityId : guideCityId;
    if (!cityId) {
      setDistricts([]);
      setGuideDistrictId('');
      setBizDistrictId('');
      return;
    }
    void api<District[]>(`/v1/cities/${cityId}/districts`, { auth: false })
      .then((rows) => {
        setDistricts(rows);
        if (tab === 'BUSINESS') {
          setBizDistrictId((prev) =>
            rows.some((d) => d.id === prev) ? prev : (rows[0]?.id ?? ''),
          );
        } else {
          setGuideDistrictId((prev) =>
            rows.some((d) => d.id === prev) ? prev : (rows[0]?.id ?? ''),
          );
        }
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : String(e)));
  }, [guideCityId, bizCityId, tab]);

  useEffect(() => {
    if (
      tabParam === 'GUIDE' ||
      tabParam === 'BUSINESS' ||
      tabParam === 'CLIENT'
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api<UserRow[]>(`/v1/admin/users?role=${tab}`);
      setUsers(rows);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (!focusUserId) {
      setDetailGuide(null);
      setDetailBiz(null);
    }
    void load().catch((e) =>
      setMsg(e instanceof Error ? e.message : String(e)),
    );
  }, [load, focusUserId]);

  function selectTab(next: Tab) {
    setTab(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', next);
      p.delete('user');
      return p;
    });
  }

  async function setBlocked(id: string, block: boolean) {
    try {
      await api(`/v1/admin/users/${id}/${block ? 'suspend' : 'reactivate'}`, {
        method: 'POST',
      });
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
      const res = await api<{ user: UserRow; temporaryPassword: string }>(
        '/v1/admin/guides',
        {
          method: 'POST',
          body: JSON.stringify({
            email: guideEmail,
            displayName: guideName,
            languages: ['en', 'fr', 'ar'],
            baseCityId: guideCityId,
            primaryDistrictId: guideDistrictId,
          }),
        },
      );
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
      const res = await api<{ user: UserRow; temporaryPassword: string }>(
        '/v1/admin/businesses',
        {
          method: 'POST',
          body: JSON.stringify({
            email: bizEmail,
            displayName: bizName,
            baseCityId: bizCityId,
            primaryDistrictId: bizDistrictId,
          }),
        },
      );
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
      const detail = await api<GuideDetail>(`/v1/admin/guides/${id}`);
      setDetailGuide(detail);
      setDetailBiz(null);
      setEditDistrictId(detail.user.guideProfile?.primaryDistrictId ?? '');
      if (detail.user.guideProfile?.baseCityId) {
        setGuideCityId(detail.user.guideProfile.baseCityId);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function saveGuideDistrict(e: FormEvent) {
    e.preventDefault();
    if (!detailGuide) return;
    try {
      const cityId =
        detailGuide.user.guideProfile?.baseCityId ?? guideCityId;
      await api(`/v1/admin/guides/${detailGuide.user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          baseCityId: cityId,
          primaryDistrictId: editDistrictId,
        }),
      });
      setMsg('Guide zone updated');
      await openGuide(detailGuide.user.id);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function openBusiness(id: string) {
    try {
      const detail = await api<BusinessDetail>(`/v1/admin/businesses/${id}`);
      setDetailBiz(detail);
      setDetailGuide(null);
      setEditDistrictId(detail.user.businessProfile?.primaryDistrictId ?? '');
      if (detail.user.businessProfile?.baseCityId) {
        setBizCityId(detail.user.businessProfile.baseCityId);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  function focusUser(role: 'GUIDE' | 'BUSINESS', id: string) {
    setSearchParams({ tab: role, user: id });
  }

  useEffect(() => {
    if (!focusUserId || loading) return;
    if (tab === 'GUIDE') {
      void openGuide(focusUserId);
    } else if (tab === 'BUSINESS') {
      void openBusiness(focusUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusUserId, loading, tab]);

  async function saveBusinessDistrict(e: FormEvent) {
    e.preventDefault();
    if (!detailBiz) return;
    try {
      const cityId =
        detailBiz.user.businessProfile?.baseCityId ?? bizCityId;
      await api(`/v1/admin/businesses/${detailBiz.user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          baseCityId: cityId,
          primaryDistrictId: editDistrictId,
        }),
      });
      setMsg('Business zone updated');
      await openBusiness(detailBiz.user.id);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  function clearFocus() {
    setDetailGuide(null);
    setDetailBiz(null);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('user');
      return p;
    });
  }

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Users</h1>
          <p className="ll-page-sub">
            Manage clients, provision Guides and Business accounts, and block
            abuse. Temporary passwords are shown once.
          </p>
        </div>
      </div>

      {msg ? <div style={ui.alert}>{msg}</div> : null}

      {tempPassword ? (
        <div style={ui.alertWarn}>
          <strong>Temporary password — copy now</strong>
          <pre
            style={{
              margin: '0.6rem 0 0.75rem',
              userSelect: 'all',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '1rem',
            }}
          >
            {tempPassword}
          </pre>
          <button type="button" style={ui.btnGhost} onClick={() => setTempPassword(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="ll-tabs" role="tablist">
        {(['CLIENT', 'GUIDE', 'BUSINESS'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`ll-tab${tab === t ? ' is-active' : ''}`}
            onClick={() => selectTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'GUIDE' ? (
        <form onSubmit={addGuide} style={ui.panel}>
          <h2>Add Guide</h2>
          <p style={{ ...ui.muted, marginTop: 0 }}>
            Creates an approved Guide. <strong>City + district are required</strong>{' '}
            so the Guide appears on the Map (orange pin). Share the password
            securely.
          </p>
          <div style={ui.grid2}>
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
            <label>
              City
              <select
                required
                style={ui.input}
                value={guideCityId}
                onChange={(e) => setGuideCityId(e.target.value)}
              >
                <option value="">Select city…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              District / zone
              <select
                required
                style={ui.input}
                value={guideDistrictId}
                onChange={(e) => setGuideDistrictId(e.target.value)}
                disabled={!districts.length}
              >
                <option value="">Select district…</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" style={ui.btn} disabled={!guideCityId || !guideDistrictId}>
            Create Guide
          </button>
        </form>
      ) : null}

      {tab === 'BUSINESS' ? (
        <form onSubmit={addBusiness} style={ui.panel}>
          <h2>Add Business</h2>
          <p style={{ ...ui.muted, marginTop: 0 }}>
            Creates a Business account. <strong>City + district required</strong>{' '}
            for the Map (purple pin).
          </p>
          <div style={ui.grid2}>
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
            <label>
              City
              <select
                required
                style={ui.input}
                value={bizCityId}
                onChange={(e) => setBizCityId(e.target.value)}
              >
                <option value="">Select city…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              District / zone
              <select
                required
                style={ui.input}
                value={bizDistrictId}
                onChange={(e) => setBizDistrictId(e.target.value)}
                disabled={!districts.length}
              >
                <option value="">Select district…</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            style={ui.btn}
            disabled={!bizCityId || !bizDistrictId}
          >
            Create Business
          </button>
        </form>
      ) : null}

      <div className="ll-table-wrap">
        <table className="ll-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Last login</th>
              <th>Map</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="ll-empty">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="ll-empty">
                  No {TAB_LABEL[tab].toLowerCase()} yet
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const profile =
                  tab === 'GUIDE' ? u.guideProfile : u.businessProfile;
                const hasZone = Boolean(
                  profile?.primaryDistrictId || profile?.baseCityId,
                );
                const zoneLabel =
                  tab === 'GUIDE' || tab === 'BUSINESS'
                    ? profile?.primaryDistrict?.name ??
                      (profile?.baseCity?.name
                        ? `${profile.baseCity.name} · unassigned`
                        : 'No zone')
                    : '—';
                return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.displayName}</strong>
                  </td>
                  <td style={{ color: 'var(--ll-muted)' }}>{u.email}</td>
                  <td>
                    {tab === 'GUIDE' || tab === 'BUSINESS' ? (
                      <span
                        className={`ll-badge ${
                          hasZone && profile?.primaryDistrictId
                            ? 'll-badge--ok'
                            : 'll-badge--warn'
                        }`}
                      >
                        {zoneLabel}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td style={{ color: 'var(--ll-muted)', fontSize: '0.85rem' }}>
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString()
                      : '—'}
                  </td>
                  <td>
                    {tab === 'GUIDE' ? (
                      <button
                        type="button"
                        className="ll-btn-map"
                        onClick={() =>
                          navigate(
                            `/admin/map?guide=${encodeURIComponent(u.id)}`,
                          )
                        }
                      >
                        Show on map
                      </button>
                    ) : tab === 'BUSINESS' ? (
                      <button
                        type="button"
                        className="ll-btn-map ll-btn-map--biz"
                        onClick={() =>
                          navigate(
                            `/admin/map?business=${encodeURIComponent(u.id)}`,
                          )
                        }
                      >
                        Show on map
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="ll-actions">
                      {tab === 'GUIDE' ? (
                        <button
                          type="button"
                          style={{ ...ui.btnGhost, ...ui.btnSm }}
                          onClick={() => focusUser('GUIDE', u.id)}
                        >
                          Historic
                        </button>
                      ) : null}
                      {tab === 'BUSINESS' ? (
                        <button
                          type="button"
                          style={{ ...ui.btnGhost, ...ui.btnSm }}
                          onClick={() => focusUser('BUSINESS', u.id)}
                        >
                          Historic
                        </button>
                      ) : null}
                      {u.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          style={{ ...ui.btnDanger, ...ui.btnSm }}
                          onClick={() => void setBlocked(u.id, true)}
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={{ ...ui.btn, ...ui.btnSm }}
                          onClick={() => void setBlocked(u.id, false)}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {detailGuide ? (
        <div style={{ ...ui.panel, marginTop: '1.25rem' }}>
          <div className="ll-page-head">
            <div>
              <h2>Guide historic</h2>
              <p className="ll-page-sub">{detailGuide.user.displayName}</p>
            </div>
            <div className="ll-actions">
              <button type="button" style={ui.btnGhost} onClick={clearFocus}>
                Close
              </button>
              <button
                type="button"
                style={ui.btn}
                onClick={() =>
                  navigate(
                    `/admin/map?guide=${encodeURIComponent(detailGuide.user.id)}`,
                  )
                }
              >
                Show on map
              </button>
            </div>
          </div>
          <p style={ui.muted}>
            Zone:{' '}
            <strong>
              {detailGuide.user.guideProfile?.primaryDistrict?.name ??
                'Unassigned'}
            </strong>
            {detailGuide.user.guideProfile?.baseCity
              ? ` · ${detailGuide.user.guideProfile.baseCity.name}`
              : ''}
          </p>
          <form onSubmit={saveGuideDistrict} style={{ marginBottom: '1rem' }}>
            <label>
              Update district
              <select
                style={ui.input}
                value={editDistrictId}
                onChange={(e) => setEditDistrictId(e.target.value)}
              >
                <option value="">Select…</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              style={ui.btn}
              disabled={!editDistrictId}
            >
              Save zone
            </button>
          </form>
          <p style={ui.muted}>
            Places: <strong>{detailGuide.historic.placeCount}</strong> · Tips:{' '}
            <strong>{detailGuide.historic.tipCount}</strong> · Events:{' '}
            <strong>{detailGuide.historic.eventCount}</strong> · Experiences:{' '}
            <strong>{detailGuide.historic.experienceCount}</strong> · Business
            apps:{' '}
            <strong>{detailGuide.historic.businessApplicationCount}</strong>
          </p>
          <HistoricList
            title="Places"
            items={detailGuide.historic.recentPlaces.map(
              (p) => `${p.name} · ${p.verificationStatus}`,
            )}
          />
          <HistoricList
            title="Tips"
            items={(detailGuide.historic.recentTips ?? []).map(
              (t) => `${t.title} · ${t.verificationStatus}`,
            )}
          />
          <HistoricList
            title="Events"
            items={(detailGuide.historic.recentEvents ?? []).map(
              (e) => `${e.title} · ${e.verificationStatus}`,
            )}
          />
          <HistoricList
            title="Experiences"
            items={(detailGuide.historic.recentExperiences ?? []).map(
              (e) => `${e.title} · ${e.verificationStatus}`,
            )}
          />
          <HistoricList
            title="Business applications"
            items={(detailGuide.historic.recentBusinessApplications ?? []).map(
              (a) => `${a.displayName} (${a.email}) · ${a.status}`,
            )}
          />
        </div>
      ) : null}

      {detailBiz ? (
        <div style={{ ...ui.panel, marginTop: '1.25rem' }}>
          <div className="ll-page-head">
            <div>
              <h2>Business historic</h2>
              <p className="ll-page-sub">{detailBiz.user.displayName}</p>
            </div>
            <div className="ll-actions">
              <button type="button" style={ui.btnGhost} onClick={clearFocus}>
                Close
              </button>
              <button
                type="button"
                className="ll-btn-map ll-btn-map--biz"
                onClick={() =>
                  navigate(
                    `/admin/map?business=${encodeURIComponent(detailBiz.user.id)}`,
                  )
                }
              >
                Show on map
              </button>
            </div>
          </div>
          <p style={ui.muted}>
            Zone:{' '}
            <strong>
              {detailBiz.user.businessProfile?.primaryDistrict?.name ??
                'Unassigned'}
            </strong>
            {detailBiz.user.businessProfile?.baseCity
              ? ` · ${detailBiz.user.businessProfile.baseCity.name}`
              : ''}
          </p>
          <form onSubmit={saveBusinessDistrict} style={{ marginBottom: '1rem' }}>
            <label>
              Update district
              <select
                style={ui.input}
                value={editDistrictId}
                onChange={(e) => setEditDistrictId(e.target.value)}
              >
                <option value="">Select…</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" style={ui.btn} disabled={!editDistrictId}>
              Save zone
            </button>
          </form>
          <p style={ui.muted}>
            Claims: <strong>{detailBiz.historic.claimCount}</strong> · Owned
            places: <strong>{detailBiz.historic.ownedPlaceCount}</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {detailBiz.historic.recentClaims.map((c) => (
              <li key={c.id}>
                {c.place.name} · {c.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function HistoricList({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginTop: '0.85rem' }}>
      <strong style={{ fontSize: '0.9rem' }}>{title}</strong>
      {items.length === 0 ? (
        <p style={{ ...ui.muted, margin: '0.25rem 0 0' }}>None yet</p>
      ) : (
        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem' }}>
          {items.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
