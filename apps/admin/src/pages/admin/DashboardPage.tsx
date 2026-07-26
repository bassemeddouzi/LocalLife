import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { ui } from '../../ui';

export function AdminDashboard() {
  const [queue, setQueue] = useState<{
    places: unknown[];
    reports: unknown[];
    guideApps: unknown[];
    claims: unknown[];
    tips: unknown[];
  } | null>(null);

  useEffect(() => {
    void api<typeof queue>('/v1/admin/moderation/queue').then(setQueue);
  }, []);

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="ll-page-sub">
            Snapshot of pending work for Djerba staging. Jump into moderation or
            user ops without touching the database.
          </p>
        </div>
        <Link to="/admin/moderation" style={{ ...ui.btn, textDecoration: 'none' }}>
          Open moderation
        </Link>
      </div>

      <div style={{ ...ui.grid2, marginTop: '1.5rem' }}>
        <Stat label="Pending places" value={queue?.places.length ?? '…'} />
        <Stat label="Pending tips" value={queue?.tips?.length ?? '…'} />
        <Stat label="Open reports" value={queue?.reports.length ?? '…'} />
        <Stat label="Guide apps" value={queue?.guideApps.length ?? '…'} />
        <Stat label="Business claims" value={queue?.claims.length ?? '…'} />
      </div>

      <div style={{ ...ui.panel, marginTop: '0.5rem' }}>
        <h2>Quick links</h2>
        <div className="ll-actions">
          <Link to="/admin/map" style={{ ...ui.btnGhost, textDecoration: 'none' }}>
            Service map
          </Link>
          <Link to="/admin/users" style={{ ...ui.btnGhost, textDecoration: 'none' }}>
            Users & provisioning
          </Link>
          <Link to="/admin/ai-config" style={{ ...ui.btnGhost, textDecoration: 'none' }}>
            AI model config
          </Link>
          <Link to="/admin/seed" style={{ ...ui.btnGhost, textDecoration: 'none' }}>
            Seed status
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ ...ui.card, marginBottom: 0 }}>
      <div
        style={{
          fontFamily: 'var(--ll-display)',
          fontSize: '2rem',
          fontWeight: 600,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </div>
      <div style={{ ...ui.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}
