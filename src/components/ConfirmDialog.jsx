import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }} />
      <div
        className="animate-in"
        style={{
          position: 'relative', width: '100%', maxWidth: 360,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 16, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(239,68,68,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Confirmer la suppression</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel}>Annuler</button>
          <button className="btn-danger" onClick={onConfirm} style={{ background: '#ef4444', color: '#fff', fontWeight: 600 }}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}
