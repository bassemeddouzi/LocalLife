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
      <div className="ll-page-head">
        <div>
          <h1>Guide home</h1>
          <p className="ll-page-sub">
            Submit places and tips for Djerba. Admin reviews before they go live.
          </p>
        </div>
        {profile?.status ? (
          <span className="ll-badge ll-badge--ok">{profile.status}</span>
        ) : (
          <span className="ll-badge ll-badge--neutral">No profile</span>
        )}
      </div>

      <div style={{ ...ui.grid2, marginTop: '1.25rem' }}>
        <LinkCard to="/guide/submit-place" title="Submit a place" body="Add a venue with location and photo." />
        <LinkCard to="/guide/submit-tip" title="Submit a tip" body="Share a practical local tip." />
        <LinkCard to="/guide/submissions" title="Track submissions" body="See pending and approved work." />
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
      <div className="ll-page-head">
        <div>
          <h1>Submit place</h1>
          <p className="ll-page-sub">
            New places enter PENDING until Admin approves them.
          </p>
        </div>
      </div>
      {msg ? <div style={ui.alert}>{msg}</div> : null}
      <form onSubmit={onSubmit} style={ui.panel}>
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
        <div style={ui.grid2}>
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
        </div>
        <label>
          Photo URL (placeholder OK)
          <input
            style={ui.input}
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </label>
        <button type="submit" style={ui.btn}>
          Submit for review
        </button>
      </form>
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
      <div className="ll-page-head">
        <div>
          <h1>Submit tip</h1>
          <p className="ll-page-sub">
            Tips stay PENDING until moderation clears them.
          </p>
        </div>
      </div>
      {msg ? <div style={ui.alert}>{msg}</div> : null}
      <form onSubmit={onSubmit} style={ui.panel}>
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
          Submit for review
        </button>
      </form>
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

  const places = data?.places ?? [];

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>My submissions</h1>
          <p className="ll-page-sub">Places you submitted and their review status.</p>
        </div>
      </div>

      <div className="ll-table-wrap">
        <table className="ll-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {places.length === 0 ? (
              <tr>
                <td colSpan={2}>
                  <p className="ll-empty">No place submissions yet</p>
                </td>
              </tr>
            ) : (
              places.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span
                      className={`ll-badge ${
                        p.verificationStatus === 'APPROVED'
                          ? 'll-badge--ok'
                          : p.verificationStatus === 'REJECTED'
                            ? 'll-badge--danger'
                            : 'll-badge--warn'
                      }`}
                    >
                      {p.verificationStatus}
                    </span>
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
