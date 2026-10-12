import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl, clearToken, getToken, onUnauthorized, saveToken } from './session';

type Admin = { id: string; login: string; displayName: string; role: 'ADMIN'; mustChangePassword: boolean };
type AuthValue = { admin: Admin | null; loading: boolean; login: (login: string, password: string) => Promise<void>; logout: () => Promise<void>; changePassword: (currentPassword: string, newPassword: string) => Promise<void> };
const Context = createContext<AuthValue | null>(null);
async function message(response: Response) { const body = await response.json().catch(() => null) as { message?: string } | null; return body?.message ?? `Ошибка сервера (${response.status})`; }

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin,setAdmin]=useState<Admin|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>onUnauthorized(()=>setAdmin(null)),[]);
  useEffect(()=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);void (async()=>{try{if(!await getToken())return;const response=await apiFetch('/auth/admin/me',{signal:controller.signal});if(response.ok)setAdmin(await response.json() as Admin);}catch{/* Offline startup remains in read-only mode. */}finally{clearTimeout(timeout);setLoading(false);}})();return()=>{clearTimeout(timeout);controller.abort();};},[]);
  const value=useMemo<AuthValue>(()=>({admin,loading,login:async(login,password)=>{const response=await fetch(apiUrl('/auth/admin/login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login,password})});if(!response.ok)throw new Error(await message(response));const body=await response.json() as {token:string;mustChangePassword:boolean;admin:Omit<Admin,'mustChangePassword'>};await saveToken(body.token);setAdmin({...body.admin,mustChangePassword:body.mustChangePassword});},logout:async()=>{try{await apiFetch('/auth/admin/logout',{method:'POST'});}finally{await clearToken();setAdmin(null);}},changePassword:async(currentPassword,newPassword)=>{const response=await apiFetch('/auth/admin/change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})});if(!response.ok)throw new Error(await message(response));setAdmin(value=>value?{...value,mustChangePassword:false}:null);}}),[admin,loading]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAdminAuth(){const value=useContext(Context);if(!value)throw new Error('AdminAuthProvider is missing');return value;}

