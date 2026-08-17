import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, Package, Search, Droplets, Flame, Wind,
  LayoutGrid, List, ChevronUp, ChevronDown, AlertTriangle, Lightbulb, Info,
  Scale, MapPin, Sliders, ShoppingCart, FileText, Settings2, ExternalLink, Zap,
} from 'lucide-react'
import Modal from '../components/Modal'

const TYPES = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'HIPS', 'PVA', 'Résine', 'Composite', 'Autre']
const DIAMS = [1.75, 2.85]

const TYPE_COLOR = {
  PLA:    { bg: 'rgba(59,130,246,.15)',  text: '#60a5fa',  border: 'rgba(59,130,246,.3)'  },
  PETG:   { bg: 'rgba(249,115,22,.15)',  text: '#fb923c',  border: 'rgba(249,115,22,.3)'  },
  ABS:    { bg: 'rgba(239,68,68,.15)',   text: '#f87171',  border: 'rgba(239,68,68,.3)'   },
  ASA:    { bg: 'rgba(234,179,8,.15)',   text: '#facc15',  border: 'rgba(234,179,8,.3)'   },
  TPU:    { bg: 'rgba(168,85,247,.15)',  text: '#c084fc',  border: 'rgba(168,85,247,.3)'  },
  Nylon:  { bg: 'rgba(20,184,166,.15)',  text: '#2dd4bf',  border: 'rgba(20,184,166,.3)'  },
  PC:     { bg: 'rgba(99,102,241,.15)',  text: '#818cf8',  border: 'rgba(99,102,241,.3)'  },
  default:{ bg: 'rgba(100,100,120,.15)', text: '#9ca3af',  border: 'rgba(100,100,120,.3)' },
}

const empty = {
  marque: '', gamme: '', type: 'PLA', couleur: '', code_couleur: '#f97316',
  diametre: 1.75,
  temp_buse_min: '', temp_buse_max: '', temp_plateau_min: '', temp_plateau_max: '',
  vitesse_min: '', vitesse_max: '', retraction_distance: '', retraction_vitesse: '',
  ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: '', duree_sechage: '',
  densite: '', notes: '',
  poids_bobine_vide: '', td: '', valeur_k: '', ratio_flux: '',
}

const emptyBobine = {
  bobine_uid: '',
  emplacement: '',
  poids_restant: '',
  poids_bobine_vide: '',
  poids_avec_bobine: '',
  type_bobine: '',
  date_sechage: '',
  td: '',
  valeur_k: '',
  ratio_flux: '',
  prix_achat: '',
  devise: 'EUR',
  date_achat: '',
  lien_achat: '',
  notes_achat: '',
  notes: '',
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH   = Math.floor(diffMs / 3600000)
  const diffD   = Math.floor(diffMs / 86400000)
  if (diffMin < 1)  return 'à l\'inst.'
  if (diffMin < 60) return `-${diffMin} min.`
  if (diffH < 24)   return `-${diffH} h`
  if (diffD < 30)   return `-${diffD} j.`
  return d.toLocaleDateString('fr-FR')
}

const FILAMENT_TIPS = {
  'PLA|Basique': [
    { k: 'tip',  t: 'Refroidissement à 100% dès la 2e couche pour des détails nets et des pontages propres.' },
    { k: 'warn', t: 'Tg ~60°C — ne pas utiliser en voiture, plein soleil ou lave-vaisselle : la pièce se déforme.' },
    { k: 'info', t: 'Si tu entends des "pops" à l\'extrusion ou que le filament bulle : sécher 4h à 50°C avant impression.' },
  ],
  'PLA|Silk': [
    { k: 'tip',  t: 'Réduire la vitesse de 20-30% (max 150mm/s) pour un aspect satiné homogène sans stries.' },
    { k: 'warn', t: 'Rétraction trop agressive = bouchons. Rester sur 0.8mm max, ne pas dépasser sans tester.' },
    { k: 'info', t: 'Moins résistant qu\'un PLA Basique — réserver aux objets décoratifs et figurines.' },
  ],
  'PLA|Metal': [
    { k: 'warn', t: 'Particules métalliques très abrasives — buse en acier trempé obligatoire. Une buse cuivre standard s\'use en quelques centaines de grammes.' },
    { k: 'tip',  t: 'Ponçage progressif (120→400→800→2000) puis polish métallique pour révéler le rendu acier brossé.' },
    { k: 'info', t: 'Vitesse max 120mm/s — au-delà les particules s\'homogénéisent mal, rendu inégal.' },
  ],
  'PLA|Glow': [
    { k: 'warn', t: 'Poudre phosphorescente très abrasive — buse acier trempé obligatoire, identique au Métal.' },
    { k: 'tip',  t: 'Charger 2-3 min sous lampe UV ou lumière vive pour une luminescence maximale (15-30 min dans le noir).' },
    { k: 'info', t: 'Nettoyer le tube PTFE régulièrement — les particules s\'accumulent dans les recoins.' },
  ],
  'PLA|Mat': [
    { k: 'tip',  t: 'Aspect mat sans post-traitement — idéal pour masques, coques, prototypes à rendu professionnel.' },
    { k: 'warn', t: 'Ne pas poncer ni utiliser d\'acétone — détruit immédiatement l\'effet mat.' },
    { k: 'info', t: 'Légèrement moins résistant que le PLA Basique, mais meilleur rendu surface brut de sortie.' },
  ],
  'PLA|Haute Vitesse': [
    { k: 'warn', t: 'Requiert une hotend haute performance (>40W type Volcano/Rapido). Buse standard = sous-extrusion dès 150mm/s.' },
    { k: 'tip',  t: 'Augmenter la température de 10-20°C vs PLA standard pour maintenir la même viscosité à haute vitesse.' },
    { k: 'info', t: 'Refroidissement maximum indispensable — 100% ventilateur dès la 2e couche, deux ventilateurs si possible.' },
  ],
  'PETG': [
    { k: 'warn', t: 'PETG colle aux plateaux PEI à chaud — laisser TOUJOURS refroidir complètement avant retrait (15-20 min minimum).' },
    { k: 'tip',  t: 'Stringing fréquent : augmenter la rétraction de +0.5mm et activer le wipe nozzle dans le slicer.' },
    { k: 'warn', t: 'Ventilateur à 50% max — trop de refroidissement crée des délaminations inter-couches.' },
    { k: 'info', t: 'Résistant aux UV et légèrement flexible. Idéal pour pièces fonctionnelles extérieures.' },
  ],
  'TPU': [
    { k: 'warn', t: 'Direct Drive obligatoire — en Bowden le filament flexible flambe dans le tube et bloque. Résultat imprévisible.' },
    { k: 'warn', t: 'Vitesse max 30-40mm/s strict. Au-delà : compression du filament, sous-extrusion garantie.' },
    { k: 'tip',  t: 'Désactiver la rétraction ou la limiter à 0.5mm max — une grande rétraction crée des bouchons avec le flexible.' },
    { k: 'info', t: 'Idéal pour coques téléphone, joints, amortisseurs, semelles. Résistant aux UV et aux graisses.' },
  ],
  'ABS': [
    { k: 'warn', t: 'Enceinte fermée OBLIGATOIRE — sans enceinte : warping assuré dès les premières couches.' },
    { k: 'warn', t: 'Émet des vapeurs de styrène — ventiler la pièce ou utiliser un filtre HEPA + charbon actif.' },
    { k: 'tip',  t: 'L\'acétone dissout et soude les pièces ABS entre elles : utiliser pour assembler ou lisser (vapeur acétone).' },
    { k: 'info', t: 'Tg ~100°C et résistant aux chocs. Idéal pour pièces techniques soumises à la chaleur.' },
  ],
  'ASA': [
    { k: 'tip',  t: 'Résistant aux UV et aux intempéries — le choix n°1 pour les pièces destinées à l\'extérieur.' },
    { k: 'warn', t: 'Mêmes précautions que l\'ABS : enceinte fermée et ventilation obligatoires.' },
    { k: 'info', t: 'Légèrement plus facile que l\'ABS : moins de warping, plus tolérant sur les réglages.' },
  ],
  'Nylon': [
    { k: 'warn', t: 'Très hygroscopique — sécher 24h à 80°C avant impression. Imprimer idéalement directement depuis le sécheur.' },
    { k: 'warn', t: 'Warping fort : utiliser du PVA glue, plateau Garolite ou PEI à 70°C pour accrocher.' },
    { k: 'info', t: 'Résistant à la fatigue et aux chocs répétés — excellent pour engrenages, clips et pièces mécaniques.' },
  ],
  'PC': [
    { k: 'warn', t: 'Hotend All-Metal obligatoire — pas de PTFE dans la zone chaude (dégradation au-dessus de 240°C).' },
    { k: 'warn', t: 'Très hygroscopique — sécher 8h à 80°C. L\'humidité crée des bulles et fragilise les couches.' },
    { k: 'info', t: 'Résistance thermique jusqu\'à 110°C et aux chocs élevés — pour pièces à fortes contraintes mécaniques et thermiques.' },
  ],
}

