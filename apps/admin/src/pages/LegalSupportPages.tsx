import { ui } from '../ui';

const SUPPORT_URL =
  import.meta.env.VITE_SUPPORT_FORM_URL ??
  'https://forms.gle/locallife-support-placeholder';

export function SupportPage() {
  return (
    <div style={{ ...ui.page, padding: 32 }}>
      <h1>Support</h1>
      <p style={ui.muted}>
        Open the support form for testers and operators. Replace the placeholder
        URL when your form is ready.
      </p>
      <div style={ui.card}>
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
          Open support form →
        </a>
      </div>
      <p>
        <a href="/legal/privacy">Privacy</a> · <a href="/legal/terms">Terms</a>
      </p>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div style={{ ...ui.page, padding: 32 }}>
      <h1>Privacy Policy (draft)</h1>
      <p style={ui.muted}>
        Draft placeholder for LocalLife AI. Final legal text lands before public
        launch (Phase 08). We collect account email, preferences, approximate
        location context you share, and chat messages needed to answer grounded
        questions.
      </p>
    </div>
  );
}

export function TermsPage() {
  return (
    <div style={{ ...ui.page, padding: 32 }}>
      <h1>Terms of Use (draft)</h1>
      <p style={ui.muted}>
        Draft placeholder. LocalLife provides practical local information and is
        not formal legal, medical, or immigration advice. Content may be seeded
        or community-sourced and should be verified when decisions matter.
      </p>
    </div>
  );
}
