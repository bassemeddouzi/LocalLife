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
  } | null>(null);

  useEffect(() => {
    void api<typeof queue>('/v1/admin/moderation/queue').then(setQueue);
  }, []);

  return (
    <div style={ui.page}>
      <h1>Admin dashboard</h1>
      <p style={ui.muted}>Operate Djerba MVP without raw DB edits.</p>
      <div style={ui.row}>
        <Stat label="Pending places" value={queue?.places.length ?? '…'} />
        <Stat label="Open reports" value={queue?.reports.length ?? '…'} />
        <Stat label="Guide apps" value={queue?.guideApps.length ?? '…'} />
        <Stat label="Claims" value={queue?.claims.length ?? '…'} />
      </div>
      <div style={ui.card}>
        <Link to="/admin/moderation">Open moderation queue →</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ ...ui.card, minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      <div style={ui.muted}>{label}</div>
    </div>
  );
}
