import { useState, useEffect, useRef } from 'react'
import { riskColor, levelBg, nutrientColor, nutrientIcon, nutrientLabel, API } from '../utils'

// Simplified SVG India map using district coordinates as circles/dots
// Districts positioned on a stylized India outline
function IndiaMapSVG({ districts, selectedNutrient, selectedDistrict, onSelectDistrict }) {
  const getColor = (district) => {
    const risk = district[`${selectedNutrient}_risk`] || district.overall_risk
    if (risk >= 70) return '#ff4444'
    if (risk >= 55) return '#ff8c00'
    if (risk >= 40) return '#ffcc00'
    return '#10d48e'
  }

  const getRadius = (district) => {
    const base = Math.sqrt(district.population / 1000000) * 3.5
    return Math.max(5, Math.min(18, base))
  }

  // Normalize coords to fit SVG viewport (India bounding box ~68-97°E, 8-37°N)
  const toSVG = (lat, lng) => {
    const x = ((lng - 68) / (97 - 68)) * 320 + 20
    const y = ((37 - lat) / (37 - 8)) * 440 + 20
    return { x, y }
  }

  return (
    <svg
      viewBox="0 0 360 480"
      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
    >
      {/* India outline background */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-selected">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background grid */}
      <rect width="360" height="480" fill="rgba(5,10,15,0.4)" rx="12" />
      {[...Array(7)].map((_, i) => (
        <line key={i} x1={i * 60 + 20} y1="20" x2={i * 60 + 20} y2="460"
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {[...Array(8)].map((_, i) => (
        <line key={i} x1="20" y1={i * 60 + 20} x2="340" y2={i * 60 + 20}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {/* India rough outline */}
      <path
        d="M 100 30 L 200 25 L 270 50 L 310 80 L 320 120 L 300 160 L 280 200 L 290 240 L 270 280 L 250 320 L 220 370 L 200 400 L 185 430 L 175 430 L 165 400 L 150 370 L 130 330 L 100 300 L 80 260 L 60 220 L 50 180 L 60 140 L 70 100 L 85 60 Z"
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1.5"
      />

      {/* District bubbles */}
      {districts.map(d => {
        const { x, y } = toSVG(d.lat, d.lng)
        const color = getColor(d)
        const r = getRadius(d)
        const isSelected = d.id === selectedDistrict?.id
        const isCritical = (d[`${selectedNutrient}_risk`] || d.overall_risk) >= 70

        return (
          <g key={d.id} onClick={() => onSelectDistrict(d)} style={{ cursor: 'pointer' }}>
            {/* Pulse ring for critical */}
            {isCritical && (
              <circle cx={x} cy={y} r={r + 5} fill="none"
                stroke={color} strokeWidth="1.5" opacity="0.4">
                <animate attributeName="r" values={`${r+3};${r+10};${r+3}`}
                  dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4"
                  dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Selected ring */}
            {isSelected && (
              <circle cx={x} cy={y} r={r + 7} fill="none"
                stroke="white" strokeWidth="2" opacity="0.8"
                filter="url(#glow-selected)" />
            )}

            {/* Main bubble */}
            <circle
              cx={x} cy={y} r={r}
              fill={color}
              opacity={isSelected ? 1 : 0.75}
              filter={isSelected ? 'url(#glow-selected)' : (isCritical ? 'url(#glow)' : 'none')}
            />

            {/* Tribal indicator */}
            {d.tribal && (
              <circle cx={x + r * 0.6} cy={y - r * 0.6} r="2.5"
                fill="white" opacity="0.7" />
            )}
          </g>
        )
      })}

      {/* Legend */}
      <g transform="translate(14, 390)">
        {[['≥70% Critical', '#ff4444'], ['55-70% High', '#ff8c00'],
          ['40-55% Moderate', '#ffcc00'], ['<40% Low', '#10d48e']].map(([label, color], i) => (
          <g key={label} transform={`translate(0, ${i * 18})`}>
            <circle cx="7" cy="5" r="5" fill={color} opacity="0.8" />
            <text x="18" y="9" fontSize="9" fill="rgba(255,255,255,0.5)">{label}</text>
          </g>
        ))}
        <text x="0" y="78" fontSize="8" fill="rgba(255,255,255,0.3)">● = Tribal district</text>
      </g>

      {/* Title */}
      <text x="180" y="15" textAnchor="middle" fontSize="9"
        fill="rgba(255,255,255,0.3)" letterSpacing="1.5">INDIA — DISTRICT RISK MAP</text>
    </svg>
  )
}

const NUTRIENTS = [
  { id: 'overall', label: 'Overall' },
  { id: 'iron', label: 'Iron' },
  { id: 'vitamin_a', label: 'Vit. A' },
  { id: 'b12', label: 'B12' },
  { id: 'zinc', label: 'Zinc' },
  { id: 'vitamin_d', label: 'Vit. D' },
]

export default function IndiaMap({ districts, onSelectDistrict, selectedDistrict }) {
  const [selectedNutrient, setSelectedNutrient] = useState('overall')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Nutrient selector */}
      <div className="tab-bar">
        {NUTRIENTS.map(n => (
          <button
            key={n.id}
            className={`tab ${selectedNutrient === n.id ? 'active' : ''}`}
            onClick={() => setSelectedNutrient(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="glass-card">
        <div className="map-container" style={{ padding: 8 }}>
          <IndiaMapSVG
            districts={districts}
            selectedNutrient={selectedNutrient}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={onSelectDistrict}
          />
        </div>
      </div>

      {/* Quick stats below map */}
      <div className="glass-card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Districts Monitored</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {districts.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Critical</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--critical)' }}>
              {districts.filter(d => d.overall_level === 'critical').length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Tribal</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--sky)' }}>
              {districts.filter(d => d.tribal).length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Population</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--saffron)' }}>
              {(districts.reduce((s, d) => s + d.population, 0) / 1e7).toFixed(1)}Cr
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
