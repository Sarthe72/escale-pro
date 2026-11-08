import {crmRequest} from './crmApi';
function deviceStore(action){return new Promise((resolve,reject)=>{
 const open=indexedDB.open('escale-pro-device',1);
 open.onupgradeneeded=()=>open.result.createObjectStore('keys');
 open.onerror=()=>reject(Error('Le stockage sécurisé de cet appareil est indisponible.'));
 open.onsuccess=()=>{const db=open.result;const tx=db.transaction('keys','readwrite');let result;const request=action(tx.objectStore('keys'));request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(Error('Impossible de conserver la connexion sur cet appareil.'));};};
});}
export const readDevice=()=>deviceStore(store=>store.get('current'));
export async function pairDevice(token){
 let device=await readDevice();
 if(!device?.keys){device={keys:await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify'])};await deviceStore(store=>store.put(device,'current'));}
 const publicKey=await crypto.subtle.exportKey('jwk',device.keys.publicKey);
 const result=await crmRequest('pair',{method:'POST',body:{token,publicKey},token:''});
 device.id=result.deviceId;await deviceStore(store=>store.put(device,'current'));return device;
}
export async function deviceLoginProof(){
 const device=await readDevice();if(!device?.id)return null;
 const challenge=await crmRequest('challenge',{method:'POST',body:{deviceId:device.id},token:''});
 const bytes=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},device.keys.privateKey,new TextEncoder().encode(challenge.challenge)));
 let raw='';for(const byte of bytes)raw+=String.fromCharCode(byte);
 return {deviceId:device.id,challengeId:challenge.id,signature:btoa(raw).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')};
}
