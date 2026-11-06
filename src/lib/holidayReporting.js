export function completedOrderPrestations(orders) {
 const unique = new Map();
 for(const order of orders) {
  const existing=unique.get(order.id);
  if(!existing || (order.version||0)>=(existing.version||0)) unique.set(order.id,order);
 }
 return [...unique.values()].filter(order=>order.paid===true && order.status==='collected').map(order=>({
  id:`commande-noel-${order.id}`,orderId:order.id,numero:order.id,
  clientNom:[order.firstName,order.name].filter(Boolean).join(' '),
  prestationType:'commandes_noel',statut:'accepte',datePrestation:order.pickup,
  createdAt:order.createdAt||order.pickup,description:'Commande Noël · payée et retirée',
  lignes:order.items.map(item=>({description:item.name,quantite:item.quantity,prixUnitaire:item.price/100})),tva:'0',
 }));
}
