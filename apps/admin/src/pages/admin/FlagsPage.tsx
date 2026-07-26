import { useEffect, useState } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type Flag = {
  key: string;
  description?: string | null;
  enabledGlobal: boolean;
};

export function FlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [key, setKey] = useState('FF_AI_AGENT');
  const [msg, setMsg] = useState('');

  async function load() {
    setFlags(await api<Flag[]>('/v1/admin/feature-flags'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(flag: Flag) {
    await api(`/v1/admin/feature-flags/${flag.key}`, {
      method: 'POST',
      body: JSON.stringify({ enabledGlobal: !flag.enabledGlobal }),
    });
    setMsg(`Updated ${flag.key}`);
    await load();
  }

  async function create() {
    await api(`/v1/admin/feature-flags/${key}`, {
      method: 'POST',
      body: JSON.stringify({
        enabledGlobal: false,
        description: key,
      }),
    });
    setMsg(`Upserted ${key}`);
    await load();
  }

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Feature flags</h1>
          <p className="ll-page-sub">
            Toggle product capabilities globally without a redeploy.
          </p>
        </div>
      </div>

      {msg ? <div style={ui.alert}>{msg}</div> : null}

      <div className="ll-table-wrap" style={{ marginBottom: '1.25rem' }}>
        <table className="ll-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Description</th>
              <th>State</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <p className="ll-empty">No flags yet</p>
                </td>
              </tr>
            ) : (
              flags.map((f) => (
                <tr key={f.key}>
                  <td>
                    <strong>{f.key}</strong>
                  </td>
                  <td style={ui.muted}>{f.description ?? '—'}</td>
                  <td>
                    <span
                      className={`ll-badge ${
                        f.enabledGlobal ? 'll-badge--ok' : 'll-badge--neutral'
                      }`}
                    >
                      {f.enabledGlobal ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      style={{
                        ...(f.enabledGlobal ? ui.btnGhost : ui.btn),
                        ...ui.btnSm,
                      }}
                      onClick={() => void toggle(f)}
                    >
                      {f.enabledGlobal ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={ui.panel}>
        <h2>Create / upsert</h2>
        <label>
          Flag key
          <input
            style={ui.input}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <button type="button" style={ui.btn} onClick={() => void create()}>
          Save flag
        </button>
      </div>
    </div>
  );
}
