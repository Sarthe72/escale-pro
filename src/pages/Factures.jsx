import { useState, useEffect } from 'react';
import { Printer, Mail, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFactures, saveFacture, deleteFacture, getDevis } from '../lib/store';
import { FACTURE_STATUTS, PRESTATION_TYPES, fmt, fmtDate, calcTTC, calcTotalHT } from '../lib/constants';
import { genFacturePDF } from '../lib/genFacturePDF';
import {isVisitor} from '../lib/visitor';
import {refreshSharedInvoices} from '../lib/crmApi';
import Modal from '../components/Modal';
import LignesEditor from '../components/LignesEditor';

function civilite(f) { return `${f.clientCivilite || 'M.'} ${f.clientNom}`; }

const GOOGLE_AVIS = 'https://g.page/r/Ce25mSwmf2agEBM/review';

function emailBodyFacture(f) {
  const total = fmt(calcTTC(f.lignes, f.tva));
  const date = f.datePrestation ? ' du ' + fmtDate(f.datePrestation) : '';
  return `Bonjour ${civilite(f)},\n\nVeuillez trouver ci-joint votre facture n° ${f.numero} pour votre prestation${date}, d'un montant total de ${total}.\n\nN'hésitez pas à me contacter pour toute question.\n\nSi vous avez été satisfait de nos prestations, un avis Google nous aiderait beaucoup :\n${GOOGLE_AVIS}\n\nBien cordialement,\nBenjamin Jardin\nUne Escale Gourmande\n06 25 14 26 08`;
}

function waBodyFacture(f) {
  const total = fmt(calcTTC(f.lignes, f.tva));
  const date = f.datePrestation ? ' du ' + fmtDate(f.datePrestation) : '';
  return `Bonjour ${civilite(f)},\n\nJe vous transmets votre facture n° ${f.numero} pour votre prestation${date}.\n\nMontant total : ${total}\n\nSi vous avez été satisfait, un avis Google nous aiderait beaucoup :\n${GOOGLE_AVIS}\n\nÀ bientôt,\nBenjamin Jardin — Une Escale Gourmande`;
}

function buildEmailLink(f) {
  const subject = `Votre facture n° ${f.numero} — Une Escale Gourmande`;
  return `mailto:${f.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBodyFacture(f))}`;
}

function buildWALink(f) {
  const tel = (f.clientTel || '').replace(/\D/g, '');
  const intl = tel.startsWith('33') ? tel : tel.startsWith('0') ? '33' + tel.slice(1) : tel;
  return `https://wa.me/${intl}?text=${encodeURIComponent(waBodyFacture(f))}`;
}

