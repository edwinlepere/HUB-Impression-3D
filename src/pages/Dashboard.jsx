import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Printer, SquareStack, Settings2, Droplets, ArrowRight, Scale } from 'lucide-react'

const TYPE_COLOR = {
  PLA:   { bg: 'rgba(59,130,246,.15)',  text: '#60a5fa',  dot: '#3b82f6' },
  PETG:  { bg: 'rgba(249,115,22,.15)',  text: '#fb923c',  dot: '#f97316' },
  ABS:   { bg: 'rgba(239,68,68,.15)',   text: '#f87171',  dot: '#ef4444' },
  ASA:   { bg: 'rgba(234,179,8,.15)',   text: '#facc15',  dot: '#eab308' },
  TPU:   { bg: 'rgba(168,85,247,.15)',  text: '#c084fc',  dot: '#a855f7' },
  Nylon: { bg: 'rgba(20,184,166,.15)',  text: '#2dd4bf',  dot: '#14b8a6' },
  PC:    { bg: 'rgba(99,102,241,.15)',  text: '#818cf8',  dot: '#6366f1' },
  default:{ bg: 'rgba(100,100,120,.15)', text: '#9ca3af', dot: '#6b7280' },
}

function weightColor(g) {
  if (g == null) return 'var(--muted2)'
  if (g < 200)  return '#f87171'
  if (g < 500)  return '#facc15'
  return '#34d399'
}

