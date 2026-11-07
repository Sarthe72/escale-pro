import { useRef, useState } from 'react';
import { orderCatalog, orderPickups } from '../lib/orderCatalog';
const money = value=>(value/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
export default function NouvelleCommande({orders,onSave,onClose}) {
 const [form,setForm]=useState({firstName:'',name:'',phone:'',email:'',pickup:'',payment:'cash',source:'phone',notes:''});
 const [quantities,setQuantities]=useState({}); const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const requestKey=useRef(crypto.randomUUID());
 const items=orderCatalog.filter(item=>quantities[item.id]>0).map(item=>({id:item.id,quantity:quantities[item.id]}));
 const total=orderCatalog.reduce((sum,item)=>sum+item.price*(quantities[item.id]||0),0);
 const field=(name,value)=>setForm(previous=>({...previous,[name]:value}));
 async function submit(event){event.preventDefault();if(!items.length){setError('Ajoutez au moins un plat.');return;}setBusy(true);setError('');try{await onSave({...form,items},requestKey.current);onClose();}catch(e){setError(e.message);setBusy(false);}}
 return <div className="manual-overlay"><section role="dialog" aria-modal="true" aria-labelledby="manual-title" className="manual-dialog"><header><h2 id="manual-title">Ajouter une commande</h2><button type="button" disabled={busy} onClick={onClose}>Fermer</button></header><p>Pour une commande reçue par téléphone ou e-mail.</p><form data-visitor-form onSubmit={submit}>
 <label>Client déjà présent<select defaultValue="" onChange={event=>{const client=orders.find(order=>order.id===event.target.value);if(client)setForm(previous=>({...previous,firstName:client.firstName||'',name:client.name,phone:client.phone==='—'?'':client.phone,email:client.email||''}));}}><option value="">Nouveau client</option>{[...new Map(orders.map(order=>[[order.firstName,order.name,order.phone].join('|'),order])).values()].map(client=><option key={client.id} value={client.id}>{client.firstName} {client.name}</option>)}</select></label>
 <div className="manual-columns">{[['firstName','Prénom','given-name'],['name','Nom','family-name'],['phone','Téléphone','tel'],['email','E-mail','email']].map(([name,label,autocomplete])=><label key={name}>{label}<input required type={name==='email'?'email':name==='phone'?'tel':'text'} autoComplete={autocomplete} maxLength={name==='email'?254:100} value={form[name]} onChange={event=>field(name,event.target.value)}/></label>)}</div>
 <label>Origine<select value={form.source} onChange={e=>field('source',e.target.value)}><option value="phone">Téléphone</option><option value="email">E-mail</option></select></label>
 <h2>Plats et quantités</h2>{orderCatalog.map(item=><label key={item.id} className="manual-dish"><span>{item.name} · {money(item.price)}</span><input aria-label={'Quantité : '+item.name} type="number" min="0" max="100" step="1" value={quantities[item.id]||0} onChange={e=>setQuantities(previous=>({...previous,[item.id]:Number(e.target.value)}))}/></label>)}
 <label>Retrait<select required value={form.pickup} onChange={e=>field('pickup',e.target.value)}><option value="">Choisir un créneau</option>{orderPickups.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label>Paiement au retrait<select value={form.payment} onChange={e=>field('payment',e.target.value)}><option value="cash">Espèces</option><option value="cheque">Chèque</option><option value="instant_transfer">Virement immédiat</option></select></label>
 <label>Informations complémentaires (facultatif)<textarea maxLength={1000} value={form.notes} onChange={e=>field('notes',e.target.value)}/></label>
 <strong>Total : {money(total)}</strong>{error&&<p role="alert">{error}</p>}<footer><button type="submit" data-visitor-simulation="true" disabled={busy}>{busy?'Enregistrement…':'Enregistrer la commande'}</button></footer>
 </form></section></div>;
}
