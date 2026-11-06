export const CRM_API=import.meta.env?.VITE_ORDERS_API||'https://uneescalegourmande.fr/api/holiday';
const SESSION_KEY='ep_crm_session';
let invoices=[];
export const getCrmToken=()=>sessionStorage.getItem(SESSION_KEY)||'';
export const cachedSharedInvoices=()=>structuredClone(invoices);
export function clearCrmSession(){sessionStorage.removeItem(SESSION_KEY);invoices=[];window.dispatchEvent(new Event('ep-crm-session'));}
export async function crmRequest(path,{method='GET',body,key,signal,token=getCrmToken()}={}) {
 const response=await fetch(`${CRM_API}/${path}`,{method,signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json();}catch{throw Error('Le service est momentanément indisponible.');}
 if(response.status===401&&token)clearCrmSession();
 if(!response.ok)throw Error(data.error||'Connexion impossible au CRM.');
 return data;
}
export async function signInCrm(key){const data=await crmRequest('login',{method:'POST',body:{key},token:''});sessionStorage.setItem(SESSION_KEY,data.token);return data;}
export async function refreshSharedInvoices(){const data=await crmRequest('invoices');invoices=data.invoices;return cachedSharedInvoices();}
export async function signOutCrm(){try{await crmRequest('logout',{method:'POST',body:{}});}finally{clearCrmSession();}}
