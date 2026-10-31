import { useCallback, useEffect, useState } from 'react';
import type { Vehicle } from '@garage/contracts';
import { GarageApiError } from '@garage/api-client';
import { garageApi } from '../api/garage';

export function useVehicles() {
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const reload=useCallback(async()=>{setLoading(true);setError(null);try{setVehicles(await garageApi.getVehicles())}catch(e){setError(e instanceof GarageApiError?e.message:'Не удалось подключиться к серверу.')}finally{setLoading(false)}},[]);
  useEffect(()=>{void reload()},[reload]);
  return {vehicles,loading,error,reload};
}
