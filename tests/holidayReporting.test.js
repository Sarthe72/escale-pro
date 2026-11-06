import test from 'node:test';
import assert from 'node:assert/strict';
import {completedOrderPrestations} from '../src/lib/holidayReporting.js';
const order={id:'commande-1',version:1,firstName:'Camille',name:'Exemple',pickup:'2026-12-24',paid:true,status:'collected',items:[{name:'Menu',price:2950,quantity:2}]};
test('comptabilise uniquement les commandes payées ET retirées',()=>{
 assert.equal(completedOrderPrestations([order,{...order,id:'2',paid:false},{...order,id:'3',status:'confirmed'},{...order,id:'4',status:'cancelled'}]).length,1);
});
test('classe Noël séparément à la date de retrait, y compris en janvier',()=>{
 const entries=completedOrderPrestations([order,{...order,id:'2',pickup:'2027-01-02'}]);
 assert.equal(entries[0].prestationType,'commandes_noel');assert.equal(entries[0].datePrestation,'2026-12-24');assert.equal(entries[1].datePrestation,'2027-01-02');
 assert.equal(entries.reduce((sum,e)=>sum+e.lignes.reduce((s,l)=>s+l.quantite*l.prixUnitaire,0),0),118);
});
test('évite les doublons et retire du bilan une validation annulée',()=>{
 assert.equal(completedOrderPrestations([order,order]).length,1);
 assert.equal(completedOrderPrestations([order,{...order,version:2,status:'confirmed',paid:false}]).length,0);
});