const SORT_FIELDS = [
  { key: 'marque',        label: 'Marque' },
  { key: 'couleur',       label: 'Couleur' },
  { key: 'type',          label: 'Matière' },
  { key: 'temp_buse_min', label: 'Buse °C' },
  { key: 'vitesse_max',   label: 'Vitesse' },
  { key: 'poids_restant', label: 'Poids' },
  { key: 'nb_bobines',    label: 'Bobines' },
]

const PLATEAUX_COMPAT = {
  PLA:    ['Smooth PEI', 'Cool Plate', 'Textured PEI', 'Satin Plate'],
  PETG:   ['Smooth PEI', 'Textured PEI', 'Engineering Plate'],
  ABS:    ['Engineering Plate', 'Smooth PEI'],
  ASA:    ['Engineering Plate', 'Smooth PEI'],
  TPU:    ['Smooth PEI', 'Cool Plate', 'Textured PEI'],
  Nylon:  ['Engineering Plate', 'Smooth PEI'],
  PC:     ['Engineering Plate'],
  HIPS:   ['Smooth PEI', 'Engineering Plate'],
  PVA:    ['Cool Plate', 'Smooth PEI'],
}

const FILAMENT_CATALOG = [
  { _id: 'anycubic-pla-basic',    marque: 'Anycubic', gamme: 'Basic',       type: 'PLA',  diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 190, temp_buse_max: 230, temp_plateau_min: 25, temp_plateau_max: 60,  vitesse_min: 30, vitesse_max: 300, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4,  densite: 1.24, notes: '' },
  { _id: 'anycubic-pla-silk',     marque: 'Anycubic', gamme: 'Silk',        type: 'PLA',  diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 200, temp_buse_max: 240, temp_plateau_min: 35, temp_plateau_max: 65,  vitesse_min: 30, vitesse_max: 200, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4,  densite: 1.24, notes: '' },
  { _id: 'anycubic-pla-matte',    marque: 'Anycubic', gamme: 'Matte',       type: 'PLA',  diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 190, temp_buse_max: 230, temp_plateau_min: 25, temp_plateau_max: 60,  vitesse_min: 30, vitesse_max: 300, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4,  densite: 1.24, notes: '' },
  { _id: 'anycubic-pla-hs',       marque: 'Anycubic', gamme: 'High Speed',  type: 'PLA',  diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 210, temp_buse_max: 250, temp_plateau_min: 35, temp_plateau_max: 65,  vitesse_min: 60, vitesse_max: 600, retraction_distance: 0.5, retraction_vitesse: 60, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4,  densite: 1.24, notes: '' },
  { _id: 'anycubic-pla-metal',    marque: 'Anycubic', gamme: 'Metal',       type: 'PLA',  diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 200, temp_buse_max: 240, temp_plateau_min: 45, temp_plateau_max: 60,  vitesse_min: 30, vitesse_max: 120, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4,  densite: 1.3,  notes: '' },
  { _id: 'anycubic-pla-glow',     marque: 'Anycubic', gamme: 'Glow',        type: 'PLA',  diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 190, temp_buse_max: 230, temp_plateau_min: 25, temp_plateau_max: 60,  vitesse_min: 30, vitesse_max: 180, retraction_distance: 0.8, retraction_vitesse: 40, ventilateur_pct: 100, humidite_sensible: 0, temp_sechage: 50, duree_sechage: 4,  densite: 1.24, notes: '' },
  { _id: 'anycubic-petg-basic',   marque: 'Anycubic', gamme: 'Basic',       type: 'PETG', diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 230, temp_buse_max: 250, temp_plateau_min: 70, temp_plateau_max: 90,  vitesse_min: 30, vitesse_max: 180, retraction_distance: 1.0, retraction_vitesse: 35, ventilateur_pct: 50,  humidite_sensible: 1, temp_sechage: 65, duree_sechage: 6,  densite: 1.27, notes: '' },
  { _id: 'anycubic-tpu-basic',    marque: 'Anycubic', gamme: 'Basic',       type: 'TPU',  diametre: 1.75, poids_bobine_vide: 212, temp_buse_min: 220, temp_buse_max: 240, temp_plateau_min: 30, temp_plateau_max: 60,  vitesse_min: 15, vitesse_max: 60,  retraction_distance: 0.5, retraction_vitesse: 25, ventilateur_pct: 100, humidite_sensible: 1, temp_sechage: 60, duree_sechage: 8,  densite: 1.21, notes: '' },
]

// ── Tips ─────────────────────────────────────────────────────────────────────
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

// ── Fiche produit ─────────────────────────────────────────────────────────────
function FicheCard({ title, icon, children }) {
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        {icon}
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function BigStat({ label, value, unit, missing }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 10, padding: '14px 12px', textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{label}</div>
      {missing
        ? <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--muted2)' }}>?</div>
        : <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
            {value}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginLeft: 2 }}>{unit}</span>
          </div>}
    </div>
  )
}

