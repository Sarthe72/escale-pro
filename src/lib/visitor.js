export const isVisitor = typeof window !== 'undefined' && window.location.pathname.endsWith('/visiteur.html');
import {orderCatalog,orderPickups} from './orderCatalog.js';
const date = new Date().toISOString().slice(0, 10);
const lines = [{ description: 'Menu de fête — exemple', quantite: 4, prixUnitaire: 29.5 }];
const quote = { id: 'visiteur-devis-1', numero: 'EXEMPLE-DEV-001', clientCivilite: 'Mme', clientNom: 'Camille Exemple', clientAdresse: 'Adresse fictive', clientEmail: '', clientTel: '', prestationType: 'traiteur', datePrestation: date, createdAt: date, dateEnvoi: date, dateAcceptation: date, statut: 'accepte', lignes: lines, tva: 0 };
export const visitorData = {
 ep_clients: [], ep_prestations: [],
 ep_devis: [quote, { ...quote, id: 'visiteur-devis-2', numero: 'EXEMPLE-DEV-002', clientNom: 'Alex Démonstration', statut: 'attente' },{...quote,id:'visiteur-chambre-1',numero:'EXEMPLE-CHAMBRE-001',clientNom:'Lou Exemple',prestationType:'chambre',lignes:[{description:'Séjour fictif · 2 nuits',quantite:2,prixUnitaire:90}]}],
 ep_factures: [{ ...quote, id: 'visiteur-facture-1', numero: 'EXEMPLE-FAC-001', devisId: quote.id, statut: 'payee', datePaiement: date }],
};
export const visitorOrders = [{ id: 'EXEMPLE-COMMANDE-001', firstName: 'Camille', name: 'Exemple', phone: '—', email: '', pickup: '2026-12-24', payment: 'cash', paid: false, status: 'confirmed', version: 1, total: 2950, items: [{id:'tartelette',name:'Tartelette périgourdine',price:1000,quantity:1},{id:'volaille',name:'Suprême de volaille farcie',price:1400,quantity:1},{id:'chocolat',name:'Royal chocolat',price:550,quantity:1}] }];
export function assertWritable() {
 if (isVisitor) throw new Error('Mode visiteur : consultation uniquement.');
}
const extraClients = [
 ['Julie','Exemple',4,'cash','2026-12-24'],
 ['Thomas','Démonstration',6,'cheque','2026-12-24'],
 ['Sarah','Fictive',2,'instant_transfer','2026-12-24'],
 ['Nicolas','Exemple',8,'cash','2026-12-24'],
 ['Élodie','Démonstration',3,'cheque','2026-12-26'],
 ['Marc','Fictif',5,'instant_transfer','2026-12-31'],
];
extraClients.forEach(([firstName,name,quantity,payment,pickup],index)=>{
 const items = visitorOrders[0].items.map(item=>({...item,quantity}));
 visitorOrders.push({ ...visitorOrders[0], id:`EXEMPLE-COMMANDE-00${index+2}`, firstName,name,payment,pickup,items,total:items.reduce((sum,item)=>sum+item.price*item.quantity,0) });
});
visitorOrders.push({ ...visitorOrders[0], id:'EXEMPLE-COMMANDE-008',firstName:'Anne',name:'Menu Varié',total:5900,
 items:[
  {id:'tartelette',name:'Tartelette périgourdine',price:1000,quantity:1},
  {id:'truite',name:'Truite de Borrèze en gravlax',price:900,quantity:1},
  {id:'volaille',name:'Suprême de volaille farcie',price:1400,quantity:1},
  {id:'poisson',name:'Lotte à l’américaine',price:1500,quantity:1},
  {id:'chocolat',name:'Royal chocolat',price:550,quantity:1},
  {id:'ananas',name:'Entremets ananas et yuzu',price:550,quantity:1},
 ] });