function downloadPDF(f) {
  try {
    const blob = genFacturePDF(f);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Facture-${f.numero}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch { return false; }
}

function SendModal({ facture, onClose }) {
  const [pdfReady, setPdfReady] = useState(false);
  const hasMail = !!facture.clientEmail;
  const hasTel = !!(facture.clientTel || '').replace(/\D/g, '');
  const total = fmt(calcTTC(facture.lignes, facture.tva));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: '560px', borderRadius: '24px 24px 0 0', padding: '28px 20px 48px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ fontSize: '28px' }}>✓</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Facture créée !</h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '4px' }}>{facture.numero} · {facture.clientNom} · {total}</p>
        </div>

        <div style={{ background: pdfReady ? '#f0fdf4' : '#f8fafc', borderRadius: '14px', border: `1px solid ${pdfReady ? '#86efac' : '#e2e8f0'}`, padding: '16px 18px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
            {pdfReady ? '✓ PDF téléchargé dans vos fichiers' : 'Étape 1 — Télécharger le PDF de la facture'}
          </p>
          <button type="button" onClick={() => { const ok = downloadPDF(facture); if (ok) setPdfReady(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: pdfReady ? '#dcfce7' : '#2d6a4f', border: 'none', cursor: 'pointer', width: '100%' }}>
            <Printer size={18} color={pdfReady ? '#15803d' : 'white'} />
            <span style={{ fontSize: '15px', fontWeight: '600', color: pdfReady ? '#15803d' : 'white' }}>
              {pdfReady ? 'Re-télécharger le PDF' : 'Télécharger le PDF'}
            </span>
          </button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Étape 2 — Envoyer &amp; joindre le PDF</p>

          <button type="button" disabled={!hasMail} onClick={() => { window.location.href = buildEmailLink(facture); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: hasMail ? '#eff6ff' : '#f1f5f9', border: `1px solid ${hasMail ? '#93c5fd' : '#e2e8f0'}`, cursor: hasMail ? 'pointer' : 'default', width: '100%', textAlign: 'left', opacity: hasMail ? 1 : 0.5 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: hasMail ? '#3b82f6' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: hasMail ? '#1e40af' : '#94a3b8' }}>Email</p>
              <p style={{ fontSize: '12px', color: hasMail ? '#3b82f6' : '#94a3b8', marginTop: '1px' }}>{hasMail ? facture.clientEmail : 'Email non renseigné'}</p>
            </div>
          </button>

          <button type="button" disabled={!hasTel} onClick={() => { window.open(buildWALink(facture), '_blank'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: hasTel ? '#f0fdf4' : '#f1f5f9', border: `1px solid ${hasTel ? '#86efac' : '#e2e8f0'}`, cursor: hasTel ? 'pointer' : 'default', width: '100%', textAlign: 'left', opacity: hasTel ? 1 : 0.5 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: hasTel ? '#25d366' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: hasTel ? '#15803d' : '#94a3b8' }}>WhatsApp</p>
              <p style={{ fontSize: '12px', color: hasTel ? '#22c55e' : '#94a3b8', marginTop: '1px' }}>{hasTel ? facture.clientTel : 'Téléphone non renseigné'}</p>
            </div>
          </button>

          {pdfReady && (
            <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', paddingTop: '2px' }}>
              Dans l'email ou WhatsApp, joindre le PDF depuis vos fichiers / téléchargements
            </p>
          )}
        </div>

        <button type="button" onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontSize: '16px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
          Fermer
        </button>
      </div>
    </div>
  );
}

const EMPTY = {
  clientCivilite: 'M.', clientNom: '', clientAdresse: '', clientEmail: '', clientTel: '',
  prestationType: 'traiteur', datePrestation: '',
  description: '', lignes: [], tva: '0',
  acompte: '', dateEnvoi: '', datePaiement: '',
  statut: 'attente', devisId: '', notes: '',
};

const inp = { width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', fontSize: '16px', boxSizing: 'border-box', background: 'white' };
const lbl = { fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' };

const TABS = [
  { key: 'attente', label: 'En attente' },
  { key: 'payee', label: 'Payées' },
  { key: 'retard', label: 'En retard' },
];

const STATUT_COLORS = { attente: { bg: '#fefce8', color: '#854d0e' }, payee: { bg: '#f0fdf4', color: '#15803d' }, retard: { bg: '#fef2f2', color: '#dc2626' } };
const TYPE_COLORS = { traiteur: { bg: '#fff7ed', color: '#c2410c' }, chef: { bg: '#faf5ff', color: '#7e22ce' }, cours: { bg: '#fdf2f8', color: '#be185d' }, chambre: { bg: '#eff6ff', color: '#1d4ed8' }, multi: { bg: '#f0fdfa', color: '#0f766e' } };

export default function Factures() {
  const [items, setItems] = useState([]);
  const [devis, setDevis] = useState([]);
  const [tab, setTab] = useState('attente');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [sendModal, setSendModal] = useState(null);
  const [syncError,setSyncError]=useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const reload = async () => { setItems(getFactures()); setDevis(getDevis()); if(!isVisitor){try{await refreshSharedInvoices();setItems(getFactures());setSyncError('');}catch(error){setSyncError(error.message);}} };
  useEffect(() => {
    reload();
    if (location.state?.openAdd) { setModal(true); navigate(location.pathname, { replace: true, state: {} }); }
  }, []);

  const byStatut = (s) => items.filter(f => f.statut === s).sort((a, b) => (b.dateEnvoi || b.createdAt || '').localeCompare(a.dateEnvoi || a.createdAt || ''));
  const attente = byStatut('attente');
  const payees = byStatut('payee');
  const retard = byStatut('retard');
  const list = tab === 'attente' ? attente : tab === 'payee' ? payees : retard;

  const open = (f = EMPTY) => { if(f.orderId){navigate(`/factures/${f.id}/imprimer`);return;}setForm({ ...EMPTY, ...f, lignes: f.lignes || [] }); setModal(true); };
  const close = () => { setModal(false); setForm(EMPTY); };
  const submit = () => {
    const today = new Date().toISOString().split('T')[0];
    if (form.id) {
      saveFacture(form);
      reload();
      close();
    } else {
      const created = saveFacture({ ...form, dateEnvoi: today });
      reload();
      close();
      setSendModal(created);
    }
  };

  const markPaid = (e, f) => { e.stopPropagation(); saveFacture({ ...f, statut: 'payee', datePaiement: new Date().toISOString().split('T')[0] }); reload(); };
  const markRetard = (e, f) => { e.stopPropagation(); saveFacture({ ...f, statut: 'retard' }); reload(); };

  const fromDevis = (d) => setForm(f => ({
    ...f, clientCivilite: d.clientCivilite || 'M.', clientNom: d.clientNom, clientAdresse: d.clientAdresse || '',
    clientEmail: d.clientEmail || '', clientTel: d.clientTel || '',
    prestationType: d.prestationType, datePrestation: d.datePrestation,
    description: d.description, lignes: d.lignes || [], tva: d.tva, devisId: d.id,
    dateEnvoi: new Date().toISOString().split('T')[0],
  }));

  const devisAcceptes = devis.filter(d => d.statut === 'accepte');
  const totalHT = calcTotalHT(form.lignes);
  const totalTTC = calcTTC(form.lignes, form.tva);
  const acompte = parseFloat(form.acompte) || 0;

  return (
    <div>
      {/* Header */}
      {syncError&&<p role="alert" style={{padding:16,background:'#fff1cb'}}>Factures partagées non actualisées : {syncError}</p>}
      <div style={{ background: '#2d6a4f', padding: '48px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>Factures</h1>
        <button onClick={() => open()} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '12px', padding: '10px 16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          + Nouvelle
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        {TABS.map(({ key, label }) => {
          const count = key === 'attente' ? attente.length : key === 'payee' ? payees.length : retard.length;
          return (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '16px 8px', background: 'none', border: 'none', borderBottom: `3px solid ${tab === key ? '#2d6a4f' : 'transparent'}`, color: tab === key ? '#2d6a4f' : '#94a3b8', fontSize: '14px', fontWeight: tab === key ? '700' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {label}
              {count > 0 && <span style={{ background: tab === key ? '#2d6a4f' : '#e2e8f0', color: tab === key ? 'white' : '#64748b', borderRadius: '999px', padding: '1px 7px', fontSize: '12px', fontWeight: '700' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {list.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '15px', padding: '40px 0' }}>Aucune facture</p>}
        {list.map(f => {
          const sc = STATUT_COLORS[f.statut] || STATUT_COLORS.attente;
          const tc = TYPE_COLORS[f.prestationType] || TYPE_COLORS.traiteur;
          const type = PRESTATION_TYPES.find(t => t.value === f.prestationType);
          const total = calcTTC(f.lignes, f.tva);
          return (
            <div key={f.id} onClick={() => open(f)} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ padding: '18px 18px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{f.clientNom || '—'}</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{f.numero}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{fmt(total)}</p>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color, fontWeight: '600' }}>{FACTURE_STATUTS.find(s => s.value === f.statut)?.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {type && <span style={{ fontSize: '13px', padding: '3px 10px', borderRadius: '999px', background: tc.bg, color: tc.color, fontWeight: '500' }}>{type.label}</span>}
                  {f.dateEnvoi && <span style={{ fontSize: '13px', color: '#64748b' }}>Envoyée {fmtDate(f.dateEnvoi)}</span>}
                  {f.datePaiement && <span style={{ fontSize: '13px', color: '#64748b' }}>Payée {fmtDate(f.datePaiement)}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} onClick={e => e.stopPropagation()}>
                  {tab === 'attente' && !f.orderId && (
                    <>
                      <button type="button" onClick={e => markPaid(e, f)} style={{ padding: '12px', background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>✓ Payée</button>
                      <button type="button" onClick={e => markRetard(e, f)} style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>⚠ En retard</button>
                    </>
                  )}
                  <button type="button" onClick={e => { e.stopPropagation(); setSendModal(f); }} style={{ padding: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#0369a1', fontSize: '13px', fontWeight: '600' }}>
                    <Mail size={14} /> Envoyer
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); navigate(`/factures/${f.id}/imprimer`); }} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                    <Printer size={15} /> PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal formulaire */}
      {modal && (
        <Modal
          title={form.id ? 'Modifier la facture' : 'Nouvelle facture'}
          onClose={close}
          footer={<>
            <button type="button" onClick={submit} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '17px', fontWeight: '700', cursor: 'pointer', background: '#2d6a4f', color: 'white' }}>
              {form.id ? 'Enregistrer' : 'Créer la facture'}
            </button>
            {form.id && (
              <button type="button" onClick={() => { if (confirm('Supprimer cette facture ?')) { deleteFacture(form.id); reload(); close(); } }} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #fca5a5', background: 'transparent', fontSize: '16px', fontWeight: '600', cursor: 'pointer', color: '#ef4444' }}>
                Supprimer
              </button>
            )}
          </>}
        >
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {!form.id && devisAcceptes.length > 0 && (
                <div>
                  <label style={lbl}>Reprendre depuis un devis</label>
                  <select style={inp} onChange={e => { const d = devisAcceptes.find(d => d.id === e.target.value); if (d) fromDevis(d); }}>
                    <option value="">— Créer sans devis —</option>
                    {devisAcceptes.map(d => <option key={d.id} value={d.id}>{d.numero} · {d.clientNom}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={lbl}>Nom du client</label>
                <input style={inp} placeholder="Dupont Jean" value={form.clientNom} onChange={e => setForm({ ...form, clientNom: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Téléphone</label>
                  <input type="tel" style={inp} placeholder="06 xx xx xx xx" value={form.clientTel} onChange={e => setForm({ ...form, clientTel: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" style={inp} placeholder="client@mail.fr" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={lbl}>Adresse client <span style={{ fontWeight: '400', color: '#94a3b8' }}>(pour le PDF)</span></label>
                <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }}
                  placeholder={"14 avenue Pasteur\n24800 Thiviers"}
                  value={form.clientAdresse} onChange={e => setForm({ ...form, clientAdresse: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>Type</label>
                <select style={inp} value={form.prestationType} onChange={e => setForm({ ...form, prestationType: e.target.value })}>
                  {PRESTATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Date de la prestation</label>
                <input type="date" style={inp} value={form.datePrestation} onChange={e => setForm({ ...form, datePrestation: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>Description <span style={{ fontWeight: '400', color: '#94a3b8' }}>(optionnel)</span></label>
                <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
                  placeholder="Repas du 27 juin pour 64 personnes."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <LignesEditor lignes={form.lignes} onChange={lignes => setForm({ ...form, lignes })} />

              <div>
                <label style={lbl}>TVA</label>
                <select style={inp} value={form.tva} onChange={e => setForm({ ...form, tva: e.target.value })}>
                  <option value="0">Non soumis à la TVA</option>
                  <option value="5.5">5,5 %</option>
                  <option value="10">10 %</option>
                  <option value="20">20 %</option>
                </select>
              </div>

              {form.lignes.length > 0 && (
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                    <span>Total HT</span><span style={{ fontWeight: '600' }}>{fmt(totalHT)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94a3b8' }}>
                    <span>TVA</span><span>{form.tva === '0' ? 'Non soumis' : `${form.tva} %`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '700', color: '#2d6a4f', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '2px' }}>
                    <span>Total TTC</span><span>{fmt(totalTTC)}</span>
                  </div>
                  {acompte > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                        <span>Acompte versé</span><span>− {fmt(acompte)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', color: '#ea580c' }}>
                        <span>Reste à payer</span><span>{fmt(totalTTC - acompte)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <label style={lbl}>Acompte déjà versé (€) <span style={{ fontWeight: '400', color: '#94a3b8' }}>(optionnel)</span></label>
                <input type="number" step="0.01" min="0" style={inp} placeholder="0,00" value={form.acompte} onChange={e => setForm({ ...form, acompte: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>Statut</label>
                <select style={inp} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                  {FACTURE_STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {form.statut === 'payee' && (
                <div>
                  <label style={lbl}>Date de paiement</label>
                  <input type="date" style={inp} value={form.datePaiement} onChange={e => setForm({ ...form, datePaiement: e.target.value })} />
                </div>
              )}

              <div>
                <label style={lbl}>Notes internes</label>
                <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

            </div>
          </div>
        </Modal>
      )}

      {sendModal && <SendModal facture={sendModal} onClose={() => setSendModal(null)} />}
    </div>
  );
}
