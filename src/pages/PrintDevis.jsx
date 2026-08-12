import { useParams, useNavigate } from 'react-router-dom';
import { getDevis } from '../lib/store';
import { calcTotalHT, calcTTC, fmt, fmtDate } from '../lib/constants';
import { Printer, ArrowLeft } from 'lucide-react';

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
  <ellipse cx="100" cy="110" rx="85" ry="100" stroke="#2d6a4f" stroke-width="3.5" fill="none"/>
  <ellipse cx="100" cy="110" rx="79" ry="94" stroke="#2d6a4f" stroke-width="1.5" fill="none"/>
  <path d="M82 88 L100 68 L118 88" stroke="#2d6a4f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="84" y="88" width="32" height="24" stroke="#2d6a4f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="93" y="100" width="14" height="12" stroke="#2d6a4f" stroke-width="1.8" fill="none"/>
  <line x1="65" y1="122" x2="135" y2="122" stroke="#2d6a4f" stroke-width="1.5" stroke-linecap="round"/>
  <ellipse cx="100" cy="142" rx="22" ry="14" stroke="#2d6a4f" stroke-width="2.2" fill="#2d6a4f" fill-opacity="0.08"/>
  <ellipse cx="100" cy="142" rx="22" ry="14" stroke="#2d6a4f" stroke-width="2.2" fill="none"/>
  <circle cx="93" cy="139" r="1.5" fill="#2d6a4f"/>
  <circle cx="100" cy="137" r="1.5" fill="#2d6a4f"/>
  <circle cx="107" cy="139" r="1.5" fill="#2d6a4f"/>
  <circle cx="96" cy="144" r="1.5" fill="#2d6a4f"/>
  <circle cx="104" cy="144" r="1.5" fill="#2d6a4f"/>
  <circle cx="100" cy="148" r="1.5" fill="#2d6a4f"/>
  <text x="100" y="225" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#2d6a4f" letter-spacing="0.5">Une Escale Gourmande</text>
</svg>`;

const fmtDateLong = (d) => {
  if (!d) return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function PrintDevis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const doc = getDevis().find(d => d.id === id);

  if (!doc) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-slate-500">Devis introuvable.</p>
      <button onClick={() => navigate(-1)} className="text-[#2d6a4f] underline text-sm">Retour</button>
    </div>
  );

  const lignes = doc.lignes || [];
  const totalHT = calcTotalHT(lignes);
  const tva = parseFloat(doc.tva) || 0;
  const totalTTC = calcTTC(lignes, tva);
  const acompte20 = totalTTC * 0.2;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .print-doc { box-shadow: none !important; }
          .logo-wm { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .print-doc {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          color: #1a1a1a;
          background: white;
          max-width: 780px;
          margin: 0 auto;
          padding: 48px 40px;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .doc-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
        .doc-table th { background: #f0f0f0; border: 1px solid #ccc; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 12px; }
        .doc-table td { border: 1px solid #ccc; padding: 7px 10px; vertical-align: top; }
        .doc-table td:nth-child(2), .doc-table td:nth-child(3), .doc-table td:nth-child(4) { white-space: nowrap; }
        .totals-table { border-collapse: collapse; min-width: 240px; }
        .totals-table td { border: 1px solid #ccc; padding: 6px 12px; }
        .totals-table td:last-child { text-align: right; white-space: nowrap; }
      `}</style>

      {/* Barre action (cachée à l'impression) */}
      <div className="no-print" style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#475569', fontSize: '15px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' }}>
          <ArrowLeft size={18} /> Retour
        </button>
        <button type="button" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          <Printer size={16} /> Imprimer / PDF
        </button>
      </div>

      <div className="print-doc">
        {/* Filigrane fond */}
        <div className="logo-wm" dangerouslySetInnerHTML={{ __html: LOGO }}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '520px', height: '624px', opacity: 0.12, pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <p style={{ fontWeight: '700', fontSize: '14px' }}>Une Escale Gourmande</p>
            <p>JARDIN Benjamin</p>
            <p>1144 route des calvaires</p>
            <p>24800 Eyzerac</p>
            <p>Tel : 0625142608</p>
            <p>Email : jardinbenjamin@hotmail.fr</p>
            <p>N° siret : 93942640900016</p>
          </div>
          <div dangerouslySetInnerHTML={{ __html: LOGO }}
            style={{ width: '90px', height: '108px', flexShrink: 0 }} />
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <p>Le {fmtDateLong(doc.dateEnvoi)}</p>
          </div>
        </div>

        {/* Destinataire */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <p style={{ fontWeight: '600' }}>{doc.clientNom}</p>
            {doc.clientAdresse && (
              <p style={{ whiteSpace: 'pre-line', marginTop: '2px' }}>{doc.clientAdresse}</p>
            )}
          </div>
        </div>

        {/* Titre */}
        <div style={{ marginBottom: '24px', fontSize: '13px' }}>
          <p>Devis n° {doc.numero}</p>
          {doc.description && <p>{doc.description}</p>}
        </div>

        {/* Tableau lignes */}
        <table className="doc-table">
          <thead>
            <tr>
              <th>Prestations</th>
              <th style={{ width: '130px' }}>Prix unitaire</th>
              <th style={{ width: '90px' }}>Quantité</th>
              <th style={{ width: '110px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td>{l.description}</td>
                <td>{fmt(l.prixUnitaire)}</td>
                <td>{l.quantite}</td>
                <td>{fmt((parseFloat(l.prixUnitaire) || 0) * (parseFloat(l.quantite) || 0))}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 4 - lignes.length) }).map((_, i) => (
              <tr key={`pad-${i}`}>
                <td style={{ height: '28px' }}>&nbsp;</td><td></td><td></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <table className="totals-table">
            <tbody>
              <tr>
                <td>Total HT</td>
                <td>{fmt(totalHT)}</td>
              </tr>
              <tr>
                <td>TVA</td>
                <td>{tva === 0 ? 'Non soumis' : `${tva}%`}</td>
              </tr>
              <tr>
                <td><strong>Total TTC</strong></td>
                <td><strong>{fmt(totalTTC)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pied de page devis */}
        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
          <p>Acompte de 20 % soit {fmt(acompte20)}.</p>
          <p><strong>Mode de règlement :</strong> Chèque ou virement</p>
          <p><strong>IBAN :</strong> FR76 1240 6000 1780 0303 1638 332</p>
          <p><strong>BIC :</strong> AGRIFRPP824</p>
        </div>
        </div>
      </div>
    </>
  );
}
