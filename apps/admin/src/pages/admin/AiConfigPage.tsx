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

  if (!config) return <p style={ui.muted}>Loading AI config…</p>;

  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>AI config</h1>
          <p className="ll-page-sub">
            Choose the chat model for the grounded agent. API keys stay on the
            server and are never shown here.
          </p>
        </div>
      </div>

      {msg ? <div style={ui.alert}>{msg}</div> : null}

      <div style={{ ...ui.grid2, marginBottom: '1rem' }}>
        <Meta label="Provider" value={config.provider} />
        <Meta
          label="API key"
          value={config.apiKeyConfigured ? 'Configured' : 'Missing'}
          badge={config.apiKeyConfigured ? 'ok' : 'danger'}
        />
        <Meta
          label="Status"
          value={config.enabled ? 'Enabled' : 'Disabled'}
          badge={config.enabled ? 'ok' : 'neutral'}
        />
      </div>

      <form onSubmit={onSubmit} style={ui.panel}>
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
        <label style={{ ...ui.row, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span style={{ fontWeight: 600, color: 'var(--ll-ink)' }}>Enabled</span>
        </label>

        {config.suggestedModels.length ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...ui.muted, fontSize: '0.82rem', marginBottom: 8 }}>
              Suggested models
            </div>
            <div className="ll-actions">
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
          </div>
        ) : null}

        <button type="submit" style={ui.btn}>
          Save changes
        </button>
      </form>
    </div>
  );
}

function Meta({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: 'ok' | 'danger' | 'neutral';
}) {
  return (
    <div style={{ ...ui.card, marginBottom: 0 }}>
      <div style={{ ...ui.muted, fontSize: '0.78rem', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontWeight: 700 }}>
        {badge ? (
          <span className={`ll-badge ll-badge--${badge}`}>{value}</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
