import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AdminShell, Placeholder, RequireAdmin } from './layout/AdminShell';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAdmin>
              <AdminShell />
            </RequireAdmin>
          }
        >
          <Route index element={<Placeholder title="Dashboard" />} />
          <Route
            path="moderation"
            element={<Placeholder title="Moderation" />}
          />
          <Route path="users" element={<Placeholder title="Users" />} />
          <Route path="ai-config" element={<Placeholder title="AI Config" />} />
          <Route path="flags" element={<Placeholder title="Feature Flags" />} />
          <Route path="seed" element={<Placeholder title="Seed tools" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