let simulatedOrders = structuredClone(visitorOrders);
let simulatedInvoices = [];
export function getVisitorOrders() { return structuredClone(simulatedOrders); }
export function getVisitorInvoices() { return structuredClone(simulatedInvoices); }
const visitorRequests = new Map();
export function createVisitorOrder(input,requestKey) {
 if(visitorRequests.has(requestKey)) return {id:visitorRequests.get(requestKey)};
 if(!input.name?.trim()||!input.firstName?.trim()||!/^\+?[0-9]{10,15}$/.test(input.phone.replace(/[\s().-]/g,'')))throw Error('Renseignez le nom, le prénom et un téléphone valide.');
 if(!orderPickups.some(([id])=>id===input.pickup)||!['phone','email'].includes(input.source)||!['cash','cheque','instant_transfer'].includes(input.payment))throw Error('Vérifiez le retrait et le paiement.');
 if(!input.items.length)throw Error('Ajoutez un plat.');
 const items=input.items.map(item=>{const dish=orderCatalog.find(d=>d.id===item.id);if(!dish||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>100)throw Error('Quantité invalide.');return {...dish,quantity:item.quantity};});
 const id='EXEMPLE-MANUELLE-'+crypto.randomUUID().slice(0,8);
 simulatedOrders.push({...input,name:input.name.trim(),firstName:input.firstName.trim(),id,items,total:items.reduce((sum,i)=>sum+i.price*i.quantity,0),paid:false,status:'confirmed',version:1,createdAt:new Date().toISOString()});
 visitorRequests.set(requestKey,id); return {id};
}
export function resetVisitorOrders() { simulatedOrders = structuredClone(visitorOrders); simulatedInvoices = []; visitorRequests.clear(); }
export function updateVisitorOrder(id, change) {
 const order = simulatedOrders.find(order=>order.id===id);
 if (!order || change.version !== order.version) throw new Error('Actualisez la simulation.');
 if (order.total === null || order.items.some(item=>item.price===null)) throw new Error('Le tarif du poisson doit être confirmé avant paiement et facturation.');
 if (change.status === 'confirmed' && change.paid === false) {
  if (order.status !== 'collected') throw new Error('Cette commande est déjà en attente de retrait.');
  const invoice = simulatedInvoices.find(invoice=>invoice.id===order.invoiceId);
  if (invoice) {
   invoice.statut='attente'; invoice.datePaiement='';
   invoice.description=`Commande ${order.id} · Validation du paiement et du retrait annulée · EXEMPLE SANS VALEUR COMPTABLE`;
  }
  Object.assign(order,{status:'confirmed',paid:false,version:order.version+1});
  return;
 }
 if (change.status !== 'collected' || change.paid !== true) throw new Error('Action non disponible dans la simulation.');
 const invoiceId = `facture-${order.id}`;
 if (!simulatedInvoices.some(invoice=>invoice.id===invoiceId)) {
  const today = new Date().toISOString().slice(0,10);
  simulatedInvoices.push({
   id:invoiceId, orderId:order.id, numero:`EXEMPLE-FETES-${String(simulatedInvoices.length+1).padStart(4,'0')}`,
   example:true, clientCivilite:'', clientNom:`${order.firstName} ${order.name}`,
   clientAdresse:'',clientEmail:order.email,clientTel:'',prestationType:'traiteur',
   datePrestation:order.pickup,dateEnvoi:today,datePaiement:today,createdAt:new Date().toISOString(),
   description:`Commande ${order.id} · Paiement reçu et commande retirée · EXEMPLE SANS VALEUR COMPTABLE`,
   lignes:order.items.map(item=>({description:item.name,quantite:item.quantity,prixUnitaire:item.price/100})),
   tva:0,acompte:0,statut:'payee',notes:'EXEMPLE — Sans valeur comptable',
  });
 }
 const invoice = simulatedInvoices.find(invoice=>invoice.id===invoiceId);
 invoice.statut='payee';invoice.datePaiement=new Date().toISOString().slice(0,10);
 invoice.description=`Commande ${order.id} · Paiement reçu et commande retirée · EXEMPLE SANS VALEUR COMPTABLE`;
 Object.assign(order,{status:'collected',paid:true,version:order.version+1,invoiceId});
}
