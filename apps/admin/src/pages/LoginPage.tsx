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
      <form onSubmit={onSubmit} style={styles.card}>
        <h1>LocalLife Portals</h1>
        <p style={ui.muted}>Admin · Guide · Business</p>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={ui.input}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={ui.input}
          />
        </label>
        {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
        <button type="submit" disabled={loading} style={ui.btn}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p style={{ ...ui.muted, fontSize: 12 }}>
          Seeds: admin@ / guide@ · Create BUSINESS via API profile first
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#0f172a',
    color: '#e2e8f0',
  },
  card: {
    width: 380,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: '#1e293b',
    padding: 24,
    borderRadius: 12,
  },
};
