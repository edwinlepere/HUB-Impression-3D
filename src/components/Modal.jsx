import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const w = { sm: 480, md: 620, lg: 860 }[size]

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div
        className="animate-in"
        style={{
          position: 'relative', width: '100%', maxWidth: w,
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px', borderBottom: '1px solid var(--border)',
          borderRadius: '18px 18px 0 0', flexShrink: 0,
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', padding: 4, borderRadius: 8, display: 'flex',
              transition: 'color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
