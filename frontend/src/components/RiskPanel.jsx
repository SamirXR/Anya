import { useState } from 'react'
import { levelBg, nutrientColor, nutrientIcon, nutrientLabel } from '../utils'

function NutrientCard({ name, data, isExpanded, onToggle }) {
  const color = nutrientColor(name)
  const trendIcon = data.trend === 'rising' ? '↑' : data.trend === 'falling' ? '↓' : '→'
  const trendClass = data.trend === 'rising' ? 'trend-up' : data.trend === 'falling' ? 'trend-down' : 'trend-stable'

  return (
    <div
      className="nutrient-card glass-card"
      style={{ background: levelBg(data.level), cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div className="nutrient-card-header">
        <div className="nutrient-name" style={{ color }}>
          <span>{nutrientIcon(name)}</span>
          {nutrientLabel(name)}
        </div>
        <div className={`risk-badge ${data.level}`}>{data.level}</div>
      </div>

      <div className="nutrient-pct" style={{ color }}>{data.risk_pct}%</div>

      <div className="progress-bar-wrap" style={{ marginBottom: 8 }}>
        <div className={`progress-bar-fill ${data.level}`} style={{ width: `${data.risk_pct}%` }} />
      </div>

      <div className="nutrient-trend">
        <span className={trendClass}>{trendIcon} {data.trend_delta}</span>
      </div>

      {isExpanded && data.causes && (
        <div className="cause-list fade-in" style={{ marginTop: 10 }}>
          {data.causes.map((c, i) => (
            <div key={i} className="cause-item">{c}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RiskPanel({ prediction, loading }) {
  const [expanded, setExpanded] = useState(null)

  if (loading) {
    return (
      <div>
        <div className="section-header">
          <div className="section-title">Deficiency Risk Profile</div>
        </div>
        <div className="nutrient-grid">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="shimmer" style={{ height: 130, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Select a district on the map
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Click any numbered bubble to see real NFHS-5 deficiency data
        </div>
      </div>
    )
  }

  const { micronutrients, district_name, state, rank, tribal, dominant_tribe,
          data_source, district_context, context } = prediction

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">
            📍 #{rank} {district_name}, {state}
            {tribal && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--sky)' }}>🏕 {dominant_tribe}</span>}
          </div>
          <div className="section-subtitle">{data_source}</div>
        </div>
        <div className="section-badge" style={{
          background: 'rgba(56,189,248,0.1)', color: 'var(--sky)',
          border: '1px solid rgba(56,189,248,0.25)'
        }}>
          Step ① Predict
        </div>
      </div>

      {/* District brief */}
      {context?.brief && (
        <div style={{
          padding: '12px 14px', marginBottom: 14,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderLeft: '3px solid var(--saffron)',
          borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6
        }}>
          {context.brief}
        </div>
      )}

      {/* NFHS-5 stats strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Stunting', value: `${district_context.stunting_pct}%`, alert: district_context.stunting_pct >= 50 },
          { label: 'Wasting', value: `${district_context.wasting_pct}%`, alert: district_context.wasting_pct >= 20 },
          { label: 'Underweight', value: `${district_context.underweight_pct}%`, alert: district_context.underweight_pct >= 40 },
          { label: 'Child Anemia', value: `${district_context.anemia_children_pct}%`, alert: district_context.anemia_children_pct >= 65 },
          { label: 'Women Anemia', value: `${district_context.anemia_women_pct}%`, alert: district_context.anemia_women_pct >= 60 },
          { label: 'Poverty', value: `${district_context.poverty_pct}%`, alert: false },
          { label: 'PDS Coverage', value: `${district_context.pds_coverage}%`, alert: false },
          { label: 'Inst. Delivery', value: `${district_context.institutional_delivery_pct}%`, alert: false },
        ].map(({ label, value, alert }) => (
          <div key={label} style={{
            padding: '4px 10px',
            background: alert ? 'rgba(255,68,68,0.08)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${alert ? 'rgba(255,68,68,0.2)' : 'var(--border)'}`,
            borderRadius: 99, fontSize: 11, color: 'var(--text-secondary)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
            <span style={{ color: alert ? '#ff6b6b' : 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Micronutrient grid */}
      <div className="nutrient-grid">
        {Object.entries(micronutrients).map(([name, data]) => (
          <NutrientCard
            key={name} name={name} data={data}
            isExpanded={expanded === name}
            onToggle={() => setExpanded(expanded === name ? null : name)}
          />
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
        Click any card to expand root causes · Source: NFHS-5 (92% confidence)
      </div>

      {/* Indigenous foods */}
      {context?.indigenous_foods?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            🌿 Indigenous Superfoods Available
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {context.indigenous_foods.map((food, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 11,
                background: 'rgba(16,212,142,0.08)', border: '1px solid rgba(16,212,142,0.2)',
                color: 'var(--emerald)'
              }}>{food}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
