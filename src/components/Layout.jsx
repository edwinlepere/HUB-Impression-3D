import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, Palette, Printer, SquareStack, Settings2, Sun, Moon, Calculator } from 'lucide-react'

const navSections = [
  { items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Mon stock', items: [
    { to: '/filaments', label: 'Filaments',    icon: Package },
    { to: '/couleurs',  label: 'Mes Couleurs', icon: Palette },
  ]},
  { label: 'Matériel', items: [
    { to: '/imprimantes', label: 'Imprimantes', icon: Printer },
    { to: '/plateaux',    label: 'Plateaux',    icon: SquareStack },
    { to: '/profils',     label: 'Profils',     icon: Settings2 },
  ]},
  { label: 'Outils', items: [
    { to: '/calculateur', label: 'Calculateur', icon: Calculator },
  ]},
]

export default function Layout({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="./logo.png"
              alt="logo"
              style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>HUB Impression 3D</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>TechFix&Build</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {navSections.map((section, si) => (
            <div key={si}>
              {si > 0 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />
              )}
              {section.label && (
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
                  textTransform: 'uppercase', color: 'var(--muted)',
                  padding: '10px 12px 5px',
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                    marginBottom: 2,
                    transition: 'all .15s',
                    background: isActive ? 'var(--brand-dim)' : 'transparent',
                    color: isActive ? 'var(--brand)' : 'var(--muted)',
                    border: isActive ? '1px solid rgba(249,115,22,.2)' : '1px solid transparent',
                  })}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, color: 'var(--muted2)', lineHeight: 1.6 }}>
            v1.0.0 · SQLite local
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              borderRadius: 8, padding: '5px 6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.borderColor = 'var(--brand)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
