import { useEffect, useState, useRef } from 'react'
import { Search, ChevronDown, Package } from 'lucide-react'

const GROUP_OPTIONS = [
  { key: 'type',   label: 'Matière' },
  { key: 'marque', label: 'Marque' },
  { key: 'gamme',  label: 'Gamme' },
]

function ColorCard({ f }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 88 }}>
      <div style={{
        width: 76, height: 76, borderRadius: 12,
        background: f.code_couleur || '#444',
        border: '1px solid rgba(255,255,255,.1)',
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,.35)',
      }} />
      <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{f.marque}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{f.type}</div>
        {f.gamme && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{f.gamme}</div>}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{f.couleur || '—'}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>({f.nb_bobines ?? 0})</div>
      </div>
    </div>
  )
}

function GroupSection({ label, filaments }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '20px 24px 24px',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 20, letterSpacing: '.01em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        {filaments.map(f => <ColorCard key={f.id} f={f} />)}
      </div>
    </div>
  )
}

export default function Couleurs() {
  const [filaments, setFilaments] = useState([])
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState('type')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => { window.api.filaments.getAll().then(setFilaments) }, [])

  useEffect(() => {
    if (!menuOpen) return
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const filtered = filaments.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return [f.marque, f.gamme, f.type, f.couleur].some(v => v?.toLowerCase().includes(q))
  })

  const grouped = {}
  for (const f of filtered) {
    const key = f[groupBy] || '—'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(f)
  }
  const groupKeys = Object.keys(grouped).sort()

  const currentGroupLabel = GROUP_OPTIONS.find(o => o.key === groupBy)?.label

  return (
    <div className="animate-in" style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>Mes couleurs de bobines</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Voici toutes les couleurs de filament actuellement dans votre stock
          {filtered.length !== filaments.length ? ` — ${filtered.length} / ${filaments.length}` : ` — ${filaments.length} référence${filaments.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Controls toolbar */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '10px 14px',
      }}>
        {/* Grouper par */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              borderRadius: 10, padding: '7px 13px', cursor: 'pointer',
              color: 'var(--text)', fontSize: 13, fontWeight: 500,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)' }}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.borderColor = 'var(--border2)' }}
          >
            <span style={{ fontSize: 14 }}>≡</span>
            Grouper par : <strong>{currentGroupLabel}</strong>
            <ChevronDown size={13} color="var(--muted)" />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
              background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: 10, padding: 6, minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,.35)',
            }}>
              {GROUP_OPTIONS.map(o => (
                <button
                  key={o.key}
                  onClick={() => { setGroupBy(o.key); setMenuOpen(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: groupBy === o.key ? 'var(--brand-dim)' : 'transparent',
                    color: groupBy === o.key ? 'var(--brand)' : 'var(--text)',
                    fontSize: 13, cursor: 'pointer', fontWeight: groupBy === o.key ? 600 : 400,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (groupBy !== o.key) e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { if (groupBy !== o.key) e.currentTarget.style.background = 'transparent' }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search — centré */}
        <div style={{ position: 'relative', flex: '1 1 0' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher des couleurs…"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Empty state */}
      {filaments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
          <Package size={44} style={{ margin: '0 auto 14px', opacity: .25 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucun filament</div>
          <div style={{ fontSize: 13 }}>Ajoutez des filaments depuis la page Filaments.</div>
        </div>
      ) : groupKeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 }}>
          Aucune couleur ne correspond à la recherche.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {groupKeys.map(key => (
            <GroupSection key={key} label={key} filaments={grouped[key]} />
          ))}
        </div>
      )}
    </div>
  )
}
