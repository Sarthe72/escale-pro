import {exportLocalBackup} from './localBackup';
const snapshotId='before-holiday-update-2026';
function vault(action){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('escale-pro-backups',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');
 request.onerror=()=>reject(Error('Copie de sécurité indisponible sur cet appareil.'));
 request.onsuccess=()=>{const db=request.result;const tx=db.transaction('snapshots','readwrite');const op=action(tx.objectStore('snapshots'));let value;op.onsuccess=()=>{value=op.result;};tx.oncomplete=()=>{db.close();resolve(value);};tx.onerror=()=>{db.close();reject(Error('Impossible de conserver la copie de sécurité.'));};};
});}
export const readUpdateBackup=()=>vault(store=>store.get(snapshotId));
export async function prepareUpdateBackup(){
 if(await readUpdateBackup())return;
 const backup=exportLocalBackup(localStorage);
 if(!Object.values(backup.data).some(rows=>rows.length))return;
 // add, never put: another tab cannot replace the original snapshot.
 await vault(store=>store.add(backup,snapshotId));
}
