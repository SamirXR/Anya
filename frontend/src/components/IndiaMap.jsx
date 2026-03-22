import { useEffect, useRef, useState } from 'react'

const NUTRIENT_OPTIONS = [
  { id: 'overall', label: 'Overall' },
  { id: 'iron', label: 'Iron (Fe)' },
  { id: 'vitamin_a', label: 'Vit. A' },
  { id: 'vitamin_d', label: 'Vit. D' },
  { id: 'zinc', label: 'Zinc' },
  { id: 'b12', label: 'B12' },
]

function getRiskValue(district, nutrient) {
  if (nutrient === 'overall') return district.overall_risk
  return district[`${nutrient}_risk`] ?? district.overall_risk
}

function getRiskColor(pct) {
  if (pct >= 65) return '#ff3333'
  if (pct >= 50) return '#ff8c00'
  if (pct >= 35) return '#ffcc00'
  return '#10d48e'
}

export default function IndiaMap({ districts, onSelectDistrict, selectedDistrict, activeNutrient, setActiveNutrient }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [nutrient, setNutrient] = useState('overall')

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, {
      center: [22.5, 80],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update markers whenever districts, nutrient or selectedDistrict changes
  useEffect(() => {
    const L = window.L
    const map = mapInstanceRef.current
    if (!L || !map || !districts.length) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    districts.forEach(d => {
      const val = getRiskValue(d, nutrient)
      const color = getRiskColor(val)
      const isSelected = selectedDistrict?.id === d.id

      const marker = L.circleMarker([d.lat, d.lng], {
        radius: isSelected ? 13 : 9,
        fillColor: color,
        fillOpacity: isSelected ? 1 : 0.85,
        color: isSelected ? 'white' : 'transparent',
        weight: isSelected ? 2 : 0,
      })

      marker.bindTooltip(`
        <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5">
          <strong>${d.name}</strong>, ${d.state}<br/>
          Stunting: <b>${d.stunting_pct}%</b> &nbsp;·&nbsp; Anemia: <b>${d.anemia_children_pct}%</b>
          ${d.tribal ? '<br/>🏕 Tribal district' : ''}
        </div>
      `, { direction: 'top', offset: [0, -8], opacity: 0.95 })

      marker.on('click', () => onSelectDistrict(d))
      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [districts, nutrient, selectedDistrict])

  const handleNutrientChange = (id) => {
    setNutrient(id)
    setActiveNutrient?.(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Nutrient selector */}
      <div className="tab-bar">
        {NUTRIENT_OPTIONS.map(n => (
          <button
            key={n.id}
            className={`tab ${nutrient === n.id ? 'active' : ''}`}
            onClick={() => handleNutrientChange(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
        <div ref={mapRef} style={{ height: 460, width: '100%', borderRadius: 12 }} />
        <div style={{
          padding: '6px 12px', fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>© CARTO · OpenStreetMap</span>
          <span>Data: NFHS-5 (2019-21) · MoHFW, Govt of India</span>
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card" style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            ['≥65% Critical', '#ff3333'],
            ['50–65% High', '#ff8c00'],
            ['35–50% Moderate', '#ffcc00'],
          ].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
            Click a dot · hover for details
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="glass-card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {[
            { label: 'Districts', value: districts.length, sub: 'monitored', color: 'var(--text-primary)' },
            { label: 'Avg Stunting', value: districts.length ? Math.round(districts.reduce((s, d) => s + (d.stunting_pct || 0), 0) / districts.length) + '%' : '--', sub: 'vs 35.5% national', color: 'var(--critical)' },
            { label: 'Tribal', value: districts.filter(d => d.tribal).length + '/10', sub: 'districts', color: 'var(--sky)' },
            { label: 'Population', value: (districts.reduce((s, d) => s + d.population, 0) / 1e7).toFixed(1) + 'Cr', sub: 'at-risk', color: 'var(--saffron)' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
