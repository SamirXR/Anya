import { useState } from 'react'

/**
 * MealCharts — two charts for the meal planner:
 * 1. Pie chart: macro/food group breakdown of a day's meals
 * 2. Horizontal bar chart: projected nutrient improvement after meal plan
 */

const FOOD_GROUP_COLORS = {
  'Grains & Cereals': '#f59e0b',
  'Legumes & Dal': '#10b981',
  'Vegetables': '#34d399',
  'Fruits': '#fb923c',
  'Dairy': '#60a5fa',
  'Meat & Fish': '#f87171',
  'Nuts & Seeds': '#a78bfa',
  'Oils & Fats': '#fbbf24',
  'Other': '#94a3b8',
}

function categorizeMeal(mealDesc) {
  const d = (mealDesc || '').toLowerCase()
  const cats = {}

  if (/roti|rice|bread|chapati|millet|bajra|ragi|jowar|poha|idli|dosa|upma|puri|paratha/.test(d)) cats['Grains & Cereals'] = (cats['Grains & Cereals'] || 0) + 35
  if (/dal|lentil|rajma|chana|beans|moong|masoor|chole|sambhar/.test(d)) cats['Legumes & Dal'] = (cats['Legumes & Dal'] || 0) + 25
  if (/vegetable|saag|spinach|palak|gourd|bhindi|tomato|onion|curry|sabzi|greens|methi|drumstick|amaranth/.test(d)) cats['Vegetables'] = (cats['Vegetables'] || 0) + 15
  if (/fruit|banana|mango|papaya|orange|guava|amla|berry|apple/.test(d)) cats['Fruits'] = (cats['Fruits'] || 0) + 10
  if (/milk|curd|yogurt|paneer|butter|ghee|dairy|chaas|lassi|dahi/.test(d)) cats['Dairy'] = (cats['Dairy'] || 0) + 15
  if (/chicken|mutton|fish|egg|meat|prawn|shrimp|heme|non.?veg/.test(d)) cats['Meat & Fish'] = (cats['Meat & Fish'] || 0) + 20
  if (/peanut|almond|sesame|til|groundnut|coconut|nut|seed/.test(d)) cats['Nuts & Seeds'] = (cats['Nuts & Seeds'] || 0) + 8
  if (/oil|fat|fry|ghee/.test(d)) cats['Oils & Fats'] = (cats['Oils & Fats'] || 0) + 5

  if (Object.keys(cats).length === 0) cats['Other'] = 100
  return cats
}

function buildPieData(plan) {
  if (!plan?.weekly_plan?.length) return []
  const totals = {}
  plan.weekly_plan.forEach(day => {
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
      const desc = day[meal]?.description || ''
      const cats = categorizeMeal(desc)
      Object.entries(cats).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v })
    })
  })
  const total = Object.values(totals).reduce((s, v) => s + v, 0)
  let angle = 0
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => {
      const pct = value / total
      const startAngle = angle
      angle += pct * 2 * Math.PI
      return { name, value, pct, startAngle, endAngle: angle, color: FOOD_GROUP_COLORS[name] || '#94a3b8' }
    })
}

function PieSlice({ slice, cx, cy, r, isHovered, onHover }) {
  const { startAngle, endAngle, color } = slice
  const x1 = cx + r * Math.cos(startAngle - Math.PI / 2)
  const y1 = cy + r * Math.sin(startAngle - Math.PI / 2)
  const x2 = cx + r * Math.cos(endAngle - Math.PI / 2)
  const y2 = cy + r * Math.sin(endAngle - Math.PI / 2)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  const rHover = isHovered ? r + 8 : r
  const x2h = cx + rHover * Math.cos(endAngle - Math.PI / 2)
  const y2h = cy + rHover * Math.sin(endAngle - Math.PI / 2)
  const x1h = cx + rHover * Math.cos(startAngle - Math.PI / 2)
  const y1h = cy + rHover * Math.sin(startAngle - Math.PI / 2)

  return (
    <path
      d={`M ${cx} ${cy} L ${x1h} ${y1h} A ${rHover} ${rHover} 0 ${largeArc} 1 ${x2h} ${y2h} Z`}
      fill={color}
      opacity={isHovered ? 1 : 0.85}
      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
      onMouseEnter={() => onHover(slice.name)}
      onMouseLeave={() => onHover(null)}
    />
  )
}

