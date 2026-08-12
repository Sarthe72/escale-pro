import { jsPDF } from 'jspdf';
import { fmt, calcTotalHT, calcTTC, PRESTATION_TYPES } from './constants';

// jsPDF (Helvetica) ne supporte pas l'espace fine U+202F du format fr-FR
const fmtP = (n) => fmt(n).replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');

const fmtLong = (d) => {
  if (!d) return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

function drawWatermark(doc) {
  const sc = 0.85;
  const ox = 105 - 100 * sc;
  const oy = 148.5 - 110 * sc;
  const sx = v => ox + v * sc;
  const sy = v => oy + v * sc;
  const sr = v => v * sc;

  // #2d6a4f à ~8% sur blanc → RGB(238, 243, 241)
  doc.setDrawColor(238, 243, 241);
  doc.setFillColor(238, 243, 241);
  doc.setLineWidth(0.5);

  doc.ellipse(sx(100), sy(110), sr(85), sr(100), 'S');
  doc.ellipse(sx(100), sy(110), sr(79), sr(94), 'S');
  doc.line(sx(82), sy(88), sx(100), sy(68));
  doc.line(sx(100), sy(68), sx(118), sy(88));
  doc.rect(sx(84), sy(88), sr(32), sr(24), 'S');
  doc.rect(sx(93), sy(100), sr(14), sr(12), 'S');
  doc.line(sx(65), sy(122), sx(135), sy(122));
  doc.ellipse(sx(100), sy(142), sr(22), sr(14), 'S');
  [[93,139],[100,137],[107,139],[96,144],[104,144],[100,148]].forEach(([x, y]) => {
    doc.circle(sx(x), sy(y), sr(2), 'F');
  });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Une Escale Gourmande', sx(100), sy(228), { align: 'center' });
}

export function genDevisPDF(d) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = 20, W = 170, R = L + W;
  let y = 20;

  drawWatermark(doc);

  // ─── En-tête gauche ───
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('Une Escale Gourmande', L, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  ['JARDIN Benjamin', '1144 route des calvaires', '24800 Eyzerac',
   'Tel : 06 25 14 26 08', 'Email : jardinbenjamin@hotmail.fr',
   'N° SIRET : 93942640900016'].forEach((line, i) => {
    doc.text(line, L, y + 7 + i * 5);
  });

  // ─── Date (droite) ───
  doc.setTextColor(26, 26, 26);
  doc.setFontSize(9.5);
  doc.text('Le ' + fmtLong(d.dateEnvoi), R, y, { align: 'right' });

  y += 50;

  // ─── Destinataire (droite) ───
  const clientName = `${d.clientCivilite || ''} ${d.clientNom || ''}`.trim();
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text(clientName, R, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  let clientLines = [];
  if (d.clientAdresse) clientLines = d.clientAdresse.split('\n');
  if (d.clientTel) clientLines.push(d.clientTel);
  if (d.clientEmail) clientLines.push(d.clientEmail);
  clientLines.forEach((line, i) => { doc.text(line, R, y + 6 + i * 5, { align: 'right' }); });
  y += clientLines.length > 0 ? 6 + clientLines.length * 5 : 8;

  y += 12;

  // ─── Titre devis ───
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 106, 79);
  doc.text(`Devis n° ${d.numero}`, L, y);
  y += 5;
  if (d.datePrestation) {
    const typeLabel = PRESTATION_TYPES.find(t => t.value === d.prestationType)?.label || '';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${typeLabel}${typeLabel && d.datePrestation ? ' — ' : ''}${fmtLong(d.datePrestation)}`, L, y);
    y += 5;
  }
  if (d.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    doc.text(d.description, L, y, { maxWidth: W });
    y += 5;
  }

  y += 8;

  // ─── Tableau sans quadrillage ───
  const C = { d: L, p: L + 85, q: L + 122, t: R };
  const rH = 9;

  // En-tête tableau
  doc.setFillColor(248, 249, 250);
  doc.rect(L, y - 6, W, rH, 'F');
  // Ligne sous l'en-tête uniquement
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, y + 3, R, y + 3);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PRESTATIONS', C.d, y);
  doc.text('PRIX UNIT.', C.p, y);
  doc.text('QTÉ', C.q, y);
  doc.text('TOTAL', C.t, y, { align: 'right' });
  y += rH;

  // Lignes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const rows = [...(d.lignes || [])];
  while (rows.length < 4) rows.push(null);

  rows.forEach((l, i) => {
    if (l && i % 2 === 1) {
      doc.setFillColor(250, 251, 250);
      doc.rect(L, y - 6, W, rH, 'F');
    }
    if (l) {
      doc.setTextColor(26, 26, 26);
      doc.text(doc.splitTextToSize(l.description || '', 80)[0] || '', C.d, y);
      doc.setTextColor(60, 60, 60);
      doc.text(fmtP(parseFloat(l.prixUnitaire) || 0), C.p, y);
      doc.text(String(l.quantite || 1), C.q, y);
      doc.setFont('helvetica', 'bold');
      doc.text(fmtP((parseFloat(l.prixUnitaire) || 0) * (parseFloat(l.quantite) || 0)), C.t, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }
    // Séparateur fin entre lignes
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.2);
    doc.line(L, y + 3, R, y + 3);
    y += rH;
  });

  y += 8;

  // ─── Totaux sans bordures ───
  const tw = 70, tx = R - tw;

  const totRow = (label, value, bold, topLine) => {
    if (topLine) {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.4);
      doc.line(tx, y - 4, R, y - 4);
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 26 : 80, bold ? 26 : 80, bold ? 26 : 80);
    doc.text(label, tx, y);
    doc.text(value, R, y, { align: 'right' });
    y += 7;
  };

  totRow('Total HT', fmtP(calcTotalHT(d.lignes || [])));
  totRow('TVA', parseFloat(d.tva) === 0 ? 'Non soumis' : `${d.tva} %`);
  totRow('Total TTC', fmtP(calcTTC(d.lignes || [], d.tva)), true, true);

  y += 10;

  // ─── Conditions de règlement ───
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);
  doc.text(`Acompte de 20 % à la commande, soit ${fmtP(calcTTC(d.lignes || [], d.tva) * 0.2)}.`, L, y); y += 6;
  doc.setFont('helvetica', 'bold'); doc.text('Mode de règlement : ', L, y);
  doc.setFont('helvetica', 'normal'); doc.text('Chèque ou virement', L + 43, y); y += 6;
  doc.setFont('helvetica', 'bold'); doc.text('IBAN : ', L, y);
  doc.setFont('helvetica', 'normal'); doc.text('FR76 1240 6000 1780 0303 1638 332', L + 15, y); y += 6;
  doc.setFont('helvetica', 'bold'); doc.text('BIC : ', L, y);
  doc.setFont('helvetica', 'normal'); doc.text('AGRIFRPP824', L + 11, y);

  if (d.notes) {
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Notes : ' + d.notes, L, y, { maxWidth: W });
  }

  // ─── Pied de page ───
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Une Escale Gourmande — Benjamin Jardin — 06 25 14 26 08 — jardinbenjamin@hotmail.fr', 105, 287, { align: 'center' });

  return doc.output('blob');
}
