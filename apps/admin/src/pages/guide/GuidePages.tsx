import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { ui } from '../../ui';

export function GuideHomePage() {
  const [profile, setProfile] = useState<{ status?: string; bio?: string } | null>(
    null,
  );

  useEffect(() => {
    void api<{ status?: string; bio?: string } | null>('/v1/guides/me').then(
      setProfile,
    );
  }, []);

  return (
    <div style={ui.page}>
      <h1>Guide home</h1>
      <p style={ui.muted}>
        Status: {profile?.status ?? 'no profile — apply if needed'}
      </p>
      <div style={ui.card}>
        <Link to="/guide/submit-place">Submit a place →</Link>
      </div>
      <div style={ui.card}>
        <Link to="/guide/submit-tip">Submit a tip →</Link>
      </div>
      <div style={ui.card}>
        <Link to="/guide/submissions">Track submissions →</Link>
      </div>
    </div>
  );
}

export function GuideSubmitPlacePage() {
  const [cityId, setCityId] = useState('');
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [lat, setLat] = useState('33.81');
  const [lng, setLng] = useState('10.85');
  const [photoUrl, setPhotoUrl] = useState(
    'https://placehold.co/800x600/png?text=Guide+Photo',
  );
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
      if (djerba) setCityId(djerba.id);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const place = await api<{ id: string; verificationStatus: string }>(
        '/v1/places',
        {
          method: 'POST',
          body: JSON.stringify({
            cityId,
            name,
            summary,
            latitude: Number(lat),
            longitude: Number(lng),
          }),
        },
      );
      if (photoUrl) {
        await api(`/v1/places/${place.id}/photos`, {
          method: 'POST',
          body: JSON.stringify({ url: photoUrl, caption: 'Guide upload' }),
        });
      }
      setMsg(`Created ${place.id} · ${place.verificationStatus}`);
      setName('');
      setSummary('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={ui.page}>
      <h1>Submit place</h1>
      <form onSubmit={onSubmit} style={ui.card}>
        <label>
          Name
          <input
            required
            style={ui.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Summary
          <textarea
            required
            style={{ ...ui.input, minHeight: 80 }}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <label>
          Latitude
          <input
            style={ui.input}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </label>
        <label>
          Longitude
          <input
            style={ui.input}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </label>
        <label>
          Photo URL (placeholder OK)
          <input
            style={ui.input}
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </label>
        <button type="submit" style={ui.btn}>
          Submit PENDING
        </button>
      </form>
      {msg ? <p>{msg}</p> : null}
    </div>
  );
}

export function GuideSubmitTipPage() {
  const [cityId, setCityId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
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
      if (djerba) setCityId(djerba.id);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const tip = await api<{ id: string; verificationStatus: string }>(
        '/v1/guides/tips',
        {
          method: 'POST',
          body: JSON.stringify({ cityId, title, summary }),
        },
      );
      setMsg(`Tip ${tip.id} · ${tip.verificationStatus}`);
      setTitle('');
      setSummary('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={ui.page}>
      <h1>Submit tip</h1>
      <form onSubmit={onSubmit} style={ui.card}>
        <label>
          Title
          <input
            required
            style={ui.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Summary
          <textarea
            required
            style={{ ...ui.input, minHeight: 80 }}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <button type="submit" style={ui.btn}>
          Submit PENDING
        </button>
      </form>
      {msg ? <p>{msg}</p> : null}
    </div>
  );
}

export function GuideSubmissionsPage() {
  const [data, setData] = useState<{
    places: Array<{ id: string; name: string; verificationStatus: string }>;
  } | null>(null);

  useEffect(() => {
    void api<typeof data>('/v1/guides/me/submissions').then(setData);
  }, []);

  return (
    <div style={ui.page}>
      <h1>My submissions</h1>
      {(data?.places ?? []).map((p) => (
        <div key={p.id} style={ui.card}>
          <strong>{p.name}</strong>
          <div style={ui.muted}>{p.verificationStatus}</div>
        </div>
      ))}
      {!data?.places?.length ? <p style={ui.muted}>No place submissions yet.</p> : null}
    </div>
  );
}