function PieChart({ plan }) {
  const [hovered, setHovered] = useState(null)
  const slices = buildPieData(plan)
  const cx = 110, cy = 110, r = 85

  const hoveredSlice = slices.find(s => s.name === hovered)

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        🥘 Weekly Food Group Breakdown
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Based on your 7-day meal plan
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Pie */}
        <div style={{ position: 'relative' }}>
          <svg width={220} height={220} style={{ overflow: 'visible' }}>
            {slices.map(slice => (
              <PieSlice
                key={slice.name}
                slice={slice}
                cx={cx} cy={cy} r={r}
                isHovered={hovered === slice.name}
                onHover={setHovered}
              />
            ))}
            {/* Center hole */}
            <circle cx={cx} cy={cy} r={48} fill="var(--glass-bg)" />
            {/* Center label */}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-primary)">
              {hoveredSlice ? `${Math.round(hoveredSlice.pct * 100)}%` : '7 days'}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
              {hoveredSlice ? hoveredSlice.name.split(' ')[0] : 'meal plan'}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 140 }}>
          {slices.map(s => (
            <div
              key={s.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 6px', borderRadius: 6, marginBottom: 4,
                background: hovered === s.name ? 'rgba(255,255,255,0.06)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s'
              }}
              onMouseEnter={() => setHovered(s.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                {Math.round(s.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ImprovementChart({ plan, deficiencyBefore }) {
  const nutrients = [
    { key: 'iron', label: '🔴 Iron', color: '#ef4444' },
    { key: 'vitamin_a', label: '🟠 Vitamin A', color: '#f97316' },
    { key: 'zinc', label: '🟡 Zinc', color: '#eab308' },
    { key: 'b12', label: '🔵 B12', color: '#3b82f6' },
    { key: 'vitamin_d', label: '⚪ Vitamin D', color: '#94a3b8' },
  ]

  // Get before values from plan or use sensible defaults
  const coverage = plan?.nutritional_coverage || {}
  const before = deficiencyBefore || {}

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        📈 Projected Nutrient Improvement
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Estimated deficiency reduction from this meal plan
      </div>

      {nutrients.map(({ key, label, color }) => {
        const beforeRisk = before[key] || 60
        // Meal plan coverage reduces risk proportionally
        const coverageVal = coverage[key] ?? 65
        const afterRisk = Math.max(5, Math.round(beforeRisk * (1 - coverageVal / 200)))
        const reduction = beforeRisk - afterRisk

        return (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 11, color: '#10d48e', fontWeight: 600 }}>
                ↓ {reduction}% risk reduction
              </span>
            </div>
            {/* Before bar */}
            <div style={{ position: 'relative', height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${beforeRisk}%`,
                background: `${color}55`,
                borderRadius: 4,
                display: 'flex', alignItems: 'center', paddingLeft: 8,
              }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Before: {beforeRisk}%</span>
              </div>
            </div>
            {/* After bar */}
            <div style={{ position: 'relative', height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${afterRisk}%`,
                background: `linear-gradient(90deg, ${color}, #10d48e)`,
                borderRadius: 4,
                transition: 'width 0.8s ease',
                display: 'flex', alignItems: 'center', paddingLeft: 8,
              }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>After: {afterRisk}%</span>
              </div>
            </div>
          </div>
        )
      })}

      <div style={{
        marginTop: 8, padding: '8px 12px',
        background: 'rgba(16,212,142,0.08)',
        border: '1px solid rgba(16,212,142,0.2)',
        borderRadius: 8, fontSize: 11, color: 'var(--emerald)'
      }}>
        ✅ Following this plan for 4 weeks could reduce average deficiency risk by ~{Math.round(
          nutrients.reduce((s, { key }) => {
            const b = before[key] || 60
            const c = coverage[key] ?? 65
            return s + Math.max(0, b - Math.max(5, Math.round(b * (1 - c / 200))))
          }, 0) / nutrients.length
        )} percentage points per nutrient
      </div>
    </div>
  )
}

export { PieChart, ImprovementChart }
