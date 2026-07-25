import {
  NavLink,
  Outlet,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/moderation', label: 'Moderation' },
  { to: '/users', label: 'Users' },
  { to: '/ai-config', label: 'AI Config' },
  { to: '/flags', label: 'Feature Flags' },
  { to: '/seed', label: 'Seed tools' },
];

export function RequireAdmin({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('accessToken');
  const userRaw = localStorage.getItem('adminUser');
  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userRaw) as { role?: string };
  if (user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function AdminShell() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('adminUser') ?? '{}') as {
    displayName?: string;
    email?: string;
  };

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  }

  return (
    <div style={styles.layout}>
      <aside style={styles.aside}>
        <h2 style={{ marginTop: 0 }}>LocalLife</h2>
        <p style={styles.muted}>{user.displayName ?? user.email}</p>
        <nav style={styles.nav}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.link,
                background: isActive ? '#0f766e' : 'transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={logout} style={styles.logout}>
          Logout
        </button>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p style={{ opacity: 0.7 }}>
        Placeholder screen — full MVP UI lands in Phase 05b.
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  layout: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
  aside: {
    width: 240,
    background: '#0f172a',
    color: '#e2e8f0',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  link: {
    color: '#e2e8f0',
    textDecoration: 'none',
    padding: '10px 12px',
    borderRadius: 8,
  },
  main: { flex: 1, padding: 32 },
  muted: { opacity: 0.7, marginTop: 0 },
  logout: {
    marginTop: 'auto',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #334155',
    background: 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  },
};
