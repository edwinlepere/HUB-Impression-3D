import { useState, useMemo } from 'react'
import { Calculator, Zap, Package, Box, Tag, TrendingUp, Info } from 'lucide-react'

const ENGIE_KWH_2026 = 0.2516

const fmt = (v, decimals = 2) =>
  isNaN(v) || !isFinite(v) ? '—' : v.toFixed(decimals) + ' €'

const fmtPct = v =>
  isNaN(v) || !isFinite(v) ? '—' : v.toFixed(1) + ' %'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}
        {hint && (
          <span title={hint} style={{ cursor: 'help', color: 'var(--muted2)', lineHeight: 1 }}>
            <Info size={11} />
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

function Section({ icon: Icon, title, color = 'var(--brand)', children }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: color === 'var(--brand)' ? 'rgba(249,115,22,.15)' : 'rgba(99,102,241,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          <Icon size={15} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {children}
      </div>
    </div>
  )
}

function NumInput({ value, onChange, min, max, step = 'any', unit, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder ?? '0'}
        style={{ paddingRight: unit ? 42 : undefined }}
      />
      {unit && (
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, color: 'var(--muted)', pointerEvents: 'none', fontWeight: 600,
        }}>
          {unit}
        </span>
      )}
    </div>
  )
}

function ResultLine({ label, value, sub, accent, large }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: large ? '10px 0' : '7px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: large ? 13 : 12, color: accent ? 'var(--text)' : 'var(--muted)', fontWeight: large ? 600 : 400 }}>
        {label}
        {sub && <span style={{ fontSize: 10, color: 'var(--muted2)', marginLeft: 5 }}>{sub}</span>}
      </span>
      <span style={{
        fontSize: large ? 15 : 13, fontWeight: large ? 700 : 500,
        color: accent === 'brand' ? 'var(--brand)'
          : accent === 'green' ? '#22c55e'
          : accent === 'red' ? '#ef4444'
          : 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
    </div>
  )
}

export default function Calculateur() {
  // Filament
  const [grammesFilament, setGrammesFilament] = useState('')
  const [prixFilamentKg, setPrixFilamentKg]   = useState('')

  // Électricité
  const [puissanceW, setPuissanceW] = useState('')
  const [dureeH, setDureeH]         = useState('')
  const [prixKwh, setPrixKwh]       = useState(String(ENGIE_KWH_2026))

  // Usure imprimante
  const [usure, setUsure] = useState('0.10')

  // Emballage
  const [emballage, setEmballage]         = useState(false)
  const [montantEmballage, setMontantEmb] = useState('0.50')

  // Prix de vente
  const [prixVente, setPrixVente] = useState('')

  const calc = useMemo(() => {
    const g   = parseFloat(grammesFilament) || 0
    const pkg = parseFloat(prixFilamentKg)  || 0
    const w   = parseFloat(puissanceW)      || 0
    const h   = parseFloat(dureeH)          || 0
    const kwh = parseFloat(prixKwh)         || 0
    const u   = parseFloat(usure)           || 0
    const emb = emballage ? (parseFloat(montantEmballage) || 0) : 0
    const pv  = parseFloat(prixVente)       || 0

    const coutFilament = (g / 1000) * pkg
    const coutElec     = (w / 1000) * h * kwh
    const coutUsure    = u
    const coutEmb      = emb
    const coutTotal    = coutFilament + coutElec + coutUsure + coutEmb
    const marge        = pv - coutTotal
    const margePct     = pv > 0 ? (marge / pv) * 100 : NaN

    return { coutFilament, coutElec, coutUsure, coutEmb, coutTotal, marge, margePct }
  }, [grammesFilament, prixFilamentKg, puissanceW, dureeH, prixKwh, usure, emballage, montantEmballage, prixVente])

  const margeColor = isNaN(calc.margePct) ? undefined
    : calc.marge < 0 ? 'red'
    : calc.marge === 0 ? undefined
    : 'green'

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 900, margin: '0 auto', animation: 'fadeIn .2s ease forwards' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Calculator size={20} color="var(--brand)" />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Calculateur de coût</h1>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          Estimez le coût de revient d'une impression et calculez votre marge de vente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

        {/* ── Colonne gauche : saisies ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Filament */}
          <Section icon={Package} title="Filament">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Grammes utilisés" hint="Poids total du filament consommé pour l'impression">
                <NumInput value={grammesFilament} onChange={setGrammesFilament} min={0} step={0.1} unit="g" placeholder="ex : 35" />
              </Field>
              <Field label="Prix du filament" hint="Prix d'achat au kilogramme">
                <NumInput value={prixFilamentKg} onChange={setPrixFilamentKg} min={0} step={0.01} unit="€/kg" placeholder="ex : 22.00" />
              </Field>
            </div>
            {grammesFilament && prixFilamentKg && (
              <div style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px' }}>
                Coût filament estimé : <strong style={{ color: 'var(--brand)' }}>{fmt(calc.coutFilament)}</strong>
                <span style={{ color: 'var(--muted2)', marginLeft: 8 }}>
                  ({grammesFilament} g × {(parseFloat(prixFilamentKg) / 1000).toFixed(4)} €/g)
                </span>
              </div>
            )}
          </Section>

          {/* Électricité */}
          <Section icon={Zap} title="Électricité" color="rgb(99,102,241)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Puissance imprimante" hint="Consommation électrique moyenne de l'imprimante en watts">
                <NumInput value={puissanceW} onChange={setPuissanceW} min={0} step={1} unit="W" placeholder="ex : 250" />
              </Field>
              <Field label="Durée d'impression" hint="Durée totale de l'impression">
                <NumInput value={dureeH} onChange={setDureeH} min={0} step={0.25} unit="h" placeholder="ex : 4.5" />
              </Field>
            </div>
            <div style={{ maxWidth: 200 }}>
              <Field label="Prix kWh" hint="Tarif réglementé Engie 2026 (option base TTC)">
                <NumInput value={prixKwh} onChange={setPrixKwh} min={0} step={0.0001} unit="€" placeholder="0.2516" />
              </Field>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Info size={10} />
              Tarif Engie 2026 pré-rempli : 0,2516 €/kWh (option base TTC)
            </div>
          </Section>

          {/* Usure imprimante */}
          <Section icon={TrendingUp} title="Usure imprimante">
            <Field label="Coût d'usure" hint="Estimation de l'usure mécanique : buses, courroies, roulements, etc.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min={0.05}
                  max={0.50}
                  step={0.01}
                  value={parseFloat(usure) || 0.05}
                  onChange={e => setUsure(e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--brand)', cursor: 'pointer' }}
                />
                <div style={{ position: 'relative', width: 90, flexShrink: 0 }}>
                  <input
                    type="number"
                    className="input"
                    min={0.05}
                    max={0.50}
                    step={0.01}
                    value={usure}
                    onChange={e => setUsure(e.target.value)}
                    style={{ paddingRight: 22, textAlign: 'right' }}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>€</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted2)', marginTop: 3, padding: '0 2px' }}>
                <span>0,05 € — impression légère</span>
                <span>0,50 € — impression longue / intensive</span>
              </div>
            </Field>
          </Section>

          {/* Emballage */}
          <Section icon={Box} title="Emballage">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="emballage"
                checked={emballage}
                onChange={e => setEmballage(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--brand)', cursor: 'pointer' }}
              />
              <label htmlFor="emballage" style={{ fontSize: 13, color: 'var(--text)', cursor: 'pointer', userSelect: 'none' }}>
                Ajouter un coût d'emballage
              </label>
            </div>
            {emballage && (
              <Field label="Coût emballage" hint="Boîte, papier bulle, etiquette, etc.">
                <NumInput value={montantEmballage} onChange={setMontantEmb} min={0} step={0.01} unit="€" placeholder="0.50" />
              </Field>
            )}
          </Section>

          {/* Prix de vente */}
          <Section icon={Tag} title="Prix de vente">
            <Field label="Prix de vente TTC" hint="Prix auquel vous vendez la pièce">
              <NumInput value={prixVente} onChange={setPrixVente} min={0} step={0.01} unit="€" placeholder="ex : 15.00" />
            </Field>
          </Section>
        </div>

        {/* ── Colonne droite : résultats ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="card" style={{ border: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Calculator size={15} color="var(--brand)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Récapitulatif</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ResultLine
                label="Filament"
                sub={grammesFilament ? `${grammesFilament} g` : ''}
                value={fmt(calc.coutFilament)}
              />
              <ResultLine
                label="Électricité"
                sub={puissanceW && dureeH ? `${puissanceW} W × ${dureeH} h` : ''}
                value={fmt(calc.coutElec)}
              />
              <ResultLine
                label="Usure imprimante"
                value={fmt(calc.coutUsure)}
              />
              {emballage && (
                <ResultLine
                  label="Emballage"
                  value={fmt(calc.coutEmb)}
                />
              )}

              {/* Total */}
              <div style={{ height: 1, background: 'var(--border2)', margin: '6px 0' }} />
              <ResultLine
                label="Coût total approximatif"
                value={fmt(calc.coutTotal)}
                accent="brand"
                large
              />

              {/* Prix vente & marge */}
              {prixVente && (
                <>
                  <ResultLine
                    label="Prix de vente"
                    value={fmt(parseFloat(prixVente) || 0)}
                  />
                  <div style={{ height: 1, background: 'var(--border2)', margin: '6px 0' }} />
                  <ResultLine
                    label="Marge brute"
                    sub={isNaN(calc.margePct) ? '' : `(${fmtPct(calc.margePct)})`}
                    value={fmt(calc.marge)}
                    accent={margeColor}
                    large
                  />
                </>
              )}
            </div>

            {/* Indicateur visuel marge */}
            {prixVente && !isNaN(calc.margePct) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Rentabilité
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(Math.max(calc.margePct, 0), 100)}%`,
                    background: calc.marge < 0 ? '#ef4444'
                      : calc.margePct < 20 ? '#f97316'
                      : '#22c55e',
                    borderRadius: 6,
                    transition: 'width .3s ease, background .3s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 5 }}>
                  {calc.marge < 0
                    ? 'Vente a perte — augmenter le prix ou réduire les coûts'
                    : calc.margePct < 20
                    ? 'Marge faible — envisagez d\'ajuster le prix'
                    : 'Marge saine'}
                </div>
              </div>
            )}

            {/* Bouton reset */}
            <button
              className="btn-ghost"
              style={{ width: '100%', marginTop: 18, justifyContent: 'center', fontSize: 12 }}
              onClick={() => {
                setGrammesFilament(''); setPrixFilamentKg(''); setPuissanceW(''); setDureeH('')
                setPrixKwh(String(ENGIE_KWH_2026)); setUsure('0.10'); setEmballage(false)
                setMontantEmb('0.50'); setPrixVente('')
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
