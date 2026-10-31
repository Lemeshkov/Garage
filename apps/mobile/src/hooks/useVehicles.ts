import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getVehicles } from '../api/vehicles';
import { isAbortError, shouldRefreshVehicles } from '../api/network';
import type { Vehicle } from '../data/garage';

const STALE_AFTER_MS = 60_000;

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const loadingRef = useRef(false);
  const errorRef = useRef(false);
  const lastSuccessAt = useRef<number | null>(null);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const currentController = new AbortController();
    controller.current = currentController;
    const currentRequest = ++requestId.current;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await getVehicles(undefined, currentController.signal);
      if (requestId.current !== currentRequest) return;
      setVehicles(result);
      lastSuccessAt.current = Date.now();
      errorRef.current = false;
    } catch (cause) {
      if (requestId.current !== currentRequest || isAbortError(cause)) return;
      errorRef.current = true;
      setError(cause instanceof Error ? cause.message : 'Не удалось подключиться к серверу.');
    } finally {
      if (requestId.current === currentRequest) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && !loadingRef.current && shouldRefreshVehicles(lastSuccessAt.current, errorRef.current, Date.now(), STALE_AFTER_MS)) {
        void reload();
      }
    });
    return () => subscription.remove();
  }, [reload]);

  return { vehicles, loading, error, reload };
}
