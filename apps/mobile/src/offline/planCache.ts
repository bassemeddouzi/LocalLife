import AsyncStorage from '@react-native-async-storage/async-storage';

export type CachedPlanStep = {
  id: string;
  sortOrder: number;
  freeText?: string | null;
  placeId?: string | null;
  transportNote?: string | null;
  status?: string;
};

export type CachedClientPlan = {
  id: string;
  title: string;
  status: string;
  steps?: CachedPlanStep[];
};

export type EmergencyContacts = {
  police: string;
  hospital: string;
  fire?: string;
};

export type ActivePlanCache = {
  plan: CachedClientPlan;
  emergency: EmergencyContacts;
  cachedAt: string;
};

const DEFAULT_EMERGENCY: EmergencyContacts = {
  police: '197',
  hospital: '190',
  fire: '198',
};

function key(userId: string) {
  return `activePlan:${userId}`;
}

export function defaultEmergencyContacts(): EmergencyContacts {
  return { ...DEFAULT_EMERGENCY };
}

export async function saveActivePlan(
  userId: string,
  plan: CachedClientPlan,
  emergency: EmergencyContacts = DEFAULT_EMERGENCY,
): Promise<void> {
  const payload: ActivePlanCache = {
    plan,
    emergency,
    cachedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(key(userId), JSON.stringify(payload));
}

export async function loadActivePlan(
  userId: string,
): Promise<ActivePlanCache | null> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActivePlanCache;
  } catch {
    return null;
  }
}

export async function clearActivePlan(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
