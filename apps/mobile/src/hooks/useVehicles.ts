import { useCallback, useEffect, useState } from 'react';
import { getVehicles } from '../api/vehicles';
import type { Vehicle } from '../data/garage';
export function useVehicles() { const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const reload = useCallback(async () => { setLoading(true); setError(null); try { setVehicles(await getVehicles()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось подключиться к серверу.'); } finally { setLoading(false); } }, []); useEffect(() => { void reload(); }, [reload]); return { vehicles, loading, error, reload }; }
