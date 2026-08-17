import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, SquareStack, AlertTriangle, Lightbulb, Info } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const TYPES_PLATEAU = ['PEI lisse', 'PEI texturé', 'PEI haute temp.', 'Verre', 'BuildTak', 'Garolite', 'Acier flexible', 'Autre']
const FILAMENTS_ALL = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'HIPS', 'PVA', 'Composite']

const PLATEAU_ACCENT = {
  'PEI lisse':      '#f97316',
  'PEI texturé':    '#f59e0b',
  'PEI haute temp.':'#ef4444',
  Verre:            '#06b6d4',
  BuildTak:         '#10b981',
  Garolite:         '#a855f7',
  default:          '#6b7280',
}

const FILAMENT_TAG = {
  PLA:    { bg: 'rgba(59,130,246,.12)',  text: '#60a5fa',  border: 'rgba(59,130,246,.25)' },
  PETG:   { bg: 'rgba(249,115,22,.12)', text: '#fb923c',  border: 'rgba(249,115,22,.25)' },
  ABS:    { bg: 'rgba(239,68,68,.12)',  text: '#f87171',  border: 'rgba(239,68,68,.25)'  },
  ASA:    { bg: 'rgba(234,179,8,.12)',  text: '#facc15',  border: 'rgba(234,179,8,.25)'  },
  TPU:    { bg: 'rgba(168,85,247,.12)', text: '#c084fc',  border: 'rgba(168,85,247,.25)' },
  default:{ bg: 'rgba(107,114,128,.12)',text: '#9ca3af',  border: 'rgba(107,114,128,.25)' },
}

const PLATEAU_TIPS = {
  'Carbon Fiber / Diamond Dark': [
    { k: 'tip',  t: 'Nettoyage IPA 90% avant chaque impression — une empreinte de doigt suffit à ruiner l\'adhérence.' },
    { k: 'info', t: 'Face A (Carbone) : rendu mat technique sur le dessous. Face B (Diamond Dark) : motif géométrique sombre brillant.' },
    { k: 'warn', t: 'Compatible PLA et PETG uniquement. ABS et hautes températures risquent d\'endommager la surface carbone.' },
  ],
  'PEI Double Texture': [
    { k: 'tip',  t: 'Nettoyage IPA avant chaque session. Le PETG doit refroidir COMPLÈTEMENT (15-20 min) avant retrait — sinon la surface se déchire.' },
    { k: 'info', t: 'Double face texturée interchangeable — choisir la face selon l\'effet désiré sans recalibrer le z-offset.' },
    { k: 'warn', t: 'ABS/ASA compatibles mais les hautes températures répétées usent plus vite la surface PEI.' },
  ],
  'PEI Texturée / Lisse': [
    { k: 'info', t: 'Face A texturée : rendu quadrillé mat sur le dessous. Face B lisse : fond de pièce brillant façon miroir.' },
    { k: 'tip',  t: 'Choisir la face selon le rendu final voulu — retourner la plaque sans recalibrer le z-offset si la plaque est bien plane.' },
    { k: 'warn', t: 'PETG sur face lisse = risque de collage excessif. Préférer la face texturée pour le PETG.' },
  ],
  'GECO-PLATE': [
    { k: 'info', t: 'Conçu pour PLA sans chauffe — déposer à froid, économie d\'énergie et moins d\'attente avant impression.' },
    { k: 'tip',  t: 'Si l\'adhérence diminue après plusieurs sessions : nettoyage IPA suffit généralement à la restaurer.' },
    { k: 'warn', t: 'Température plateau max 60°C — au-delà la surface peut se décoller ou se déformer de façon permanente.' },
  ],
  'Holographique Rainbow / Gold': [
    { k: 'info', t: 'L\'effet holographique arc-en-ciel s\'imprime sur le DESSOUS de la pièce (face en contact avec la plaque).' },
    { k: 'tip',  t: 'Première couche soignée et légèrement écrasée pour un rendu holo optimal — z-offset précis.' },
    { k: 'warn', t: 'Température max 90°C — réservé PLA et PETG. Ne pas dépasser pour éviter les déformations permanentes.' },
  ],
  'Holographique Shards / Silver': [
    { k: 'info', t: 'Éclats multicolores (Face A) ou triangles argentés (Face B) visibles sur le dessous de chaque pièce imprimée.' },
    { k: 'tip',  t: 'Nettoyage IPA avant impression. Première couche légèrement écrasée = rendu holo plus marqué.' },
    { k: 'warn', t: 'Température max 90°C — PLA et PETG uniquement.' },
  ],
  'JUUPINE Honeycomb / Cube Gold': [
    { k: 'info', t: 'Nid d\'abeille (Face A) ou cubes 3D dorés (Face B) s\'impriment sur le dessous de la pièce.' },
    { k: 'tip',  t: 'Nettoyage IPA avant impression. L\'effet de texture est plus marqué avec une première couche bien écrasée.' },
    { k: 'warn', t: 'Températures max 110°C. Compatible PLA, PETG et ABS — vérifier la compatibilité avant chaque matériau.' },
  ],
  'Neon Lines / Diamond Grid': [
    { k: 'info', t: 'Lignes laser néon (Face A) ou grille de diamants holographiques (Face B) sur le dessous des pièces.' },
    { k: 'tip',  t: 'Effet plus prononcé avec des filaments translucides ou clairs — le design ressort mieux.' },
    { k: 'warn', t: 'Température max 90°C — PLA et PETG uniquement. Éviter ABS/ASA sur cette surface.' },
  ],
  'PEI texturé': [
    { k: 'tip',  t: 'Nettoyage IPA 90% avant chaque session — la graisse des doigts détruit l\'adhérence.' },
    { k: 'info', t: 'Les pièces se décollent facilement en refroidissant — pas besoin de forcer avec une spatule.' },
    { k: 'warn', t: 'PETG peut coller très fort à chaud — toujours attendre le refroidissement complet.' },
  ],
  default: [
    { k: 'tip',  t: 'Nettoyer la surface à l\'IPA 90% avant chaque impression pour une adhérence optimale.' },
    { k: 'info', t: 'Ajuster précisément le z-offset : première couche légèrement écrasée mais non transparente.' },
  ],
}

