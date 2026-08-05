export type GuideSubmissions = {
  places: Array<{
    id: string;
    name: string;
    summary?: string;
    verificationStatus: string;
    createdAt: string;
    latitude: number;
    longitude: number;
    addressText?: string | null;
    phone?: string | null;
    priceLevel?: string | null;
  }>;
  tips: Array<{
    id: string;
    title: string;
    summary?: string;
    verificationStatus: string;
    createdAt: string;
    categoryKey?: string | null;
  }>;
  events: Array<{
    id: string;
    title: string;
    summary?: string;
    description?: string | null;
    prerequisites?: string | null;
    verificationStatus: string;
    createdAt: string;
    startsAt: string;
    endsAt?: string | null;
    placeId?: string | null;
    place?: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    } | null;
  }>;
  experiences: Array<{
    id: string;
    title: string;
    summary?: string;
    description?: string | null;
    verificationStatus: string;
    createdAt: string;
    audience?: string | null;
    priceLevel?: string | null;
  }>;
  businessApplications: Array<{
    id: string;
    email: string;
    displayName: string;
    status: string;
    createdAt: string;
    note?: string | null;
    phone?: string | null;
    addressText?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    photoUrl?: string | null;
    categoryKey?: string | null;
  }>;
};

export type ActivityKind =
  | 'place'
  | 'tip'
  | 'event'
  | 'experience'
  | 'business';

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  status: string;
  createdAt: string;
  subtitle?: string;
  payload: Record<string, unknown>;
};

export function flattenSubmissions(data: GuideSubmissions): ActivityItem[] {
  const rows: ActivityItem[] = [];
  for (const p of data.places ?? []) {
    rows.push({
      id: p.id,
      kind: 'place',
      title: p.name,
      status: p.verificationStatus,
      createdAt: p.createdAt,
      subtitle: p.summary,
      payload: p as unknown as Record<string, unknown>,
    });
  }
  for (const t of data.tips ?? []) {
    rows.push({
      id: t.id,
      kind: 'tip',
      title: t.title,
      status: t.verificationStatus,
      createdAt: t.createdAt,
      subtitle: t.categoryKey ?? undefined,
      payload: t as unknown as Record<string, unknown>,
    });
  }
  for (const e of data.events ?? []) {
    rows.push({
      id: e.id,
      kind: 'event',
      title: e.title,
      status: e.verificationStatus,
      createdAt: e.createdAt,
      subtitle: e.startsAt ? new Date(e.startsAt).toLocaleString() : undefined,
      payload: e as unknown as Record<string, unknown>,
    });
  }
  for (const x of data.experiences ?? []) {
    rows.push({
      id: x.id,
      kind: 'experience',
      title: x.title,
      status: x.verificationStatus,
      createdAt: x.createdAt,
      subtitle: x.summary,
      payload: x as unknown as Record<string, unknown>,
    });
  }
  for (const a of data.businessApplications ?? []) {
    rows.push({
      id: a.id,
      kind: 'business',
      title: a.displayName,
      status: a.status,
      createdAt: a.createdAt,
      subtitle: a.email,
      payload: a as unknown as Record<string, unknown>,
    });
  }
  rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return rows;
}

export function countByStatus(items: ActivityItem[]) {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const i of items) {
    const s = i.status.toUpperCase();
    if (s === 'APPROVED' || s === 'PUBLISHED') approved += 1;
    else if (s === 'REJECTED') rejected += 1;
    else pending += 1;
  }
  return { pending, approved, rejected, total: items.length };
}
