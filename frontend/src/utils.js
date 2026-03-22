// Utility — compute colour for a risk level
export function riskColor(level) {
  if (level === 'critical') return 'var(--critical)'
  if (level === 'high') return 'var(--high)'
  if (level === 'moderate') return 'var(--moderate)'
  return 'var(--low)'
}

export function nutrientColor(key) {
  const map = {
    iron: '#ef4444', vitamin_a: '#f59e0b', b12: '#a78bfa',
    zinc: '#06b6d4', vitamin_d: '#eab308'
  }
  return map[key] || 'var(--text-secondary)'
}

export function nutrientIcon(key) {
  const map = { iron: '🩸', vitamin_a: '🥕', b12: '💊', zinc: '⚡', vitamin_d: '☀️' }
  return map[key] || '💊'
}

export function nutrientLabel(key) {
  const map = { iron: 'Iron', vitamin_a: 'Vitamin A', b12: 'Vitamin B12', zinc: 'Zinc', vitamin_d: 'Vitamin D' }
  return map[key] || key
}

export function coverageClass(pct) {
  if (pct >= 85) return 'good'
  if (pct >= 60) return 'warn'
  return 'bad'
}

export function levelBg(level) {
  if (level === 'critical') return 'rgba(255,68,68,0.12)'
  if (level === 'high') return 'rgba(255,140,0,0.12)'
  if (level === 'moderate') return 'rgba(255,204,0,0.1)'
  return 'rgba(16,212,142,0.1)'
}

export const API = 'http://localhost:8000'
