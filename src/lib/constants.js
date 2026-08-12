export const PRESTATION_TYPES = [
  { value: 'traiteur', label: 'Traiteur', color: 'bg-orange-100 text-orange-700' },
  { value: 'chef', label: 'Chef à domicile', color: 'bg-purple-100 text-purple-700' },
  { value: 'cours', label: 'Cours de cuisine', color: 'bg-pink-100 text-pink-700' },
  { value: 'chambre', label: 'Chambre d\'hôte', color: 'bg-blue-100 text-blue-700' },
  { value: 'multi', label: 'Multi-prestation', color: 'bg-teal-100 text-teal-700' },
];

export const DEVIS_STATUTS = [
  { value: 'attente', label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'accepte', label: 'Accepté', color: 'bg-green-100 text-green-700' },
  { value: 'refuse', label: 'Refusé', color: 'bg-red-100 text-red-700' },
];

export const FACTURE_STATUTS = [
  { value: 'attente', label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'payee', label: 'Payée', color: 'bg-green-100 text-green-700' },
  { value: 'retard', label: 'En retard', color: 'bg-red-100 text-red-700' },
];

export const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export const calcTotalHT = (lignes = []) =>
  lignes.reduce((sum, l) => sum + (parseFloat(l.prixUnitaire) || 0) * (parseFloat(l.quantite) || 0), 0);

export const calcTTC = (lignes = [], tva = 0) =>
  calcTotalHT(lignes) * (1 + (parseFloat(tva) || 0) / 100);
