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
