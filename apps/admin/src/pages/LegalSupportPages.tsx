import { ui } from '../ui';

const SUPPORT_URL =
  import.meta.env.VITE_SUPPORT_FORM_URL ??
  'https://forms.gle/locallife-support-placeholder';

export function SupportPage() {
  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>Support</h1>
          <p className="ll-page-sub">
            Open the support form for testers and operators. Replace the
            placeholder URL when your form is ready.
          </p>
        </div>
      </div>
      <div style={ui.panel}>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noreferrer"
          style={{ ...ui.btn, display: 'inline-block', textDecoration: 'none' }}
        >
          Open support form
        </a>
        <p style={{ ...ui.muted, marginTop: '1rem', marginBottom: 0 }}>
          <a href="/legal/privacy">Privacy</a> · <a href="/legal/terms">Terms</a>
        </p>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>Privacy Policy</h1>
          <p className="ll-page-sub">Draft placeholder — final text before public launch.</p>
        </div>
      </div>
      <div style={ui.panel}>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--ll-muted)' }}>
          We collect account email, preferences, approximate location context you
          share, and chat messages needed to answer grounded questions. Final
          legal text lands before public launch (Phase 08).
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div style={ui.page}>
      <div className="ll-page-head">
        <div>
          <h1>Terms of Use</h1>
          <p className="ll-page-sub">Draft placeholder — not legal advice.</p>
        </div>
      </div>
      <div style={ui.panel}>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--ll-muted)' }}>
          LocalLife provides practical local information and is not formal legal,
          medical, or immigration advice. Content may be seeded or
          community-sourced and should be verified when decisions matter.
        </p>
      </div>
    </div>
  );
}
