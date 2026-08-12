import { fmt } from '../lib/constants';

export default function LignesEditor({ lignes = [], onChange }) {
  const add = () => onChange([...lignes, { description: '', prixUnitaire: '', quantite: '1' }]);
  const remove = (i) => onChange(lignes.filter((_, idx) => idx !== i));
  const update = (i, field, value) => {
    const updated = [...lignes];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
        Lignes de prestation
      </p>

      {lignes.length === 0 ? (
        <button type="button" onClick={add} style={{
          width: '100%', padding: '18px', border: '2px dashed #d1d5db', borderRadius: '14px',
          background: 'none', fontSize: '15px', color: '#9ca3af', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          + Ajouter une ligne
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lignes.map((ligne, i) => {
            const total = (parseFloat(ligne.prixUnitaire) || 0) * (parseFloat(ligne.quantite) || 0);
            return (
              <div key={i} style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0' }}>
                {/* Description + supprimer */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', fontSize: '15px', background: 'white' }}
                    placeholder="Description (ex : Tapas 6 pièces/pers)"
                    value={ligne.description}
                    onChange={e => update(i, 'description', e.target.value)}
                  />
                  <button type="button" onClick={() => remove(i)} style={{
                    flexShrink: 0, padding: '10px 12px', background: 'none', border: '1px solid #fca5a5',
                    borderRadius: '10px', color: '#ef4444', fontSize: '18px', cursor: 'pointer', lineHeight: 1,
                  }}>✕</button>
                </div>

                {/* Prix / Qté / Total */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Prix unit. €</p>
                    <input
                      type="number" step="0.01" min="0"
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 8px', fontSize: '15px', background: 'white' }}
                      placeholder="0"
                      value={ligne.prixUnitaire}
                      onChange={e => update(i, 'prixUnitaire', e.target.value)}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Quantité</p>
                    <input
                      type="number" step="1" min="0"
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 8px', fontSize: '15px', background: 'white' }}
                      placeholder="1"
                      value={ligne.quantite}
                      onChange={e => update(i, 'quantite', e.target.value)}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total</p>
                    <div style={{ border: '1px solid #d1fae5', borderRadius: '10px', padding: '10px 8px', fontSize: '15px', fontWeight: '700', color: '#2d6a4f', background: '#f0fdf4' }}>
                      {fmt(total)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button type="button" onClick={add} style={{
            width: '100%', padding: '14px', border: '2px dashed #d1d5db', borderRadius: '14px',
            background: 'none', fontSize: '15px', color: '#6b7280', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            + Ajouter une ligne
          </button>
        </div>
      )}
    </div>
  );
}
