import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { ui } from '../../ui';

type Cat = { id: string; key: string; name: string };
type District = { id: string; name: string; slug: string };

async function loadDjerbaCityId(): Promise<string> {
  const countries = await api<Array<{ id: string; iso2: string }>>(
    '/v1/countries',
    { auth: false },
  );
  const tn = countries.find((c) => c.iso2 === 'TN');
  if (!tn) return '';
  const cities = await api<Array<{ id: string; slug: string }>>(
    `/v1/countries/${tn.id}/cities`,
    { auth: false },
  );
  return cities.find((c) => c.slug === 'djerba')?.id ?? '';
}

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
            Add zone knowledge for Djerba. Admin reviews before it goes live on
            the map / app.
          </p>
        </div>
        {profile?.status ? (
          <span className="ll-badge ll-badge--ok">{profile.status}</span>
        ) : (
          <span className="ll-badge ll-badge--neutral">No profile</span>
        )}
      </div>

      <div style={{ ...ui.grid2, marginTop: '1.25rem' }}>
        <LinkCard
          to="/guide/submit-place"
          title="Submit a place"
          body="Venue with category, location, and optional attributes."
        />
        <LinkCard
          to="/guide/submit-tip"
          title="Submit a tip"
          body="Transport how-to, rental notes, practical advice."
        />
        <LinkCard
          to="/guide/submit-event"
          title="Submit an event"
          body="Something happening in your zone."
        />
        <LinkCard
          to="/guide/submit-experience"
          title="Submit an experience"
          body="A short curated itinerary."
        />
        <LinkCard
          to="/guide/propose-business"
          title="Propose a Business"
          body="Suggest a Business account for Admin approval."
        />
        <LinkCard
          to="/guide/submissions"
          title="Track submissions"
          body="See pending and approved work."
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

