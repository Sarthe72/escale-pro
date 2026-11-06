import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import NouvelleCommande from '../components/NouvelleCommande';
import './Commandes.css';
import { isVisitor, getVisitorOrders, updateVisitorOrder, resetVisitorOrders, createVisitorOrder, assertWritable } from '../lib/visitor';
import {crmRequest,getCrmToken,refreshSharedInvoices} from '../lib/crmApi';
const money = value => value === null ? 'Tarif à confirmer' : (value / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const paymentNames = { cash: 'Espèces', cheque: 'Chèque', instant_transfer: 'Virement immédiat' };
export default function Commandes() {
 const token=isVisitor ? 'visitor' : getCrmToken();
 const [orders, setOrders] = useState([]);
 const [manual,setManual]=useState(false);
 const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [pickup, setPickup] = useState('');
 async function api(path, method = 'GET', body, session = token, requestKey) {
  if (isVisitor) {
   if(method === 'POST' && path === 'orders/manual') return createVisitorOrder(body,requestKey);
   if (method === 'GET' && path === 'orders') return {orders:getVisitorOrders()};
   if (method === 'PATCH' && path.startsWith('orders/')) { updateVisitorOrder(path.slice(7),body);return {ok:true}; }
   assertWritable();
  }
  return crmRequest(path,{method,body,key:requestKey,token:session});
 }
 async function refresh() { setBusy(true); setError(''); try { const data = await api('orders'); setOrders(data.orders); if(!isVisitor)await refreshSharedInvoices(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
 useEffect(() => { if (token) refresh(); }, [token]); // Refresh only after explicit connection or user action.
 async function update(order, change) { setBusy(true);setError('');try{await api('orders/'+order.id,'PATCH',{status:order.status,paid:order.paid,version:order.version,...change});await refresh();}catch(e){setError(e.message);setBusy(false);} }
 const rank = status => status === 'confirmed' ? 0 : status === 'collected' ? 1 : 2;
 const selected=orders.filter(o=>!pickup||o.pickup===pickup).sort((a,b)=>rank(a.status)-rank(b.status)||a.pickup.localeCompare(b.pickup)||(a.createdAt||'').localeCompare(b.createdAt||'')||a.id.localeCompare(b.id));
 const production = new Map(); selected.filter(o=>o.status==='confirmed').forEach(o=>o.items.forEach(i=>production.set(i.name,(production.get(i.name)||0)+i.quantity)));
 return <><PageHeader title="Commandes des fêtes"/><main className="orders-page" style={{maxWidth:800,margin:'auto',padding:20}}>
 {error && <p role="alert" style={{background:'#fff0eb',padding:16}}>{error}</p>}
 {isVisitor && <aside style={{background:'#fff1cb',padding:16,marginBottom:16}}><p><strong>Simulation du rush · {orders.length} clients fictifs</strong></p><p>Le bouton de paiement et retrait est actif pour cet essai. Les totaux et les portions à préparer évoluent après chaque validation. Aucune commande réelle n’est modifiée.</p><button type="button" onClick={()=>{resetVisitorOrders();refresh();}}>Recommencer la simulation</button></aside>}
 <>
 <div style={{display:'flex',gap:16,flexWrap:'wrap'}}><button type="button" data-visitor-simulation={isVisitor ? 'true' : undefined} onClick={()=>setManual(true)}>+ Ajouter une commande</button><button disabled={busy} onClick={refresh}>{busy?'Chargement…':'Actualiser'}</button></div>
 <label style={{display:'block',margin:'20px 0'}}>Retrait <select value={pickup} onChange={e=>setPickup(e.target.value)}><option value="">Tous les jours</option>{[...new Set(orders.map(o=>o.pickup))].map(day=><option key={day}>{day}</option>)}</select></label>
 <section style={{background:'white',padding:20,borderRadius:12}}><h2>À préparer · commandes confirmées</h2><p>{pickup ? `Retrait du ${new Date(pickup + 'T12:00:00').toLocaleDateString('fr-FR')}` : 'Tous les jours de retrait'} · tous les clients de la sélection</p>{[...production].map(([name,count])=><p key={name}>{count} × {name}</p>)}{!production.size&&<p>Aucun plat à préparer pour cette sélection.</p>}<strong>Reste à encaisser : {money(selected.filter(o=>o.status!=='cancelled'&&!o.paid).reduce((sum,o)=>sum+o.total,0))}</strong>{selected.some(o=>o.total===null)&&<p>Le reste à encaisser exclut les commandes dont le tarif est encore à confirmer.</p>}</section>
 {!busy&&!selected.length&&<p>Aucune commande pour cette sélection.</p>}
 {selected.map(order=><article key={order.id} className={order.status === 'collected' && order.paid ? 'order-card order-card-complete' : 'order-card'} style={{padding:20,marginTop:16,borderRadius:12}}><div className="order-card-heading"><h2>{order.firstName} {order.name} · {money(order.total)}</h2>{order.status === 'collected' && order.paid && <span className="order-complete-badge">✓ Terminée · payée et retirée</span>}</div><p>Retrait : {order.pickup} · Réf. {order.id}</p><p><a href={'tel:'+order.phone}>{order.phone}</a>{order.email && <> · <a href={'mailto:'+order.email}>{order.email}</a></>}</p>{order.items.map(item=><p key={item.id}>{item.quantity} × {item.name} · {item.price === null ? 'Tarif à confirmer' : money(item.price*item.quantity)}</p>)}{order.total === null && <p role="status">Sous-total connu : {money(order.items.reduce((sum,item)=>sum+(item.price??0)*item.quantity,0))}, hors poisson. Validation du paiement et facture disponibles après confirmation du tarif.</p>}<p>{paymentNames[order.payment]} au retrait</p>{order.status === 'collected' ? <><p role="status"><strong>Paiement reçu et commande retirée ✓</strong></p></> : <><label>État <select disabled={busy || isVisitor} value={order.status} onChange={e=>update(order,{status:e.target.value})}><option value="confirmed">Confirmée</option><option value="cancelled">Annulée</option></select></label>{order.status === 'confirmed' && <div style={{marginTop:16}}><button type="button" data-visitor-simulation={isVisitor ? 'true' : undefined} disabled={busy || order.total === null} onClick={()=>update(order,{paid:true,status:'collected'})}>Paiement reçu et commande retirée</button></div>}</>}{order.invoiceId && <p><Link to={`/factures/${order.invoiceId}/imprimer`}>Voir la facture · Imprimer / PDF</Link></p>}{order.notes && <p><strong>Précisions :</strong> {order.notes}</p>}<p className="order-source">Origine : {order.source === 'phone' ? 'Téléphone' : order.source === 'email' ? 'E-mail' : 'Site internet'}</p>{order.status === 'collected' && <div className="order-correction"><button className="order-undo" type="button" data-visitor-simulation={isVisitor ? 'true' : undefined} disabled={busy} onClick={()=>update(order,{paid:false,status:'confirmed'})}>Remettre en attente de retrait</button></div>}</article>)}
 </>
 {manual && <NouvelleCommande orders={orders} onClose={()=>setManual(false)} onSave={async(body,key)=>{await api('orders/manual','POST',body,token,key);setPickup('');await refresh();}}/>}</main></>;
}
