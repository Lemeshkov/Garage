export const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;

export class RequestTimeoutError extends Error {
  constructor() {
    super('Не удалось подключиться к серверу.');
    this.name = 'RequestTimeoutError';
  }
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  fetcher: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener('abort', abortFromCaller, { once: true });
  if (init.signal?.aborted) controller.abort();

  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestTimeoutError());
      controller.abort();
    }, timeoutMs);
  });

  try {
    return await Promise.race([fetcher(input, { ...init, signal: controller.signal }), timeout]);
  } finally {
    clearTimeout(timer!);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
}

type RetryOptions = {
  retries: number;
  delayMs: number;
  shouldRetry: (error: unknown) => boolean;
  signal?: AbortSignal;
};

function wait(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const timer = setTimeout(finish, delayMs);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      reject(error);
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

export async function retryAsync<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= options.retries || !options.shouldRetry(error) || options.signal?.aborted) throw error;
      attempt += 1;
      await wait(options.delayMs, options.signal);
    }
  }
}

export function shouldRefreshVehicles(lastSuccessAt: number | null, hadError: boolean, now: number, staleAfterMs: number) {
  return hadError || lastSuccessAt === null || now - lastSuccessAt >= staleAfterMs;
}
