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

  if (!status) return <p>Loading…</p>;

  return (
    <div style={ui.page}>
      <h1>Seed tools</h1>
      <p style={ui.muted}>{status.hint}</p>
      <div style={ui.card}>
        <ul>
          <li>Countries: {status.countries}</li>
          <li>Active cities: {status.activeCities}</li>
          <li>Approved places: {status.approvedPlaces}</li>
          <li>Transport systems: {status.transportSystems}</li>
          <li>Arrival guides: {status.arrivalGuides}</li>
          <li>Local rules: {status.localRules}</li>
        </ul>
      </div>
      <div style={ui.card}>
        <strong>Support form URL</strong>
        <div>
          <a href={status.supportFormUrl} target="_blank" rel="noreferrer">
            {status.supportFormUrl}
          </a>
        </div>
      </div>
    </div>
  );
}
