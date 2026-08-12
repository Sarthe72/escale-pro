// Stockage local — sera remplacé par Cloudflare D1
const KEYS = { clients: 'ep_clients', prestations: 'ep_prestations', devis: 'ep_devis', factures: 'ep_factures' };

const load = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

// CLIENTS
export const getClients = () => load(KEYS.clients);
export const saveClient = (client) => {
  const list = load(KEYS.clients);
  if (client.id) {
    const idx = list.findIndex(c => c.id === client.id);
    list[idx] = client;
  } else {
    list.push({ ...client, id: uid(), createdAt: new Date().toISOString() });
  }
  save(KEYS.clients, list);
};
export const deleteClient = (id) => save(KEYS.clients, load(KEYS.clients).filter(c => c.id !== id));

// PRESTATIONS
export const getPrestations = () => load(KEYS.prestations);
export const savePrestation = (p) => {
  const list = load(KEYS.prestations);
  if (p.id) {
    const idx = list.findIndex(x => x.id === p.id);
    list[idx] = p;
  } else {
    list.push({ ...p, id: uid(), createdAt: new Date().toISOString() });
  }
  save(KEYS.prestations, list);
};
export const deletePrestation = (id) => save(KEYS.prestations, load(KEYS.prestations).filter(p => p.id !== id));

const dateStamp = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const uniqueNumero = (list, prefix) => {
  const base = `${prefix}-${dateStamp()}`;
  const existing = list.map(x => x.numero).filter(n => n && n.startsWith(base));
  if (existing.length === 0) return base;
  return `${base}-${existing.length + 1}`;
};

// DEVIS
export const getDevis = () => load(KEYS.devis);
export const saveDevis = (d) => {
  const list = load(KEYS.devis);
  if (d.id) {
    const idx = list.findIndex(x => x.id === d.id);
    list[idx] = d;
    save(KEYS.devis, list);
    return d;
  } else {
    const created = { ...d, id: uid(), numero: uniqueNumero(list, 'DEV'), createdAt: new Date().toISOString() };
    list.push(created);
    save(KEYS.devis, list);
    return created;
  }
};
export const deleteDevis = (id) => save(KEYS.devis, load(KEYS.devis).filter(d => d.id !== id));

// FACTURES
export const getFactures = () => load(KEYS.factures);
export const saveFacture = (f) => {
  const list = load(KEYS.factures);
  if (f.id) {
    const idx = list.findIndex(x => x.id === f.id);
    list[idx] = f;
    save(KEYS.factures, list);
    return f;
  } else {
    const created = { ...f, id: uid(), numero: uniqueNumero(list, 'FAC'), createdAt: new Date().toISOString() };
    list.push(created);
    save(KEYS.factures, list);
    return created;
  }
};
export const deleteFacture = (id) => save(KEYS.factures, load(KEYS.factures).filter(f => f.id !== id));

export const resetAll = () => Object.values(KEYS).forEach(k => localStorage.removeItem(k));
