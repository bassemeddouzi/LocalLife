import { useEffect, useState } from 'react';
import { api } from '../../api';
import { ui } from '../../ui';

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  guideProfile?: { status: string } | null;
  businessProfile?: { displayName: string } | null;
};

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [role, setRole] = useState('');

  useEffect(() => {
    const q = role ? `?role=${role}` : '';
    void api<UserRow[]>(`/v1/admin/users${q}`).then(setUsers);
  }, [role]);

  return (
    <div style={ui.page}>
      <h1>Users</h1>
      <div style={ui.row}>
        {['', 'CLIENT', 'GUIDE', 'BUSINESS', 'ADMIN'].map((r) => (
          <button
            key={r || 'all'}
            type="button"
            style={role === r ? ui.btn : ui.btnGhost}
            onClick={() => setRole(r)}
          >
            {r || 'ALL'}
          </button>
        ))}
      </div>
      {users.map((u) => (
        <div key={u.id} style={ui.card}>
          <strong>
            {u.displayName} · {u.role}
          </strong>
          <div style={ui.muted}>
            {u.email} · {u.status}
            {u.guideProfile ? ` · guide ${u.guideProfile.status}` : ''}
            {u.businessProfile
              ? ` · biz ${u.businessProfile.displayName}`
              : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
