import { useState, useEffect } from 'react';
import { Printer, Mail, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDevis, saveDevis, deleteDevis } from '../lib/store';
import { DEVIS_STATUTS, PRESTATION_TYPES, fmt, fmtDate, calcTTC, calcTotalHT } from '../lib/constants';
import { genDevisPDF } from '../lib/genDevisPDF';
import Modal from '../components/Modal';
import LignesEditor from '../components/LignesEditor';

const EMPTY = {
  clientCivilite: 'M.', clientNom: '', clientAdresse: '', clientEmail: '', clientTel: '',
  prestationType: 'traiteur', datePrestation: '',
  description: '', lignes: [], tva: '0',
  dateEnvoi: '', dateAcceptation: '', statut: 'attente', notes: '',
};

const inp = { width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', fontSize: '16px', boxSizing: 'border-box', background: 'white' };
const lbl = { fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' };

const TABS = [
  { key: 'attente', label: 'En attente' },
  { key: 'accepte', label: 'Acceptés' },
  { key: 'refuse', label: 'Refusés' },
];

const STATUT_COLORS = { attente: { bg: '#fefce8', color: '#854d0e' }, accepte: { bg: '#f0fdf4', color: '#15803d' }, refuse: { bg: '#fef2f2', color: '#dc2626' } };
const TYPE_COLORS = { traiteur: { bg: '#fff7ed', color: '#c2410c' }, chef: { bg: '#faf5ff', color: '#7e22ce' }, cours: { bg: '#fdf2f8', color: '#be185d' }, chambre: { bg: '#eff6ff', color: '#1d4ed8' }, multi: { bg: '#f0fdfa', color: '#0f766e' } };

function civilite(d) {
  return `${d.clientCivilite || 'M.'} ${d.clientNom}`;
}

function emailBody(d) {
  const total = fmt(calcTTC(d.lignes, d.tva));
  const date = d.datePrestation ? ' du ' + fmtDate(d.datePrestation) : '';
  return `Bonjour ${civilite(d)},\n\nVeuillez trouver ci-joint votre devis n° ${d.numero} pour votre prestation${date}, d'un montant total de ${total}.\n\nN'hésitez pas à me contacter pour toute question ou pour valider ce devis.\n\nBien cordialement,\nBenjamin Jardin\nUne Escale Gourmande\n06 25 14 26 08`;
}

function waMsg(d) {
  const total = fmt(calcTTC(d.lignes, d.tva));
  const date = d.datePrestation ? ' du ' + fmtDate(d.datePrestation) : '';
  return `Bonjour ${civilite(d)},\n\nJe vous transmets votre devis n° ${d.numero} pour votre prestation${date}.\n\nMontant total : ${total}\n\nN'hésitez pas à me répondre pour le valider ou poser vos questions.\n\nÀ bientôt,\nBenjamin Jardin — Une Escale Gourmande`;
}

function buildEmailLink(d) {
  const subject = `Votre devis n° ${d.numero} — Une Escale Gourmande`;
  return `mailto:${d.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody(d))}`;
}

function buildWhatsAppLink(d) {
  const tel = (d.clientTel || '').replace(/\D/g, '');
  const intl = tel.startsWith('33') ? tel : tel.startsWith('0') ? '33' + tel.slice(1) : tel;
  return `https://wa.me/${intl}?text=${encodeURIComponent(waMsg(d))}`;
}

function downloadPDF(d) {
  try {
    const blob = genDevisPDF(d);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Devis-${d.numero}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}

function openChannel(d, channel) {
  if (channel === 'email') window.location.href = buildEmailLink(d);
  else window.open(buildWhatsAppLink(d), '_blank');
}

function SendModal({ devis, onClose, onPrint }) {
  const [pdfReady, setPdfReady] = useState(false);
  const hasMail = !!devis.clientEmail;
  const hasTel = !!(devis.clientTel || '').replace(/\D/g, '');
  const total = fmt(calcTTC(devis.lignes, devis.tva));

  const handleDownload = () => {
    const ok = downloadPDF(devis);
    if (ok) setPdfReady(true);
  };

  const handleSend = (channel) => {
    openChannel(devis, channel);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: '560px', borderRadius: '24px 24px 0 0', padding: '28px 20px 48px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ fontSize: '28px' }}>✓</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Devis créé !</h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '4px' }}>{devis.numero} · {devis.clientNom} · {total}</p>
        </div>

        {/* Étape 1 : télécharger le PDF */}
        <div style={{ background: pdfReady ? '#f0fdf4' : '#f8fafc', borderRadius: '14px', border: `1px solid ${pdfReady ? '#86efac' : '#e2e8f0'}`, padding: '16px 18px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
            {pdfReady ? '✓ PDF téléchargé dans vos fichiers' : 'Étape 1 — Télécharger le PDF du devis'}
          </p>
          <button type="button" onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: pdfReady ? '#dcfce7' : '#2d6a4f', border: 'none', cursor: 'pointer', width: '100%' }}>
            <Printer size={18} color={pdfReady ? '#15803d' : 'white'} />
            <span style={{ fontSize: '15px', fontWeight: '600', color: pdfReady ? '#15803d' : 'white' }}>
              {pdfReady ? 'Re-télécharger le PDF' : 'Télécharger le PDF'}
            </span>
          </button>
        </div>

        {/* Étape 2 : envoyer */}
        <div style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
            Étape 2 — Envoyer &amp; joindre le PDF
          </p>

          {/* Email */}
          <button type="button" disabled={!hasMail} onClick={() => handleSend('email')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: hasMail ? '#eff6ff' : '#f1f5f9', border: `1px solid ${hasMail ? '#93c5fd' : '#e2e8f0'}`, cursor: hasMail ? 'pointer' : 'default', width: '100%', textAlign: 'left', opacity: hasMail ? 1 : 0.5 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: hasMail ? '#3b82f6' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: hasMail ? '#1e40af' : '#94a3b8' }}>Email</p>
              <p style={{ fontSize: '12px', color: hasMail ? '#3b82f6' : '#94a3b8', marginTop: '1px' }}>{hasMail ? devis.clientEmail : 'Email non renseigné'}</p>
            </div>
          </button>

          {/* WhatsApp */}
          <button type="button" disabled={!hasTel} onClick={() => handleSend('wa')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '10px', background: hasTel ? '#f0fdf4' : '#f1f5f9', border: `1px solid ${hasTel ? '#86efac' : '#e2e8f0'}`, cursor: hasTel ? 'pointer' : 'default', width: '100%', textAlign: 'left', opacity: hasTel ? 1 : 0.5 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: hasTel ? '#25d366' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: hasTel ? '#15803d' : '#94a3b8' }}>WhatsApp</p>
              <p style={{ fontSize: '12px', color: hasTel ? '#22c55e' : '#94a3b8', marginTop: '1px' }}>{hasTel ? devis.clientTel : 'Téléphone non renseigné'}</p>
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

export default function Devis() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('attente');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [sendModal, setSendModal] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const reload = () => setItems(getDevis());
  useEffect(() => {
    const list = getDevis();
    setItems(list);
    if (location.state?.openAdd) {
      setModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state?.openDevisId) {
      const d = list.find(x => x.id === location.state.openDevisId);
      if (d) { setForm({ ...EMPTY, ...d, lignes: d.lignes || [] }); setModal(true); }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const byStatut = (s) => items.filter(d => d.statut === s).sort((a, b) => (b.dateEnvoi || b.createdAt || '').localeCompare(a.dateEnvoi || a.createdAt || ''));
  const attente = byStatut('attente');
  const acceptes = byStatut('accepte');
  const refuses = byStatut('refuse');
  const list = tab === 'attente' ? attente : tab === 'accepte' ? acceptes : refuses;

  const open = (d = EMPTY) => { setForm({ ...EMPTY, ...d, lignes: d.lignes || [] }); setModal(true); };
  const close = () => { setModal(false); setForm(EMPTY); };

  const submit = () => {
    const today = new Date().toISOString().split('T')[0];
    if (form.id) {
      saveDevis(form);
      reload();
      close();
    } else {
      const created = saveDevis({ ...form, dateEnvoi: today });
      reload();
      close();
      setSendModal(created);
    }
  };

  const changeStatut = (e, d, statut) => {
    e.stopPropagation();
    saveDevis({ ...d, statut, ...(statut === 'accepte' ? { dateAcceptation: new Date().toISOString().split('T')[0] } : {}) });
    reload();
  };

  const totalHT = calcTotalHT(form.lignes);
  const totalTTC = calcTTC(form.lignes, form.tva);

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#2d6a4f', padding: '48px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>Devis</h1>
        <button type="button" onClick={() => open()} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '12px', padding: '10px 16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          + Nouveau
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        {TABS.map(({ key, label }) => {
          const count = key === 'attente' ? attente.length : key === 'accepte' ? acceptes.length : refuses.length;
          return (
            <button type="button" key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '16px 8px', background: 'none', border: 'none', borderBottom: `3px solid ${tab === key ? '#2d6a4f' : 'transparent'}`, color: tab === key ? '#2d6a4f' : '#94a3b8', fontSize: '14px', fontWeight: tab === key ? '700' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {label}
              {count > 0 && <span style={{ background: tab === key ? '#2d6a4f' : '#e2e8f0', color: tab === key ? 'white' : '#64748b', borderRadius: '999px', padding: '1px 7px', fontSize: '12px', fontWeight: '700' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {list.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '15px', padding: '40px 0' }}>Aucun devis</p>}
        {list.map(d => {
          const sc = STATUT_COLORS[d.statut] || STATUT_COLORS.attente;
          const tc = TYPE_COLORS[d.prestationType] || TYPE_COLORS.traiteur;
          const type = PRESTATION_TYPES.find(t => t.value === d.prestationType);
          const total = calcTTC(d.lignes, d.tva);
          return (
            <div key={d.id} onClick={() => open(d)} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ padding: '18px 18px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{d.clientNom || '—'}</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{d.numero}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{fmt(total)}</p>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color, fontWeight: '600' }}>{DEVIS_STATUTS.find(s => s.value === d.statut)?.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {type && <span style={{ fontSize: '13px', padding: '3px 10px', borderRadius: '999px', background: tc.bg, color: tc.color, fontWeight: '500' }}>{type.label}</span>}
                  {d.datePrestation && <span style={{ fontSize: '13px', color: '#64748b' }}>📅 {fmtDate(d.datePrestation)}</span>}
                  {d.dateEnvoi && <span style={{ fontSize: '13px', color: '#64748b' }}>Envoyé {fmtDate(d.dateEnvoi)}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} onClick={e => e.stopPropagation()}>
                  {tab === 'attente' && (
                    <>
                      <button type="button" onClick={e => changeStatut(e, d, 'accepte')} style={{ padding: '12px', background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>✓ Accepté</button>
                      <button type="button" onClick={e => changeStatut(e, d, 'refuse')} style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>✗ Refusé</button>
                    </>
                  )}
                  <button type="button" onClick={e => { e.stopPropagation(); setSendModal(d); }} style={{ padding: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#0369a1', fontSize: '13px', fontWeight: '600' }}>
                    <Mail size={14} /> Envoyer
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); navigate(`/devis/${d.id}/imprimer`); }} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
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
          title={form.id ? 'Modifier le devis' : 'Nouveau devis'}
          onClose={close}
          footer={<>
            <button type="button" onClick={submit} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '17px', fontWeight: '700', cursor: 'pointer', background: '#2d6a4f', color: 'white' }}>
              {form.id ? 'Enregistrer' : 'Créer le devis'}
            </button>
            {form.id && (
              <button type="button" onClick={() => { if (confirm('Supprimer ce devis ?')) { deleteDevis(form.id); reload(); close(); } }} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #fca5a5', background: 'transparent', fontSize: '16px', fontWeight: '600', cursor: 'pointer', color: '#ef4444' }}>
                Supprimer
              </button>
            )}
          </>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={lbl}>Civilité &amp; nom du client</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  {['M.', 'Mme'].map(civ => (
                    <button key={civ} type="button" onClick={() => setForm({ ...form, clientCivilite: civ })}
                      style={{ padding: '12px 16px', border: 'none', background: form.clientCivilite === civ ? '#2d6a4f' : 'white', color: form.clientCivilite === civ ? 'white' : '#374151', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                      {civ}
                    </button>
                  ))}
                </div>
                <input style={{ ...inp, flex: 1 }} placeholder="Dupont Jean" value={form.clientNom} onChange={e => setForm({ ...form, clientNom: e.target.value })} />
              </div>
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
              <label style={lbl}>Adresse <span style={{ fontWeight: '400', color: '#94a3b8' }}>(pour le PDF)</span></label>
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
              <label style={lbl}>Objet / description <span style={{ fontWeight: '400', color: '#94a3b8' }}>(optionnel)</span></label>
              <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
                placeholder="Repas du 29 août pour 50 personnes."
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
              </div>
            )}

            <div>
              <label style={lbl}>Statut</label>
              <select style={inp} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                {DEVIS_STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {form.statut === 'accepte' && (
              <div>
                <label style={lbl}>Date d'acceptation</label>
                <input type="date" style={inp} value={form.dateAcceptation} onChange={e => setForm({ ...form, dateAcceptation: e.target.value })} />
              </div>
            )}

            <div>
              <label style={lbl}>Notes internes</label>
              <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

          </div>
        </Modal>
      )}

      {/* Modale d'envoi */}
      {sendModal && (
        <SendModal
          devis={sendModal}
          onClose={() => setSendModal(null)}
          onPrint={() => { setSendModal(null); navigate(`/devis/${sendModal.id}/imprimer`); }}
        />
      )}
    </div>
  );
}
