import { useEffect, useState } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type SeedStatus = {
  countries: number;
  activeCities: number;
  approvedPlaces: number;
  transportSystems: number;
  arrivalGuides: number;
  localRules: number;
  hint: string;
  supportFormUrl: string;
};

export function SeedToolsPage() {
  const [status, setStatus] = useState<SeedStatus | null>(null);

  useEffect(() => {
    void api<SeedStatus>('/v1/admin/seed-status').then(setStatus);
  }, []);

  if (!status) return <p style={ui.muted}>Loading seed status…</p>;

  const stats: Array<{ label: string; value: number }> = [
    { label: 'Countries', value: status.countries },
    { label: 'Active cities', value: status.activeCities },
    { label: 'Approved places', value: status.approvedPlaces },
    { label: 'Transport systems', value: status.transportSystems },
    { label: 'Arrival guides', value: status.arrivalGuides },
    { label: 'Local rules', value: status.localRules },
  ];

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Seed tools</h1>
          <p className="ll-page-sub">{status.hint}</p>
        </div>
      </div>

      <div style={{ ...ui.grid2, marginTop: '1.25rem' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...ui.card, marginBottom: 0 }}>
            <div
              style={{
                fontFamily: 'var(--ll-display)',
                fontSize: '2rem',
                fontWeight: 600,
                letterSpacing: '-0.03em',
              }}
            >
              {s.value}
            </div>
            <div style={{ ...ui.muted, marginTop: 4, fontWeight: 600 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...ui.panel, marginTop: '0.5rem' }}>
        <h2>Support form</h2>
        <p className="ll-page-sub" style={{ marginBottom: '0.85rem' }}>
          Public form URL used by Support pages and staging ops.
        </p>
        <a href={status.supportFormUrl} target="_blank" rel="noreferrer">
          {status.supportFormUrl}
        </a>
      </div>
    </div>
  );
}
