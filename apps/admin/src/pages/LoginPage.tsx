import { useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPing, login } from '../api';

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
      if (data.user.role !== 'ADMIN') {
        throw new Error('Admin role required');
      }
      await adminPing(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h1>LocalLife Admin</h1>
        <p style={styles.muted}>ADMIN role required</p>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </label>
        {error ? <p style={styles.error}>{error}</p> : null}
        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
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
    width: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: '#1e293b',
    padding: 24,
    borderRadius: 12,
  },
  input: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
  },
  btn: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: '#0d9488',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: { color: '#f87171', margin: 0 },
  muted: { opacity: 0.7, marginTop: 0 },
};
