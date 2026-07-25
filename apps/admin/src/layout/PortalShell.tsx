import {
  NavLink,
  Outlet,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';
import { clearSession, getPortalUser } from '../api';

function RequireRole({
  role,
  children,
}: {
  role: string | string[];
  children: ReactNode;
}) {
  const token = localStorage.getItem('accessToken');
  const user = getPortalUser();
  if (!token || !user) return <Navigate to="/login" replace />;
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  return <RequireRole role="ADMIN">{children}</RequireRole>;
}

export function RequireGuide({ children }: { children: ReactNode }) {
  return <RequireRole role={['GUIDE', 'ADMIN']}>{children}</RequireRole>;
}

export function RequireBusiness({ children }: { children: ReactNode }) {
  return <RequireRole role={['BUSINESS', 'ADMIN']}>{children}</RequireRole>;
}

function Shell({
  title,
  links,
}: {
  title: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}) {
  const navigate = useNavigate();
  const user = getPortalUser();

  return (
    <div style={styles.layout}>
      <aside style={styles.aside}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p style={styles.muted}>{user?.displayName ?? user?.email}</p>
        <nav style={styles.nav}>
          {links.map((item) => (
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
        <a href="/support" style={styles.support}>
          Support
        </a>
        <button
          type="button"
          onClick={() => {
            clearSession();
            navigate('/login');
          }}
          style={styles.logout}
        >
          Logout
        </button>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export function AdminShell() {
  return (
    <Shell
      title="LocalLife Admin"
      links={[
        { to: '/admin', label: 'Dashboard', end: true },
        { to: '/admin/moderation', label: 'Moderation' },
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/ai-config', label: 'AI Config' },
        { to: '/admin/flags', label: 'Feature Flags' },
        { to: '/admin/seed', label: 'Seed tools' },
        { to: '/legal/privacy', label: 'Privacy' },
        { to: '/legal/terms', label: 'Terms' },
      ]}
    />
  );
}

export function GuideShell() {
  return (
    <Shell
      title="Guide Portal"
      links={[
        { to: '/guide', label: 'Home', end: true },
        { to: '/guide/submit-place', label: 'Submit place' },
        { to: '/guide/submit-tip', label: 'Submit tip' },
        { to: '/guide/submissions', label: 'My submissions' },
        { to: '/support', label: 'Support' },
      ]}
    />
  );
}

export function BusinessShell() {
  return (
    <Shell
      title="Business Portal"
      links={[
        { to: '/business', label: 'Home', end: true },
        { to: '/business/profile', label: 'Profile' },
        { to: '/business/claim', label: 'Claim place' },
        { to: '/business/places', label: 'My places' },
        { to: '/support', label: 'Support' },
      ]}
    />
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
  support: {
    color: '#99f6e4',
    textDecoration: 'none',
    padding: '8px 12px',
  },
  logout: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #334155',
    background: 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
  },
};
