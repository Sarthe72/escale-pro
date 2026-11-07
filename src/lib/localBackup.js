const keys=['ep_clients','ep_prestations','ep_devis','ep_factures'];
export function exportLocalBackup(storage,now=new Date()){
 const data=Object.fromEntries(keys.map(key=>[key,JSON.parse(storage.getItem(key)||'[]')]));
 if(Object.values(data).some(rows=>!Array.isArray(rows)))throw Error('Données locales illisibles : ne pas les remplacer.');
 return {format:'escale-pro-local',version:1,createdAt:now.toISOString(),data};
}
export function restoreMissingLocalData(storage,backup){
 if(backup?.format!=='escale-pro-local'||backup.version!==1||!backup.data)throw Error('Ce fichier n’est pas une sauvegarde Escale Pro compatible.');
 const before=Object.fromEntries(keys.map(key=>[key,storage.getItem(key)]));
 const next={};let added=0;
 for(const key of keys){
  const incoming=backup.data[key],current=JSON.parse(before[key]||'[]');
  if(!Array.isArray(incoming)||!Array.isArray(current)||incoming.some(row=>!row||typeof row!=='object'||typeof row.id!=='string'||!row.id))throw Error('Sauvegarde invalide : aucune donnée modifiée.');
  const ids=new Set(current.map(row=>row.id));next[key]=[...current];
  for(const row of incoming)if(!ids.has(row.id)&&!row.id.startsWith('holiday-invoice-')){next[key].push(row);ids.add(row.id);added++;}
 }
 try{for(const key of keys)storage.setItem(key,JSON.stringify(next[key]));}
 catch(error){for(const key of keys){if(before[key]===null)storage.removeItem(key);else storage.setItem(key,before[key]);}throw error;}
 return added;
}
