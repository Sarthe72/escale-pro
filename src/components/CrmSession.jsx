import {useEffect,useState} from 'react';
import {getCrmToken,crmRequest,signInCrm,clearCrmSession,refreshSharedInvoices} from '../lib/crmApi';
import {deviceLoginProof,pairDevice} from '../lib/crmDevice';
import {restoreCrmConnection} from '../lib/restoreCrmConnection';
let connecting;
async function connect(){
 const hash=location.hash;const query=hash.includes('?')?hash.slice(hash.indexOf('?')+1):'';
 const token=new URLSearchParams(query).get('associer');
 const connected=await restoreCrmConnection({getCrmToken,crmRequest,signInCrm,clearCrmSession,refreshSharedInvoices,deviceLoginProof,pairDevice},token);
 if(connected){
  if(token)history.replaceState(null,'',location.pathname+location.search+hash.split('?')[0]);
  window.dispatchEvent(new Event('ep-crm-connected'));
 }
 return connected;
}
export default function CrmSession({children}){
 const [busy,setBusy]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{let live=true;
  const start=()=>{
   if(!connecting)connecting=connect().finally(()=>{connecting=undefined;});
   connecting.then(()=>{if(live)setError('');}).catch(error=>{if(live)setError(error.message||'Connexion aux commandes momentanément impossible.');}).finally(()=>{if(live)setBusy(false);});
  };
  const retry=()=>{if(sessionStorage.getItem('ep_auth')==='1')start();};
  const visible=()=>{if(document.visibilityState==='visible')retry();};
  start();window.addEventListener('ep-crm-session',retry);window.addEventListener('ep-crm-reconnect',retry);window.addEventListener('online',retry);window.addEventListener('pageshow',retry);document.addEventListener('visibilitychange',visible);
  return()=>{live=false;window.removeEventListener('ep-crm-session',retry);window.removeEventListener('ep-crm-reconnect',retry);window.removeEventListener('online',retry);window.removeEventListener('pageshow',retry);document.removeEventListener('visibilitychange',visible);};
 },[]);
 return busy?<main role="status" style={{padding:32,textAlign:'center',color:'#2d6a4f'}}>Ouverture du CRM…</main>:<>{error&&<aside role="alert" style={{padding:16,background:'#fff1cb',color:'#563d11'}}>Les commandes en ligne ne sont pas connectées : {error} <button type="button" onClick={()=>window.dispatchEvent(new Event('ep-crm-reconnect'))}>Réessayer la connexion</button></aside>}{children}</>;
}
