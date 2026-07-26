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
  brand,
  eyebrow,
  links,
}: {
  brand: string;
  eyebrow: string;
  links: Array<{ to: string; label: string; end?: boolean }>;
}) {
  const navigate = useNavigate();
  const user = getPortalUser();

  return (
    <div style={styles.layout} className="ll-shell-layout">
      <aside style={styles.aside}>
        <div style={styles.brandBlock}>
          <div style={styles.eyebrow}>{eyebrow}</div>
          <div style={styles.brand}>{brand}</div>
        </div>
        <div style={styles.userCard} className="ll-user-card">
          <div style={styles.userName}>{user?.displayName ?? 'User'}</div>
          <div style={styles.userMeta}>{user?.email}</div>
          <div style={styles.rolePill}>{user?.role}</div>
        </div>
        <nav style={styles.nav}>
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.link,
                background: isActive ? 'rgba(13, 148, 136, 0.22)' : 'transparent',
                color: isActive ? '#5eead4' : styles.link.color,
                borderColor: isActive ? 'rgba(94, 234, 212, 0.35)' : 'transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.footer}>
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
            Log out
          </button>
        </div>
      </aside>
      <div style={styles.stage}>
        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminShell() {
  return (
    <Shell
      brand="LocalLife"
      eyebrow="Admin console"
      links={[
        { to: '/admin', label: 'Dashboard', end: true },
        { to: '/admin/map', label: 'Map' },
        { to: '/admin/moderation', label: 'Moderation' },
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/ai-config', label: 'AI config' },
        { to: '/admin/flags', label: 'Feature flags' },
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
      brand="LocalLife"
      eyebrow="Guide portal"
      links={[
        { to: '/guide', label: 'Home', end: true },
        { to: '/guide/submit-place', label: 'Place' },
        { to: '/guide/submit-tip', label: 'Tip' },
        { to: '/guide/submit-event', label: 'Event' },
        { to: '/guide/submit-experience', label: 'Experience' },
        { to: '/guide/propose-business', label: 'Business' },
        { to: '/guide/submissions', label: 'Submissions' },
        { to: '/support', label: 'Support' },
      ]}
    />
  );
}

export function BusinessShell() {
  return (
    <Shell
      brand="LocalLife"
      eyebrow="Business portal"
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    minHeight: '100vh',
    background: 'var(--ll-bg)',
  },
  aside: {
    background:
      'linear-gradient(180deg, #0b1324 0%, #111b2e 55%, #0d1a24 100%)',
    color: 'var(--ll-sidebar-text)',
    padding: '1.35rem 1rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  brandBlock: { padding: '0 0.4rem' },
  eyebrow: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#7dd3c7',
    fontWeight: 700,
  },
  brand: {
    fontFamily: 'var(--ll-display)',
    fontSize: '1.55rem',
    fontWeight: 600,
    color: '#f8fafc',
    letterSpacing: '-0.03em',
  },
  userCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '0.85rem 0.9rem',
  },
  userName: { fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' },
  userMeta: { color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 },
  rolePill: {
    display: 'inline-block',
    marginTop: 8,
    fontSize: '0.68rem',
    fontWeight: 800,
    letterSpacing: '0.06em',
    padding: '0.2rem 0.5rem',
    borderRadius: 999,
    background: 'rgba(13, 148, 136, 0.25)',
    color: '#99f6e4',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
    padding: '0.65rem 0.85rem',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: '0.9rem',
    border: '1px solid transparent',
  },
  stage: {
    minWidth: 0,
    background:
      'radial-gradient(1200px 500px at 10% -10%, rgba(13,148,136,0.08), transparent 55%), var(--ll-bg)',
  },
  main: {
    padding: '2rem 2.25rem 3rem',
    maxWidth: 1200,
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  support: {
    color: '#99f6e4',
    textDecoration: 'none',
    padding: '0.45rem 0.85rem',
    fontWeight: 600,
    fontSize: '0.88rem',
  },
  logout: {
    padding: '0.65rem 0.85rem',
    borderRadius: 10,
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'transparent',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontWeight: 700,
    textAlign: 'left',
  },
};
