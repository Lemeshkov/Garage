import assert from 'node:assert/strict';
import test from 'node:test';
import { GarageApi, MemorySessionTokenStore } from '../src/index.js';

test('loads vehicles through a relative /api URL without rebinding fetch', async () => {
  const vehicles = [{ id: 'vehicle-1', brand: 'BMW', model: 'X7' }];
  let requestedUrl = '';

  const browserLikeFetch: typeof fetch = async function (this: unknown, input) {
    assert.equal(this, undefined, 'fetch must not be called as a GarageApi method');
    requestedUrl = String(input);
    return new Response(JSON.stringify(vehicles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const api = new GarageApi({
    baseUrl: '/api/',
    tokenStore: new MemorySessionTokenStore(),
    fetcher: browserLikeFetch,
  });

  const result = await api.getVehicles();

  assert.equal(requestedUrl, '/api/vehicles');
  assert.deepEqual(result, vehicles);
});

test('admin session authorizes mutations and logout revokes the local token', async () => {
  const store = new MemorySessionTokenStore();
  const requests: Array<{ url: string; authorization: string | null }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, authorization: new Headers(init?.headers).get('Authorization') });
    if (url.endsWith('/auth/admin/login')) return json({ token: 'session-token', expiresAt: '2026-11-01T00:00:00Z', mustChangePassword: false, admin: { id: 'a1', login: 'admin', displayName: 'Admin', role: 'ADMIN' } });
    if (url.endsWith('/auth/admin/logout')) return json({ loggedOut: true });
    return json({ id: 'v1', brand: 'BMW', model: 'X7' });
  };
  const api = new GarageApi({ baseUrl: '/api', tokenStore: store, fetcher });

  await api.login('admin', '7999');
  await api.createVehicle({ group: 'VE', type: 'CAR', brand: 'BMW', model: 'X7', year: null, licensePlate: 'A001AA', vin: 'VIN1', currentMileage: null });
  await api.addMileage('v1', { value: 100 });
  await api.createRecord('v1', 'maintenance', { performedAt: '2026-10-31' });
  await api.logout();

  assert.equal(requests[0].authorization, null);
  assert.deepEqual(requests.slice(1).map(item => item.authorization), ['Bearer session-token', 'Bearer session-token', 'Bearer session-token', 'Bearer session-token']);
  assert.equal(await store.get(), null);
});

test('reports malformed successful JSON as a response error, not a network error', async () => {
  const api = new GarageApi({ baseUrl: '/api', tokenStore: new MemorySessionTokenStore(), fetcher: async () => new Response('<html>', { status: 200 }) });
  await assert.rejects(() => api.getVehicles(), /Сервер вернул некорректный ответ/);
});

test('changes only the current administrator password through the active session', async () => {
  const store = new MemorySessionTokenStore(); await store.set('active-session');
  let request: { url: string; authorization: string | null; body: unknown } | null = null;
  const api = new GarageApi({ baseUrl: '/api', tokenStore: store, fetcher: async (input, init) => {
    request = { url: String(input), authorization: new Headers(init?.headers).get('Authorization'), body: JSON.parse(String(init?.body)) };
    return json({ passwordChanged: true });
  }});
  assert.deepEqual(await api.changePassword('current-secret','new-secret'), { passwordChanged: true });
  assert.deepEqual(request, { url: '/api/auth/admin/change-password', authorization: 'Bearer active-session', body: { currentPassword: 'current-secret', newPassword: 'new-secret' } });
  assert.equal(await store.get(), 'active-session');
});

function json(body: unknown) { return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
