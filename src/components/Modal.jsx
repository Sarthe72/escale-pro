export default function Modal({ title, onClose, footer, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', width: '100%', maxWidth: '560px',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

        {/* En-tête fixe */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ✕
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px', paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {children}
        </div>

        {/* Pied fixe — boutons d'action toujours visibles */}
        {footer && (
          <div style={{ flexShrink: 0, padding: '16px 20px 32px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
