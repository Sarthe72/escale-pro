import {getCrmToken,crmRequest} from '../lib/crmApi';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getDevis } from '../lib/store';
import { PRESTATION_TYPES, fmt, fmtDate, calcTTC, calcTotalHT } from '../lib/constants';
import {isVisitor,getVisitorOrders} from '../lib/visitor';
import {completedOrderPrestations} from '../lib/holidayReporting';
const REPORT_TYPES=[...PRESTATION_TYPES,{value:'commandes_noel',label:'Commandes Noël'}];

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const TYPE_COLORS = {
  traiteur: { bg: '#fff7ed', color: '#c2410c' },
  chef:     { bg: '#faf5ff', color: '#7e22ce' },
  cours:    { bg: '#fdf2f8', color: '#be185d' },
  chambre:  { bg: '#eff6ff', color: '#1d4ed8' },
  multi:    { bg: '#f0fdfa', color: '#0f766e' },
  commandes_noel: {bg:'#fff1e8',color:'#8c273a'},
};

export default function Prestations() {
  const [devis, setDevis] = useState([]);
  const [orders,setOrders]=useState([]);
  const [ordersError,setOrdersError]=useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterType, setFilterType] = useState('all');
  const [activeMonth, setActiveMonth] = useState(null);
  const [showRecap, setShowRecap] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDevis(getDevis());
    if (location.state?.month) {
      const [y, m] = location.state.month.split('-');
      setYear(Number(y));
      setActiveMonth(location.state.month);
    }
  }, []);
  useEffect(()=>{
    if(isVisitor){setOrders(getVisitorOrders());return;}
    const token=getCrmToken();
    if(!token){setOrdersError('Les commandes Noël ne sont pas chargées : accès sécurisé au CRM requis.');return;}
    const controller=new AbortController();
    crmRequest('orders',{token,signal:controller.signal}).then(data=>setOrders(data.orders))
      .catch(error=>{if(error.name!=='AbortError')setOrdersError('Les commandes Noël ne peuvent pas être chargées. Le bilan ci-dessous est incomplet.');});
    return()=>controller.abort();
  },[]);

  // Prestations = devis acceptés
  const holidayEntries=completedOrderPrestations(orders);
  const all = [...devis.filter(d => d.statut === 'accepte'),...holidayEntries];

  const getDate = (d) => d.datePrestation || d.dateAcceptation || d.createdAt || '';

  // Available years
  const years = [...new Set(all.map(d => getDate(d).slice(0, 4)).filter(Boolean).map(Number))].sort().reverse();
  if (!years.includes(year)) years.unshift(year);

  // Filter by year
  const byYear = all.filter(d => getDate(d).startsWith(String(year)));

  // Filter by type
  const byType = filterType === 'all' ? byYear : byYear.filter(d => d.prestationType === filterType);

  // Filter by month
  const filtered = activeMonth ? byType.filter(d => getDate(d).startsWith(activeMonth)) : byType;

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_desc') return getDate(b).localeCompare(getDate(a));
    if (sortBy === 'date_asc')  return getDate(a).localeCompare(getDate(b));
    if (sortBy === 'montant')   return calcTTC(b.lignes, b.tva) - calcTTC(a.lignes, a.tva);
    if (sortBy === 'client')    return (a.clientNom || '').localeCompare(b.clientNom || '');
    return 0;
  });

  // Group by month (for display)
  const byMonth = {};
  sorted.forEach(d => {
    const key = getDate(d).slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(d);
  });

  // Month chips (all 12 months)
  const monthChips = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const key = `${year}-${m}`;
    const items = byType.filter(d => getDate(d).startsWith(key));
    return { key, short: MONTHS_SHORT[i], total: items.reduce((s, d) => s + calcTTC(d.lignes, d.tva), 0), count: items.length };
  });

  // Recap by type
  const recapType = REPORT_TYPES.map(t => ({
    ...t,
    count: byYear.filter(d => d.prestationType === t.value).length,
    total: byYear.filter(d => d.prestationType === t.value).reduce((s, d) => s + calcTTC(d.lignes, d.tva), 0),
  })).filter(t => t.count > 0).sort((a, b) => b.total - a.total);

  const totalCA = sorted.reduce((s, d) => s + calcTTC(d.lignes, d.tva), 0);
  const totalCAYear = byYear.reduce((s, d) => s + calcTTC(d.lignes, d.tva), 0);

  // Export CSV
  const exportCSV = () => {
    const rows = [['Date', 'Client', 'Type', 'Devis', 'Description', 'Montant HT', 'TVA', 'Montant TTC']];
    sorted.forEach(d => {
      const type = REPORT_TYPES.find(t => t.value === d.prestationType)?.label || '';
      rows.push([
        d.datePrestation || d.dateAcceptation || '',
        d.clientNom || '',
        type,
        d.numero || '',
        d.description || '',
        calcTotalHT(d.lignes).toFixed(2).replace('.', ','),
        d.tva === '0' ? 'Non soumis' : d.tva + ' %',
        calcTTC(d.lignes, d.tva).toFixed(2).replace('.', ','),
      ]);
    });
    const label = activeMonth ? activeMonth : String(year);
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `prestations-${label}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <section style={{padding:16,background:'#fff2e6',color:'#5c3036'}}><strong>Commandes Noël · campagne 2026–2027 : {fmt(holidayEntries.reduce((sum,entry)=>sum+calcTTC(entry.lignes,entry.tva),0))}</strong><p>{holidayEntries.length} commande(s) payée(s) et retirée(s) · décembre et janvier réunis. Les encaissements ci-dessous sont classés à la date du retrait.</p>{ordersError && <p role="status">{ordersError}</p>}</section>
      {/* Header */}
      <div style={{ background: '#2d6a4f', padding: '48px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>Prestations</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '3px' }}>
            {sorted.length} prestation{sorted.length !== 1 ? 's' : ''} · {fmt(totalCA)}
          </p>
        </div>
        <button onClick={exportCSV} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Download size={16} /> CSV
        </button>
      </div>

      {/* Year tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        {years.map(y => (
          <button key={y} onClick={() => { setYear(y); setActiveMonth(null); }} style={{ flex: '0 0 auto', padding: '14px 22px', background: 'none', border: 'none', borderBottom: `3px solid ${year === y ? '#2d6a4f' : 'transparent'}`, color: year === y ? '#2d6a4f' : '#94a3b8', fontSize: '15px', fontWeight: year === y ? '700' : '400', cursor: 'pointer' }}>
            {y}
          </button>
        ))}
      </div>

      {/* Month chips */}
      <div style={{ overflowX: 'auto', display: 'flex', gap: '8px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {monthChips.map(({ key, short, total, count }) => {
          const isActive = activeMonth === key;
          return (
            <button key={key} onClick={() => setActiveMonth(isActive ? null : key)}
              style={{ flex: '0 0 auto', background: isActive ? '#2d6a4f' : count > 0 ? 'white' : '#f1f5f9', border: `1px solid ${isActive ? '#2d6a4f' : count > 0 ? '#d1fae5' : '#e2e8f0'}`, borderRadius: '10px', padding: '8px 12px', cursor: count > 0 ? 'pointer' : 'default', minWidth: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: isActive ? 'white' : count > 0 ? '#2d6a4f' : '#94a3b8', fontWeight: '600' }}>{short}</p>
              {count > 0
                ? <p style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.85)' : '#374151', fontWeight: '700', marginTop: '2px' }}>{fmt(total)}</p>
                : <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>—</p>}
            </button>
          );
        })}
      </div>

      {/* Active month filter banner */}
      {activeMonth && (
        <div style={{ background: '#ecfdf5', borderBottom: '1px solid #a7f3d0', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#065f46', fontWeight: '600' }}>
            {MONTHS_FR[Number(activeMonth.split('-')[1]) - 1]} {activeMonth.split('-')[0]} · {sorted.length} prestation{sorted.length !== 1 ? 's' : ''} · {fmt(totalCA)}
          </span>
          <button onClick={() => setActiveMonth(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Recap chiffré */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setShowRecap(!showRecap)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Récap chiffré {year}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#2d6a4f' }}>{fmt(totalCAYear)}</span>
            {showRecap ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
          </div>
        </button>
        {showRecap && (
          <div style={{ padding: '0 16px 16px' }}>
            {/* Par type */}
            {recapType.map(t => (
              <div key={t.value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: TYPE_COLORS[t.value]?.color || '#94a3b8', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{t.label}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t.count} prest.</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{fmt(t.total)}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>
                    {totalCAYear > 0 ? Math.round(t.total / totalCAYear * 100) + '%' : ''}
                  </span>
                </div>
              </div>
            ))}
            {/* Par mois (barre compacte) */}
            <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Par mois</p>
              {monthChips.filter(c => c.count > 0).sort((a, b) => b.key.localeCompare(a.key)).map(({ key, count, total }) => {
                const [, m] = key.split('-');
                const pct = totalCAYear > 0 ? total / totalCAYear * 100 : 0;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', width: '28px', flexShrink: 0 }}>{MONTHS_SHORT[Number(m) - 1]}</span>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#2d6a4f', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600', width: '80px', textAlign: 'right', flexShrink: 0 }}>{fmt(total)}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontWeight: '700', fontSize: '16px' }}>
                <span>Total {year}</span><span style={{ color: '#2d6a4f' }}>{fmt(totalCAYear)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort + filtre type */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: '8px', overflowX: 'auto', background: '#fafaf9', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', background: 'white', cursor: 'pointer', flexShrink: 0 }}>
          <option value="date_desc">↓ Date</option>
          <option value="date_asc">↑ Date</option>
          <option value="montant">↓ Montant</option>
          <option value="client">A→Z Client</option>
        </select>
        <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }} />
        {[{ value: 'all', label: 'Tous' }, ...REPORT_TYPES].map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)}
            style={{ flex: '0 0 auto', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${filterType === t.value ? '#2d6a4f' : '#e2e8f0'}`, background: filterType === t.value ? '#2d6a4f' : 'white', color: filterType === t.value ? 'white' : '#64748b', fontSize: '12px', cursor: 'pointer', fontWeight: filterType === t.value ? '600' : '400', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste groupée par mois */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.keys(byMonth).length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '15px', padding: '40px 0' }}>
            {all.length === 0 ? 'Aucune prestation — acceptez un devis pour commencer' : 'Aucun résultat'}
          </p>
        )}
        {Object.entries(byMonth)
          .sort(([a], [b]) => sortBy === 'date_asc' ? a.localeCompare(b) : b.localeCompare(a))
          .map(([month, items]) => {
            const [y, m] = month.split('-');
            const monthTotal = items.reduce((s, d) => s + calcTTC(d.lignes, d.tva), 0);
            return (
              <div key={month}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#374151' }}>{MONTHS_FR[Number(m) - 1]} {y}</h3>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#2d6a4f' }}>{fmt(monthTotal)}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>{items.length} prest.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(d => {
                    const type = REPORT_TYPES.find(t => t.value === d.prestationType);
                    const tc = TYPE_COLORS[d.prestationType] || { bg: '#f1f5f9', color: '#64748b' };
                    return (
                      <div key={d.id} style={{ background: 'white', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                            <p style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{d.clientNom || '—'}</p>
                            {d.description && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{d.description}</p>}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                              {type && <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', background: tc.bg, color: tc.color, fontWeight: '500' }}>{type.label}</span>}
                              {d.datePrestation && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{fmtDate(d.datePrestation)}</span>}
                              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{d.numero}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '18px', fontWeight: '700', color: '#2d6a4f' }}>{fmt(calcTTC(d.lignes, d.tva))}</p>
                            {calcTotalHT(d.lignes) !== calcTTC(d.lignes, d.tva) && (
                              <p style={{ fontSize: '12px', color: '#94a3b8' }}>HT {fmt(calcTotalHT(d.lignes))}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
