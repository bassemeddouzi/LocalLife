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
    await load();
  }

  return (
    <div style={ui.page}>
      <h1>Feature flags</h1>
      {msg ? <p style={ui.muted}>{msg}</p> : null}
      {flags.map((f) => (
        <div key={f.key} style={ui.card}>
          <strong>{f.key}</strong>
          <div style={ui.muted}>{f.description}</div>
          <button type="button" style={ui.btn} onClick={() => void toggle(f)}>
            {f.enabledGlobal ? 'Disable' : 'Enable'}
          </button>
        </div>
      ))}
      <div style={ui.card}>
        <label>
          New flag key
          <input
            style={ui.input}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <button type="button" style={ui.btn} onClick={() => void create()}>
          Create / upsert
        </button>
      </div>
    </div>
  );
}
