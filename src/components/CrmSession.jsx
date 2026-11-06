import {useEffect,useState} from 'react';
import {getCrmToken,crmRequest,signInCrm,clearCrmSession,refreshSharedInvoices} from '../lib/crmApi';
export default function CrmSession({children}){
 const [ready,setReady]=useState(false);const [busy,setBusy]=useState(true);const [key,setKey]=useState('');const [error,setError]=useState('');
 useEffect(()=>{
  let live=true;
  const expired=()=>{setReady(false);setError('Votre session a expiré. Reconnectez-vous au CRM.');};window.addEventListener('ep-crm-session',expired);
  if(getCrmToken())crmRequest('session').then(()=>refreshSharedInvoices()).then(()=>{if(live)setReady(true);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setBusy(false);});
  else setBusy(false);
  return()=>{live=false;window.removeEventListener('ep-crm-session',expired);};
 },[]);
 async function login(event){event.preventDefault();setBusy(true);setError('');try{await signInCrm(key);await refreshSharedInvoices();setKey('');setReady(true);}catch(e){clearCrmSession();setError(e.message);}finally{setBusy(false);}}
 if(ready)return children;
 return <main style={{minHeight:'100vh',background:'#f5f0e6',display:'grid',placeItems:'center',padding:24}}><form onSubmit={login} style={{maxWidth:420,width:'100%',background:'white',padding:28,borderRadius:20}}><h1 style={{fontSize:26,color:'#2d6a4f',fontWeight:700}}>Escale Pro</h1><p style={{margin:'16px 0'}}>Un seul accès pour le CRM, les commandes et leurs factures.</p><label>Clé d’accès sécurisée<input type="password" autoComplete="current-password" required value={key} onChange={e=>setKey(e.target.value)} style={{display:'block',width:'100%',padding:14,border:'1px solid #d0d9d2',borderRadius:10,margin:'10px 0'}}/></label>{error&&<p role="alert">{error}</p>}<button disabled={busy} style={{background:'#2d6a4f',color:'white',padding:14,borderRadius:10,width:'100%',marginTop:16}}>{busy?'Connexion…':'Se connecter'}</button></form></main>;
}