function StatCard({ label, value, icon: Icon, color, to }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
        transition: 'all .2s', position: 'relative', overflow: 'hidden',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
      >
        <div style={{
          position: 'absolute', top: -20, right: -20, width: 80, height: 80,
          borderRadius: '50%', background: color, opacity: .12, filter: 'blur(20px)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ padding: 8, borderRadius: 10, background: color + '20' }}>
            <Icon size={18} color={color} />
          </div>
          <ArrowRight size={14} color="var(--muted2)" />
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  )
}

const ACE_SLOTS = ['Ace Pro 1', 'Ace Pro 2', 'Ace Pro 3', 'Ace Pro 4']

function AceProCard({ bobines, onReload }) {
  const [editingId, setEditingId] = useState(null)
  const [editVal, setEditVal]     = useState('')

  const saveWeight = async (id, val) => {
    const n = Number(val)
    if (!isNaN(n) && n >= 0) {
      await window.api.bobines.patch(id, { poids_restant: n })
      onReload()
    }
  }

  const changeSlot = async (bobine, targetSlot) => {
    if (bobine.emplacement === targetSlot) return
    const other = bobines.find(b => b.emplacement === targetSlot)
    if (other) await window.api.bobines.patch(other.id, { emplacement: bobine.emplacement })
    await window.api.bobines.patch(bobine.id, { emplacement: targetSlot })
    onReload()
  }

  const bySlot = Object.fromEntries(bobines.map(b => [b.emplacement, b]))
  const filled = bobines.length

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Printer size={14} color="#818cf8" />
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Ace Pro
          </div>
        </div>
        <span style={{
          fontSize: 11, color: filled >= 4 ? '#818cf8' : 'var(--muted)',
          background: 'var(--surface2)', padding: '2px 8px', borderRadius: 10,
          border: `1px solid ${filled >= 4 ? 'rgba(99,102,241,.3)' : 'var(--border)'}`,
          fontWeight: 700,
        }}>
          {filled}/4 slots
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {ACE_SLOTS.map((slotKey, idx) => {
          const b = bySlot[slotKey]
          const slotNum = idx + 1

          if (!b) return (
            <div key={slotKey} style={{
              height: 46, borderRadius: 10, border: '2px dashed var(--border)',
              display: 'flex', alignItems: 'center', paddingLeft: 12, gap: 8,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: 'var(--muted2)',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 5, padding: '1px 6px', flexShrink: 0,
              }}>{slotNum}</span>
              <span style={{ fontSize: 11, color: 'var(--muted2)' }}>Vide</span>
            </div>
          )

          const isEditing = editingId === b.id
          return (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', background: 'var(--bg)',
              borderRadius: 10, border: '1px solid var(--border)',
            }}>
              {/* Slot selector */}
              <select
                value={slotKey}
                onChange={e => changeSlot(b, e.target.value)}
                title="Changer de slot"
                style={{
                  fontSize: 10, fontWeight: 800, background: 'rgba(99,102,241,.15)',
                  border: '1px solid rgba(99,102,241,.35)', color: '#818cf8',
                  borderRadius: 5, padding: '2px 4px', cursor: 'pointer', flexShrink: 0,
                  appearance: 'none', textAlign: 'center', width: 22,
                }}
              >
                {ACE_SLOTS.map((s, i) => (
                  <option key={s} value={s}>{i + 1}</option>
                ))}
              </select>

              {/* Color swatch */}
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: b.code_couleur || '#555', border: '2px solid var(--border2)',
              }} />

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.marque}{b.gamme ? ` ${b.gamme}` : ''} {b.couleur || ''}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{b.type}</div>
              </div>

              {/* Weight */}
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <input
                    type="number" min="0" autoFocus
                    className="input"
                    style={{ width: 70, padding: '2px 6px', fontSize: 12, textAlign: 'right' }}
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') { await saveWeight(b.id, editVal); setEditingId(null) }
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>g</span>
                  <button className="btn-primary" style={{ padding: '2px 6px', fontSize: 11 }}
                    onClick={async () => { await saveWeight(b.id, editVal); setEditingId(null) }}>✓</button>
                  <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 11 }}
                    onClick={() => setEditingId(null)}>✕</button>
                </div>
              ) : (
                <span
                  title="Cliquer pour modifier le poids"
                  onClick={() => { setEditingId(b.id); setEditVal(b.poids_restant ?? '') }}
                  style={{
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    color: weightColor(b.poids_restant),
                    borderBottom: '1px dashed currentColor', whiteSpace: 'nowrap',
                  }}
                >
                  {b.poids_restant != null ? `${b.poids_restant} g` : '— g'}
                </span>
              )}

              {/* Move to armoire */}
              <button
                title="Déplacer vers l'armoire"
                onClick={async () => { await window.api.bobines.patch(b.id, { emplacement: 'Armoire' }); onReload() }}
                className="btn-ghost"
                style={{ padding: '3px 7px', fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                → Armoire
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]       = useState(null)
  const [filaments, setFilaments] = useState([])

  const load = () => {
    window.api.stats.get()
      .then(setStats)
      .catch(() => setStats({ filaments: 0, imprimantes: 0, plateaux: 0, profils: 0, types: [], marques: [], total_bobines: 0, total_poids: 0, ace_bobines: [] }))
    window.api.filaments.getAll().then(setFilaments).catch(() => setFilaments([]))
  }

  useEffect(() => { load() }, [])

  if (!stats) return (
    <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Chargement…</div>
  )

  const cards = [
    { label: 'Filaments',   value: stats.filaments,   icon: Package,     color: '#f97316', to: '/filaments'   },
    { label: 'Imprimantes', value: stats.imprimantes, icon: Printer,     color: '#3b82f6', to: '/imprimantes' },
    { label: 'Plateaux',    value: stats.plateaux,    icon: SquareStack, color: '#10b981', to: '/plateaux'    },
    { label: 'Profils',     value: stats.profils,     icon: Settings2,   color: '#a855f7', to: '/profils'     },
  ]

  const maxType = stats.types?.[0]?.n || 1
  const ace = stats.ace_bobines || []

  return (
    <div className="animate-in" style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Tableau de bord</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Vue d'ensemble de ta bibliothèque impression 3D</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {cards.map(c => <StatCard key={c.to} {...c} />)}
      </div>

      {/* Stock summary */}
      {stats.total_bobines > 0 && (
        <div style={{
          display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
          padding: '11px 18px', marginBottom: 20,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--muted)' }}>
            <Package size={14} />
            <span><strong style={{ color: 'var(--text)' }}>{stats.total_bobines}</strong> bobine{stats.total_bobines > 1 ? 's' : ''} en stock</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--muted)' }}>
            <Scale size={14} />
            <span>Poids total : <strong style={{ color: 'var(--brand)' }}>
              {stats.total_poids >= 1000
                ? `${(stats.total_poids / 1000).toFixed(2)} kg`
                : `${Math.round(stats.total_poids)} g`}
            </strong></span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--muted)' }}>
            <Printer size={14} color="#818cf8" />
            <span>Ace Pro : <strong style={{ color: '#818cf8' }}>{ace.length}/4 slots</strong>
              {ace.length > 0 && (
                <span style={{ marginLeft: 6, color: 'var(--muted2)' }}>
                  · {ace.reduce((s, b) => s + (b.poids_restant || 0), 0)} g chargés
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Types distribution */}
        {stats.types.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
              Répartition par type
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.types.map(({ type, n }) => {
                const c = TYPE_COLOR[type] || TYPE_COLOR.default
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                        {type}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{n}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: `linear-gradient(90deg, ${c.dot}, ${c.dot}99)`,
                        width: `${(n / maxType) * 100}%`,
                        transition: 'width .6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Ace Pro */}
        <AceProCard bobines={ace} onReload={load} />

        {/* Color palette preview */}
        {filaments.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
              Palette de filaments
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {filaments.slice(0, 20).map(f => (
                <div
                  key={f.id}
                  title={`${f.marque}${f.gamme ? ' ' + f.gamme : ''} ${f.couleur} — ${f.type}`}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: f.code_couleur || '#555',
                    border: '2px solid var(--border2)',
                    cursor: 'default',
                    transition: 'transform .15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
              {filaments.length > 20 && (
                <Link to="/filaments" style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--surface2)', border: '2px solid var(--border2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: 'var(--muted)', textDecoration: 'none', fontWeight: 700,
                }}>+{filaments.length - 20}</Link>
              )}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(stats.marques || []).map(({ marque, n }) => (
                <span key={marque} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  background: 'var(--surface2)', color: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}>
                  {marque} <span style={{ color: 'var(--brand)', fontWeight: 700 }}>×{n}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Humidité sensible */}
        {stats.filaments > 0 && (() => {
          const sensibles = filaments.filter(f => f.humidite_sensible)
          if (!sensibles.length) return null
          return (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Droplets size={14} color="#60a5fa" />
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Sensibles à l'humidité
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sensibles.map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.code_couleur || '#555', flexShrink: 0, border: '1px solid var(--border2)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{f.marque} {f.type} {f.couleur}</span>
                    {f.temp_sechage && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
                        {f.temp_sechage}°C / {f.duree_sechage}h
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Empty state */}
      {stats.filaments === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <Package size={48} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucune donnée</div>
          <div style={{ fontSize: 13 }}>Commence par ajouter un filament ou une imprimante.</div>
        </div>
      )}
    </div>
  )
}
