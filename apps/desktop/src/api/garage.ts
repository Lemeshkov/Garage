import { GarageApi, type SessionTokenStore } from '@garage/api-client';
import { getApiBaseUrl } from '../config/runtime';

const tokenKey='garage.admin.session';
class BrowserSessionTokenStore implements SessionTokenStore {
  async get(){return sessionStorage.getItem(tokenKey)}
  async set(token:string){sessionStorage.setItem(tokenKey,token)}
  async clear(){sessionStorage.removeItem(tokenKey)}
}
export const sessionTokenStore=new BrowserSessionTokenStore();
export const garageApi=new GarageApi({baseUrl:getApiBaseUrl(),tokenStore:sessionTokenStore,onUnauthorized:()=>window.dispatchEvent(new Event('garage:unauthorized'))});
