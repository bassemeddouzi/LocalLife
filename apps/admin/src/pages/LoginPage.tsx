import { useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, saveSession } from '../api';
import { ui } from '../ui';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@locallife.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      saveSession(data);
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'GUIDE') navigate('/guide');
      else if (data.user.role === 'BUSINESS') navigate('/business');
      else setError('Use an ADMIN, GUIDE, or BUSINESS account for portals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
        <div style={styles.panel} className="ll-login-panel">
        <div style={styles.brandCol}>
          <div style={styles.eyebrow}>LocalLife</div>
          <h1 style={styles.title}>Portals</h1>
          <p style={styles.lead}>
            Admin moderation, Guide contributions, and Business claims — one
            calm console for Djerba ops.
          </p>
        </div>
        <form onSubmit={onSubmit} style={styles.card}>
          <h2 style={{ marginTop: 0 }}>Sign in</h2>
          <p style={{ ...ui.muted, marginTop: 0 }}>Admin · Guide · Business</p>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={ui.input}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={ui.input}
              autoComplete="current-password"
            />
          </label>
          {error ? (
            <p style={{ color: 'var(--ll-danger)', margin: '0 0 0.5rem' }}>
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={loading} style={{ ...ui.btn, width: '100%' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '2rem',
    background:
      'radial-gradient(900px 420px at 15% 10%, rgba(13,148,136,0.28), transparent 50%), radial-gradient(700px 380px at 90% 80%, rgba(15,23,42,0.55), transparent 45%), linear-gradient(160deg, #0b1324 0%, #132033 45%, #0f1c24 100%)',
  },
  panel: {
    width: 'min(920px, 100%)',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '1.5rem',
    alignItems: 'stretch',
  },
  brandCol: {
    color: '#e2e8f0',
    padding: '1.5rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: '0.75rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#5eead4',
    fontWeight: 800,
  },
  title: {
    fontFamily: 'var(--ll-display)',
    fontSize: '3rem',
    margin: '0.35rem 0 0.75rem',
    color: '#f8fafc',
    letterSpacing: '-0.04em',
  },
  lead: {
    margin: 0,
    color: '#94a3b8',
    lineHeight: 1.55,
    maxWidth: '34ch',
    fontSize: '1.02rem',
  },
  card: {
    background: 'rgba(255,255,255,0.97)',
    color: 'var(--ll-ink)',
    padding: '1.5rem',
    borderRadius: 16,
    boxShadow: '0 20px 50px rgba(0,0,0,0.28)',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
};
