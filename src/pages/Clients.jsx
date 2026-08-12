import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getDevis } from '../lib/store';
import { fmt, fmtDate, calcTTC, PRESTATION_TYPES } from '../lib/constants';

const DEVIS_STATUT_STYLE = {
  attente: { color: '#854d0e', label: 'En attente' },
  accepte: { color: '#15803d', label: 'Accepté' },
  refuse: { color: '#dc2626', label: 'Refusé' },
};

export default function Clients() {
  const [devis, setDevis] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [sort, setSort] = useState('activite');
  const navigate = useNavigate();

  useEffect(() => { setDevis(getDevis()); }, []);

  const clientMap = {};
  devis.forEach(d => {
    const nom = d.clientNom?.trim() || '—';
    if (!clientMap[nom]) clientMap[nom] = { nom, adresse: '', devis: [], lastDate: '' };
    clientMap[nom].devis.push(d);
    const date = d.dateEnvoi || d.createdAt || '';
    if (date > clientMap[nom].lastDate) {
      clientMap[nom].lastDate = date;
      if (d.clientAdresse) clientMap[nom].adresse = d.clientAdresse;
    }
  });

  const getStatut = (c) => {
    if (c.devis.some(d => d.statut === 'accepte')) return 'actif';
    if (c.devis.every(d => d.statut === 'refuse')) return 'refuse';
    return 'prospect';
  };
  const getCA = (c) => c.devis.filter(d => d.statut === 'accepte').reduce((s, d) => s + calcTTC(d.lignes, d.tva), 0);

  let clients = Object.values(clientMap);
  if (sort === 'activite') clients = clients.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  if (sort === 'nom') clients = clients.sort((a, b) => a.nom.localeCompare(b.nom));
  if (sort === 'ca') clients = clients.sort((a, b) => getCA(b) - getCA(a));

  const actifs = clients.filter(c => getStatut(c) === 'actif').length;
  const prospects = clients.filter(c => getStatut(c) === 'prospect').length;

  const STATUT_STYLE = {
    actif:   { bg: '#f0fdf4', color: '#15803d', label: 'Actif' },
    refuse:  { bg: '#f8fafc', color: '#94a3b8', label: 'Refusé' },
    prospect:{ bg: '#fefce8', color: '#854d0e', label: 'Prospect' },
  };

  return (
    <div>
      <div style={{ background: '#2d6a4f', padding: '48px 20px 20px' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>Clients</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>
          {clients.length} clients · {actifs} actifs · {prospects} prospects
        </p>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8', flexShrink: 0 }}>Trier :</span>
        {[['activite', 'Récent'], ['nom', 'Nom A→Z'], ['ca', 'CA ↓']].map(([v, l]) => (
          <button key={v} onClick={() => setSort(v)} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${sort === v ? '#2d6a4f' : '#e2e8f0'}`, background: sort === v ? '#2d6a4f' : 'white', color: sort === v ? 'white' : '#64748b', fontSize: '13px', cursor: 'pointer', fontWeight: sort === v ? '600' : '400' }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {clients.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '15px', padding: '40px 0' }}>
            Aucun client — les clients apparaissent automatiquement depuis les devis
          </p>
        )}
        {clients.map(c => {
          const statut = getStatut(c);
          const ss = STATUT_STYLE[statut];
          const ca = getCA(c);
          const isGrise = statut === 'refuse';
          const isOpen = expanded === c.nom;
          const nbAcceptes = c.devis.filter(d => d.statut === 'accepte').length;

          return (
            <div key={c.nom} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', opacity: isGrise ? 0.45 : 1 }}>
              <div onClick={() => setExpanded(isOpen ? null : c.nom)} style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: isGrise ? '#f1f5f9' : '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: isGrise ? '#94a3b8' : '#2d6a4f' }}>{c.nom[0]?.toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: isGrise ? '#94a3b8' : '#1e293b' }}>{c.nom}</p>
                    <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '999px', background: ss.bg, color: ss.color, fontWeight: '600' }}>{ss.label}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {c.devis.length} devis{nbAcceptes > 0 ? ` · ${nbAcceptes} accepté${nbAcceptes > 1 ? 's' : ''}` : ''}
                    {ca > 0 ? ` · CA ${fmt(ca)}` : ''}
                  </p>
                </div>
                {isOpen ? <ChevronUp size={18} color="#94a3b8" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="#94a3b8" style={{ flexShrink: 0 }} />}
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                  {c.adresse && (
                    <div style={{ padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'pre-wrap' }}>{c.adresse}</p>
                    </div>
                  )}
                  {[...c.devis].sort((a, b) => (b.dateEnvoi || b.createdAt || '').localeCompare(a.dateEnvoi || a.createdAt || '')).map(d => {
                    const ds = DEVIS_STATUT_STYLE[d.statut] || DEVIS_STATUT_STYLE.attente;
                    const type = PRESTATION_TYPES.find(t => t.value === d.prestationType);
                    return (
                      <div key={d.id} onClick={() => navigate('/devis', { state: { openDevisId: d.id } })} style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{d.numero}</p>
                          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                            {type?.label}{d.datePrestation ? ' · ' + fmtDate(d.datePrestation) : ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{fmt(calcTTC(d.lignes, d.tva))}</p>
                          <p style={{ fontSize: '12px', color: ds.color, fontWeight: '600' }}>{ds.label} →</p>
                        </div>
                      </div>
                    );
                  })}
                  {nbAcceptes > 0 && (
                    <button onClick={() => navigate('/prestations')} style={{ width: '100%', padding: '12px 18px', background: '#f0fdf4', border: 'none', color: '#2d6a4f', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}>
                      Voir les prestations →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
