import { useState, useCallback } from 'react'
import Dashboard from './pages/Dashboard'
import MealPlanner from './pages/MealPlanner'
import './index.css'

const PAGES = [
  { id: 'dashboard', label: 'Command Center', icon: '🗺️', group: 'core' },
  { id: 'meals', label: 'Meal Planner', icon: '🍛', group: 'core' },
]

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-wordmark">Anya</div>
          <div className="logo-tagline">India's Nutrition Copilot</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">Navigation</div>
          {PAGES.map(p => (
            <div
              key={p.id}
              className={`nav-item ${activePage === p.id ? 'active' : ''}`}
              onClick={() => setActivePage(p.id)}
            >
              <span className="icon">{p.icon}</span>
              {p.label}
            </div>
          ))}

          <div className="nav-group-label" style={{ marginTop: 16 }}>Pipeline</div>
          <div className="nav-item" style={{ cursor: 'default', opacity: 0.7 }}>
            <span style={{ fontSize: 11, color: 'var(--sky)', fontWeight: 600 }}>① PREDICT</span>
          </div>
          <div className="nav-item" style={{ cursor: 'default', opacity: 0.7 }}>
            <span style={{ fontSize: 11, color: 'var(--saffron)', fontWeight: 600 }}>② FORTIFY</span>
          </div>
          <div className="nav-item" style={{ cursor: 'default', opacity: 0.7 }}>
            <span style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 600 }}>③ NOURISH</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: 16 }}>Data Sources</div>
          {['NFHS-5', 'ICDS/Anganwadi', 'IMD Weather', 'Agmarknet', 'FSSAI'].map(s => (
            <div key={s} style={{ padding: '4px 20px', fontSize: 11, color: 'var(--text-muted)' }}>
              • {s}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="india-badge">
            <span>🇮🇳</span>
            <span>Made for Bharat</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
            640 districts · 1.4B people
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {activePage === 'dashboard' && <Dashboard onNavigate={setActivePage} />}
        {activePage === 'meals' && <MealPlanner />}
      </div>
    </div>
  )
}
