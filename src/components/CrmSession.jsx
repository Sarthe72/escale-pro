import {useEffect,useState} from 'react';
import {getCrmToken,crmRequest,signInCrm,clearCrmSession,refreshSharedInvoices} from '../lib/crmApi';
import {deviceLoginProof,pairDevice} from '../lib/crmDevice';
let connecting;
async function connect(){
 const hash=location.hash;const query=hash.includes('?')?hash.slice(hash.indexOf('?')+1):'';
 const token=new URLSearchParams(query).get('associer');
 if(token){await pairDevice(token);history.replaceState(null,'',location.pathname+location.search+hash.split('?')[0]);}
 if(getCrmToken()){try{await crmRequest('session');await refreshSharedInvoices();return;}catch{clearCrmSession();}}
 const proof=await deviceLoginProof();if(!proof)return;
 await signInCrm(proof);await refreshSharedInvoices();window.dispatchEvent(new Event('ep-crm-connected'));
}
export default function CrmSession({children}){
 const [busy,setBusy]=useState(true);
 useEffect(()=>{let live=true;const start=()=>{if(!connecting)connecting=connect().finally(()=>{connecting=undefined;});connecting.catch(()=>window.dispatchEvent(new Event('ep-crm-connection-error'))).finally(()=>{if(live)setBusy(false);});};start();const retry=()=>{if(sessionStorage.getItem('ep_auth')==='1')start();};window.addEventListener('ep-crm-session',retry);return()=>{live=false;window.removeEventListener('ep-crm-session',retry);};},[]);
 return busy?<main role="status" style={{padding:32,textAlign:'center',color:'#2d6a4f'}}>Ouverture du CRM…</main>:children;
}
