import { useState } from 'react';

const PIN_KEY      = 'ep_pin_v2';
const RECOVERY_KEY = 'ep_recovery_v2';
const AUTH_KEY     = 'ep_auth';
const SETUP_KEY    = 'ep_setup';
const SALT         = ':escale-pro';
const BOOTSTRAP    = '1313';

const encode       = (s) => btoa(s + SALT);
const storedPin    = () => localStorage.getItem(PIN_KEY);
const isSetupDone  = () => !!localStorage.getItem(SETUP_KEY);
const isAuth       = () => sessionStorage.getItem(AUTH_KEY) === '1';

export function checkPin(pin) {
  if (!isSetupDone()) return false;
  return encode(pin) === storedPin();
}
export function savePin(pin) {
  localStorage.setItem(PIN_KEY, encode(pin));
  localStorage.setItem(SETUP_KEY, '1');
}
export function logout() { sessionStorage.removeItem(AUTH_KEY); }

function genRecovery() {
  return String(Math.floor(10000000 + Math.random() * 89999999));
}
function storedRecovery() { return localStorage.getItem(RECOVERY_KEY); }
function checkRecovery(code) {
  const r = storedRecovery();
  return r && encode(code) === r;
}
function saveRecovery(code) { localStorage.setItem(RECOVERY_KEY, encode(code)); }

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">
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

// ─── Modes ────────────────────────────────────────────────────────────────────
// 'pin'             → saisie normale du PIN
// 'setup-new'       → 1re connexion : choisir un nouveau PIN
// 'setup-confirm'   → confirmer le nouveau PIN
// 'recovery-show'   → afficher le code de récupération généré
// 'recovery-enter'  → saisir le code de récupération (PIN oublié)
// 'recovery-new'    → après récupération : choisir un nouveau PIN
// 'recovery-confirm'→ confirmer le nouveau PIN après récupération