export function GuideSubmitPlacePage() {
  const [cityId, setCityId] = useState('');
  const [categories, setCategories] = useState<Cat[]>([]);
  const [categoryKey, setCategoryKey] = useState('restaurants');
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [lat, setLat] = useState('33.81');
  const [lng, setLng] = useState('10.85');
  const [bestTime, setBestTime] = useState('');
  const [budgetFriendly, setBudgetFriendly] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(
    'https://placehold.co/800x600/png?text=Guide+Photo',
  );
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void (async () => {
      setCityId(await loadDjerbaCityId());
      try {
        const cats = await api<Cat[]>('/v1/categories', { auth: false });
        setCategories(cats);
        if (cats[0]) setCategoryKey(cats[0].key);
      } catch {
        /* categories endpoint may require seed */
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const attributes: Record<string, string | boolean> = {};
      if (bestTime.trim()) attributes.bestTimeOfDay = bestTime.trim();
      if (budgetFriendly) attributes.budgetFriendly = true;
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
            categoryKey,
            attributes:
              Object.keys(attributes).length > 0 ? attributes : undefined,
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
            New places enter PENDING until Admin approves them (then map pin).
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
          Category
          <select
            style={ui.input}
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
          >
            {(categories.length
              ? categories
              : [{ id: 'x', key: 'restaurants', name: 'Restaurants' }]
            ).map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
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
        <div style={ui.grid2}>
          <label>
            Best time of day (optional)
            <input
              style={ui.input}
              placeholder="sunset / morning…"
              value={bestTime}
              onChange={(e) => setBestTime(e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={budgetFriendly}
              onChange={(e) => setBudgetFriendly(e.target.checked)}
            />
            Budget friendly
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
  const [categoryKey, setCategoryKey] = useState('local_tip');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void loadDjerbaCityId().then(setCityId);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const tip = await api<{ id: string; verificationStatus: string }>(
        '/v1/guides/tips',
        {
          method: 'POST',
          body: JSON.stringify({ cityId, title, summary, categoryKey }),
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
          Category key
          <input
            style={ui.input}
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
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

export function GuideSubmitEventPage() {
  const [cityId, setCityId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void loadDjerbaCityId().then(setCityId);
    const d = new Date(Date.now() + 86400000);
    setStartsAt(d.toISOString().slice(0, 16));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const event = await api<{ id: string; verificationStatus: string }>(
        '/v1/guides/events',
        {
          method: 'POST',
          body: JSON.stringify({
            cityId,
            title,
            summary,
            startsAt: new Date(startsAt).toISOString(),
          }),
        },
      );
      setMsg(`Event ${event.id} · ${event.verificationStatus}`);
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
          <h1>Submit event</h1>
          <p className="ll-page-sub">Events go PENDING until Admin approves.</p>
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
        <label>
          Starts at
          <input
            required
            type="datetime-local"
            style={ui.input}
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </label>
        <button type="submit" style={ui.btn}>
          Submit for review
        </button>
      </form>
    </div>
  );
}

export function GuideSubmitExperiencePage() {
  const [cityId, setCityId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void loadDjerbaCityId().then(setCityId);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const xp = await api<{ id: string; verificationStatus: string }>(
        '/v1/guides/experiences',
        {
          method: 'POST',
          body: JSON.stringify({
            cityId,
            title,
            summary,
            steps: [{ title: 'Start', description: summary }],
          }),
        },
      );
      setMsg(`Experience ${xp.id} · ${xp.verificationStatus}`);
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
          <h1>Submit experience</h1>
          <p className="ll-page-sub">
            Curated itineraries stay PENDING until moderation.
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

export function GuideProposeBusinessPage() {
  const [cityId, setCityId] = useState('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtId, setDistrictId] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void (async () => {
      const id = await loadDjerbaCityId();
      setCityId(id);
      if (!id) return;
      const rows = await api<District[]>(`/v1/cities/${id}/districts`, {
        auth: false,
      });
      setDistricts(rows);
      if (rows[0]) setDistrictId(rows[0].id);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const app = await api<{ id: string; status: string }>(
        '/v1/guides/business-applications',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            displayName,
            baseCityId: cityId,
            primaryDistrictId: districtId,
            note: note || undefined,
          }),
        },
      );
      setMsg(`Application ${app.id} · ${app.status}`);
      setEmail('');
      setDisplayName('');
      setNote('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>Propose Business</h1>
          <p className="ll-page-sub">
            Admin must approve before the Business account is created.
          </p>
        </div>
      </div>
      {msg ? <div style={ui.alert}>{msg}</div> : null}
      <form onSubmit={onSubmit} style={ui.panel}>
        <label>
          Business display name
          <input
            required
            style={ui.input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label>
          Business email
          <input
            required
            type="email"
            style={ui.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          District
          <select
            required
            style={ui.input}
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
          >
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Note (optional)
          <textarea
            style={{ ...ui.input, minHeight: 80 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button type="submit" style={ui.btn} disabled={!cityId || !districtId}>
          Submit proposal
        </button>
      </form>
    </div>
  );
}

type Submissions = {
  places: Array<{ id: string; name: string; verificationStatus: string }>;
  tips: Array<{ id: string; title: string; verificationStatus: string }>;
  events: Array<{ id: string; title: string; verificationStatus: string }>;
  experiences: Array<{ id: string; title: string; verificationStatus: string }>;
  businessApplications: Array<{
    id: string;
    displayName: string;
    email: string;
    status: string;
  }>;
};

export function GuideSubmissionsPage() {
  const [data, setData] = useState<Submissions | null>(null);

  useEffect(() => {
    void api<Submissions>('/v1/guides/me/submissions').then(setData);
  }, []);

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>My submissions</h1>
          <p className="ll-page-sub">
            Places, tips, events, experiences, and Business proposals.
          </p>
        </div>
      </div>

      <SubTable
        title="Places"
        empty="No places yet"
        rows={(data?.places ?? []).map((p) => ({
          id: p.id,
          label: p.name,
          status: p.verificationStatus,
        }))}
      />
      <SubTable
        title="Tips"
        empty="No tips yet"
        rows={(data?.tips ?? []).map((t) => ({
          id: t.id,
          label: t.title,
          status: t.verificationStatus,
        }))}
      />
      <SubTable
        title="Events"
        empty="No events yet"
        rows={(data?.events ?? []).map((e) => ({
          id: e.id,
          label: e.title,
          status: e.verificationStatus,
        }))}
      />
      <SubTable
        title="Experiences"
        empty="No experiences yet"
        rows={(data?.experiences ?? []).map((e) => ({
          id: e.id,
          label: e.title,
          status: e.verificationStatus,
        }))}
      />
      <SubTable
        title="Business applications"
        empty="No Business proposals yet"
        rows={(data?.businessApplications ?? []).map((a) => ({
          id: a.id,
          label: `${a.displayName} (${a.email})`,
          status: a.status,
        }))}
      />
    </div>
  );
}

function SubTable({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; label: string; status: string }>;
}) {
  return (
    <section style={{ ...ui.panel, marginTop: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="ll-table-wrap" style={{ boxShadow: 'none' }}>
        <table className="ll-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2}>
                  <p className="ll-empty">{empty}</p>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.label}</strong>
                  </td>
                  <td>
                    <span
                      className={`ll-badge ${
                        r.status === 'APPROVED'
                          ? 'll-badge--ok'
                          : r.status === 'REJECTED'
                            ? 'll-badge--danger'
                            : 'll-badge--warn'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