function FicheProduit({ f, onEdit, onClose }) {
  const tc = TYPE_COLOR[f.type] || TYPE_COLOR.default
  const tips = FILAMENT_TIPS[`${f.type}|${f.gamme}`] || FILAMENT_TIPS[f.type] || []
  const compat = PLATEAUX_COMPAT[f.type] || []

  const TechRow = ({ label, value, blue }) => (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '6px 0', fontSize: 12.5, color: blue ? '#60a5fa' : 'var(--muted)', width: '60%' }}>{label} :</td>
      <td style={{ padding: '6px 0', fontSize: 12.5, color: blue ? '#60a5fa' : 'var(--text)', fontWeight: 600, textAlign: 'right' }}>{value}</td>
    </tr>
  )

  const hasTechDetails = f.densite || f.poids_bobine_vide || f.retraction_distance || f.valeur_k || f.td
  const hasDrying = !!f.humidite_sensible && (f.temp_sechage || f.duree_sechage)
  const hasFlow = f.ratio_flux != null || f.td != null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* ── LEFT ── */}
        <div>
          {/* Couleur */}
          <FicheCard title="Couleur" icon={<div style={{ width: 16, height: 16, borderRadius: 4, background: f.code_couleur || '#555', border: '1px solid var(--border2)', flexShrink: 0 }} />}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 80, height: 80, borderRadius: 10, background: f.code_couleur || '#555', border: '2px solid var(--border2)', flexShrink: 0, overflow: 'hidden' }}>
                {f.img && <img src={`./impression-3d/filaments/${f.img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 1 }}>Couleur</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{f.couleur || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>RGB</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {f.code_couleur || '—'}
                  {f.code_couleur && (
                    <button type="button" title="Copier"
                      onClick={() => navigator.clipboard?.writeText(f.code_couleur)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, padding: 0, lineHeight: 1 }}>
                      ⎘
                    </button>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Matériau</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, display: 'inline-block', marginBottom: 8 }}>{f.type}</span>
                {f.gamme && <>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Type de matériau</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{f.gamme}</div>
                </>}
              </div>
            </div>
          </FicheCard>

          {/* Détails techniques */}
          {hasTechDetails && (
            <FicheCard title="Détails techniques" icon={<FileText size={15} color="var(--muted)" />}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {f.densite != null && f.densite !== '' && <TechRow label="Densité" value={`${f.densite} g/cm³`} />}
                  <TechRow label="Diamètre" value={`${f.diametre || 1.75} mm`} />
                  {f.poids_bobine_vide != null && f.poids_bobine_vide !== '' && <TechRow label="Poids de la bobine vide" value={`${f.poids_bobine_vide} g`} />}
                  {f.retraction_distance != null && f.retraction_distance !== '' && (
                    <TechRow label="Retrait" value={`${f.retraction_distance} mm${f.retraction_vitesse ? ` @ ${f.retraction_vitesse} mm/s` : ''}`} />
                  )}
                  {f.valeur_k != null && f.valeur_k !== '' && <TechRow label="Pression d'avance (valeur K)" value={f.valeur_k} blue />}
                  {f.td != null && f.td !== '' && <TechRow label="Distance de transmission (TD)" value={f.td} blue />}
                </tbody>
              </table>
            </FicheCard>
          )}

          {/* Températures */}
          <FicheCard title="Températures" icon={<Flame size={15} color="#fb923c" />}>
            <div style={{ display: 'flex', gap: 10 }}>
              <BigStat label="Buse"
                value={f.temp_buse_min && f.temp_buse_max ? `${f.temp_buse_min}–${f.temp_buse_max}` : f.temp_buse_min || f.temp_buse_max}
                unit="°C" missing={!f.temp_buse_min && !f.temp_buse_max} />
              <BigStat label="Plateau"
                value={f.temp_plateau_min && f.temp_plateau_max ? `${f.temp_plateau_min}–${f.temp_plateau_max}` : f.temp_plateau_min || f.temp_plateau_max}
                unit="°C" missing={!f.temp_plateau_min && !f.temp_plateau_max} />
            </div>
          </FicheCard>
        </div>

        {/* ── RIGHT ── */}
        <div>
          {/* Détails du produit */}
          <FicheCard title="Détails du produit" icon={<Package size={15} color="var(--muted)" />}>
            <div style={{ marginBottom: f.lien_achat ? 14 : 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 2, letterSpacing: '-0.02em' }}>{f.marque}</div>
              {f.gamme && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{f.gamme}</div>}
              {!!f.humidite_sensible && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12, background: 'rgba(96,165,250,.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,.3)' }}>
                  <Droplets size={10} /> Sensible à l'humidité
                </div>
              )}
            </div>
            {f.lien_achat && (
              <a href={f.lien_achat} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.25)', borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
                Lien produit <ExternalLink size={11} />
              </a>
            )}
          </FicheCard>

          {/* Ventilateur */}
          <FicheCard title="Vitesse du ventilateur" icon={<Wind size={15} color="#818cf8" />}>
            <div style={{ display: 'flex', gap: 10 }}>
              <BigStat label="Vitesse du ventilateur" value={f.ventilateur_pct} unit="%" missing={f.ventilateur_pct == null} />
            </div>
          </FicheCard>

          {/* Vitesses */}
          <FicheCard title="Vitesses d'impression" icon={<Zap size={15} color="var(--muted)" />}>
            <div style={{ display: 'flex', gap: 10 }}>
              <BigStat label="Vitesse min" value={f.vitesse_min} unit="mm/s" missing={!f.vitesse_min} />
              <BigStat label="Vitesse max" value={f.vitesse_max} unit="mm/s" missing={!f.vitesse_max} />
            </div>
          </FicheCard>

          {/* Flux */}
          {hasFlow && (
            <FicheCard title="Caractéristiques du flux" icon={<Sliders size={15} color="var(--muted)" />}>
              <div style={{ display: 'flex', gap: 10 }}>
                {f.ratio_flux != null && <BigStat label="Ratio de flux" value={f.ratio_flux} unit="" />}
                {f.td != null && <BigStat label="TD" value={f.td} unit="" />}
              </div>
            </FicheCard>
          )}

          {/* Séchage */}
          {hasDrying && (
            <FicheCard title="Infos de séchage" icon={<Droplets size={15} color="#60a5fa" />}>
              <div style={{ display: 'flex', gap: 10 }}>
                {f.temp_sechage && <BigStat label="Temp. de séchage" value={f.temp_sechage} unit="°C" />}
                {f.duree_sechage && <BigStat label="Durée de séchage" value={f.duree_sechage} unit="h" />}
              </div>
            </FicheCard>
          )}
        </div>
      </div>

      {/* ── Full width ── */}
      {compat.length > 0 && (
        <FicheCard title="Plateaux d'impression compatibles" icon={<Scale size={15} color="var(--muted)" />}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {compat.map(p => (
              <div key={p} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
                {p}
              </div>
            ))}
          </div>
        </FicheCard>
      )}

      {tips.length > 0 && (
        <FicheCard title="Conseils d'utilisation" icon={<Lightbulb size={15} color="#60a5fa" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tips.map((tip, i) => <TipItem key={i} {...tip} />)}
          </div>
        </FicheCard>
      )}

      {f.notes && (
        <FicheCard title="Notes" icon={<FileText size={15} color="var(--muted)" />}>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{f.notes}</div>
        </FicheCard>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onClose}>Fermer</button>
        <button className="btn-primary" onClick={onEdit}><Pencil size={13} /> Modifier</button>
      </div>
    </div>
  )
}

// ── Detail ───────────────────────────────────────────────────────────────────
function FilamentDetail({ f, onEdit, onClose, onReload }) {
  const [bobines, setBobines] = useState([])
  const [bobineView, setBobineView] = useState(null) // null | { mode: 'add'|'edit', data: {} }
  const [deletingId, setDeletingId] = useState(null)
  const [editingWeight, setEditingWeight] = useState(null)

  const loadBobines = () => window.api.bobines.getByFilament(f.id).then(setBobines)
  useEffect(() => { loadBobines() }, [f.id])

  const handleSaveBobine = async () => {
    const { mode, data } = bobineView
    if (mode === 'add') await window.api.bobines.create({ ...data, filament_id: f.id })
    else await window.api.bobines.update(data.id, data)
    setBobineView(null)
    loadBobines()
    onReload()
  }

  const handleDeleteBobine = async (id) => {
    await window.api.bobines.delete(id)
    setDeletingId(null)
    loadBobines()
    onReload()
  }

  const newBobineData = () => ({
    ...emptyBobine,
    poids_bobine_vide: f.poids_bobine_vide != null ? f.poids_bobine_vide : '',
    td:         f.td        != null ? f.td        : '',
    valeur_k:   f.valeur_k  != null ? f.valeur_k  : '',
    ratio_flux: f.ratio_flux != null ? f.ratio_flux : '',
  })

  if (bobineView) {
    return (
      <div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setBobineView(null)}
          style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          ← Retour
        </button>
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
          {bobineView.mode === 'add' ? 'Nouvelle bobine — ' : 'Modification — '}
          <strong style={{ color: 'var(--text)' }}>{f.marque} {f.type} {f.couleur || ''}</strong>
          {bobineView.data.bobine_uid ? <span style={{ marginLeft: 8, fontFamily: 'monospace', color: '#60a5fa', fontSize: 11 }}>{bobineView.data.bobine_uid}</span> : null}
        </div>
        <BobineForm
          data={bobineView.data}
          onChange={d => setBobineView(v => ({ ...v, data: d }))}
          onSave={handleSaveBobine}
          onCancel={() => setBobineView(null)}
        />
      </div>
    )
  }

  const tc = TYPE_COLOR[f.type] || TYPE_COLOR.default
  const tips = FILAMENT_TIPS[`${f.type}|${f.gamme}`] || FILAMENT_TIPS[f.type] || []

  const Tile = ({ label, value, unit }) =>
    value != null && value !== '' ? (
      <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
          {value}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 3 }}>{unit}</span>
        </div>
      </div>
    ) : null

  const Section = ({ label }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '16px 0 8px', paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
      {label}
    </div>
  )

  return (
    <div>
      {f.img && (
        <div style={{ height: 160, borderRadius: 10, overflow: 'hidden', marginBottom: 14, position: 'relative', background: f.code_couleur || '#333' }}>
          <img src={`./impression-3d/filaments/${f.img}`} alt={f.couleur} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.65))' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: f.code_couleur || '#555', border: '2px solid var(--border2)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{f.couleur || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{f.marque}{f.gamme ? ` · ${f.gamme}` : ''} · {f.diametre} mm</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, flexShrink: 0 }}>{f.type}</span>
        {!!f.humidite_sensible && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 20, background: 'rgba(96,165,250,.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,.3)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Droplets size={10} /> Humidité
          </span>
        )}
      </div>

      {/* ── Bobines ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px', paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
          Bobines ({bobines.length})
        </div>
        <button
          className="btn-primary"
          style={{ fontSize: 11, padding: '4px 10px' }}
          onClick={() => setBobineView({ mode: 'add', data: newBobineData() })}
        >
          <Plus size={12} /> Ajouter une bobine
        </button>
      </div>

      {bobines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 16px', background: 'var(--bg)', borderRadius: 10, color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
          Aucune bobine enregistrée — ajoutez-en une pour commencer le suivi.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Emplacement', 'Restant (g)', 'ID Bobine', 'Type', 'Ajouté', 'Dernière MAJ', 'Lien', 'Notes achat', 'Notes', ''].map(h => (
                  <th key={h} className="th" style={{ whiteSpace: 'nowrap', fontSize: 10, padding: '8px 10px' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bobines.map(b => (
                <tr key={b.id} className="trow">
                  <td className="td" style={{ padding: '6px 10px' }}>
                    <select
                      value={b.emplacement || ''}
                      onChange={async e => {
                        await window.api.bobines.patch(b.id, { emplacement: e.target.value || null })
                        loadBobines(); onReload()
                      }}
                      style={{
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: b.emplacement?.startsWith('Ace Pro') ? 'rgba(99,102,241,.15)' : b.emplacement === 'Armoire' ? 'var(--surface2)' : 'transparent',
                        border: `1px solid ${b.emplacement?.startsWith('Ace Pro') ? 'rgba(99,102,241,.4)' : 'var(--border)'}`,
                        color: b.emplacement?.startsWith('Ace Pro') ? '#818cf8' : b.emplacement === 'Armoire' ? 'var(--muted)' : 'var(--muted2)',
                        borderRadius: 6, padding: '3px 8px',
                      }}
                    >
                      <option value="">—</option>
                      <option value="Armoire">Armoire</option>
                      <option value="Ace Pro 1">Ace Pro 1</option>
                      <option value="Ace Pro 2">Ace Pro 2</option>
                      <option value="Ace Pro 3">Ace Pro 3</option>
                      <option value="Ace Pro 4">Ace Pro 4</option>
                    </select>
                  </td>
                  <td className="td" style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {editingWeight?.id === b.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number" min="0"
                          className="input"
                          style={{ width: 80, textAlign: 'right', padding: '2px 6px', fontSize: 12 }}
                          value={editingWeight.value}
                          onChange={e => setEditingWeight(w => ({ ...w, value: e.target.value }))}
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              await window.api.bobines.update(b.id, { ...b, poids_restant: Number(editingWeight.value) })
                              setEditingWeight(null); loadBobines(); onReload()
                            }
                            if (e.key === 'Escape') setEditingWeight(null)
                          }}
                          autoFocus
                        />
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>g</span>
                        <button className="btn-primary" style={{ padding: '2px 6px', fontSize: 11 }} onClick={async () => {
                          await window.api.bobines.update(b.id, { ...b, poids_restant: Number(editingWeight.value) })
                          setEditingWeight(null); loadBobines(); onReload()
                        }}>✓</button>
                        <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => setEditingWeight(null)}>✕</button>
                      </div>
                    ) : (
                      <span
                        onClick={() => setEditingWeight({ id: b.id, value: b.poids_restant ?? '' })}
                        title="Cliquer pour modifier le poids"
                        style={{
                          fontWeight: 700, cursor: 'pointer',
                          color: b.poids_restant == null ? 'var(--muted2)' : b.poids_restant < 200 ? '#f87171' : b.poids_restant < 500 ? '#facc15' : '#34d399',
                          borderBottom: '1px dashed currentColor',
                        }}
                      >
                        {b.poids_restant != null ? `${b.poids_restant} g` : '— g'}
                      </span>
                    )}
                  </td>
                  <td className="td" style={{ padding: '8px 10px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#60a5fa', background: 'rgba(96,165,250,.1)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      {b.bobine_uid}
                    </span>
                  </td>
                  <td className="td" style={{ padding: '8px 10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {b.type_bobine || '—'}
                  </td>
                  <td className="td" style={{ padding: '8px 10px', color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {timeAgo(b.created_at)}
                  </td>
                  <td className="td" style={{ padding: '8px 10px', color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {timeAgo(b.updated_at)}
                  </td>
                  <td className="td" style={{ padding: '8px 10px' }}>
                    {b.lien_achat
                      ? <a href={b.lien_achat} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <ExternalLink size={12} />
                        </a>
                      : <span style={{ color: 'var(--muted2)' }}>—</span>}
                  </td>
                  <td className="td" style={{ padding: '8px 10px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                    {b.notes_achat || '—'}
                  </td>
                  <td className="td" style={{ padding: '8px 10px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                    {b.notes || '—'}
                  </td>
                  <td className="td" style={{ padding: '8px 10px' }}>
                    {deletingId === b.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 11, color: '#f87171' }}>Supprimer ?</span>
                        <button className="btn-danger" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => handleDeleteBobine(b.id)}>Oui</button>
                        <button className="btn-ghost"  style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setDeletingId(null)}>Non</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn-ghost"  style={{ padding: '3px 7px' }} onClick={() => setBobineView({ mode: 'edit', data: { ...b } })}><Pencil size={12} /></button>
                        <button className="btn-danger" style={{ padding: '3px 7px' }} onClick={() => setDeletingId(b.id)}><Trash2 size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Paramètres fabricant ── */}
      <Section label="Températures" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Tile label="Buse min"    value={f.temp_buse_min}    unit="°C" />
        <Tile label="Buse max"    value={f.temp_buse_max}    unit="°C" />
        <Tile label="Plateau min" value={f.temp_plateau_min} unit="°C" />
        <Tile label="Plateau max" value={f.temp_plateau_max} unit="°C" />
      </div>

      <Section label="Paramètres fabricant" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Tile label="Vitesse min"   value={f.vitesse_min}         unit="mm/s" />
        <Tile label="Vitesse max"   value={f.vitesse_max}         unit="mm/s" />
        <Tile label="Ventilateur"   value={f.ventilateur_pct}     unit="%" />
        <Tile label="Rétraction"    value={f.retraction_distance} unit="mm" />
        <Tile label="V. rétraction" value={f.retraction_vitesse}  unit="mm/s" />
        <Tile label="Densité"       value={f.densite}             unit="g/cm³" />
      </div>

      {(f.poids_bobine_vide != null || f.td != null || f.valeur_k != null || f.ratio_flux != null) && (
        <>
          <Section label="Défauts bobines" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <Tile label="Bobine vide"  value={f.poids_bobine_vide} unit="g" />
            <Tile label="TD"           value={f.td}                unit="" />
            <Tile label="Valeur K"     value={f.valeur_k}          unit="" />
            <Tile label="Ratio flux"   value={f.ratio_flux}        unit="" />
          </div>
        </>
      )}

      {!!f.humidite_sensible && (f.temp_sechage || f.duree_sechage) && (
        <>
          <Section label="Séchage" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <Tile label="Température" value={f.temp_sechage}  unit="°C" />
            <Tile label="Durée"       value={f.duree_sechage} unit="h" />
          </div>
        </>
      )}

      {f.notes && (
        <>
          <Section label="Notes" />
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>{f.notes}</div>
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
        <button className="btn-primary" onClick={onEdit}><Pencil size={13} /> Modifier le filament</button>
      </div>
    </div>
  )
}

// ── Accordion ────────────────────────────────────────────────────────────────
function Accord({ title, icon, open, onToggle, children }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px',
          background: open ? 'var(--bg)' : 'var(--surface2)',
          border: 'none', borderBottom: open ? '1px solid var(--border)' : 'none',
          cursor: 'pointer', color: 'var(--text)', fontWeight: 600, fontSize: 13,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>{icon} {title}</span>
        {open ? <ChevronUp size={14} color="var(--muted)" /> : <ChevronDown size={14} color="var(--muted)" />}
      </button>
      {open && <div style={{ padding: 16 }}>{children}</div>}
    </div>
  )
}

// ── CatalogPicker ────────────────────────────────────────────────────────────
function CatalogPicker({ onSelect, onManual, onCancel }) {
  const [q, setQ] = useState('')
  const filtered = FILAMENT_CATALOG.filter(item => {
    const s = q.toLowerCase()
    return !s || [item.marque, item.gamme, item.type].some(v => v?.toLowerCase().includes(s))
  })
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          className="input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher Anycubic PLA, PETG…"
          style={{ paddingLeft: 36 }}
          autoFocus
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {filtered.map(item => {
          const tc = TYPE_COLOR[item.type] || TYPE_COLOR.default
          return (
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
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 10, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, flexShrink: 0 }}>
                {item.type}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.marque} {item.gamme} {item.type}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                  buse {item.temp_buse_min}–{item.temp_buse_max}°C · plateau {item.temp_plateau_min}–{item.temp_plateau_max}°C
                </div>
              </div>
              <ChevronDown size={13} color="var(--muted)" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />
            </button>
          )
        })}
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

// ── QuickAddForm ─────────────────────────────────────────────────────────────
function QuickAddForm({ preset, onSave, onCancel }) {
  const tc = TYPE_COLOR[preset.type] || TYPE_COLOR.default
  const [couleur, setCouleur]             = useState('')
  const [code_couleur, setCodeCouleur]    = useState('#f97316')
  const [poids_avec, setPoidsAvec]        = useState('')
  const [poids_vide, setPoidsVide]        = useState(preset.poids_bobine_vide ?? '')
  const [emplacement, setEmplacement]     = useState('')

  const poids_restant = (poids_avec !== '' && poids_vide !== '')
    ? Math.max(0, Number(poids_avec) - Number(poids_vide))
    : ''

  const handleSave = () => {
    const { _id: _unused, ...filamentBase } = preset
    onSave({
      filament: { ...filamentBase, couleur, code_couleur },
      bobine: {
        poids_avec_bobine: poids_avec === '' ? null : Number(poids_avec),
        poids_bobine_vide: poids_vide === '' ? null : Number(poids_vide),
        poids_restant: poids_restant === '' ? null : poids_restant,
        emplacement,
      },
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, flexShrink: 0 }}>
          {preset.type}
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{preset.marque} {preset.gamme} {preset.type}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            buse {preset.temp_buse_min}–{preset.temp_buse_max}°C · plateau {preset.temp_plateau_min}–{preset.temp_plateau_max}°C · ventilo {preset.ventilateur_pct}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <div className="label">Couleur</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="color" value={code_couleur} onChange={e => setCodeCouleur(e.target.value)}
              style={{ width: 42, height: 42, borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--surface2)', cursor: 'pointer', padding: 3, flexShrink: 0 }} />
            <input className="input" value={couleur} onChange={e => setCouleur(e.target.value)} placeholder="Rouge, Blanc Ivoire…" style={{ flex: 1 }} />
          </div>
        </div>
        <div>
          <div className="label">Poids avec bobine (g)</div>
          <input type="number" className="input" min="0" value={poids_avec}
            onChange={e => setPoidsAvec(e.target.value === '' ? '' : e.target.value)}
            placeholder="1210" />
        </div>
        <div>
          <div className="label">Poids bobine vide (g)</div>
          <input type="number" className="input" min="0" value={poids_vide}
            onChange={e => setPoidsVide(e.target.value === '' ? '' : e.target.value)}
            placeholder={String(preset.poids_bobine_vide ?? 210)} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Filament restant</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: poids_restant === '' ? 'var(--muted2)' : poids_restant < 200 ? '#f87171' : poids_restant < 500 ? '#facc15' : '#34d399' }}>
              {poids_restant === '' ? '—' : `${poids_restant} g`}
            </span>
          </div>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <div className="label">Emplacement</div>
          <select className="input" value={emplacement} onChange={e => setEmplacement(e.target.value)}>
            <option value="">— Non défini</option>
            <option value="Armoire">Armoire</option>
            <option value="Ace Pro 1">Ace Pro — Slot 1</option>
            <option value="Ace Pro 2">Ace Pro — Slot 2</option>
            <option value="Ace Pro 3">Ace Pro — Slot 3</option>
            <option value="Ace Pro 4">Ace Pro — Slot 4</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" onClick={handleSave}>Ajouter</button>
      </div>
    </div>
  )
}

// ── BobineForm ───────────────────────────────────────────────────────────────
function BobineForm({ data, onChange, onSave, onCancel }) {
  const [open, setOpen] = useState({ rapides: true, details: false, achat: false, notes: false })
  const tog = k => setOpen(s => ({ ...s, [k]: !s[k] }))

  const f  = field => e => onChange({ ...data, [field]: e.target.value })
  const n  = field => e => onChange({ ...data, [field]: e.target.value === '' ? '' : Number(e.target.value) })

  const recompute = (avec, vide, fallback) => {
    const a = Number(avec), v = Number(vide)
    return (avec !== '' && avec != null && vide !== '' && vide != null) ? Math.max(0, a - v) : fallback
  }
  const handleAvecBobine = e => {
    const avec = e.target.value === '' ? '' : Number(e.target.value)
    onChange({ ...data, poids_avec_bobine: avec, poids_restant: recompute(avec, data.poids_bobine_vide, data.poids_restant) })
  }
  const handlePoidsVide = e => {
    const vide = e.target.value === '' ? '' : Number(e.target.value)
    onChange({ ...data, poids_bobine_vide: vide, poids_restant: recompute(data.poids_avec_bobine, vide, data.poids_restant) })
  }
  const handleRestantDirect = e => {
    onChange({ ...data, poids_restant: e.target.value === '' ? '' : Number(e.target.value), poids_avec_bobine: '' })
  }

  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

  return (
    <div>
      <Accord title="Mises à jour rapides" icon={<Zap size={14} color="var(--muted)" />} open={open.rapides} onToggle={() => tog('rapides')}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <MapPin size={13} color="var(--muted)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Emplacement</span>
          </div>
          <select className="input" value={data.emplacement || ''} onChange={f('emplacement')}>
            <option value="">— Non défini</option>
            <option value="Armoire">Armoire</option>
            <option value="Ace Pro 1">Ace Pro — Slot 1</option>
            <option value="Ace Pro 2">Ace Pro — Slot 2</option>
            <option value="Ace Pro 3">Ace Pro — Slot 3</option>
            <option value="Ace Pro 4">Ace Pro — Slot 4</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <Scale size={13} color="var(--muted)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Poids (grammes)</span>
        </div>
        <div style={g2}>
          <div>
            <div className="label">Avec bobine</div>
            <input type="number" className="input" value={data.poids_avec_bobine || ''} onChange={handleAvecBobine} placeholder="1212" min="0" />
          </div>
          <div>
            <div className="label" style={{ color: '#60a5fa' }}>Poids bobine vide</div>
            <input type="number" className="input" value={data.poids_bobine_vide || ''} onChange={handlePoidsVide} placeholder="212" min="0"
              style={{ color: data.poids_bobine_vide ? '#60a5fa' : undefined }} />
          </div>
        </div>
        <div style={{ marginTop: 10, background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>Filament restant</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" className="input" value={data.poids_restant || ''} onChange={handleRestantDirect} placeholder="0" min="0"
              style={{ width: 100, textAlign: 'right', fontWeight: 700, fontSize: 15 }} />
            <span style={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>g</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 6 }}>
          Tu peux aussi modifier le poids restant directement sans faire le calcul.
        </div>
      </Accord>

      <Accord title="Autres détails" icon={<Sliders size={14} color="var(--muted)" />} open={open.details} onToggle={() => tog('details')}>
        <div style={g2}>
          <div>
            <div className="label">Type de bobine</div>
            <select className="input" value={data.type_bobine || ''} onChange={f('type_bobine')}>
              <option value="">— Sélectionner —</option>
              <option value="Plastic Cardboard Center">Plastic Cardboard Center</option>
              <option value="Plastic Center">Plastic Center</option>
              <option value="Cardboard Center">Cardboard Center</option>
              <option value="Plastic Spool">Plastic Spool</option>
              <option value="Bambu Spool">Bambu Spool</option>
              <option value="Refill / No Spool">Refill / No Spool</option>
            </select>
          </div>
          <div>
            <div className="label">Date de dernier séchage</div>
            <input type="date" className="input" value={data.date_sechage || ''} onChange={f('date_sechage')} />
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '16px 0 6px', paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
          Calibrations spécifiques à cette bobine
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          Valeurs qui remplacent les défauts du filament pour cette bobine uniquement.
        </div>
        <div style={g2}>
          <div>
            <div className="label" style={{ color: data.td ? '#60a5fa' : undefined }}>TD</div>
            <input type="number" className="input" value={data.td || ''} onChange={n('td')} placeholder="0.0" step="0.1"
              style={{ color: data.td ? '#60a5fa' : undefined }} />
          </div>
          <div>
            <div className="label" style={{ color: data.valeur_k ? '#60a5fa' : undefined }}>Valeur K</div>
            <input type="number" className="input" value={data.valeur_k || ''} onChange={n('valeur_k')} placeholder="0.020" step="0.001"
              style={{ color: data.valeur_k ? '#60a5fa' : undefined }} />
          </div>
          <div>
            <div className="label" style={{ color: data.ratio_flux ? '#60a5fa' : undefined }}>Ratio de flux</div>
            <input type="number" className="input" value={data.ratio_flux || ''} onChange={n('ratio_flux')} placeholder="0.98" step="0.01"
              style={{ color: data.ratio_flux ? '#60a5fa' : undefined }} />
          </div>
        </div>
      </Accord>

      <Accord title="Informations d'achat" icon={<ShoppingCart size={14} color="var(--muted)" />} open={open.achat} onToggle={() => tog('achat')}>
        <div style={g2}>
          <div>
            <div className="label">Prix d'achat</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="input" value={data.devise || 'EUR'} onChange={f('devise')} style={{ width: 115, flexShrink: 0 }}>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="CAD">CAD ($CA)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF</option>
              </select>
              <input type="number" className="input" value={data.prix_achat || ''} onChange={n('prix_achat')} placeholder="0.00" step="0.01" />
            </div>
          </div>
          <div>
            <div className="label">Date d'achat</div>
            <input type="date" className="input" value={data.date_achat || ''} onChange={f('date_achat')} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div className="label">Lien d'achat</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input" value={data.lien_achat || ''} onChange={f('lien_achat')} placeholder="https://…" style={{ flex: 1 }} />
              {data.lien_achat && (
                <button type="button" onClick={() => window.open(data.lien_achat, '_blank')}
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div className="label">Notes d'achat</div>
            <textarea className="input" rows={2} value={data.notes_achat || ''} onChange={f('notes_achat')} placeholder="Notes sur l'achat…" style={{ resize: 'vertical' }} />
          </div>
        </div>
      </Accord>

      <Accord title="Notes" icon={<FileText size={14} color="var(--muted)" />} open={open.notes} onToggle={() => tog('notes')}>
        <textarea className="input" rows={3} value={data.notes || ''} onChange={f('notes')} placeholder="Observations, retours d'expérience…" style={{ resize: 'vertical' }} />
      </Accord>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" onClick={onSave}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── FilamentForm ─────────────────────────────────────────────────────────────
function FilamentForm({ data, onChange, onSave, onCancel }) {
  const [open, setOpen] = useState({ params: true, defaults: false, notes: false })
  const tog = k => setOpen(s => ({ ...s, [k]: !s[k] }))

  const f = field => e => onChange({ ...data, [field]: e.target.value })
  const n = field => e => onChange({ ...data, [field]: e.target.value === '' ? '' : Number(e.target.value) })

  const handleMarque = e => {
    const marque = e.target.value
    const upd = { ...data, marque }
    if (marque.toLowerCase().includes('anycubic') && !data.poids_bobine_vide) upd.poids_bobine_vide = 212
    onChange(upd)
  }

  const sub = label => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid var(--border)', marginTop: 16 }}>
      {label}
    </div>
  )

  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const g3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }
  const g4 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }

  return (
    <div>
      {(data.marque || data.type) && (
        <div style={{ marginBottom: 14, padding: '11px 14px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
            {[data.marque, data.type, data.gamme, data.couleur ? `– ${data.couleur}` : ''].filter(Boolean).join(' ')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Paramètres fabricant et défauts pour les nouvelles bobines
          </div>
        </div>
      )}

      <Accord title="Identification & Paramètres" icon={<Settings2 size={14} color="var(--muted)" />} open={open.params} onToggle={() => tog('params')}>
        <div style={g2}>
          <div>
            <div className="label">Marque *</div>
            <input className="input" value={data.marque} onChange={handleMarque} placeholder="Anycubic, Bambu Lab…" />
          </div>
          <div>
            <div className="label">Gamme / Série</div>
            <input className="input" value={data.gamme} onChange={f('gamme')} placeholder="Basic, Matte, Silk…" />
          </div>
          <div>
            <div className="label">Type *</div>
            <select className="input" value={data.type} onChange={f('type')}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div className="label">Diamètre</div>
            <select className="input" value={data.diametre} onChange={n('diametre')}>
              {DIAMS.map(d => <option key={d} value={d}>{d} mm</option>)}
            </select>
          </div>
          <div>
            <div className="label">Couleur</div>
            <input className="input" value={data.couleur} onChange={f('couleur')} placeholder="Rouge, Blanc Ivoire…" />
          </div>
          <div>
            <div className="label">Code couleur</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="color" value={data.code_couleur} onChange={f('code_couleur')}
                style={{ width: 42, height: 42, borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--surface2)', cursor: 'pointer', padding: 3 }} />
              <input className="input" value={data.code_couleur} onChange={f('code_couleur')} placeholder="#f97316" />
            </div>
          </div>
        </div>

        {sub('Températures')}
        <div style={g4}>
          {[['Buse min (°C)', 'temp_buse_min', '190'], ['Buse max (°C)', 'temp_buse_max', '230'],
            ['Plateau min (°C)', 'temp_plateau_min', '0'], ['Plateau max (°C)', 'temp_plateau_max', '60']].map(([label, key, ph]) => (
            <div key={key}>
              <div className="label">{label}</div>
              <input type="number" className="input" value={data[key]} onChange={n(key)} placeholder={ph} />
            </div>
          ))}
        </div>

        {sub('Paramètres fabricant')}
        <div style={g3}>
          {[['Vitesse min (mm/s)', 'vitesse_min', '30'], ['Vitesse max (mm/s)', 'vitesse_max', '200'],
            ['Ventilateur (%)', 'ventilateur_pct', '100'],
            ['Rétraction (mm)', 'retraction_distance', '0.8'], ['V. rétraction (mm/s)', 'retraction_vitesse', '45'],
            ['Densité (g/cm³)', 'densite', '1.24']].map(([label, key, ph]) => (
            <div key={key}>
              <div className="label">{label}</div>
              <input type="number" className="input" value={data[key]} onChange={n(key)} placeholder={ph} step={key === 'retraction_distance' || key === 'densite' ? '0.1' : undefined} />
            </div>
          ))}
        </div>

        {sub('Séchage')}
        <div style={g3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <input type="checkbox" id="hum" style={{ width: 16, height: 16, accentColor: 'var(--brand)', cursor: 'pointer' }}
              checked={!!data.humidite_sensible} onChange={e => onChange({ ...data, humidite_sensible: e.target.checked ? 1 : 0 })} />
            <label htmlFor="hum" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>Sensible à l'humidité</label>
          </div>
          <div>
            <div className="label">Temp. séchage (°C)</div>
            <input type="number" className="input" value={data.temp_sechage} onChange={n('temp_sechage')} placeholder="50" />
          </div>
          <div>
            <div className="label">Durée (heures)</div>
            <input type="number" className="input" value={data.duree_sechage} onChange={n('duree_sechage')} placeholder="4" />
          </div>
        </div>
      </Accord>

      <Accord title="Défauts bobines" icon={<Scale size={14} color="var(--muted)" />} open={open.defaults} onToggle={() => tog('defaults')}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
          Ces valeurs seront pré-remplies automatiquement lors de l'ajout d'une nouvelle bobine pour ce filament.
        </div>
        <div style={g2}>
          <div>
            <div className="label">Poids bobine vide par défaut (g)</div>
            <input type="number" className="input" value={data.poids_bobine_vide || ''} onChange={n('poids_bobine_vide')} placeholder="212" min="0" />
          </div>
          <div>
            <div className="label">TD par défaut</div>
            <input type="number" className="input" value={data.td || ''} onChange={n('td')} placeholder="0.0" step="0.1" />
          </div>
          <div>
            <div className="label">Valeur K par défaut</div>
            <input type="number" className="input" value={data.valeur_k || ''} onChange={n('valeur_k')} placeholder="0.020" step="0.001" />
          </div>
          <div>
            <div className="label">Ratio de flux par défaut</div>
            <input type="number" className="input" value={data.ratio_flux || ''} onChange={n('ratio_flux')} placeholder="0.98" step="0.01" />
          </div>
        </div>
      </Accord>

      <Accord title="Notes" icon={<FileText size={14} color="var(--muted)" />} open={open.notes} onToggle={() => tog('notes')}>
        <div className="label">Notes générales sur ce filament</div>
        <textarea className="input" rows={3} value={data.notes} onChange={f('notes')} placeholder="Observations, conseils d'utilisation…" style={{ resize: 'vertical' }} />
      </Accord>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" onClick={onSave}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
function FilamentCard({ f, onDetail, onEdit, onDelete, onFiche }) {
  const tc = TYPE_COLOR[f.type] || TYPE_COLOR.default
  return (
    <div
      onClick={() => onDetail(f)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'all .2s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ height: 100, position: 'relative', background: f.code_couleur || '#333', overflow: 'hidden' }}>
        {f.img ? (
          <img src={`./impression-3d/filaments/${f.img}`} alt={f.couleur} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : null}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,.65))' }} />
        {f.humidite_sensible ? (
          <div style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(96,165,250,.25)', border: '1px solid rgba(96,165,250,.5)', borderRadius: 6, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)' }}>
            <Droplets size={9} color="#60a5fa" />
            <span style={{ fontSize: 9, color: '#60a5fa', fontWeight: 700 }}>HUMIDITÉ</span>
          </div>
        ) : null}
        <div style={{ position: 'absolute', bottom: 7, left: 9, right: 9 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, backdropFilter: 'blur(4px)' }}>
            {f.type}{f.gamme ? ` · ${f.gamme}` : ''}
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 12px 10px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{f.couleur || '—'}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{f.marque}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {f.temp_buse_min && f.temp_buse_max && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <Flame size={10} color="#fb923c" />
              <span>{f.temp_buse_min}–{f.temp_buse_max}°C buse</span>
            </div>
          )}
          {(f.temp_plateau_min != null || f.temp_plateau_max != null) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ fontSize: 10 }}>🔲</span>
              <span>{f.temp_plateau_min ?? '?'}–{f.temp_plateau_max ?? '?'}°C plateau</span>
            </div>
          ) : null}
          {f.ventilateur_pct != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
              <Wind size={10} color="#818cf8" />
              <span>{f.ventilateur_pct}% ventilateur</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
            {f.nb_bobines} bob.
          </span>
          {f.poids_restant > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(52,211,153,.1)', color: '#34d399', border: '1px solid rgba(52,211,153,.25)' }}>
              {f.poids_restant} g
            </span>
          )}
        </div>

        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={e => { e.stopPropagation(); onFiche(f) }}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 0', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all .15s', marginBottom: 4 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <Info size={12} /> Voir plus
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={e => { e.stopPropagation(); onEdit(f) }}
              style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 0', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <Pencil size={12} /> Modifier
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(f) }}
              style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--muted)', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Filaments() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Tous')
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState({ field: 'marque', dir: 'asc' })
  const [detail, setDetail] = useState(null)
  const [ficheProduit, setFicheProduit] = useState(null)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => window.api.filaments.getAll().then(setItems)
  useEffect(() => { load() }, [])

  const totalBobines = items.reduce((s, f) => s + (f.nb_bobines ?? 0), 0)
  const totalPoids   = items.reduce((s, f) => s + (f.poids_restant ?? 0), 0)

  const toggleSort = field =>
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))

  const types = ['Tous', ...new Set(items.map(f => f.type))]

  const filtered = items.filter(f => {
    const q = search.toLowerCase()
    return (!q || [f.marque, f.gamme, f.type, f.couleur].some(v => v?.toLowerCase().includes(q)))
      && (filterType === 'Tous' || f.type === filterType)
  })

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sort.field] ?? ''
    const bv = b[sort.field] ?? ''
    const cmp = typeof av === 'string' ? av.localeCompare(bv, 'fr') : (Number(av) - Number(bv))
    return sort.dir === 'asc' ? cmp : -cmp
  })

  const handleSave = async () => {
    const { mode, data } = modal
    if (mode === 'catalog-add') {
      const { filamentData, bobineData } = data
      const created = await window.api.filaments.create(filamentData)
      if (created?.id) {
        await window.api.bobines.create({ ...bobineData, filament_id: created.id })
      }
      setModal(null); load(); return
    }
    if (!data.marque || !data.type) return alert('Marque et type requis.')
    if (mode === 'add') await window.api.filaments.create(data)
    else await window.api.filaments.update(data.id, data)
    setModal(null); load()
  }

  const openEdit = f => { setDetail(null); setModal({ mode: 'edit', data: { ...f } }) }

  const handleDeleteFilament = async () => {
    await window.api.filaments.delete(confirm.id)
    setConfirm(null)
    load()
  }

  return (
    <div className="animate-in" style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>Filaments</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{items.length} référence{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ mode: 'catalog' })}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* Stock summary */}
      {(totalBobines > 0 || totalPoids > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
            <Package size={13} color="var(--muted)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{totalBobines}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>bobine{totalBobines !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
            <Scale size={13} color="var(--muted)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{totalPoids.toLocaleString('fr-FR')} g</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>({(totalPoids / 1000).toFixed(2)} kg)</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {types.map(t => {
            const tc = TYPE_COLOR[t] || TYPE_COLOR.default
            const active = filterType === t
            return (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                background: active ? (t === 'Tous' ? 'var(--brand)' : tc.bg) : 'var(--surface2)',
                color: active ? (t === 'Tous' ? '#fff' : tc.text) : 'var(--muted)',
                border: active ? (t === 'Tous' ? '1px solid var(--brand)' : `1px solid ${tc.border}`) : '1px solid var(--border)',
              }}>{t}</button>
            )
          })}
        </div>
        <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, gap: 2, marginLeft: 'auto' }}>
          {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 8px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
              background: view === v ? 'var(--surface)' : 'transparent',
              color: view === v ? 'var(--text)' : 'var(--muted)',
              border: view === v ? '1px solid var(--border2)' : '1px solid transparent',
            }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Sort bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginRight: 2 }}>Trier :</span>
        {SORT_FIELDS.map(sf => (
          <button key={sf.key} onClick={() => toggleSort(sf.key)} style={{
            padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            display: 'flex', alignItems: 'center', gap: 3,
            background: sort.field === sf.key ? 'var(--brand)' : 'var(--surface2)',
            color: sort.field === sf.key ? '#fff' : 'var(--muted)',
            border: sort.field === sf.key ? '1px solid var(--brand)' : '1px solid var(--border)',
          }}>
            {sf.label}
            {sort.field === sf.key
              ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
              : null}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>{sorted.length} résultat{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <Package size={40} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucun filament trouvé</div>
          <div style={{ fontSize: 13 }}>Modifie les filtres ou ajoute un filament.</div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {sorted.map(f => (
            <FilamentCard key={f.id} f={f}
              onDetail={setDetail}
              onEdit={openEdit}
              onDelete={setConfirm}
              onFiche={setFicheProduit}
            />
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {[
                  { label: 'Couleur',        key: 'couleur' },
                  { label: 'Marque / Gamme', key: 'marque' },
                  { label: 'Type',           key: 'type' },
                  { label: 'Buse',           key: 'temp_buse_min' },
                  { label: 'Plateau',        key: null },
                  { label: 'Vitesse',        key: 'vitesse_max' },
                  { label: 'Ventilo',        key: null },
                  { label: 'Séchage',        key: null },
                  { label: 'Bobines',        key: 'nb_bobines' },
                  { label: 'Poids (g)',      key: 'poids_restant' },
                  { label: '',               key: null },
                ].map(({ label, key }) => (
                  <th key={label} className="th"
                    onClick={key ? () => toggleSort(key) : undefined}
                    style={key ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {label}
                      {key && sort.field === key
                        ? (sort.dir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)
                        : key ? <ChevronUp size={10} style={{ opacity: .2 }} /> : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(f => {
                const tc = TYPE_COLOR[f.type] || TYPE_COLOR.default
                return (
                  <tr key={f.id} className="trow" onClick={() => setDetail(f)} style={{ cursor: 'pointer' }}>
                    <td className="td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: f.code_couleur || '#555', flexShrink: 0, border: '1px solid var(--border2)' }} />
                        <span style={{ color: 'var(--text)' }}>{f.couleur || '—'}</span>
                      </div>
                    </td>
                    <td className="td">
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{f.marque}</div>
                      {f.gamme && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.gamme}</div>}
                    </td>
                    <td className="td">
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>{f.type}</span>
                    </td>
                    <td className="td" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {f.temp_buse_min && f.temp_buse_max ? `${f.temp_buse_min}–${f.temp_buse_max}°C` : '—'}
                    </td>
                    <td className="td" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {(f.temp_plateau_min != null || f.temp_plateau_max != null) ? `${f.temp_plateau_min ?? '?'}–${f.temp_plateau_max ?? '?'}°C` : '—'}
                    </td>
                    <td className="td" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {f.vitesse_min && f.vitesse_max ? `${f.vitesse_min}–${f.vitesse_max}` : '—'}
                    </td>
                    <td className="td" style={{ color: 'var(--muted)' }}>
                      {f.ventilateur_pct != null ? `${f.ventilateur_pct}%` : '—'}
                    </td>
                    <td className="td">
                      {f.humidite_sensible
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#60a5fa', fontSize: 11 }}><Droplets size={11} />{f.temp_sechage ? `${f.temp_sechage}°C/${f.duree_sechage}h` : 'Oui'}</span>
                        : <span style={{ color: 'var(--muted2)', fontSize: 11 }}>Non</span>}
                    </td>
                    <td className="td" style={{ color: 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {f.nb_bobines ?? 0}
                    </td>
                    <td className="td" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {f.poids_restant > 0
                        ? <span style={{ fontWeight: 600, color: f.poids_restant < 200 ? '#f87171' : f.poids_restant < 500 ? '#facc15' : '#34d399' }}>{f.poids_restant} g</span>
                        : <span style={{ color: 'var(--muted2)' }}>—</span>}
                    </td>
                    <td className="td">
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={e => { e.stopPropagation(); setFicheProduit(f) }}><Info size={13} /></button>
                        <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={e => { e.stopPropagation(); openEdit(f) }}><Pencil size={13} /></button>
                        <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={e => { e.stopPropagation(); setConfirm(f) }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Modal
          title={`${detail.couleur || '—'} · ${detail.type}${detail.gamme ? ' ' + detail.gamme : ''}`}
          onClose={() => setDetail(null)}
          size="lg"
        >
          <FilamentDetail
            f={detail}
            onEdit={() => openEdit(detail)}
            onClose={() => setDetail(null)}
            onReload={load}
          />
        </Modal>
      )}
      {ficheProduit && (
        <Modal
          title={`Fiche — ${ficheProduit.marque}${ficheProduit.gamme ? ' ' + ficheProduit.gamme : ''} ${ficheProduit.type}${ficheProduit.couleur ? ' · ' + ficheProduit.couleur : ''}`}
          onClose={() => setFicheProduit(null)}
          size="lg"
        >
          <FicheProduit
            f={ficheProduit}
            onEdit={() => { setFicheProduit(null); openEdit(ficheProduit) }}
            onClose={() => setFicheProduit(null)}
          />
        </Modal>
      )}
      {modal?.mode === 'add' || modal?.mode === 'edit' ? (
        <Modal title={modal.mode === 'add' ? 'Ajouter un filament' : 'Modifier le filament'} onClose={() => setModal(null)} size="lg">
          <FilamentForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      ) : null}
      {modal?.mode === 'catalog' && (
        <Modal title="Ajouter un filament" onClose={() => setModal(null)} size="lg">
          <CatalogPicker
            onSelect={item => setModal({ mode: 'catalog-add', data: { preset: item } })}
            onManual={() => setModal({ mode: 'add', data: { ...empty } })}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.mode === 'catalog-add' && (
        <Modal title="Ajouter un filament" onClose={() => setModal(null)}>
          <QuickAddForm
            preset={modal.data.preset}
            onSave={async ({ filament, bobine }) => {
              const created = await window.api.filaments.create(filament)
              if (created?.id) await window.api.bobines.create({ ...bobine, filament_id: created.id })
              setModal(null); load()
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={() => setConfirm(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }} />
          <div className="animate-in" style={{ position: 'relative', width: '100%', maxWidth: 360, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>Confirmer la suppression</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 20 }}>
              Supprimer "{confirm.marque} {confirm.type} {confirm.couleur || ''}" et toutes ses bobines ?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setConfirm(null)}>Annuler</button>
              <button className="btn-danger" onClick={handleDeleteFilament} style={{ background: '#ef4444', color: '#fff', fontWeight: 600 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
