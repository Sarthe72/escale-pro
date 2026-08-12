import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Receipt, Users, BarChart2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Devis from './pages/Devis';
import Factures from './pages/Factures';
import Clients from './pages/Clients';
import Prestations from './pages/Prestations';
import PrintDevis from './pages/PrintDevis';
import PrintFacture from './pages/PrintFacture';
import PinScreen from './components/PinScreen';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/devis', icon: FileText, label: 'Devis' },
  { to: '/factures', icon: Receipt, label: 'Factures' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/prestations', icon: BarChart2, label: 'Prestations' },
];

const LOGO_WATERMARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
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

function BottomNav() {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e7e5e4', zIndex: 50 }}>
      <div style={{ display: 'flex' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            padding: '10px 0 12px',
            fontSize: '10px',
            fontWeight: isActive ? '700' : '400',
            color: isActive ? '#2d6a4f' : '#94a3b8',
            textDecoration: 'none',
          })}>
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isPrint = location.pathname.includes('/imprimer');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: isPrint ? 'white' : '#f5f0e6', paddingBottom: isPrint ? 0 : '80px', position: 'relative' }}>
      {!isPrint && (
        <div
          dangerouslySetInnerHTML={{ __html: LOGO_WATERMARK }}
          style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '280px', height: '336px',
            opacity: 0.07, pointerEvents: 'none', zIndex: 0,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devis" element={<Devis />} />
          <Route path="/factures" element={<Factures />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/prestations" element={<Prestations />} />
          <Route path="/devis/:id/imprimer" element={<PrintDevis />} />
          <Route path="/factures/:id/imprimer" element={<PrintFacture />} />
        </Routes>
        {!isPrint && <BottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PinScreen>
        <AppContent />
      </PinScreen>
    </BrowserRouter>
  );
}