export default function PinScreen({ children }) {
  const [authed, setAuthed]   = useState(isAuth());
  const [mode, setMode]       = useState('pin');
  const [input, setInput]     = useState('');
  const [newPin, setNewPin]   = useState('');
  const [recCode, setRecCode] = useState(''); // code généré affiché à l'écran
  const [recInput, setRecInput] = useState('');
  const [shake, setShake]     = useState(false);
  const [err, setErr]         = useState('');

  if (authed) return children;

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const doShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); setInput(''); }, 500);
  };

  const doAuth = () => {
    sessionStorage.setItem(AUTH_KEY, '1');
    setAuthed(true);
  };

  const press = (d) => {
    if (input.length >= 4) return;
    const next = input + d;
    setInput(next);
    setErr('');

    if (next.length === 4) {
      setTimeout(() => {
        if (mode === 'pin') {
          if (!isSetupDone()) {
            // 1re connexion : seul le bootstrap est accepté
            if (next === BOOTSTRAP) {
              setInput('');
              setMode('setup-new');
            } else {
              setErr('Code invalide');
              doShake();
            }
          } else {
            if (checkPin(next)) {
              doAuth();
            } else {
              setErr('Code incorrect');
              doShake();
            }
          }
        } else if (mode === 'setup-new') {
          setNewPin(next);
          setInput('');
          setMode('setup-confirm');
        } else if (mode === 'setup-confirm') {
          if (next === newPin) {
            const code = genRecovery();
            savePin(newPin);
            saveRecovery(code);
            setRecCode(code);
            setInput('');
            setMode('recovery-show');
          } else {
            setErr('Les codes ne correspondent pas');
            doShake();
          }
        } else if (mode === 'recovery-new') {
          setNewPin(next);
          setInput('');
          setMode('recovery-confirm');
        } else if (mode === 'recovery-confirm') {
          if (next === newPin) {
            savePin(newPin);
            setInput('');
            doAuth();
          } else {
            setErr('Les codes ne correspondent pas');
            doShake();
          }
        }
      }, 80);
    }
  };

  const del = () => { setInput(p => p.slice(0, -1)); setErr(''); };

  // ─── Keypad ────────────────────────────────────────────────────────────────
  const Keypad = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '240px' }}>
      {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => {
        if (k === '') return <div key={i} />;
        const isDel = k === '⌫';
        return (
          <button key={i} type="button"
            onClick={() => isDel ? del() : press(String(k))}
            style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: isDel ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)',
              border: 'none', color: 'white',
              fontSize: isDel ? '22px' : '26px', fontWeight: '400',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
            }}
          >{k}</button>
        );
      })}
    </div>
  );

  // ─── Dots ──────────────────────────────────────────────────────────────────
  const Dots = ({ n = 4 }) => (
    <div style={{
      display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px',
      animation: shake ? 'ep-shake 0.45s ease' : 'none',
    }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          width: '14px', height: '14px', borderRadius: '50%',
          background: i < input.length ? 'white' : 'rgba(255,255,255,0.25)',
          transition: 'background 0.15s',
        }} />
      ))}
    </div>
  );

  // ─── Fond ──────────────────────────────────────────────────────────────────
  const Bg = ({ title, subtitle, children: inner }) => (
    <div style={{ minHeight: '100dvh', background: '#2d6a4f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`@keyframes ep-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
      <div dangerouslySetInnerHTML={{ __html: LOGO }} style={{ width: 80, height: 96, marginBottom: 16, opacity: 0.85 }} />
      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', fontWeight: '600', marginBottom: subtitle ? '6px' : '32px', textAlign: 'center' }}>{title}</p>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '32px', textAlign: 'center', maxWidth: '260px', lineHeight: 1.5 }}>{subtitle}</p>}
      {inner}
    </div>
  );

  // ─── Écran PIN oublié (saisie du code de récupération) ────────────────────
  if (mode === 'recovery-enter') {
    const submit = () => {
      if (!checkRecovery(recInput.trim())) {
        setErr('Code de récupération incorrect');
        return;
      }
      setRecInput('');
      setErr('');
      setMode('recovery-new');
    };
    return (
      <Bg title="PIN oublié" subtitle="Saisissez votre code de récupération à 8 chiffres (noté lors de la 1re connexion).">
        <input
          type="tel" maxLength={8} value={recInput}
          onChange={e => { setRecInput(e.target.value.replace(/\D/g, '').slice(0, 8)); setErr(''); }}
          placeholder="12345678"
          style={{ width: '200px', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '24px', textAlign: 'center', letterSpacing: '0.25em', outline: 'none', color: '#1a1a1a' }}
          autoFocus
        />
        {err && <p style={{ color: '#fca5a5', fontSize: '14px', marginTop: '10px' }}>{err}</p>}
        <button type="button" onClick={submit}
          style={{ marginTop: '20px', padding: '14px 40px', borderRadius: '14px', background: 'white', border: 'none', color: '#2d6a4f', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
          Valider
        </button>
        <button type="button" onClick={() => { setMode('pin'); setInput(''); setErr(''); setRecInput(''); }}
          style={{ marginTop: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}>
          Annuler
        </button>
      </Bg>
    );
  }

  // ─── Écran code de récupération (à noter) ─────────────────────────────────
  if (mode === 'recovery-show') {
    return (
      <Bg title="Code de récupération" subtitle="Notez ce code en lieu sûr. Il vous permettra de réinitialiser votre PIN si vous l'oubliez.">
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '20px 32px', marginBottom: '12px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Code de récupération</p>
          <p style={{ color: 'white', fontSize: '32px', fontWeight: '700', letterSpacing: '0.2em' }}>{recCode}</p>
        </div>
        <p style={{ color: '#fcd34d', fontSize: '13px', textAlign: 'center', maxWidth: '260px', lineHeight: 1.5, marginBottom: '24px' }}>
          ⚠️ Ce code ne sera plus affiché. Sans lui, en cas d'oubli du PIN, vous ne pourrez pas récupérer l'accès.
        </p>
        <button type="button" onClick={doAuth}
          style={{ padding: '16px 40px', borderRadius: '14px', background: 'white', border: 'none', color: '#2d6a4f', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
          J'ai noté le code →
        </button>
      </Bg>
    );
  }

  // ─── Écrans avec clavier PIN ───────────────────────────────────────────────
  const titles = {
    'pin':              { title: 'Une Escale Gourmande', subtitle: !isSetupDone() ? 'Saisissez le code de 1ère connexion' : null },
    'setup-new':        { title: 'Créez votre PIN',      subtitle: 'Choisissez un code à 4 chiffres personnel' },
    'setup-confirm':    { title: 'Confirmez le PIN',     subtitle: 'Saisissez à nouveau votre nouveau code' },
    'recovery-new':     { title: 'Nouveau PIN',          subtitle: 'Choisissez un nouveau code à 4 chiffres' },
    'recovery-confirm': { title: 'Confirmez le PIN',     subtitle: 'Saisissez à nouveau votre nouveau code' },
  };
  const { title, subtitle } = titles[mode] || titles['pin'];

  return (
    <Bg title={title} subtitle={subtitle}>
      <Dots />
      {err && <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>{err}</p>}
      <Keypad />
      {mode === 'pin' && isSetupDone() && (
        <button type="button" onClick={() => { setMode('recovery-enter'); setInput(''); setErr(''); }}
          style={{ marginTop: '28px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '14px', cursor: 'pointer' }}>
          PIN oublié ?
        </button>
      )}
    </Bg>
  );
}
