import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type AiConfig = {
  provider: string;
  modelId: string;
  fallbackModelId: string | null;
  enabled: boolean;
  apiKeyConfigured: boolean;
  suggestedModels: string[];
  updatedAt?: string | null;
};

export function AiConfigPage() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [modelId, setModelId] = useState('');
  const [fallback, setFallback] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void api<AiConfig>('/v1/admin/ai-config').then((c) => {
      setConfig(c);
      setModelId(c.modelId);
      setFallback(c.fallbackModelId ?? '');
      setEnabled(c.enabled);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const saved = await api<AiConfig>('/v1/admin/ai-config', {
        method: 'PATCH',
        body: JSON.stringify({
          modelId,
          fallbackModelId: fallback || undefined,
          enabled,
        }),
      });
      setConfig(saved);
      setMsg('Saved — next chats use this model id');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    }
  }

  if (!config) return <p>Loading…</p>;

  return (
    <div style={ui.page}>
      <h1>AI Config</h1>
      <p style={ui.muted}>
        Provider: {config.provider} · API key configured:{' '}
        {config.apiKeyConfigured ? 'yes' : 'no'} (secret never shown)
      </p>
      <form onSubmit={onSubmit} style={ui.card}>
        <label>
          Model id
          <input
            style={ui.input}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          />
        </label>
        <label>
          Fallback model id
          <input
            style={ui.input}
            value={fallback}
            onChange={(e) => setFallback(e.target.value)}
          />
        </label>
        <label style={ui.row}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
        <div style={ui.row}>
          {config.suggestedModels.map((m) => (
            <button
              key={m}
              type="button"
              style={ui.btnGhost}
              onClick={() => setModelId(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <button type="submit" style={{ ...ui.btn, marginTop: 12 }}>
          Save
        </button>
      </form>
      {msg ? <p>{msg}</p> : null}
    </div>
  );
}
