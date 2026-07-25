import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { ui } from '../../ui';

export function BusinessHomePage() {
  return (
    <div style={ui.page}>
      <h1>Business portal</h1>
      <p style={ui.muted}>Claim places and edit allowed contact fields. No payments.</p>
      <div style={ui.card}>
        <Link to="/business/profile">Create / update profile →</Link>
      </div>
      <div style={ui.card}>
        <Link to="/business/claim">Claim a place →</Link>
      </div>
      <div style={ui.card}>
        <Link to="/business/places">Manage linked places →</Link>
      </div>
    </div>
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
      setMsg('Profile saved. Re-login if you just upgraded from CLIENT.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={ui.page}>
      <h1>Business profile</h1>
      <form onSubmit={onSubmit} style={ui.card}>
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
          Save
        </button>
      </form>
      {msg ? <p>{msg}</p> : null}
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
      <h1>Claim place</h1>
      <form onSubmit={onSubmit} style={ui.card}>
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
      {msg ? <p>{msg}</p> : null}
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
    <div style={ui.page}>
      <h1>My places</h1>
      <label>
        New phone (allowed edit)
        <input
          style={ui.input}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      {verified.map((c) => (
        <div key={c.id} style={ui.card}>
          <strong>{c.placeId.slice(0, 8)}</strong>
          <div style={ui.muted}>{c.status}</div>
          <button type="button" style={ui.btn} onClick={() => void edit(c.placeId)}>
            Update phone
          </button>
        </div>
      ))}
      {!verified.length ? (
        <p style={ui.muted}>No verified claims yet — wait for Admin approval.</p>
      ) : null}
      {msg ? <p>{msg}</p> : null}
    </div>
  );
}
