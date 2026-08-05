import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type Freshness = {
  stalePlaces: number;
  pendingSubGuides: number;
  openReports: number;
  planPackCount?: number;
  staleThresholdDays?: number;
};

export function FreshnessPage() {
  const [data, setData] = useState<Freshness | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setData(await api<Freshness>('/v1/admin/freshness'));
  }, []);

  useEffect(() => {
    void load().catch((e) => setMsg(String(e)));
  }, [load]);

  const days = data?.staleThresholdDays ?? 30;

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Content freshness</h1>
          <p className="ll-page-sub">
            Places not reviewed in {days} days, pending SubGuides, and open
            reports.
          </p>
        </div>
        <button type="button" style={ui.btn} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {msg ? <div style={ui.alert}>{msg}</div> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={ui.card}>
          <div style={{ ...ui.muted, fontSize: '0.8rem' }}>Stale places</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            {data?.stalePlaces ?? '—'}
          </div>
          <p style={ui.muted}>lastReviewedAt null or older than {days}d</p>
        </div>
        <div style={ui.card}>
          <div style={{ ...ui.muted, fontSize: '0.8rem' }}>Pending SubGuides</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            {data?.pendingSubGuides ?? '—'}
          </div>
          <p style={ui.muted}>Awaiting admin confirmation</p>
        </div>
        <div style={ui.card}>
          <div style={{ ...ui.muted, fontSize: '0.8rem' }}>Open reports</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            {data?.openReports ?? '—'}
          </div>
          <p style={ui.muted}>Status OPEN</p>
        </div>
      </div>

      <div style={ui.panel}>
        <h2 style={{ marginTop: 0 }}>Plan packs</h2>
        <p style={ui.muted}>
          Enabled packs in DB: <strong>{data?.planPackCount ?? '—'}</strong>
        </p>
        <p style={ui.muted}>
          Seed note: run <code>prisma db seed</code> to upsert packs{' '}
          <code>arrival_kit</code>, <code>student_essentials</code>, and{' '}
          <code>transport_only</code> for the active city. There is no separate
          admin plan-pack editor yet — packs are listed to travelers via{' '}
          <code>GET /v1/me/plan-packs</code>.
        </p>
      </div>
    </div>
  );
}
