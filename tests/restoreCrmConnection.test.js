import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreCrmConnection} from '../src/lib/restoreCrmConnection.js';
function fixture(){let token='';const calls=[];return {calls,api:{pairDevice:async()=>{calls.push('pair');},getCrmToken:()=>token,crmRequest:async()=>{},clearCrmSession:()=>{token='';},deviceLoginProof:async()=>({deviceId:'existing-device'}),signInCrm:async()=>{token='new-session';calls.push('login');},refreshSharedInvoices:async()=>{calls.push('invoices');}}};}
test('réouverture sans session : reconnexion avec l’appareil conservé',async()=>{const f=fixture();assert.equal(await restoreCrmConnection(f.api),true);assert.deepEqual(f.calls,['login','invoices']);});
test('ancien lien consommé : un appareil déjà associé reste utilisable',async()=>{const f=fixture();f.api.pairDevice=async()=>{throw Error('Lien déjà utilisé');};assert.equal(await restoreCrmConnection(f.api,'used-link'),true);assert.deepEqual(f.calls,['login','invoices']);});
test('autre navigateur sans appareil : ne prétend pas être connecté',async()=>{const f=fixture();f.api.deviceLoginProof=async()=>null;assert.equal(await restoreCrmConnection(f.api),false);assert.deepEqual(f.calls,[]);});
test('lien consommé sans appareil : erreur explicite',async()=>{const f=fixture();f.api.pairDevice=async()=>{throw Error('Lien déjà utilisé');};f.api.deviceLoginProof=async()=>null;await assert.rejects(()=>restoreCrmConnection(f.api,'used-link'),/Lien déjà utilisé/);});
test('panne réseau : conserve la session existante',async()=>{const f=fixture();f.api.getCrmToken=()=> 'existing';f.api.crmRequest=async()=>{throw Error('Réseau indisponible');};await assert.rejects(()=>restoreCrmConnection(f.api),/Réseau/);assert.deepEqual(f.calls,[]);});
