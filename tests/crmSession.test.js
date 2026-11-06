import test from 'node:test';
import assert from 'node:assert/strict';
import {signInCrm,crmRequest,refreshSharedInvoices,cachedSharedInvoices,getCrmToken,signOutCrm} from '../src/lib/crmApi.js';
test('une session CRM commune protège les factures et se révoque à la déconnexion',async()=>{
 const storage=new Map();globalThis.sessionStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
 const events=[];globalThis.window={dispatchEvent:event=>events.push(event.type)};
 const originalFetch=globalThis.fetch;const requests=[];
 globalThis.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,status:200,json:async()=>url.endsWith('/login')?{token:'session-test'}:url.endsWith('/invoices')?{invoices:[{id:'holiday-invoice-1'}]}:{ok:true}};};
 try{
  await signInCrm('cle-de-test');assert.equal(getCrmToken(),'session-test');
  await refreshSharedInvoices();assert.equal(cachedSharedInvoices().length,1);assert.equal(requests.at(-1).options.headers.Authorization,'Bearer session-test');
  await signOutCrm();assert.equal(getCrmToken(),'');assert.equal(cachedSharedInvoices().length,0);assert.ok(events.includes('ep-crm-session'));
  storage.set('ep_crm_session','session-expiree');
  globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({error:'Session expirée'})});
  await assert.rejects(()=>crmRequest('orders'),/Session expirée/);assert.equal(getCrmToken(),'');
 }finally{globalThis.fetch=originalFetch;delete globalThis.sessionStorage;delete globalThis.window;}
});
