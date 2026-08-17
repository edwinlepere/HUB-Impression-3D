import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Settings2, Package, Printer, SquareStack, Thermometer, Zap, Wind, Upload, Download } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

// ── Slicer import/export ──────────────────────────────────────────────────────
const ORCA_PAT = { gyroid: 'Gyroïde', grid: 'Grille', honeycomb: "Nid d'abeille", line: 'Lignes', concentric: 'Concentrique', triangles: 'Triangles', cubic: 'Cubique', rectilinear: 'Lignes' }
const APP_PAT  = { 'Gyroïde': 'gyroid', 'Grille': 'grid', "Nid d'abeille": 'honeycomb', 'Lignes': 'line', 'Concentrique': 'concentric', 'Triangles': 'triangles', 'Cubique': 'cubic' }

function parseOrcaJson(text) {
  const d = JSON.parse(text)
  const num = k => { const v = parseFloat(d[k]); return isNaN(v) ? '' : v }
  const arr = k => { const a = d[k]; return Array.isArray(a) && a.length ? (parseFloat(a[0]) || '') : '' }
  const pct = k => { const v = String(d[k] ?? '').replace('%', ''); return parseFloat(v) || '' }
  return {
    nom: d.name || d.inherits || '',
    hauteur_couche: num('layer_height'),
    perimetre_nb: num('wall_loops') || num('perimeters'),
    couches_dessus: num('top_shell_layers') || num('top_solid_layers'),
    couches_dessous: num('bottom_shell_layers') || num('bottom_solid_layers'),
    remplissage_pct: pct('sparse_infill_density'),
    motif_remplissage: ORCA_PAT[d.sparse_infill_pattern] || 'Gyroïde',
    vitesse_impression: num('outer_wall_speed') || num('print_speed'),
    vitesse_perimetre: num('inner_wall_speed'),
    vitesse_remplissage: num('infill_speed') || num('sparse_infill_speed'),
    vitesse_deplacement: num('travel_speed'),
    temp_buse: arr('nozzle_temperature') || arr('nozzle_temperature_initial_layer'),
    temp_plateau: arr('bed_temperature') || arr('bed_temperature_initial_layer'),
    ventilateur_pct: arr('fan_speed') || arr('fan_speed_for_layer'),
    retraction_distance: arr('retraction_length'),
    retraction_vitesse: arr('retraction_speed'),
    largeur_extrusion: num('line_width') || num('extrusion_width'),
    supports: d.support_enable === '1' ? 1 : 0,
    brim_largeur: num('brim_width'),
    notes: '',
  }
}

