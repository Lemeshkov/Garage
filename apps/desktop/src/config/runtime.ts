export function getApiBaseUrl() {
  const value = import.meta.env.VITE_GARAGE_API_URL?.trim() || '/api';
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) throw new Error('VITE_GARAGE_API_URL должен быть абсолютным URL или начинаться с /.');
  return value.replace(/\/$/, '');
}
