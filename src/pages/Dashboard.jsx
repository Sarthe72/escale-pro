import { useState, useEffect } from 'react';
import { isVisitor } from '../lib/visitor';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Receipt, AlertCircle, Plus } from 'lucide-react';
import { getDevis, getFactures } from '../lib/store';
import { PRESTATION_TYPES, fmt, fmtDate, calcTTC } from '../lib/constants';
import {signOutCrm} from '../lib/crmApi';
import LocalBackup from '../components/LocalBackup';

const LOGO_HEADER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
  <ellipse cx="100" cy="110" rx="85" ry="100" stroke="rgba(255,255,255,0.5)" stroke-width="3.5" fill="none"/>
  <ellipse cx="100" cy="110" rx="79" ry="94" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" fill="none"/>
  <path d="M82 88 L100 68 L118 88" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="84" y="88" width="32" height="24" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="93" y="100" width="14" height="12" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" fill="none"/>
  <line x1="65" y1="122" x2="135" y2="122" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
  <ellipse cx="100" cy="142" rx="22" ry="14" stroke="rgba(255,255,255,0.6)" stroke-width="2.2" fill="rgba(255,255,255,0.1)"/>
  <circle cx="93" cy="139" r="1.5" fill="rgba(255,255,255,0.6)"/>
  <circle cx="100" cy="137" r="1.5" fill="rgba(255,255,255,0.6)"/>
  <circle cx="107" cy="139" r="1.5" fill="rgba(255,255,255,0.6)"/>
  <circle cx="96" cy="144" r="1.5" fill="rgba(255,255,255,0.6)"/>
  <circle cx="104" cy="144" r="1.5" fill="rgba(255,255,255,0.6)"/>
  <circle cx="100" cy="148" r="1.5" fill="rgba(255,255,255,0.6)"/>
</svg>`;

const card = { background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' };

export default function Dashboard() {
  const [devis, setDevis] = useState([]);
  const [factures, setFactures] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    setDevis(getDevis());
    setFactures(getFactures());
  }, []);

  const devisAttente = devis.filter(d => d.statut === 'attente');
  const devisAcceptes = devis.filter(d => d.statut === 'accepte');
  const facturesAttente = factures.filter(f => f.statut === 'attente');
  const facturesRetard = factures.filter(f => f.statut === 'retard');

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const caMonth = factures.filter(f => {
    const d = new Date(f.datePaiement || '');
    return f.statut === 'payee' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, f) => sum + calcTTC(f.lignes, f.tva), 0);

  const caAnnee = factures.filter(f => {
    const d = new Date(f.datePaiement || '');
    return f.statut === 'payee' && d.getFullYear() === now.getFullYear();
  }).reduce((sum, f) => sum + calcTTC(f.lignes, f.tva), 0);

  const today = now.toISOString().split('T')[0];
  const prochains = devisAcceptes
    .filter(d => d.datePrestation && d.datePrestation >= today)
    .sort((a, b) => a.datePrestation.localeCompare(b.datePrestation))
    .slice(0, 4);

  const getType = (v) => PRESTATION_TYPES.find(t => t.value === v);

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#2d6a4f', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div dangerouslySetInnerHTML={{ __html: LOGO_HEADER }}
          style={{ position: 'absolute', right: -10, top: -10, width: 160, height: 192, pointerEvents: 'none' }} />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Bonjour Benjamin 🧑‍🍳</p>
        <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '700', marginTop: '4px' }}>Tableau de bord</h1>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* CA — cliquables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ ...card, cursor: 'pointer' }} onClick={() => navigate('/prestations', { state: { month: thisMonth } })}>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>CA ce mois</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: '#2d6a4f' }}>{fmt(caMonth)}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Voir les prestations →</p>
            </div>
          </div>
          <div style={{ ...card, cursor: 'pointer' }} onClick={() => navigate('/prestations')}>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>CA {now.getFullYear()}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: '#1e293b' }}>{fmt(caAnnee)}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Voir les prestations →</p>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {devisAttente.length > 0 && (
          <div onClick={() => navigate('/devis')} style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <AlertCircle size={22} color="#ca8a04" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '15px', color: '#854d0e' }}>{devisAttente.length} devis en attente de réponse</p>
          </div>
        )}
        {(facturesAttente.length > 0 || facturesRetard.length > 0) && (
          <div onClick={() => navigate('/factures')} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <AlertCircle size={22} color="#ea580c" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '15px', color: '#9a3412' }}>
              {facturesAttente.length + facturesRetard.length} facture{facturesAttente.length + facturesRetard.length > 1 ? 's' : ''} impayée{facturesAttente.length + facturesRetard.length > 1 ? 's' : ''}
              {facturesRetard.length > 0 && ` (dont ${facturesRetard.length} en retard)`}
            </p>
          </div>
        )}

        {/* Ajout rapide */}
        <div style={card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '17px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="#2d6a4f" /> Nouveau
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[
              { label: 'Devis', icon: FileText, to: '/devis', bg: '#f0f9ff', color: '#0369a1' },
              { label: 'Facture', icon: Receipt, to: '/factures', bg: '#f0fdf4', color: '#15803d' },
            ].map(({ label, icon: Icon, to, bg, color }) => (
              <button key={to} disabled={isVisitor} onClick={() => navigate(to, { state: { openAdd: true } })}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px 8px', background: 'none', border: 'none', cursor: 'pointer', borderRight: label === 'Devis' ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={30} color={color} />
                </div>
                <span style={{ fontSize: '15px', color: '#475569', fontWeight: '600' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prochaines dates */}
        {prochains.length > 0 && (
          <div style={card}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '17px', fontWeight: '600', color: '#1e293b' }}>Prochains événements</p>
              <Link to="/prestations" style={{ fontSize: '14px', color: '#2d6a4f', textDecoration: 'none', fontWeight: '500' }}>Voir tout</Link>
            </div>
            {prochains.map((d, i) => {
              const type = getType(d.prestationType);
              const date = new Date(d.datePrestation);
              return (
                <div key={d.id} onClick={() => navigate('/prestations')} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}>
                  <div style={{ textAlign: 'center', minWidth: '44px' }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>{date.toLocaleDateString('fr-FR', { month: 'short' })}</p>
                    <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', lineHeight: 1.1 }}>{date.getDate()}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{d.clientNom}</p>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>{d.description || (type?.label)}</p>
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#2d6a4f' }}>{fmt(calcTTC(d.lignes, d.tva))}</p>
                </div>
              );
            })}
          </div>
        )}

        <LocalBackup />
        {/* Actions discrètes */}
        <div style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>

          <button type="button" onClick={async() => { await signOutCrm(); }}
            style={{ background: 'none', border: 'none', fontSize: '13px', color: '#94a3b8', cursor: 'pointer', padding: '8px 16px' }}>
            Se déconnecter
          </button>
        </div>

      </div>


    </div>
  );
}