function parsePrusaIni(text) {
  const d = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([^=\[#;\s][^=]*)=\s*(.*)$/)
    if (m) d[m[1].trim()] = m[2].trim()
  }
  const num = k => { const v = parseFloat(d[k]); return isNaN(v) ? '' : v }
  return {
    nom: d['name'] || '',
    hauteur_couche: num('layer_height'),
    perimetre_nb: num('perimeters'),
    couches_dessus: num('top_solid_layers'),
    couches_dessous: num('bottom_solid_layers'),
    remplissage_pct: parseFloat((d['fill_density'] || '').replace('%', '')) || '',
    motif_remplissage: 'Gyroïde',
    vitesse_impression: num('perimeter_speed'),
    vitesse_perimetre: num('external_perimeter_speed'),
    vitesse_remplissage: num('infill_speed'),
    vitesse_deplacement: num('travel_speed'),
    temp_buse: num('nozzle_temperature') || num('first_layer_temperature'),
    temp_plateau: num('bed_temperature') || num('first_layer_bed_temperature'),
    ventilateur_pct: num('fan_speed_for_layer') || num('min_fan_speed'),
    retraction_distance: num('retract_length'),
    retraction_vitesse: num('retract_speed'),
    supports: d['support_material'] === '1' ? 1 : 0,
    brim_largeur: num('brim_width'),
    notes: '',
  }
}

function generateExportJson(p) {
  return JSON.stringify({
    _source: 'HUB Impression 3D',
    type: 'process',
    name: p.nom,
    layer_height: String(p.hauteur_couche || ''),
    wall_loops: String(p.perimetre_nb || ''),
    top_shell_layers: String(p.couches_dessus || ''),
    bottom_shell_layers: String(p.couches_dessous || ''),
    sparse_infill_density: `${p.remplissage_pct || ''}%`,
    sparse_infill_pattern: APP_PAT[p.motif_remplissage] || 'gyroid',
    outer_wall_speed: String(p.vitesse_impression || ''),
    inner_wall_speed: String(p.vitesse_perimetre || ''),
    infill_speed: String(p.vitesse_remplissage || ''),
    travel_speed: String(p.vitesse_deplacement || ''),
    nozzle_temperature: [String(p.temp_buse || '')],
    bed_temperature: [String(p.temp_plateau || '')],
    fan_speed: [String(p.ventilateur_pct || '')],
    retraction_length: [String(p.retraction_distance || '')],
    retraction_speed: [String(p.retraction_vitesse || '')],
    line_width: String(p.largeur_extrusion || ''),
    support_enable: p.supports ? '1' : '0',
    brim_width: String(p.brim_largeur || '0'),
  }, null, 2)
}

const MOTIFS = ['Gyroïde', 'Grille', 'Nid d\'abeille', 'Lignes', 'Concentrique', 'Triangles', 'Cubique', 'Autre']

const empty = {
  nom: '', filament_id: '', imprimante_id: '', plateau_id: '',
  temp_buse: '', temp_plateau: '',
  vitesse_impression: '', vitesse_perimetre: '', vitesse_remplissage: '', vitesse_deplacement: '',
  retraction_distance: '', retraction_vitesse: '',
  ventilateur_pct: 100,
  hauteur_couche: 0.2, largeur_extrusion: 0.4,
  remplissage_pct: 15, motif_remplissage: 'Gyroïde',
  perimetre_nb: 3, couches_dessus: 4, couches_dessous: 4,
  supports: 0, brim_largeur: 0,
  notes: '',
}

function ProfilForm({ data, onChange, onSave, onCancel, filaments, imprimantes, plateaux }) {
  const f = field => e => onChange({ ...data, [field]: e.target.value })
  const n = field => e => onChange({ ...data, [field]: e.target.value === '' ? '' : Number(e.target.value) })

  const selFil = filaments.find(x => x.id === Number(data.filament_id))

  const section = label => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '18px 0 10px', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
      {label}
    </div>
  )

  return (
    <div>
      {section('Identification & liaisons')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: 'span 3' }}>
          <div className="label">Nom du profil *</div>
          <input className="input" value={data.nom} onChange={f('nom')} placeholder="PLA Standard Kobra S1 / PEI Texturé…" />
        </div>
        <div>
          <div className="label">Filament</div>
          <select className="input" value={data.filament_id} onChange={f('filament_id')}>
            <option value="">— Aucun —</option>
            {filaments.map(fi => <option key={fi.id} value={fi.id}>{fi.marque} {fi.gamme || fi.type} {fi.couleur}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Imprimante</div>
          <select className="input" value={data.imprimante_id} onChange={f('imprimante_id')}>
            <option value="">— Aucune —</option>
            {imprimantes.map(i => <option key={i.id} value={i.id}>{i.nom}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Plateau</div>
          <select className="input" value={data.plateau_id} onChange={f('plateau_id')}>
            <option value="">— Aucun —</option>
            {plateaux.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
      </div>

      {section('Températures')}
      {selFil && (selFil.temp_buse_min || selFil.temp_buse_max) && (
        <div style={{ marginBottom: 10, background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.15)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Fabricant :</span> buse {selFil.temp_buse_min}–{selFil.temp_buse_max}°C · plateau {selFil.temp_plateau_min}–{selFil.temp_plateau_max}°C
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[['Buse (°C)', 'temp_buse', '215'], ['Plateau (°C)', 'temp_plateau', '60'], ['Ventilateur (%)', 'ventilateur_pct', '100']].map(([label, key, ph]) => (
          <div key={key}>
            <div className="label">{label}</div>
            <input type="number" className="input" value={data[key]} onChange={n(key)} placeholder={ph} />
          </div>
        ))}
      </div>

      {section('Vitesses (mm/s)')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        {[['Globale', 'vitesse_impression', '80'], ['Périmètre', 'vitesse_perimetre', '50'], ['Remplissage', 'vitesse_remplissage', '100'], ['Déplacement', 'vitesse_deplacement', '200']].map(([label, key, ph]) => (
          <div key={key}>
            <div className="label">{label}</div>
            <input type="number" className="input" value={data[key]} onChange={n(key)} placeholder={ph} />
          </div>
        ))}
      </div>

      {section('Couches & Extrusion')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {[
          ['Hauteur (mm)', 'hauteur_couche', '0.2'],
          ['Largeur (mm)', 'largeur_extrusion', '0.4'],
          ['Périmètres', 'perimetre_nb', '3'],
          ['Couches dessus', 'couches_dessus', '4'],
          ['Couches dessous', 'couches_dessous', '4'],
          ['Rétraction (mm)', 'retraction_distance', '0.8'],
        ].map(([label, key, ph]) => (
          <div key={key}>
            <div className="label">{label}</div>
            <input type="number" className="input" value={data[key]} onChange={n(key)} placeholder={ph} step="0.05" />
          </div>
        ))}
      </div>

      {section('Remplissage & Options')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        <div>
          <div className="label">Densité (%)</div>
          <input type="number" className="input" value={data.remplissage_pct} onChange={n('remplissage_pct')} min="0" max="100" />
        </div>
        <div>
          <div className="label">Motif</div>
          <select className="input" value={data.motif_remplissage} onChange={f('motif_remplissage')}>
            {MOTIFS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Brim (mm)</div>
          <input type="number" className="input" value={data.brim_largeur} onChange={n('brim_largeur')} step="1" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--brand)' }}
              checked={!!data.supports} onChange={e => onChange({ ...data, supports: e.target.checked ? 1 : 0 })} />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Supports</span>
          </label>
        </div>
      </div>

      {section('Notes')}
      <textarea className="input" rows={2} value={data.notes} onChange={f('notes')} placeholder="Contexte d'utilisation, résultats, conseils…" style={{ resize: 'vertical' }} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" onClick={onSave}>Enregistrer</button>
      </div>
    </div>
  )
}

function ProfilCard({ p, onEdit, onDelete, onExport }) {
  const specs = [
    p.temp_buse     && { icon: Thermometer, label: 'Buse',     val: `${p.temp_buse}°C`,        color: '#fb923c' },
    p.temp_plateau  && { icon: Thermometer, label: 'Plateau',  val: `${p.temp_plateau}°C`,      color: '#60a5fa' },
    p.ventilateur_pct != null && { icon: Wind, label: 'Ventilo', val: `${p.ventilateur_pct}%`,  color: '#818cf8' },
    p.vitesse_impression && { icon: Zap, label: 'Vitesse',    val: `${p.vitesse_impression} mm/s`, color: '#34d399' },
    p.hauteur_couche && { label: '↕ Couche', val: `${p.hauteur_couche} mm`,   color: 'var(--muted)' },
    p.remplissage_pct != null && { label: '▤ Remplissage', val: `${p.remplissage_pct}%`, color: 'var(--muted)' },
  ].filter(Boolean)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
      padding: 18, transition: 'all .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{p.nom}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {p.f_marque && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <Package size={10} /> {p.f_marque} {p.f_type} {p.f_couleur}
              </span>
            )}
            {p.i_nom && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <Printer size={10} /> {p.i_nom}
              </span>
            )}
            {p.pl_nom && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <SquareStack size={10} /> {p.pl_nom}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginLeft: 8 }}>
          <button className="btn-ghost" style={{ padding: '4px 7px' }} title="Exporter (Orca/Bambu JSON)" onClick={() => onExport(p)}><Download size={12} /></button>
          <button className="btn-ghost" style={{ padding: '4px 7px' }} onClick={() => onEdit(p)}><Pencil size={12} /></button>
          <button className="btn-danger" style={{ padding: '4px 7px' }} onClick={() => onDelete(p)}><Trash2 size={12} /></button>
        </div>
      </div>

      {/* Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {specs.map(s => (
          <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 9, padding: '7px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color || 'var(--text)' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {p.notes && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          {p.notes}
        </div>
      )}
    </div>
  )
}

export default function Profils() {
  const [items, setItems]     = useState([])
  const [filaments, setFil]   = useState([])
  const [imprimantes, setImp] = useState([])
  const [plateaux, setPlat]   = useState([])
  const [modal, setModal]     = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    const [p, f, i, pl] = await Promise.all([
      window.api.profils.getAll(),
      window.api.filaments.getAll(),
      window.api.imprimantes.getAll(),
      window.api.plateaux.getAll(),
    ])
    setItems(p); setFil(f); setImp(i); setPlat(pl)
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const { mode, data } = modal
    if (!data.nom) return alert('Le nom du profil est requis.')
    const payload = {
      ...data,
      filament_id:   data.filament_id   ? Number(data.filament_id)   : null,
      imprimante_id: data.imprimante_id ? Number(data.imprimante_id) : null,
      plateau_id:    data.plateau_id    ? Number(data.plateau_id)    : null,
    }
    if (mode === 'add') await window.api.profils.create(payload)
    else await window.api.profils.update(data.id, payload)
    setModal(null); load()
  }

  const handleImport = async () => {
    const result = await window.api.dialog.openFile({
      title: 'Importer un profil slicer',
      filters: [
        { name: 'Profils slicer', extensions: ['json', 'ini'] },
        { name: 'OrcaSlicer / Bambu Studio JSON', extensions: ['json'] },
        { name: 'PrusaSlicer INI', extensions: ['ini'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths.length) return
    try {
      const text = await window.api.fs.readFile(result.filePaths[0])
      const parsed = result.filePaths[0].endsWith('.ini') ? parsePrusaIni(text) : parseOrcaJson(text)
      setModal({ mode: 'add', data: { ...empty, ...parsed, filament_id: '', imprimante_id: '', plateau_id: '' } })
    } catch (e) {
      alert(`Erreur lors de l'import : ${e.message}`)
    }
  }

  const handleExport = async (profil) => {
    const safeName = (profil.nom || 'profil').replace(/[^a-zA-Z0-9_\- ]/g, '_')
    const result = await window.api.dialog.saveFile({
      title: 'Exporter le profil',
      defaultPath: `${safeName}.json`,
      filters: [{ name: 'JSON (Orca/Bambu compatible)', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return
    try {
      await window.api.fs.writeFile(result.filePath, generateExportJson(profil))
    } catch (e) {
      alert(`Erreur lors de l'export : ${e.message}`)
    }
  }

  return (
    <div className="animate-in" style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>Profils d'impression</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{items.length} profil{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={handleImport} title="Importer depuis OrcaSlicer, Bambu Studio ou PrusaSlicer">
            <Upload size={15} /> Importer
          </button>
          <button className="btn-primary" onClick={() => setModal({ mode: 'add', data: { ...empty } })}>
            <Plus size={15} /> Créer un profil
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <Settings2 size={40} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Aucun profil</div>
          <div style={{ fontSize: 13 }}>Les profils combinent filament + imprimante + plateau + tous les paramètres slicer.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {items.map(p => (
            <ProfilCard key={p.id} p={p}
              onEdit={pi => setModal({ mode: 'edit', data: { ...pi, filament_id: pi.filament_id || '', imprimante_id: pi.imprimante_id || '', plateau_id: pi.plateau_id || '' } })}
              onDelete={setConfirm}
              onExport={handleExport}
            />
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Créer un profil' : 'Modifier le profil'} onClose={() => setModal(null)} size="lg">
          <ProfilForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} onSave={handleSave} onCancel={() => setModal(null)} filaments={filaments} imprimantes={imprimantes} plateaux={plateaux} />
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog message={`Supprimer le profil "${confirm.nom}" ?`} onConfirm={async () => { await window.api.profils.delete(confirm.id); setConfirm(null); load() }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
