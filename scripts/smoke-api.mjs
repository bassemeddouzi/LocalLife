#!/usr/bin/env node
/**
 * API smoke script for local or Railway staging.
 * Usage: API_BASE_URL=http://localhost:3000 node scripts/smoke-api.mjs
 */
const base = (process.env.API_BASE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

async function req(path, init) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('Smoke against', base);

  const health = await req('/v1/health');
  assert(health.status === 'ok', 'health not ok');
  const ready = await req('/v1/health/ready');
  assert(ready.status === 'ready', 'ready not ready');

  const countries = await req('/v1/countries');
  const tn = countries.find((c) => c.iso2 === 'TN');
  assert(tn, 'TN missing — seed staging');

  const cities = await req(`/v1/countries/${tn.id}/cities`);
  const djerba = cities.find((c) => c.slug === 'djerba');
  assert(djerba, 'Djerba missing');

  const places = await req(`/v1/places?cityId=${djerba.id}&pageSize=5`);
  assert(places.data?.length > 0, 'no places');
  const placeId = places.data[0].id;

  const arrival = await req(`/v1/arrival-guides?cityId=${djerba.id}`);
  assert(arrival.length > 0 && arrival[0].steps?.length > 0, 'no arrival guide');

  const transport = await req(`/v1/transport-systems?cityId=${djerba.id}`);
  assert(transport.length > 0, 'no transport');

  const login = await req('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@locallife.local',
      password: 'Admin123!',
    }),
  });
  assert(login.accessToken, 'admin login failed');
  const auth = { Authorization: `Bearer ${login.accessToken}` };

  await req('/v1/favorites', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ targetType: 'PLACE', targetId: placeId }),
  });
  const favs = await req('/v1/me/favorites', { headers: auth });
  assert(Array.isArray(favs) && favs.length > 0, 'favorites empty after toggle');

  const conv = await req('/v1/ai/conversations', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ cityId: djerba.id, title: 'smoke' }),
  });
  const msg = await req(`/v1/ai/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      content: 'What should I do in my first hour after landing at Djerba airport?',
      cityId: djerba.id,
    }),
  });
  assert(msg.message?.citations?.length > 0, 'AI missing citations');

  const cfg = await req('/v1/admin/ai-config', { headers: auth });
  assert(cfg.modelId, 'ai-config missing');

  const queue = await req('/v1/admin/moderation/queue', { headers: auth });
  assert(queue !== undefined && queue !== null, 'moderation queue missing');

  console.log('SMOKE OK');
}

main().catch((e) => {
  console.error('SMOKE FAIL', e.message ?? e);
  process.exit(1);
});
