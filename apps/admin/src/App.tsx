import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoginPage } from './pages/LoginPage';
import {
  AdminShell,
  BusinessShell,
  GuideShell,
  RequireAdmin,
  RequireBusiness,
  RequireGuide,
} from './layout/PortalShell';
import { AdminDashboard } from './pages/admin/DashboardPage';
import { ModerationPage } from './pages/admin/ModerationPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AiConfigPage } from './pages/admin/AiConfigPage';
import { FlagsPage } from './pages/admin/FlagsPage';
import { SeedToolsPage } from './pages/admin/SeedToolsPage';
import {
  GuideHomePage,
  GuideSubmitPlacePage,
  GuideSubmitTipPage,
  GuideSubmitEventPage,
  GuideSubmitExperiencePage,
  GuideProposeBusinessPage,
  GuideSubmissionsPage,
} from './pages/guide/GuidePages';
import {
  BusinessHomePage,
  BusinessProfilePage,
  BusinessClaimPage,
  BusinessPlacesPage,
} from './pages/business/BusinessPages';
import {
  SupportPage,
  PrivacyPage,
  TermsPage,
} from './pages/LegalSupportPages';
import { getPortalUser } from './api';
import './App.css';

const MapPage = lazy(() =>
  import('./pages/admin/MapPage').then((m) => ({ default: m.MapPage })),
);

function HomeRedirect() {
  const user = getPortalUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'GUIDE') return <Navigate to="/guide" replace />;
  if (user.role === 'BUSINESS') return <Navigate to="/business" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminShell />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route
            path="map"
            element={
              <Suspense fallback={<p style={{ color: 'var(--ll-muted)' }}>Loading map…</p>}>
                <MapPage />
              </Suspense>
            }
          />
          <Route path="moderation" element={<ModerationPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="ai-config" element={<AiConfigPage />} />
          <Route path="flags" element={<FlagsPage />} />
          <Route path="seed" element={<SeedToolsPage />} />
        </Route>

        <Route
          path="/guide"
          element={
            <RequireGuide>
              <GuideShell />
            </RequireGuide>
          }
        >
          <Route index element={<GuideHomePage />} />
          <Route path="submit-place" element={<GuideSubmitPlacePage />} />
          <Route path="submit-tip" element={<GuideSubmitTipPage />} />
          <Route path="submit-event" element={<GuideSubmitEventPage />} />
          <Route
            path="submit-experience"
            element={<GuideSubmitExperiencePage />}
          />
          <Route
            path="propose-business"
            element={<GuideProposeBusinessPage />}
          />
          <Route path="submissions" element={<GuideSubmissionsPage />} />
        </Route>

        <Route
          path="/business"
          element={
            <RequireBusiness>
              <BusinessShell />
            </RequireBusiness>
          }
        >
          <Route index element={<BusinessHomePage />} />
          <Route path="profile" element={<BusinessProfilePage />} />
          <Route path="claim" element={<BusinessClaimPage />} />
          <Route path="places" element={<BusinessPlacesPage />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
