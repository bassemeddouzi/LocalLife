import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { ui } from '../../ui';

export function BusinessHomePage() {
  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>Business portal</h1>
          <p className="ll-page-sub">
            Claim places and edit allowed contact fields. No payments in MVP.
          </p>
        </div>
      </div>

      <div style={{ ...ui.grid2, marginTop: '1.25rem' }}>
        <LinkCard
          to="/business/profile"
          title="Profile"
          body="Create or update your business contact profile."
        />
        <LinkCard
          to="/business/claim"
          title="Claim a place"
          body="Request ownership of a listed venue."
        />
        <LinkCard
          to="/business/places"
          title="My places"
          body="Manage verified places after Admin approval."
        />
      </div>
    </div>
  );
}

function LinkCard({
  to,
  title,
  body,
}: {
  to: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      style={{
        ...ui.card,
        marginBottom: 0,
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
      }}
    >
      <strong style={{ fontSize: '1.05rem' }}>{title}</strong>
      <p style={{ ...ui.muted, margin: '0.4rem 0 0' }}>{body}</p>
    </Link>
  );
}

export function BusinessProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void api<{
      displayName?: string;
      contactEmail?: string;
      contactPhone?: string;
    } | null>('/v1/business/me').then((p) => {
      if (!p) return;
      setDisplayName(p.displayName ?? '');
      setContactEmail(p.contactEmail ?? '');
      setContactPhone(p.contactPhone ?? '');
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/v1/business/profile', {
        method: 'POST',
        body: JSON.stringify({ displayName, contactEmail, contactPhone }),
      });
      setMsg('Profile saved.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>Business profile</h1>
          <p className="ll-page-sub">Contact details shown to ops and claim flows.</p>
        </div>
      </div>
      {msg ? <div style={ui.alert}>{msg}</div> : null}
      <form onSubmit={onSubmit} style={ui.panel}>
        <label>
          Display name
          <input
            required
            style={ui.input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label>
          Contact email
          <input
            style={ui.input}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </label>
        <label>
          Contact phone
          <input
            style={ui.input}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </label>
        <button type="submit" style={ui.btn}>
          Save profile
        </button>
      </form>
    </div>
  );
}

export function BusinessClaimPage() {
  const [placeId, setPlaceId] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('https://example.com/evidence');
  const [places, setPlaces] = useState<Array<{ id: string; name: string }>>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void (async () => {
      const countries = await api<Array<{ id: string; iso2: string }>>(
        '/v1/countries',
        { auth: false },
      );
      const tn = countries.find((c) => c.iso2 === 'TN');
      if (!tn) return;
      const cities = await api<Array<{ id: string; slug: string }>>(
        `/v1/countries/${tn.id}/cities`,
        { auth: false },
      );
      const djerba = cities.find((c) => c.slug === 'djerba');
      if (!djerba) return;
      const list = await api<{ data: Array<{ id: string; name: string }> }>(
        `/v1/places?cityId=${djerba.id}&pageSize=50`,
        { auth: false },
      );
      setPlaces(list.data);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const claim = await api<{ id: string; status: string }>(
        '/v1/business/claims',
        {
          method: 'POST',
          body: JSON.stringify({ placeId, evidenceUrl }),
        },
      );
      setMsg(`Claim ${claim.id} · ${claim.status}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>Claim place</h1>
          <p className="ll-page-sub">
            Submit evidence; Admin verifies before the place is linked.
          </p>
        </div>
      </div>
      {msg ? <div style={ui.alert}>{msg}</div> : null}
      <form onSubmit={onSubmit} style={ui.panel}>
        <label>
          Place
          <select
            required
            style={ui.input}
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
          >
            <option value="">Select…</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Evidence URL
          <input
            style={ui.input}
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />
        </label>
        <button type="submit" style={ui.btn}>
          Submit claim
        </button>
      </form>
    </div>
  );
}

export function BusinessPlacesPage() {
  const [profile, setProfile] = useState<{
    id: string;
    claims: Array<{
      id: string;
      status: string;
      placeId: string;
      place?: { name?: string };
    }>;
  } | null>(null);
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void api<typeof profile>('/v1/business/me').then(setProfile);
  }, []);

  async function edit(placeId: string) {
    try {
      await api(`/v1/places/${placeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ phone }),
      });
      setMsg('Updated phone on linked place');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  const verified = (profile?.claims ?? []).filter((c) => c.status === 'VERIFIED');

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>My places</h1>
          <p className="ll-page-sub">
            Verified claims only. Phone is the allowed contact edit in MVP.
          </p>
        </div>
      </div>

      {msg ? <div style={ui.alert}>{msg}</div> : null}

      <div style={{ ...ui.panel, marginBottom: '1rem' }}>
        <label>
          New phone (allowed edit)
          <input
            style={ui.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>

      <div className="ll-table-wrap">
        <table className="ll-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {verified.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <p className="ll-empty">
                    No verified claims yet — wait for Admin approval
                  </p>
                </td>
              </tr>
            ) : (
              verified.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.place?.name ?? c.placeId.slice(0, 8)}</strong>
                  </td>
                  <td>
                    <span className="ll-badge ll-badge--ok">{c.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      style={{ ...ui.btn, ...ui.btnSm }}
                      onClick={() => void edit(c.placeId)}
                    >
                      Update phone
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
