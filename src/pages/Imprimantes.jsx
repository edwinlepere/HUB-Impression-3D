import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Printer, Box, AlertTriangle, Lightbulb, Info, Search, ChevronDown } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const EXTRUDEURS = ['Direct Drive', 'Bowden', 'Dual Bowden', 'IDEX', 'Toolchanger', 'MSLA / Résine']
const FIRMWARES  = ['Marlin', 'Klipper', 'RepRapFirmware', 'Bambu', 'Anycubic', 'Prusa', 'Autre']

const empty = {
  nom: '', marque: '', modele: '',
  volume_x: '', volume_y: '', volume_z: '',
  type_extrudeur: 'Direct Drive', diametre_buse: 0.4,
  firmware: 'Marlin', notes: '',
}

const IMPRIMANTE_TIPS = {
  'Direct Drive': [
    { k: 'tip',  t: 'Rétraction courte (0.5–2mm) — l\'extrudeur est directement sur la tête, inutile de rétracter loin. Trop de rétraction = bouchons.' },
    { k: 'info', t: 'Parfait pour les flexibles (TPU, TPE) — le filament est guidé directement sans passer par un long tube Bowden.' },
    { k: 'tip',  t: 'Calibrer l\'E-step : extruder 100mm de filament et mesurer au réglet ce qui sort réellement. Fondamental pour une extrusion précise.' },
    { k: 'warn', t: 'Nettoyer régulièrement via cold pull (filament à mi-chemin de la temp de fusion, tirer d\'un coup sec) pour éviter les bouchons partiels.' },
  ],
  'Bowden': [
    { k: 'warn', t: 'Rétraction longue requise (4–7mm) selon la longueur du tube — calibrer précisément pour chaque filament.' },
    { k: 'warn', t: 'Filaments flexibles (TPU, TPE) déconseillés — le filament flambe dans le tube et bloque. Résultats imprévisibles.' },
    { k: 'tip',  t: 'Remplacer le tube PTFE tous les 6–12 mois ou dès qu\'il jaunit. Le Capricorn bleu (PTFE premium) résiste mieux aux hautes températures.' },
    { k: 'info', t: 'Avantage : tête d\'impression légère = vitesses plus élevées potentiellement (moins d\'inertie).' },
  ],
  'IDEX': [
    { k: 'tip',  t: 'Calibrer l\'offset XY entre les deux têtes avant chaque projet bi-matière — un décalage de 0.1mm se voit sur la pièce finale.' },
    { k: 'info', t: 'Mode miroir et copie disponibles — doubler la productivité pour les pièces symétriques ou identiques.' },
    { k: 'warn', t: 'Purge tower obligatoire en bi-matière pour éviter la contamination inter-filaments — prévoir l\'espace sur le plateau.' },
  ],
  'Dual Bowden': [
    { k: 'warn', t: 'Calibrer la rétraction des deux extrudeurs indépendamment — les longueurs de tube peuvent différer.' },
    { k: 'tip',  t: 'Utiliser un filament soluble (PVA) sur le second extrudeur pour des supports complexes dissolvables à l\'eau.' },
    { k: 'info', t: 'Purge entre chaque changement de matériau obligatoire pour éviter la contamination de couleur.' },
  ],
  'Toolchanger': [
    { k: 'info', t: 'Chaque tête (tool) est indépendante — zéro contamination entre matériaux, changement propre sans purge.' },
    { k: 'tip',  t: 'Calibrer le z-offset de chaque outil individuellement — une erreur sur l\'un impacte l\'adhésion des couches mixtes.' },
    { k: 'warn', t: 'Vérifier les contacts électriques du toolchanger régulièrement — poussière et résidus peuvent perturber la détection.' },
  ],
  'MSLA / Résine': [
    { k: 'warn', t: 'Travailler dans un espace ventilé — les résines dégagent des COV. Port de gants nitrile et lunettes de protection obligatoire lors de la manipulation.' },
    { k: 'tip',  t: 'Exposer les premières couches 2× plus longtemps que les couches normales pour garantir l\'adhésion au plateau. Typiquement 30–60 s selon la résine.' },
    { k: 'info', t: 'Orienter les pièces à 45° avec supports auto réduit les forces d\'arrachement et améliore la qualité de surface.' },
    { k: 'warn', t: 'Nettoyer à l\'IPA (isopropanol ≥90 %) dans le Wash & Cure avant post-cuisson UV — résine non lavée durcit avec des résidus liquides visibles.' },
    { k: 'tip',  t: 'Vider et filtrer la résine dans le FEP si l\'imprimante reste inactive plus de 48 h — la résine sédimente et peut abîmer l\'écran LCD.' },
    { k: 'warn', t: 'Remplacer le film FEP dès qu\'il se trouble ou se raye — une perte de transparence réduit la qualité d\'exposition et peut provoquer des arrachements.' },
  ],
  default: [
    { k: 'tip',  t: 'Calibrer le bed leveling avant chaque projet important — même les auto-niveau dérivent dans le temps.' },
    { k: 'info', t: 'Première couche : z-offset légèrement négatif (-0.05 à -0.1mm) pour une couche bien ancrée mais non transparente.' },
    { k: 'warn', t: 'Surveiller le tube PTFE — le remplacer si jaunissement ou si la température de travail dépasse régulièrement 240°C.' },
  ],
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

// ── CatalogPicker ────────────────────────────────────────────────────────────
function ImprimanteCatalogPicker({ catalog, onSelect, onManual, onCancel }) {
  const [q, setQ] = useState('')
  const filtered = catalog.filter(item => {
    const s = q.toLowerCase()
    return !s || [item.marque, item.modele, item.type_extrudeur].some(v => v?.toLowerCase().includes(s))
  })
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          className="input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher Bambu Lab, Prusa, Creality…"
          style={{ paddingLeft: 36 }}
          autoFocus
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, maxHeight: 400, overflowY: 'auto' }}>
        {filtered.map(item => (
          <button
            key={item._id}
            type="button"
            onClick={() => { const { _id, ...rest } = item; onSelect(rest) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12,
              cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Printer size={14} color="#60a5fa" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.marque} {item.modele}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                {item.type_extrudeur}{item.volume_x ? ` · ${item.volume_x}×${item.volume_y}×${item.volume_z} mm` : ''}
              </div>
            </div>
            <ChevronDown size={13} color="var(--muted)" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn-ghost" onClick={onManual} style={{ fontSize: 13 }}>
          Saisie manuelle (remplir moi-même)
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

// ── Detail ───────────────────────────────────────────────────────────────────
function ImprimanteDetail({ p, onEdit, onClose }) {
  const vol = p.volume_x && p.volume_y && p.volume_z
  const tips = IMPRIMANTE_TIPS[p.type_extrudeur] || IMPRIMANTE_TIPS.default

  const Section = ({ label }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '16px 0 8px', paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
      {label}
    </div>
  )

  const Tile = ({ label, value }) => value != null && value !== '' ? (
    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    </div>
  ) : null

  return (
    <div>
      {/* Image */}
      <div style={{ height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 12, position: 'relative', background: '#111' }}>
        {p.img
          ? <img src={`./impression-3d/printers/${p.img}`} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ height: '100%', background: 'linear-gradient(135deg, rgba(59,130,246,.2), rgba(59,130,246,.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Printer size={48} color="#60a5fa" /></div>
        }
      </div>

      {/* Identity row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,.12)', border: '2px solid rgba(59,130,246,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Printer size={18} color="#60a5fa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {[p.marque, p.modele].filter(Boolean).join(' ') || p.nom}
          </div>
          {p.firmware && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Firmware : {p.firmware}</div>
          )}
        </div>
        {p.type_extrudeur && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(59,130,246,.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.25)', flexShrink: 0 }}>{p.type_extrudeur}</span>
        )}
      </div>

      {/* Volume */}
      {vol && (
        <>
          <Section label="Volume d'impression" />
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Box size={16} color="var(--muted)" />
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{p.volume_x} × {p.volume_y} × {p.volume_z}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>mm</span>
          </div>
        </>
      )}

      {/* Config */}
      <Section label="Configuration" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Tile label="Extrudeur" value={p.type_extrudeur} />
        <Tile label="Diamètre buse" value={p.diametre_buse ? `⌀ ${p.diametre_buse} mm` : null} />
        <Tile label="Firmware" value={p.firmware} />
      </div>

      {/* Notes */}
      {p.notes && (
        <>
          <Section label="Notes" />
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>{p.notes}</div>
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
function ImprimanteForm({ data, onChange, onSave, onCancel }) {
  const f = field => e => onChange({ ...data, [field]: e.target.value })
  const n = field => e => onChange({ ...data, [field]: e.target.value === '' ? '' : Number(e.target.value) })

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
          <input className="input" value={data.nom} onChange={f('nom')} placeholder="Mon Anycubic Kobra S1…" />
        </div>
        <div>
          <div className="label">Marque</div>
          <input className="input" value={data.marque} onChange={f('marque')} placeholder="Anycubic, Bambu Lab, Prusa…" />
        </div>
        <div>
          <div className="label">Modèle</div>
          <input className="input" value={data.modele} onChange={f('modele')} placeholder="Kobra S1 Combo, X1 Carbon…" />
        </div>
      </div>

      {section("Volume d'impression (mm)")}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[['X — Largeur', 'volume_x', '220'], ['Y — Profondeur', 'volume_y', '220'], ['Z — Hauteur', 'volume_z', '250']].map(([label, key, ph]) => (
          <div key={key}>
            <div className="label">{label}</div>
            <input type="number" className="input" value={data[key]} onChange={n(key)} placeholder={ph} />
          </div>
        ))}
      </div>

      {section('Configuration')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div className="label">Extrudeur</div>
          <select className="input" value={data.type_extrudeur} onChange={f('type_extrudeur')}>
            {EXTRUDEURS.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Diamètre buse (mm)</div>
          <input type="number" className="input" value={data.diametre_buse} onChange={n('diametre_buse')} step="0.1" placeholder="0.4" />
        </div>
        <div>
          <div className="label">Firmware</div>
          <select className="input" value={data.firmware} onChange={f('firmware')}>
            {FIRMWARES.map(fw => <option key={fw}>{fw}</option>)}
          </select>
        </div>
      </div>

      {section('Notes')}
      <textarea className="input" rows={3} value={data.notes} onChange={f('notes')} placeholder="Modifications, configs particulières…" style={{ resize: 'vertical' }} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" onClick={onSave}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
function ImprimanteCard({ p, onDetail, onEdit, onDelete }) {
  const vol = p.volume_x && p.volume_y && p.volume_z
  return (
    <div
      onClick={() => onDetail(p)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'all .2s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      <div style={{ height: 140, position: 'relative', background: '#111', overflow: 'hidden' }}>
        {p.img
          ? <img src={`./impression-3d/printers/${p.img}`} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ height: '100%', background: 'linear-gradient(135deg, rgba(59,130,246,.2), rgba(59,130,246,.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Printer size={36} color="#60a5fa" /></div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,.75))' }} />
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          <button
            style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', color: '#ccc', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
            onClick={e => { e.stopPropagation(); onEdit(p) }}
          ><Pencil size={12} /></button>
          <button
            style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer', color: '#f87171', transition: 'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
            onMouseLeave={e => e.currentTarget.style.color = '#f87171'}
            onClick={e => { e.stopPropagation(); onDelete(p) }}
          ><Trash2 size={12} /></button>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,.9)' }}>{p.nom}</div>
          {(p.marque || p.modele) && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{p.marque} {p.modele}</div>
          )}
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {vol && (
            <div style={{ gridColumn: 'span 2', background: 'var(--bg)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box size={13} color="var(--muted)" />
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{p.volume_x} × {p.volume_y} × {p.volume_z} mm</span>
            </div>
          )}
          {[
            ['Extrudeur', p.type_extrudeur],
            ['Buse', p.diametre_buse ? `⌀ ${p.diametre_buse} mm` : null],
            ['Firmware', p.firmware],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{val}</div>
            </div>
          ))}
        </div>

        {p.notes && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            {p.notes}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Imprimantes() {
  const [items, setItems] = useState([])
  const [catalog, setCatalog] = useState([])
  const [detail, setDetail] = useState(null)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => window.api.imprimantes.getAll().then(setItems)
  useEffect(() => { load() }, [])
  useEffect(() => {
    fetch('./data/printers-db.json')
      .then(r => r.json())
      .then(d => setCatalog(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    const { mode, data } = modal
    if (!data.nom) return alert('Le nom est requis.')
    if (mode === 'add' || mode === 'catalog-add') await window.api.imprimantes.create(data)
    else await window.api.imprimantes.update(data.id, data)
    setModal(null); load()
  }

  const openEdit = p => { setDetail(null); setModal({ mode: 'edit', data: { ...p } }) }

  return (
    <div className="animate-in" style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>Imprimantes</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{items.length} imprimante{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ mode: 'catalog' })}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <Printer size={40} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucune imprimante</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {items.map(p => (
            <ImprimanteCard key={p.id} p={p}
              onDetail={setDetail}
              onEdit={openEdit}
              onDelete={setConfirm}
            />
          ))}
        </div>
      )}

      {detail && (
        <Modal title={detail.nom} onClose={() => setDetail(null)}>
          <ImprimanteDetail p={detail} onEdit={() => openEdit(detail)} onClose={() => setDetail(null)} />
        </Modal>
      )}
      {modal?.mode === 'catalog' && (
        <Modal title="Ajouter une imprimante" onClose={() => setModal(null)} size="lg">
          <ImprimanteCatalogPicker
            catalog={catalog}
            onSelect={preset => setModal({ mode: 'catalog-add', data: { ...empty, ...preset, nom: `${preset.marque} ${preset.modele}` } })}
            onManual={() => setModal({ mode: 'add', data: { ...empty } })}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {(modal?.mode === 'add' || modal?.mode === 'catalog-add' || modal?.mode === 'edit') && (
        <Modal title={modal.mode === 'edit' ? "Modifier l'imprimante" : 'Ajouter une imprimante'} onClose={() => setModal(null)}>
          <ImprimanteForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog message={`Supprimer "${confirm.nom}" ?`} onConfirm={async () => { await window.api.imprimantes.delete(confirm.id); setConfirm(null); load() }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
