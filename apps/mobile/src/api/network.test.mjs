import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestTimeoutError, fetchWithTimeout, retryAsync, shouldRefreshVehicles } from './network.ts';

test('successful vehicle request returns all ten records', async () => {
  const response = new Response(JSON.stringify(Array.from({ length: 10 }, (_, index) => ({ id: String(index) }))));
  const result = await fetchWithTimeout('https://example.test/vehicles', {}, 50, async () => response);
  assert.equal((await result.json()).length, 10);
});

test('hanging request is aborted by timeout', async () => {
  const hangingFetch = (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    }, { once: true });
  });
  await assert.rejects(() => fetchWithTimeout('https://example.test/vehicles', {}, 10, hangingFetch), RequestTimeoutError);
});

test('temporary server error is retried once and connection recovers', async () => {
  let attempts = 0;
  const result = await retryAsync(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('server 503');
    return 10;
  }, { retries: 1, delayMs: 1, shouldRetry: () => true });
  assert.equal(result, 10);
  assert.equal(attempts, 2);
});

test('persistent server error stops after the configured retry', async () => {
  let attempts = 0;
  await assert.rejects(() => retryAsync(async () => {
    attempts += 1;
    throw new Error('server 503');
  }, { retries: 1, delayMs: 1, shouldRetry: () => true }), /server 503/);
  assert.equal(attempts, 2);
});

test('foreground refresh runs after an error or stale data', () => {
  assert.equal(shouldRefreshVehicles(Date.now(), true, Date.now(), 60_000), true);
  assert.equal(shouldRefreshVehicles(1_000, false, 62_000, 60_000), true);
  assert.equal(shouldRefreshVehicles(10_000, false, 20_000, 60_000), false);
});