const empty = {
  nom: '', type: 'PEI lisse', surface: '',
  temp_min: '', temp_max: '',
  preparation: '', compatible_filaments: '', notes: '',
}

const TIP_S = {
  warn: { bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', color: '#f59e0b', Icon: AlertTriangle },
  tip:  { bg: 'rgba(96,165,250,.08)',  border: 'rgba(96,165,250,.2)',  color: '#60a5fa', Icon: Lightbulb },
  info: { bg: 'rgba(52,211,153,.08)', border: 'rgba(52,211,153,.2)',  color: '#34d399', Icon: Info },
}
function TipItem({ k, t }) {
  const s = TIP_S[k] || TIP_S.info
  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, alignItems: 'flex-start' }}>
      <s.Icon size={13} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55 }}>{t}</span>
    </div>
  )
}

// ── Detail ───────────────────────────────────────────────────────────────────
function PlateauDetail({ pl, onEdit, onClose }) {
  const accent = PLATEAU_ACCENT[pl.type] || PLATEAU_ACCENT.default
  const tips = PLATEAU_TIPS[pl.nom] || PLATEAU_TIPS[pl.type] || PLATEAU_TIPS.default
  const fils = pl.compatible_filaments
    ? pl.compatible_filaments.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const [faceA, faceB] = pl.surface?.includes('—')
    ? pl.surface.split('—').map(s => s.trim().replace(/^Face [AB]\s*:\s*/i, ''))
    : [pl.surface, null]

  const Section = ({ label }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '16px 0 8px', paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
      {label}
    </div>
  )

  const Tile = ({ label, value, unit }) => value != null && value !== '' ? (
    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
        {value}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  ) : null

  return (
    <div>
      {/* Image */}
      <div style={{ height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 12, position: 'relative', background: '#111' }}>
        {pl.img
          ? <img src={`./impression-3d/plaques/${pl.img}`} alt={pl.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ height: '100%', background: `linear-gradient(135deg, ${accent}22, ${accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SquareStack size={48} color={accent} /></div>
        }
      </div>

      {/* Identity row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}18`, border: `2px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SquareStack size={18} color={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{pl.type}</div>
          {(pl.temp_min != null || pl.temp_max != null) && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {pl.temp_min != null && pl.temp_max != null
                ? `${pl.temp_min} – ${pl.temp_max} °C`
                : pl.temp_min != null ? `min ${pl.temp_min} °C` : `max ${pl.temp_max} °C`}
            </div>
          )}
        </div>
        {fils.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${accent}18`, color: accent, border: `1px solid ${accent}35`, flexShrink: 0 }}>
            {fils.length} filament{fils.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Faces */}
      {(faceA || faceB) && (
        <>
          <Section label="Faces" />
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faceA && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', width: 50, flexShrink: 0 }}>Face A</span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{faceA}</span>
              </div>
            )}
            {faceB && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', width: 50, flexShrink: 0 }}>Face B</span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{faceB}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Température */}
      {(pl.temp_min != null || pl.temp_max != null) && (
        <>
          <Section label="Température plateau" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Tile label="Min" value={pl.temp_min} unit="°C" />
            <Tile label="Max" value={pl.temp_max} unit="°C" />
          </div>
        </>
      )}

      {/* Filaments compatibles */}
      {fils.length > 0 && (
        <>
          <Section label="Filaments compatibles" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {fils.map(fil => {
              const tc = FILAMENT_TAG[fil] || FILAMENT_TAG.default
              return (
                <span key={fil} style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{fil}</span>
              )
            })}
          </div>
        </>
      )}

      {/* Préparation */}
      {pl.preparation && (
        <>
          <Section label="Préparation / Entretien" />
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>{pl.preparation}</div>
        </>
      )}

      {/* Notes */}
      {pl.notes && (
        <>
          <Section label="Notes" />
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>{pl.notes}</div>
        </>
      )}

      {tips.length > 0 && (
        <>
          <Section label="Conseils d'utilisation" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tips.map((tip, i) => <TipItem key={i} {...tip} />)}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onClose}>Fermer</button>
        <button className="btn-primary" onClick={onEdit}><Pencil size={13} /> Modifier</button>
      </div>
    </div>
  )
}

// ── Form ─────────────────────────────────────────────────────────────────────
function PlateauForm({ data, onChange, onSave, onCancel }) {
  const f = field => e => onChange({ ...data, [field]: e.target.value })
  const n = field => e => onChange({ ...data, [field]: e.target.value === '' ? '' : Number(e.target.value) })

  const selected = data.compatible_filaments
    ? data.compatible_filaments.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const toggle = fil => {
    const next = selected.includes(fil) ? selected.filter(x => x !== fil) : [...selected, fil]
    onChange({ ...data, compatible_filaments: next.join(', ') })
  }

  const section = label => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '18px 0 10px', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      {label}
    </div>
  )

  return (
    <div>
      {section('Identification')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <div className="label">Nom *</div>
          <input className="input" value={data.nom} onChange={f('nom')} placeholder="Mon PEI texturé…" />
        </div>
        <div>
          <div className="label">Type *</div>
          <select className="input" value={data.type} onChange={f('type')}>
            {TYPES_PLATEAU.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Description faces (Face A — Face B)</div>
          <input className="input" value={data.surface} onChange={f('surface')} placeholder="Face A : Texturée — Face B : Lisse" />
        </div>
        <div>
          <div className="label">Temp. min (°C)</div>
          <input type="number" className="input" value={data.temp_min} onChange={n('temp_min')} placeholder="0" />
        </div>
        <div>
          <div className="label">Temp. max (°C)</div>
          <input type="number" className="input" value={data.temp_max} onChange={n('temp_max')} placeholder="110" />
        </div>
      </div>

      {section('Filaments compatibles')}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {FILAMENTS_ALL.map(fil => {
          const tc = FILAMENT_TAG[fil] || FILAMENT_TAG.default
          const active = selected.includes(fil)
          return (
            <button key={fil} type="button" onClick={() => toggle(fil)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              background: active ? tc.bg : 'var(--surface2)',
              color: active ? tc.text : 'var(--muted)',
              border: active ? `1px solid ${tc.border}` : '1px solid var(--border)',
            }}>{fil}</button>
          )
        })}
      </div>

      {section('Préparation & Notes')}
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div className="label">Préparation / Entretien</div>
          <textarea className="input" rows={2} value={data.preparation} onChange={f('preparation')} placeholder="Nettoyage IPA, huile PEI, colle…" style={{ resize: 'vertical' }} />
        </div>
        <div>
          <div className="label">Notes</div>
          <textarea className="input" rows={2} value={data.notes} onChange={f('notes')} placeholder="Observations, points d'attention…" style={{ resize: 'vertical' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" onClick={onSave}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
function PlateauCard({ pl, onDetail, onEdit, onDelete }) {
  const accent = PLATEAU_ACCENT[pl.type] || PLATEAU_ACCENT.default
  const fils = pl.compatible_filaments
    ? pl.compatible_filaments.split(',').map(s => s.trim()).filter(Boolean)
    : []
  const [faceA, faceB] = pl.surface?.includes('—')
    ? pl.surface.split('—').map(s => s.trim().replace(/^Face [AB]\s*:\s*/i, ''))
    : [pl.surface, null]

  return (
    <div
      onClick={() => onDetail(pl)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'all .2s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      <div style={{ height: 120, position: 'relative', background: '#111', overflow: 'hidden' }}>
        {pl.img
          ? <img src={`./impression-3d/plaques/${pl.img}`} alt={pl.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ height: '100%', background: `linear-gradient(135deg, ${accent}22, ${accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SquareStack size={32} color={accent} /></div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,.75))' }} />
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          <button
            style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', color: '#ccc', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
            onClick={e => { e.stopPropagation(); onEdit(pl) }}
          ><Pencil size={12} /></button>
          <button
            style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', color: '#f87171', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
            onMouseLeave={e => e.currentTarget.style.color = '#f87171'}
            onClick={e => { e.stopPropagation(); onDelete(pl) }}
          ><Trash2 size={12} /></button>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,.9)' }}>{pl.nom}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{pl.type}</div>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {(faceA || faceB) && (
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
            {faceA && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: faceB ? 5 : 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', width: 38, flexShrink: 0 }}>Face A</span>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{faceA}</span>
              </div>
            )}
            {faceB && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', width: 38, flexShrink: 0 }}>Face B</span>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{faceB}</span>
              </div>
            )}
          </div>
        )}

        {(pl.temp_min != null && pl.temp_max != null) && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
              {pl.temp_min}–{pl.temp_max}°C
            </span>
          </div>
        )}

        {fils.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            {fils.map(fil => {
              const tc = FILAMENT_TAG[fil] || FILAMENT_TAG.default
              return <span key={fil} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{fil}</span>
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Plateaux() {
  const [items, setItems] = useState([])
  const [detail, setDetail] = useState(null)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => window.api.plateaux.getAll().then(setItems)
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const { mode, data } = modal
    if (!data.nom || !data.type) return alert('Nom et type requis.')
    if (mode === 'add') await window.api.plateaux.create(data)
    else await window.api.plateaux.update(data.id, data)
    setModal(null); load()
  }

  const openEdit = pl => { setDetail(null); setModal({ mode: 'edit', data: { ...pl } }) }

  return (
    <div className="animate-in" style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>Plateaux d'impression</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{items.length} plateau{items.length !== 1 ? 'x' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ mode: 'add', data: { ...empty } })}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <SquareStack size={40} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun plateau</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {items.map(pl => (
            <PlateauCard key={pl.id} pl={pl}
              onDetail={setDetail}
              onEdit={openEdit}
              onDelete={setConfirm}
            />
          ))}
        </div>
      )}

      {detail && (
        <Modal title={detail.nom} onClose={() => setDetail(null)}>
          <PlateauDetail pl={detail} onEdit={() => openEdit(detail)} onClose={() => setDetail(null)} />
        </Modal>
      )}
      {modal && (
        <Modal title={modal.mode === 'add' ? 'Ajouter un plateau' : 'Modifier le plateau'} onClose={() => setModal(null)}>
          <PlateauForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog message={`Supprimer "${confirm.nom}" ?`} onConfirm={async () => { await window.api.plateaux.delete(confirm.id); setConfirm(null); load() }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
